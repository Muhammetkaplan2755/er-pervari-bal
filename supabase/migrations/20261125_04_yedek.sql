-- Haftalık yedek deposu (server/maintenance.js). SQL Editor → yapıştır → Run. Tekrar çalıştırmak güvenlidir.
-- GİZLİ depo: herkese açık değil, hiçbir okuma/yazma politikası yok → yalnızca sunucu (service_role) erişir.
-- Yönetici, panelden 5 dakikalık indirme bağlantısı alır.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('yedekler', 'yedekler', false, 52428800, array['application/json'])
on conflict (id) do update set public = false;

select id, public from storage.buckets where id = 'yedekler';
