-- Строк очікування до збору і погодні сповіщення. Безпечно запускати повторно.
--
-- program_treatments:
--   done_at      — коли обробку виконали (сайт ставить сьогоднішню дату при позначці «Виконано», фермер може змінити);
--   waiting_days — строк очікування до збору за етикеткою препарату, днів (0 — без обмежень).
-- Звідси сайт рахує «збір не раніше …» і попереджає, якщо насадження вже дозріває.
--
-- farm_notifications: новий тип сповіщення weather_risk (заморозки, погода для інфекцій) — щоденний cron.

begin;

alter table public.program_treatments add column if not exists done_at date;
alter table public.program_treatments add column if not exists waiting_days smallint;
alter table public.program_treatments drop constraint if exists program_treatments_waiting_days_check;
alter table public.program_treatments add constraint program_treatments_waiting_days_check
  check (waiting_days is null or waiting_days between 0 and 365);

-- Якщо на farm_notifications.type є перевірка допустимих значень — додаємо до неї weather_risk
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
      union select unnest(array['inventory_low', 'treatment_soon', 'weather_risk'])
    ) s;
    execute format('alter table public.farm_notifications add constraint %I check (type in (%s))', c.conname, types);
    raise notice 'farm_notifications: дозволені типи %', types;
  end loop;
end;
$$;

commit;
