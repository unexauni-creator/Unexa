-- Онбординг зберігає відповіді в profiles, але чотирьох колонок бракувало, тому фінальний крок падав.
-- Запустіть один раз у Supabase → SQL Editor (режим бази даних, НЕ "Logs"). Наявні дані не змінюються.

alter table public.profiles add column if not exists languages  text[];
alter table public.profiles add column if not exists formats    text[];
alter table public.profiles add column if not exists budget     text;
alter table public.profiles add column if not exists priorities text[];

-- Профілі для акаунтів, у яких рядка в profiles ще немає
insert into public.profiles (id, full_name)
select u.id, u.raw_user_meta_data ->> 'full_name'
from auth.users u
on conflict (id) do nothing;

-- Кожен користувач може читати й міняти лише власний профіль
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
