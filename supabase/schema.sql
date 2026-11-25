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
