-- Roadmap: які кроки плану вступу студент уже позначив виконаними (зберігається в акаунті).
-- Запустіть один раз у Supabase → SQL Editor (режим бази даних, НЕ "Logs"). Наявні дані не змінюються.
-- Правила доступу до profiles вже є (004): кожен бачить і змінює лише свій профіль.

alter table public.profiles add column if not exists roadmap_progress jsonb not null default '{}'::jsonb;
