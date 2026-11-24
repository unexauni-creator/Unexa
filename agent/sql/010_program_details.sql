-- Повна інформація про програму для вкладки Program: огляд, модулі по роках, навички, кар'єра, як навчають,
-- дипломний проєкт, портфоліо, посилання на сторінку програми. Заповнює агент: npm run program.
-- Запустіть один раз у Supabase → SQL Editor. Наявні дані не змінюються.
alter table public.specialties add column if not exists program_details jsonb;
