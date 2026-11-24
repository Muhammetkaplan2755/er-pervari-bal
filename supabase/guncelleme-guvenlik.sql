-- Er Pervari Bal — güvenlik ve hukuk güncellemesi (2026-11-24).
-- Supabase → SQL Editor → New query → tamamını yapıştır → Run. Tekrar çalıştırmak güvenlidir.

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

-- 4) İki adımlı doğrulama zorunluluğu (kurulduysa).
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

-- 5) Kontrol: sütunlar ve politika
select
  (select count(*) from information_schema.columns where table_name = 'orders' and column_name in ('consent_at', 'legal_version')) as onay_sutunlari,
  (select count(*) from pg_policies where policyname = 'urunler_admin_select') as fotograf_politikasi;
