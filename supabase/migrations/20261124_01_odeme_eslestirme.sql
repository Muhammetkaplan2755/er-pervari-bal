-- Yarıda kalan kartlı ödemelerin eşleştirilmesi (server/reconcile.js).
-- Supabase → SQL Editor → yapıştır → Run. Tekrar çalıştırmak güvenlidir.

-- iyzico ödeme oturumu anahtarı: müşteri sayfayı kapatırsa ödemeyi bununla sorarız.
-- Tek başına para çekmeye yaramaz; yalnızca sonucu sorgulamak içindir. Ziyaretçiye kapalı (RLS).
alter table public.orders add column if not exists provider_token text;

-- Eşleştirme görevi "ödeme bekliyor" siparişleri hızlı bulsun.
create index if not exists orders_pending_idx on public.orders (status, created_at) where status = 'odeme_bekliyor';

-- Kontrol
select count(*) filter (where column_name = 'provider_token') as token_sutunu
from information_schema.columns where table_name = 'orders';
