-- Студентське життя школи (клуби, спорт, події, підтримка, житло…), яке збирає агент.
-- Запустіть один раз у Supabase → SQL Editor (режим бази даних, НЕ "Logs").
-- Наявні дані не змінюються, лише додається порожня колонка.

alter table public.universities add column if not exists student_life jsonb;
