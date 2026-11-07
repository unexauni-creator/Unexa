-- Викладачі та житло кожної школи, які агент збирає з офіційного сайту (npm run campus).
-- Запустіть один раз у Supabase → SQL Editor (режим бази даних, НЕ "Logs"). Наявні дані не змінюються.

alter table public.universities add column if not exists faculty jsonb;
alter table public.universities add column if not exists housing jsonb;
