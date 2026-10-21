-- Щотижневий лист «План на тиждень». Безпечно запускати повторно.
-- Запускати ПІСЛЯ 20261020_care_yields.sql.
--
-- notification_settings — налаштування листів користувача (поки одне: план на тиждень щопонеділка).
--   Рядка немає — лист надсилається (значення за замовчуванням). Кожен бачить і змінює лише свій рядок.
-- farm_notifications.type — додаємо week_plan (сповіщення в кабінеті разом із листом).

begin;

create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  week_digest boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

drop policy if exists "own: all" on public.notification_settings;
create policy "own: all" on public.notification_settings
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.notification_settings to authenticated;

-- Якщо на farm_notifications.type є перевірка допустимих значень — додаємо до неї week_plan
do $$
declare
  c record;
  types text;
begin
  for c in
    select con.conname from pg_constraint con
    where con.conrelid = 'public.farm_notifications'::regclass and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%type%'
  loop
    execute format('alter table public.farm_notifications drop constraint %I', c.conname);
    select string_agg(quote_literal(t), ', ') into types from (
      select distinct type as t from public.farm_notifications
      union select unnest(array['inventory_low', 'treatment_soon', 'weather_risk', 'week_plan'])
    ) s;
    execute format('alter table public.farm_notifications add constraint %I check (type in (%s))', c.conname, types);
    raise notice 'farm_notifications: дозволені типи %', types;
  end loop;
end;
$$;

commit;
