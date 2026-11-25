-- Panelden kart iadesi / iptali (server/refund.js). SQL Editor → yapıştır → Run. Tekrar çalıştırmak güvenlidir.
-- Kısmi iadelerde toplam iade edilen tutar; rapor bunu cirodan düşer.
alter table public.orders add column if not exists refunded numeric(12, 2) not null default 0 check (refunded >= 0);

select count(*) filter (where column_name = 'refunded') as iade_sutunu
from information_schema.columns where table_name = 'orders';
