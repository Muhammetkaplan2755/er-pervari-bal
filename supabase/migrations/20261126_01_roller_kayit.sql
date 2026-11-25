-- Roller (sahip / personel) + işlem kaydı. SQL Editor → yapıştır → Run. Tekrar çalıştırmak güvenlidir.
-- Mevcut yönetici(ler) "sahip" olur; panelden eklenen çalışanlar "personel".
-- Personel: siparişleri görür, durum/kargo/not günceller. Fiyat, maliyet, stok, ayar, rapor, iade YALNIZCA sahip.

-- ---------- 1) Roller ----------
alter table public.admins add column if not exists role text not null default 'sahip';
alter table public.admins drop constraint if exists admins_role_check;
alter table public.admins add constraint admins_role_check check (role in ('sahip', 'personel'));
alter table public.admins add column if not exists email text;
update public.admins a set email = u.email from auth.users u where u.id = a.user_id and a.email is null;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select public.is_admin() and exists (select 1 from public.admins where user_id = auth.uid() and role = 'sahip');
$$;
grant execute on function public.is_owner() to anon, authenticated, service_role;

-- Panelden çalışan eklerken e-postanın hesabı var mı (yalnızca sunucu çağırabilir).
create or replace function public.admin_user_id_by_email(e text) returns uuid
language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(e) limit 1;
$$;
revoke execute on function public.admin_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.admin_user_id_by_email(text) to service_role;

-- Sahip tüm yöneticileri görür (ekleme/silme yalnızca sunucudan).
drop policy if exists admins_owner_read on public.admins;
create policy admins_owner_read on public.admins for select using (public.is_owner());

-- Ürün/maliyet/stok/ayar/fotoğraf yazma yalnızca sahip. Siparişler iki role de açık (değişmedi).
drop policy if exists products_write on public.products;
create policy products_write on public.products for all using (public.is_owner()) with check (public.is_owner());
drop policy if exists costs_admin on public.variant_costs;
create policy costs_admin on public.variant_costs for all using (public.is_owner()) with check (public.is_owner());
drop policy if exists settings_admin on public.settings;
create policy settings_admin on public.settings for all using (public.is_owner()) with check (public.is_owner());
drop policy if exists inventory_admin on public.inventory;
create policy inventory_admin on public.inventory for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists urunler_admin_insert on storage.objects;
create policy urunler_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'urunler' and public.is_owner());
drop policy if exists urunler_admin_update on storage.objects;
create policy urunler_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'urunler' and public.is_owner());
drop policy if exists urunler_admin_delete on storage.objects;
create policy urunler_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'urunler' and public.is_owner());
drop policy if exists urunler_admin_select on storage.objects;
create policy urunler_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'urunler' and public.is_owner());

-- ---------- 2) İşlem kaydı ----------
-- Kim, ne zaman, neyi değiştirdi. Panelden yapılanlarda kişinin e-postası; sunucu işlemlerinde
-- (kargo, iade) sunucunun ilettiği yönetici e-postası; otomatik işlemlerde "sistem".
-- Müşteri kişisel verisi (ad, telefon, adres, IP) kayda YAZILMAZ, yalnızca "değişti" yazılır.
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null,
  tbl text not null,
  row_id text,
  action text not null,
  changes jsonb
);
create index if not exists audit_log_at_idx on public.audit_log (at desc);
alter table public.audit_log enable row level security;
drop policy if exists audit_owner_read on public.audit_log;
create policy audit_owner_read on public.audit_log for select using (public.is_owner());
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;

create or replace function public.audit_trg() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare
  o jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  n jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  c jsonb := coalesce(n, o);
  private text[] := array['customer', 'ip', 'provider_token'];
  diff jsonb := '{}'::jsonb;
  who text;
  k text;
begin
  -- Başka bir tetikleyicinin yaptığı zincirleme değişiklik (siparişle düşen stok vb.) ayrıca yazılmaz.
  if pg_trigger_depth() > 1 then return null; end if;
  who := coalesce(
    nullif(auth.jwt() ->> 'email', ''),
    case when auth.role() = 'service_role'
      then nullif(nullif(current_setting('request.headers', true), '')::json ->> 'x-actor', '') end,
    case when auth.role() = 'service_role' then 'sistem' when auth.role() = 'anon' then 'ziyaretçi' else 'veritabanı' end
  );
  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(n) loop
      if k <> 'updated_at' and (o -> k) is distinct from (n -> k) then
        diff := diff || jsonb_build_object(k, case when k = any(private) then '"değişti"'::jsonb else jsonb_build_array(o -> k, n -> k) end);
      end if;
    end loop;
    if diff = '{}'::jsonb then return null; end if;
  else
    diff := c - private;
  end if;
  insert into public.audit_log (actor, tbl, row_id, action, changes)
  values (left(who, 200), tg_table_name,
          coalesce(c ->> 'id', c ->> 'key', c ->> 'user_id', (c ->> 'product_id') || '/' || (c ->> 'variant_id')),
          lower(tg_op), diff);
  return null;
end $$;

drop trigger if exists audit on public.products;
create trigger audit after insert or update or delete on public.products for each row execute function public.audit_trg();
drop trigger if exists audit on public.variant_costs;
create trigger audit after insert or update or delete on public.variant_costs for each row execute function public.audit_trg();
drop trigger if exists audit on public.inventory;
create trigger audit after insert or update or delete on public.inventory for each row execute function public.audit_trg();
drop trigger if exists audit on public.settings;
create trigger audit after insert or update or delete on public.settings for each row execute function public.audit_trg();
drop trigger if exists audit on public.admins;
create trigger audit after insert or update or delete on public.admins for each row execute function public.audit_trg();
-- Siparişlerde yalnızca değişiklik/silme (müşterinin verdiği sipariş zaten kayıttır).
drop trigger if exists audit on public.orders;
create trigger audit after update or delete on public.orders for each row execute function public.audit_trg();

select user_id, role, email from public.admins;
