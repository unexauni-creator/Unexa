-- Community: хто в якій групі, і дописи в групах (з відповідями).
-- Запустіть один раз у Supabase → SQL Editor (режим бази даних, НЕ "Logs"). Наявні дані не змінюються.
-- Supabase покаже попередження через "drop policy": воно видаляє лише правила з цими ж назвами й одразу створює їх знову.

-- Учасники груп
create table if not exists public.group_members (
  group_id   uuid not null references public.community_groups(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.group_members enable row level security;

drop policy if exists "group_members_read" on public.group_members;
create policy "group_members_read" on public.group_members for select to authenticated using (true);
drop policy if exists "group_members_join" on public.group_members;
create policy "group_members_join" on public.group_members for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "group_members_leave" on public.group_members;
create policy "group_members_leave" on public.group_members for delete to authenticated using (auth.uid() = user_id);

-- Дописи і відповіді (відповідь = допис із parent_id)
create table if not exists public.group_posts (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.community_groups(id) on delete cascade,
  parent_id     uuid references public.group_posts(id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name   text,
  author_avatar text,
  body          text not null check (char_length(body) between 1 and 4000),
  created_at    timestamptz not null default now()
);
create index if not exists group_posts_group_idx on public.group_posts (group_id, created_at desc);
alter table public.group_posts enable row level security;

-- читати можуть усі, хто увійшов; писати — лише учасники групи і лише від свого імені; видаляти — лише свої
drop policy if exists "group_posts_read" on public.group_posts;
create policy "group_posts_read" on public.group_posts for select to authenticated using (true);
drop policy if exists "group_posts_write" on public.group_posts;
create policy "group_posts_write" on public.group_posts for insert to authenticated
  with check (auth.uid() = user_id and exists (select 1 from public.group_members m where m.group_id = group_posts.group_id and m.user_id = auth.uid()));
drop policy if exists "group_posts_delete" on public.group_posts;
create policy "group_posts_delete" on public.group_posts for delete to authenticated using (auth.uid() = user_id);

-- Справжня кількість учасників для карток груп
create or replace view public.community_group_stats with (security_invoker = true) as
  select g.id as group_id,
         (select count(*) from public.group_members m where m.group_id = g.id) as members,
         (select count(*) from public.group_posts p where p.group_id = g.id) as posts
  from public.community_groups g;
grant select on public.community_group_stats to authenticated;
