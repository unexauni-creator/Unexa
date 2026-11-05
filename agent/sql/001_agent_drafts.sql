-- Чернетки агента. Запустіть один раз у Supabase → SQL Editor.
-- Агент НЕ пише одразу в universities / specialties: спершу сюди,
-- а на сайт дані потрапляють лише після схвалення командою `npm run review`.

create table if not exists public.agent_university_drafts (
  id              uuid primary key default gen_random_uuid(),
  registry        text not null,            -- звідки взято заклад, напр. 'fr-esr'
  registry_id     text not null,            -- id у тому реєстрі
  name            text not null,
  name_local      text,
  city            text,
  country         text not null,
  website_url     text not null,
  description     text,
  ror_id          text,
  pages_read      jsonb not null default '[]',  -- які сторінки прочитав агент
  model           text,
  status          text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  university_id   text,                     -- id у вашій таблиці universities після схвалення
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (registry, registry_id)
);

create table if not exists public.agent_specialty_drafts (
  id                  uuid primary key default gen_random_uuid(),
  university_draft_id uuid not null references public.agent_university_drafts(id) on delete cascade,
  payload             jsonb not null,       -- рівно ті колонки, що підуть у specialties
  source_urls         text[] not null default '{}',
  confidence          numeric,
  status              text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected')),
  specialty_id        text,                 -- id у specialties після схвалення
  created_at          timestamptz not null default now()
);

-- RLS увімкнено без політик: з сайту (anon-ключ) ці таблиці не видно,
-- працювати з ними може лише агент із service_role ключем.
alter table public.agent_university_drafts enable row level security;
alter table public.agent_specialty_drafts  enable row level security;
