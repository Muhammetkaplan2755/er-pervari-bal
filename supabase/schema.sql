-- Er Pervari Bal — yönetici paneli veritabanı (Supabase / Postgres).
-- Kurulum: Supabase projesi → SQL Editor → bu dosyanın tamamını yapıştır → Run.
-- Ardından supabase/seed.sql (mevcut ürünler) ve KURULUM-YONETIM.md'deki adımlar.
-- Güvenlik: her tabloda RLS açık. Ziyaretçi yalnızca aktif ürünleri okuyabilir;
-- siparişler, maliyetler ve ayarlar yalnızca "admins" tablosundaki kullanıcılara açık.
-- Sunucu fonksiyonları service_role anahtarıyla çalışır (RLS'i atlar, tarayıcıya gitmez).

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public, auth as $$
  -- Yönetici mi? İki adımlı doğrulama kurmuşsa oturum da kodla doğrulanmış (aal2) olmalı:
  -- şifresi çalınan bir hesap kod olmadan veriye erişemez.
  select exists (select 1 from public.admins where user_id = auth.uid())
    and (
      coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified')
    );
$$;

-- Ürünler: src/data/catalog.js ile aynı biçim (name/note/label: {tr,en,ar} ya da düz metin).
create table if not exists public.products (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  category text not null default 'bal',
  stock text not null default 'in' check (stock in ('in', 'low', 'out', 'preorder')),
  name jsonb not null,
  note jsonb not null default '{}'::jsonb,
  variants jsonb not null check (jsonb_typeof(variants) = 'array' and jsonb_array_length(variants) > 0),
  images jsonb not null default '[]'::jsonb,  -- panelden yüklenen fotoğrafların adresleri
  sort integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Birim maliyet (alış / üretim). Herkese açık ürün tablosunda durmaz.
create table if not exists public.variant_costs (
  product_id text not null references public.products (id) on delete cascade,
  variant_id text not null,
  cost numeric(12, 2) not null default 0 check (cost >= 0),
  primary key (product_id, variant_id)
);

-- Siparişler. channel: 'kart' (iyzico) | 'whatsapp'.
-- status: odeme_bekliyor → odendi | basarisiz (kart); beklemede → onaylandi | iptal (WhatsApp);
--         odendi/onaylandi → kargolandi → teslim_edildi; iade.
create table if not exists public.orders (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  channel text not null check (channel in ('kart', 'whatsapp')),
  status text not null check (status in ('odeme_bekliyor', 'odendi', 'basarisiz', 'beklemede', 'onaylandi', 'iptal', 'kargolandi', 'teslim_edildi', 'iade')),
  payment_method text,                 -- kart | havale | kapida
  customer jsonb not null,             -- {name, phone, email, address, city, district, note}
  items jsonb not null,                -- [{product_id, variant_id, name, label, qty, unit_price, total}]
  subtotal numeric(12, 2) not null,
  shipping numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  commission numeric(12, 2) not null default 0,   -- iyzico kesintisi (ödeme sonucundan)
  payout numeric(12, 2),                          -- hesaba geçecek tutar (iyzico)
  extra_cost numeric(12, 2) not null default 0,   -- elle: kargo bedeli, kapıda ödeme ücreti vb.
  provider_payment_id text,
  tracking_code text,
  admin_note text,
  ip text
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_ip_idx on public.orders (ip, created_at desc);

-- Ayarlar: notify_numbers = ["905xxxxxxxxx", …], weekly_report = true/false
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.settings (key, value) values
  ('notify_numbers', '[]'::jsonb),
  ('weekly_report', 'true'::jsonb)
on conflict (key) do nothing;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

alter table public.admins enable row level security;
alter table public.products enable row level security;
alter table public.variant_costs enable row level security;
alter table public.orders enable row level security;
alter table public.settings enable row level security;

drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins for select using (user_id = auth.uid());

drop policy if exists products_read on public.products;
create policy products_read on public.products for select using (active or public.is_admin());
drop policy if exists products_write on public.products;
create policy products_write on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists costs_admin on public.variant_costs;
create policy costs_admin on public.variant_costs for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read on public.orders for select using (public.is_admin());
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders for update using (public.is_admin()) with check (public.is_admin());
-- Sipariş ekleme yalnızca sunucudan (service_role); silme yok, iptal durumu kullanılır.

drop policy if exists settings_admin on public.settings;
create policy settings_admin on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- Eski kurulumu güncellerken (tablo zaten varsa) fotoğraf sütunu:
alter table public.products add column if not exists images jsonb not null default '[]'::jsonb;

-- Ürün fotoğrafları: herkese açık "urunler" kovası; yükleme/silme yalnızca yöneticiler.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('urunler', 'urunler', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists urunler_admin_insert on storage.objects;
create policy urunler_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'urunler' and public.is_admin());
drop policy if exists urunler_admin_update on storage.objects;
create policy urunler_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'urunler' and public.is_admin());
drop policy if exists urunler_admin_delete on storage.objects;
create policy urunler_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'urunler' and public.is_admin());

-- Yeni Supabase projelerinde tablolar Data API rollerine otomatik açılmıyor.
-- Erişimi yine RLS kuralları sınırlar; bunlar yalnızca kapıyı açar.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.products to anon;
grant select, insert, update, delete on public.products, public.variant_costs, public.settings to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.admins to authenticated;
grant all on all tables in schema public to service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;
-- 1) Sipariş onay kanıtı (Mesafeli Sözleşmeler Yönetmeliği: ön bilgilendirmenin ispatı satıcıda).
alter table public.orders add column if not exists consent_at timestamptz;
alter table public.orders add column if not exists legal_version text;

-- 2) Aynı iyzico ödemesi iki kez kaydedilemez.
create unique index if not exists orders_provider_payment_id_key
  on public.orders (provider_payment_id) where provider_payment_id is not null and provider_payment_id <> '';

-- 3) Fotoğraf silme: Supabase depolamada silmek için okuma izni de gerekir; yalnızca yöneticiye.
drop policy if exists urunler_admin_select on storage.objects;
create policy urunler_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'urunler' and public.is_admin());

-- iyzico ödeme oturumu anahtarı: müşteri sayfayı kapatırsa ödemeyi bununla sorarız.
-- Tek başına para çekmeye yaramaz; yalnızca sonucu sorgulamak içindir. Ziyaretçiye kapalı (RLS).
alter table public.orders add column if not exists provider_token text;

-- Eşleştirme görevi "ödeme bekliyor" siparişleri hızlı bulsun.
create index if not exists orders_pending_idx on public.orders (status, created_at) where status = 'odeme_bekliyor';
alter table public.orders add column if not exists refunded numeric(12, 2) not null default 0 check (refunded >= 0);

-- ---------- Stok takibi (migration 20261125_01) ----------
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

