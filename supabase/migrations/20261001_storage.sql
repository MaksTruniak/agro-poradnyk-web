-- Сховище файлів (Supabase Storage).
-- Запускати ПІСЛЯ 20261001_marketplace_workers_misc.sql (потрібна public.is_admin()).
--
-- Було:
--  • user-avatars: будь-хто з акаунтом завантажував у avatars/ будь-який файл під будь-яким ім'ям (зокрема .html / .svg);
--    замінити власний аватар було неможливо (не було правила UPDATE);
--  • chat-images: будь-хто з акаунтом завантажував будь-що напряму, в обхід перевірок /api/upload-image;
--  • logos / product-images: правил не було — адмінка не могла завантажувати логотипи й фото товарів.
-- Стало:
--  • аватар — лише свій файл avatars/<uid>.<jpg|jpeg|png|webp|gif|heic|heif>, до 2 МБ, лише зображення;
--  • chat-images — завантажує лише сервер (/api/upload-image), до 10 МБ, лише зображення;
--  • logos / product-images — керує адмін; читання публічне, як і раніше.

begin;

-- ── Аватари ─────────────────────────────────────────────────────────────────
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "avatars: own insert" on storage.objects;
drop policy if exists "avatars: own update" on storage.objects;
drop policy if exists "avatars: own delete" on storage.objects;

create policy "avatars: own insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'user-avatars'
    and name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|webp|gif|heic|heif)$')
  );

create policy "avatars: own update" on storage.objects
  for update to authenticated
  using (bucket_id = 'user-avatars' and name ~ ('^avatars/' || auth.uid()::text || '\.'))
  with check (
    bucket_id = 'user-avatars'
    and name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|webp|gif|heic|heif)$')
  );

create policy "avatars: own delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'user-avatars' and name ~ ('^avatars/' || auth.uid()::text || '\.'));

update storage.buckets
set file_size_limit = 2 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
where id = 'user-avatars';

-- ── Картинки чатів: лише через сервер ────────────────────────────────────────
drop policy if exists "Auth users can upload chat images" on storage.objects;

update storage.buckets
set file_size_limit = 10 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
where id = 'chat-images';

-- ── Логотипи брендів і фото товарів: адмін ──────────────────────────────────
drop policy if exists "admin manages logos and product images" on storage.objects;
create policy "admin manages logos and product images" on storage.objects
  for all to authenticated
  using (bucket_id in ('logos', 'product-images') and public.is_admin())
  with check (bucket_id in ('logos', 'product-images') and public.is_admin());

commit;
