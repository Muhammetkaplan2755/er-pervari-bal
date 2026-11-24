-- Supabase → SQL Editor → New query → tamamını yapıştır → Run.
-- 1) Tablo izinleri (yeni projelerde gerekli)
-- Yeni Supabase projelerinde tablolar Data API rollerine otomatik açılmıyor.
-- Erişimi yine RLS kuralları sınırlar; bunlar yalnızca kapıyı açar.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.products to anon;
grant select, insert, update, delete on public.products, public.variant_costs, public.settings to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.admins to authenticated;
grant all on all tables in schema public to service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- 2) Yöneticiyi ekle. E-posta TEK TIRNAK içinde olmalı.
insert into public.admins (user_id)
select id from auth.users where email = 'yonetici@ornek.com'
on conflict (user_id) do nothing;

-- Sonuç: yönetici sayısı (1 olmalı)
select count(*) as yonetici_sayisi from public.admins;
