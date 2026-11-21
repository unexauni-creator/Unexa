-- Коли агент востаннє звірив школу з її офіційним сайтом. Сайт показує це на сторінці програми.
-- Запустіть один раз у Supabase → SQL Editor. Наявні дані не змінюються.
alter table public.universities add column if not exists verified_at timestamptz;
