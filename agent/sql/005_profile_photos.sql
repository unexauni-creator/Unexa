-- Фото, ім'я та біо профілю зберігаються в акаунті, а не лише в браузері.
-- Запустіть один раз у Supabase → SQL Editor (режим бази даних, НЕ "Logs"). Наявні дані не змінюються.
-- Supabase покаже попередження через "drop policy": воно видаляє лише правила з цими ж назвами й одразу створює їх знову.

alter table public.profiles add column if not exists bio        text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists cover_url  text;

-- Сховище для фото: відкрите для перегляду, лише JPEG, до 5 МБ на файл
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', true, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg'];

-- Кожен користувач може змінювати лише файли у власній папці (<id користувача>/...)
drop policy if exists "profile_photos_select_own" on storage.objects;
create policy "profile_photos_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile_photos_insert_own" on storage.objects;
create policy "profile_photos_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile_photos_update_own" on storage.objects;
create policy "profile_photos_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile_photos_delete_own" on storage.objects;
create policy "profile_photos_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
