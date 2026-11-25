-- Stok takibi (adet). Supabase → SQL Editor → tamamını yapıştır → Run. Tekrar çalıştırmak güvenlidir.
--
-- Nasıl çalışır:
--  * inventory tablosunda adedi girilen boyutlar takip edilir; satırı olmayan boyut "takipsiz" (sınırsız).
--  * Sipariş kaydedilirken (kart: ödeme bekliyor, WhatsApp: onay bekliyor) adet veritabanında,
--    tek işlemde ve kilitli düşülür: aynı son ürünü iki kişi aynı anda alamaz. Yetmezse sipariş
--    kaydı reddedilir ('stok_yetersiz') ve ödeme hiç başlamaz.
--  * Sipariş iptal / başarısız / iade olursa adet geri eklenir; tekrar açılırsa yeniden düşülür.
--  * Ürünün sitedeki durumu (var / az kaldı / tükendi) adetlerden kendiliğinden güncellenir
--    ("ön sipariş" durumundaki ürünlere dokunulmaz).

create table if not exists public.inventory (
  product_id text not null references public.products (id) on delete cascade,
  variant_id text not null,
  qty integer not null default 0 check (qty >= 0),
  low_at integer not null default 3 check (low_at >= 0),   -- bu adet ve altı "az kaldı"
  updated_at timestamptz not null default now(),
  primary key (product_id, variant_id)
);

alter table public.inventory enable row level security;
drop policy if exists inventory_admin on public.inventory;
create policy inventory_admin on public.inventory for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.inventory to authenticated;
grant all on public.inventory to service_role;

-- Satış sayılan / stok tutan durumlar
create or replace function public.stock_held(s text) returns boolean
language sql immutable as $$
  select s in ('odeme_bekliyor', 'odendi', 'beklemede', 'onaylandi', 'kargolandi', 'teslim_edildi');
$$;

-- Ürünün sitedeki durumunu adetlerden hesapla
create or replace function public.refresh_stock_status(pid text) returns void
language plpgsql security definer set search_path = public as $$
declare
  n int;
  total int;
  low boolean;
  next text;
begin
  select count(*), coalesce(sum(qty), 0), coalesce(bool_or(qty <= low_at), false)
    into n, total, low from public.inventory where product_id = pid;
  if n = 0 then return; end if;
  next := case when total = 0 then 'out' when low then 'low' else 'in' end;
  update public.products set stock = next where id = pid and stock <> 'preorder' and stock <> next;
end $$;

-- Kalemleri düş (sign = -1) ya da geri ekle (sign = 1). Yetmezse hata verir ve tüm işlem geri alınır.
create or replace function public.apply_stock(items jsonb, sign int) returns void
language plpgsql security definer set search_path = public as $$
declare
  it jsonb;
  pid text;
  vid text;
  n int;
  changed int;
begin
  for it in select * from jsonb_array_elements(coalesce(items, '[]'::jsonb)) loop
    pid := it ->> 'product_id';
    vid := it ->> 'variant_id';
    n := greatest(coalesce((it ->> 'qty')::int, 0), 0);
    if sign < 0 then
      update public.inventory set qty = qty - n, updated_at = now()
        where product_id = pid and variant_id = vid and qty >= n;
      get diagnostics changed = row_count;
      if changed = 0 and exists (select 1 from public.inventory where product_id = pid and variant_id = vid) then
        raise exception 'stok_yetersiz: % %', pid, vid using errcode = 'P0001';
      end if;
    else
      update public.inventory set qty = qty + n, updated_at = now() where product_id = pid and variant_id = vid;
    end if;
    perform public.refresh_stock_status(pid);
  end loop;
end $$;

create or replace function public.orders_stock_trg() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if public.stock_held(new.status) then perform public.apply_stock(new.items, -1); end if;
  elsif new.status is distinct from old.status then
    if public.stock_held(old.status) and not public.stock_held(new.status) then
      perform public.apply_stock(old.items, 1);
    elsif not public.stock_held(old.status) and public.stock_held(new.status) then
      perform public.apply_stock(new.items, -1);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists orders_stock on public.orders;
create trigger orders_stock after insert or update of status on public.orders
  for each row execute function public.orders_stock_trg();

-- Adet değişince (yönetici panelinden) ürün durumunu güncelle
create or replace function public.inventory_status_trg() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_stock_status(coalesce(new.product_id, old.product_id));
  return null;
end $$;

drop trigger if exists inventory_status on public.inventory;
create trigger inventory_status after insert or update or delete on public.inventory
  for each row execute function public.inventory_status_trg();

-- Kontrol
select
  (select count(*) from information_schema.tables where table_name = 'inventory') as stok_tablosu,
  (select count(*) from pg_trigger where tgname in ('orders_stock', 'inventory_status')) as tetikleyiciler;
