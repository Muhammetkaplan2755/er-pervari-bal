-- Er Pervari Bal: TEK SEFERDE KURULUM (schema.sql + seed.sql birleşik).
-- Supabase → SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.

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
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
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

-- OTOMATİK ÜRETİLDİ: node scripts/make-seed.mjs
-- Mevcut ürünleri veritabanına aktarır (schema.sql'den sonra çalıştırın).
insert into public.products (id, category, stock, name, note, variants, sort) values
  ('suzme', 'bal', 'in', '{"tr":"Süzme bal","en":"Strained honey","ar":"عسل مصفّى"}'::jsonb, '{"tr":"Pervari yayla çiçek balı, cam kavanozda.","en":"Pervari highland blossom honey, in a glass jar.","ar":"عسل أزهار مرتفعات بيرواري في برطمان زجاجي."}'::jsonb, '[{"id":"500g","label":"500 g","price":450},{"id":"1kg","label":"1 kg","price":850}]'::jsonb, 0),
  ('karakovan', 'bal', 'in', '{"tr":"Karakovan petek bal","en":"Karakovan comb honey","ar":"عسل شمع كاراكوفان"}'::jsonb, '{"tr":"Hazır temelsiz, doğal petek. Kesilip kutulanır.","en":"Natural comb built without foundation. Cut and boxed.","ar":"شمع طبيعي بلا أساس جاهز، يُقطع ويُعبّأ."}'::jsonb, '[{"id":"500g","label":"500 g","price":900},{"id":"1kg","label":"1 kg","price":1700}]'::jsonb, 10),
  ('cerceve', 'bal', 'in', '{"tr":"Çerçeve petek bal","en":"Frame comb honey","ar":"عسل شمع بالإطار"}'::jsonb, '{"tr":"Kesilmiş ya da tam çerçeve olarak.","en":"Cut pieces or a whole frame.","ar":"قطع أو إطار كامل."}'::jsonb, '[{"id":"1kg","label":"1 kg","price":1100},{"id":"tam","label":{"tr":"Tam çerçeve (~2,5 kg)","en":"Whole frame (~2.5 kg)","ar":"إطار كامل (~2.5 كغ)"},"price":2600}]'::jsonb, 20),
  ('krem', 'bal', 'in', '{"tr":"Krem bal","en":"Creamed honey","ar":"عسل كريمي"}'::jsonb, '{"tr":"Kaşıkla kesilen kıvamda, sürülebilir.","en":"Thick enough to cut with a spoon, easy to spread.","ar":"قوام سميك يُقطع بالملعقة وسهل الدهن."}'::jsonb, '[{"id":"250g","label":"250 g","price":300},{"id":"500g","label":"500 g","price":550}]'::jsonb, 30),
  ('polen', 'bal', 'in', '{"tr":"Polen","en":"Bee pollen","ar":"حبوب اللقاح"}'::jsonb, '{"tr":"Kurutulmuş arı poleni.","en":"Dried bee pollen.","ar":"حبوب لقاح مجففة."}'::jsonb, '[{"id":"250g","label":"250 g","price":350}]'::jsonb, 40),
  ('tahin', 'kahvalti', 'in', '{"tr":"Tahin","en":"Tahini","ar":"طحينة"}'::jsonb, '{"tr":"Balla ya da pekmezle karıştırıp kahvaltıda.","en":"Mix with honey or molasses for breakfast.","ar":"تُخلط مع العسل أو الدبس للفطور."}'::jsonb, '[{"id":"300g","label":"300 g","price":180},{"id":"600g","label":"600 g","price":320}]'::jsonb, 50),
  ('pekmez', 'kahvalti', 'in', '{"tr":"Pekmez","en":"Grape molasses","ar":"دبس العنب"}'::jsonb, '{"tr":"Cam kavanozda.","en":"In a glass jar.","ar":"في برطمان زجاجي."}'::jsonb, '[{"id":"700g","label":"700 g","price":220}]'::jsonb, 60),
  ('fistik', 'kahvalti', 'in', '{"tr":"Antep fıstığı","en":"Antep pistachios","ar":"فستق عنتاب"}'::jsonb, '{"tr":"Kabuklu, kavrulmuş.","en":"In shell, roasted.","ar":"بقشره، محمّص."}'::jsonb, '[{"id":"500g","label":"500 g","price":650},{"id":"1kg","label":"1 kg","price":1250}]'::jsonb, 70),
  ('kutu-kahvalti', 'kutu', 'in', '{"tr":"Kahvaltı kutusu","en":"Breakfast box","ar":"علبة الفطور"}'::jsonb, '{"tr":"Süzme bal 500 g, tahin 300 g, pekmez 700 g, Antep fıstığı 500 g.","en":"Strained honey 500 g, tahini 300 g, grape molasses 700 g, Antep pistachios 500 g.","ar":"عسل مصفّى 500 غ، طحينة 300 غ، دبس 700 غ، فستق عنتاب 500 غ."}'::jsonb, '[{"id":"kutu","label":{"tr":"Kutu","en":"Box","ar":"علبة"},"price":1400}]'::jsonb, 80),
  ('kutu-karakovan', 'kutu', 'in', '{"tr":"Karakovan hediye kutusu","en":"Karakovan gift box","ar":"علبة هدية كاراكوفان"}'::jsonb, '{"tr":"Karakovan petek 1 kg ve krem bal 250 g, ahşap kutuda.","en":"Karakovan comb 1 kg and creamed honey 250 g in a wooden box.","ar":"شمع كاراكوفان 1 كغ وعسل كريمي 250 غ في علبة خشبية."}'::jsonb, '[{"id":"kutu","label":{"tr":"Kutu","en":"Box","ar":"علبة"},"price":1900}]'::jsonb, 90),
  ('kutu-bayram', 'kutu', 'in', '{"tr":"Bayram kutusu","en":"Holiday box","ar":"علبة العيد"}'::jsonb, '{"tr":"Krem bal 250 g, süzme bal 500 g ve Antep fıstığı 500 g. Bayram ve düğün ikramı için.","en":"Creamed honey 250 g, strained honey 500 g and Antep pistachios 500 g. For holidays and weddings.","ar":"عسل كريمي 250 غ، عسل مصفّى 500 غ وفستق عنتاب 500 غ. للأعياد والأعراس."}'::jsonb, '[{"id":"kutu","label":{"tr":"Kutu","en":"Box","ar":"علبة"},"price":1350}]'::jsonb, 100)
on conflict (id) do nothing;
