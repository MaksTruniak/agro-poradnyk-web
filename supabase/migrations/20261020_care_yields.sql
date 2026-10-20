-- Догляд за насадженнями, урожай по роках, строк очікування в журналі обробок. Безпечно запускати повторно.
-- Запускати ПІСЛЯ 20261016_perennial_plantings.sql і 20261019_waiting_days_weather_alerts.sql.
--
-- field_treatments.waiting_days — строк очікування до збору для записів, внесених у журнал вручну
--   (для обробок з техкарти він у program_treatments.waiting_days).
-- planting_care_log — виконані роботи з догляду (обрізка, побілка, укриття…): task_key — ключ роботи
--   з shared/utils/careTasks.ts, period — місяць початку вікна роботи (yyyy-mm), щоб та сама робота
--   наступного сезону знову з'явилась у плані.
-- planting_yields — урожай насадження за рік, якщо фермер не веде облік збору зі збирачами.
-- Доступ — як до журналу фенофаз: власник, команда (редактор пише) і агроном з активною співпрацею (читає;
-- відмічати догляд теж може).

begin;

alter table public.field_treatments add column if not exists waiting_days smallint;
alter table public.field_treatments drop constraint if exists field_treatments_waiting_days_check;
alter table public.field_treatments add constraint field_treatments_waiting_days_check
  check (waiting_days is null or waiting_days between 0 and 365);

-- ── Догляд ───────────────────────────────────────────────────────────────────
create table if not exists public.planting_care_log (
  id uuid primary key default gen_random_uuid(),
  farm_crop_id uuid not null references public.farm_crops(id) on delete cascade,
  task_key text not null check (task_key ~ '^[a-z_]{1,60}$'),
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  done_at date not null default current_date,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (farm_crop_id, task_key, period)
);

-- ── Урожай по роках ──────────────────────────────────────────────────────────
create table if not exists public.planting_yields (
  id uuid primary key default gen_random_uuid(),
  farm_crop_id uuid not null references public.farm_crops(id) on delete cascade,
  year smallint not null check (year between 1900 and 2100),
  yield_kg numeric not null check (yield_kg >= 0 and yield_kg <= 100000000),
  note text check (note is null or length(note) <= 500),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (farm_crop_id, year)
);

-- Автор, час і насадження запису не підробити (та сама функція, що й для planting_phases)
drop trigger if exists planting_care_log_protect on public.planting_care_log;
create trigger planting_care_log_protect
  before insert or update on public.planting_care_log
  for each row execute function public.planting_phases_protect();
drop trigger if exists planting_yields_protect on public.planting_yields;
create trigger planting_yields_protect
  before insert or update on public.planting_yields
  for each row execute function public.planting_phases_protect();

do $$
declare
  t text;
begin
  foreach t in array array['planting_care_log', 'planting_yields'] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "owner: all" on public.%I', t);
    execute format($p$create policy "owner: all" on public.%I for all to authenticated
      using (public.farm_crop_owner(farm_crop_id) = auth.uid())
      with check (public.farm_crop_owner(farm_crop_id) = auth.uid())$p$, t);

    execute format('drop policy if exists "team: read" on public.%I', t);
    execute format('drop policy if exists "team: editor insert" on public.%I', t);
    execute format('drop policy if exists "team: editor update" on public.%I', t);
    execute format('drop policy if exists "team: editor delete" on public.%I', t);
    execute format($p$create policy "team: read" on public.%I for select to authenticated
      using (public.is_team_member_of(public.farm_crop_owner(farm_crop_id)))$p$, t);
    execute format($p$create policy "team: editor insert" on public.%I for insert to authenticated
      with check (public.is_team_editor_of(public.farm_crop_owner(farm_crop_id)))$p$, t);
    execute format($p$create policy "team: editor update" on public.%I for update to authenticated
      using (public.is_team_editor_of(public.farm_crop_owner(farm_crop_id)))
      with check (public.is_team_editor_of(public.farm_crop_owner(farm_crop_id)))$p$, t);
    execute format($p$create policy "team: editor delete" on public.%I for delete to authenticated
      using (public.is_team_editor_of(public.farm_crop_owner(farm_crop_id)))$p$, t);

    execute format('drop policy if exists "agronomist: read" on public.%I', t);
    execute format($p$create policy "agronomist: read" on public.%I for select to authenticated
      using (public.is_agronomist_of(public.farm_crop_owner(farm_crop_id)))$p$, t);

    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end;
$$;

-- Агроном може відмічати виконаний догляд (як і фенофази)
drop policy if exists "agronomist: insert" on public.planting_care_log;
drop policy if exists "agronomist: delete" on public.planting_care_log;
create policy "agronomist: insert" on public.planting_care_log
  for insert to authenticated with check (public.is_agronomist_of(public.farm_crop_owner(farm_crop_id)));
create policy "agronomist: delete" on public.planting_care_log
  for delete to authenticated using (public.is_agronomist_of(public.farm_crop_owner(farm_crop_id)));

commit;
