-- Kargo firması (takip bağlantısı için). SQL Editor → yapıştır → Run. Tekrar çalıştırmak güvenlidir.
alter table public.orders add column if not exists carrier text;

select count(*) filter (where column_name = 'carrier') as kargo_sutunu
from information_schema.columns where table_name = 'orders';
