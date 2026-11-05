-- Нові колонки для сторінки програми. Запустіть один раз у Supabase → SQL Editor
-- (режим бази даних, НЕ "Logs"). Наявні дані не змінюються, лише додаються порожні колонки.

alter table public.specialties add column if not exists image_url         text;  -- власне фото програми
alter table public.specialties add column if not exists intake            text;  -- коли починається навчання
alter table public.specialties add column if not exists application_fee   text;  -- вартість подачі заявки
alter table public.specialties add column if not exists class_size        text;  -- розмір групи / набору
alter table public.specialties add column if not exists campus_facilities text;  -- майстерні, студії, лабораторії

-- Дедлайн подачі вже має свою колонку: application_deadlines
