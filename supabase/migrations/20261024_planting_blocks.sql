-- Квартали насадження і облік випадів / підсадки. Безпечно запускати повторно.
-- Запускати ПІСЛЯ 20261023_variety_ripening.sql.
--
-- planting_blocks — квартали (ділянки, групи рядів) одного насадження: назва, ряди, кількість рослин.
-- planting_plant_events — випад (loss) або підсадка (replant): дата, кількість, причина, квартал (необов'язково).
--   Живих рослин = рослин у кварталах (або в насадженні, якщо кварталів немає) − випади + підсадка.
-- Доступ — як до урожаю й догляду: власник, команда (редактор пише), агроном з активною співпрацею (читає).
-- Квартал події має належати тому самому насадженню (тригер); автора й насадження запису не підробити.

begin;

create table if not exists public.planting_blocks (
  id uuid primary key default gen_random_uuid(),
  farm_crop_id uuid not null references public.farm_crops(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  rows_from integer check (rows_from is null or rows_from between 1 and 100000),
  rows_to integer check (rows_to is null or rows_to between 1 and 100000),
  plants_count integer not null default 0 check (plants_count between 0 and 10000000),
  note text check (note is null or char_length(note) <= 300),
  sort_order integer not null default 0,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (farm_crop_id, name),
  check (rows_from is null or rows_to is null or rows_to >= rows_from)
);

create table if not exists public.planting_plant_events (
  id uuid primary key default gen_random_uuid(),
  farm_crop_id uuid not null references public.farm_crops(id) on delete cascade,
  block_id uuid references public.planting_blocks(id) on delete set null,
  event_date date not null default current_date check (event_date >= '1990-01-01'),
  kind text not null check (kind in ('loss', 'replant')),
  count integer not null check (count between 1 and 10000000),
  reason text check (reason is null or reason in ('frost', 'disease', 'pests', 'drought', 'mechanical', 'other')),
  note text check (note is null or char_length(note) <= 300),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists planting_plant_events_crop_idx on public.planting_plant_events (farm_crop_id, event_date);

drop trigger if exists planting_blocks_protect on public.planting_blocks;
create trigger planting_blocks_protect
  before insert or update on public.planting_blocks
  for each row execute function public.planting_phases_protect();
drop trigger if exists planting_plant_events_protect on public.planting_plant_events;
create trigger planting_plant_events_protect
  before insert or update on public.planting_plant_events
  for each row execute function public.planting_phases_protect();

-- Квартал події — того самого насадження
create or replace function public.planting_plant_events_block_check()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.block_id is not null and not exists (
    select 1 from public.planting_blocks b where b.id = new.block_id and b.farm_crop_id = new.farm_crop_id
  ) then
    raise exception 'Квартал не належить цьому насадженню' using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists planting_plant_events_block_check on public.planting_plant_events;
create trigger planting_plant_events_block_check
  before insert or update on public.planting_plant_events
  for each row execute function public.planting_plant_events_block_check();

do $$
declare
  t text;
begin
  foreach t in array array['planting_blocks', 'planting_plant_events'] loop
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

commit;
