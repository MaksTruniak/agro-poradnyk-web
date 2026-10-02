-- Команда: доступ співробітників до даних господарства.
-- Запускати ПІСЛЯ 20261002_team_invites.sql і 20261001_messages_shares_catalog_agreements_harvest.sql.
--
-- Було: правила таблиць пускали лише власника. Співробітник (і переглядач, і редактор) не бачив складу,
-- нагадувань, журналу обробок, витрат, техкарти, обліку збору власника; редактор не міг нічого записати —
-- кнопки на сайті були, але дії тихо не зберігались.
-- Стало (правила лише ДОДАЮТЬСЯ до наявних, нічого не забирають):
--  • активний співробітник (будь-яка роль) читає дані господарства власника;
--  • редактор створює, змінює й видаляє їх так само, як власник;
--  • угоди власника (deals) співробітник лише читає — для аналітики та доходів.
-- Чати, співпраця з агрономами, підписка, команда, платежі лишаються лише власнику.

begin;

-- ── Допоміжні функції ────────────────────────────────────────────────────────
create or replace function public.is_team_editor_of(owner uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.team_members
    where owner_id = owner and member_id = auth.uid() and status = 'active' and role = 'editor'
  );
$$;

-- Власник за ланцюжком (security definer — без рекурсії правил)
create or replace function public.farm_owner(p_farm_id uuid)
returns uuid language sql stable security definer set search_path to 'public' as $$
  select user_id from public.farms where id = p_farm_id;
$$;

create or replace function public.farm_crop_owner(p_farm_crop_id uuid)
returns uuid language sql stable security definer set search_path to 'public' as $$
  select f.user_id from public.farm_crops fc join public.farms f on f.id = fc.farm_id where fc.id = p_farm_crop_id;
$$;

create or replace function public.program_owner(p_program_id uuid)
returns uuid language sql stable security definer set search_path to 'public' as $$
  select f.user_id from public.protection_programs p
  join public.farm_crops fc on fc.id = p.farm_crop_id
  join public.farms f on f.id = fc.farm_id
  where p.id = p_program_id;
$$;

create or replace function public.inventory_owner(p_inventory_id uuid)
returns uuid language sql stable security definer set search_path to 'public' as $$
  select user_id from public.farm_inventory where id = p_inventory_id;
$$;

create or replace function public.fuel_owner(p_fuel_id uuid)
returns uuid language sql stable security definer set search_path to 'public' as $$
  select user_id from public.fuel_inventory where id = p_fuel_id;
$$;

create or replace function public.harvest_season_owner(p_season_id uuid)
returns uuid language sql stable security definer set search_path to 'public' as $$
  select owner_id from public.harvest_seasons where id = p_season_id;
$$;

-- ── Правила: читання для команди, запис для редактора ─────────────────────────
-- Створює чотири правила "team: ..." для таблиці; owner_expr — вираз власника рядка.
create or replace function pg_temp.team_policies(tbl text, owner_expr text)
returns void language plpgsql as $$
begin
  execute format('drop policy if exists "team: read" on public.%I', tbl);
  execute format('drop policy if exists "team: editor insert" on public.%I', tbl);
  execute format('drop policy if exists "team: editor update" on public.%I', tbl);
  execute format('drop policy if exists "team: editor delete" on public.%I', tbl);
  execute format('create policy "team: read" on public.%I for select to authenticated using (public.is_team_member_of(%s))', tbl, owner_expr);
  execute format('create policy "team: editor insert" on public.%I for insert to authenticated with check (public.is_team_editor_of(%s))', tbl, owner_expr);
  execute format('create policy "team: editor update" on public.%I for update to authenticated using (public.is_team_editor_of(%s)) with check (public.is_team_editor_of(%s))', tbl, owner_expr, owner_expr);
  execute format('create policy "team: editor delete" on public.%I for delete to authenticated using (public.is_team_editor_of(%s))', tbl, owner_expr);
end;
$$;

select pg_temp.team_policies('farms',                  'user_id');
select pg_temp.team_policies('farm_crops',             'public.farm_owner(farm_id)');
select pg_temp.team_policies('crop_rotation',          'public.farm_owner(farm_id)');
select pg_temp.team_policies('protection_programs',    'public.farm_crop_owner(farm_crop_id)');
select pg_temp.team_policies('program_treatments',     'public.program_owner(program_id)');
select pg_temp.team_policies('reminders',              'user_id');
select pg_temp.team_policies('field_treatments',       'user_id');
select pg_temp.team_policies('expenses',               'user_id');
select pg_temp.team_policies('manual_sales',           'user_id');
select pg_temp.team_policies('farm_inventory',         'user_id');
select pg_temp.team_policies('farm_inventory_log',     'public.inventory_owner(inventory_id)');
select pg_temp.team_policies('fuel_inventory',         'user_id');
select pg_temp.team_policies('fuel_log',               'public.fuel_owner(fuel_id)');
select pg_temp.team_policies('equipment',              'user_id');
select pg_temp.team_policies('harvest_seasons',        'owner_id');
select pg_temp.team_policies('harvest_workers',        'owner_id');
select pg_temp.team_policies('harvest_season_workers', 'public.harvest_season_owner(season_id)');
select pg_temp.team_policies('harvest_records',        'public.harvest_season_owner(season_id)');
select pg_temp.team_policies('harvest_payments',       'public.harvest_season_owner(season_id)');

-- Угоди власника — лише читання (аналітика, доходи)
drop policy if exists "team: read" on public.deals;
create policy "team: read" on public.deals
  for select to authenticated using (public.is_team_member_of(farmer_id));

-- ── Виплати збирачам: редактор команди веде їх як власник ─────────────────────
create or replace function public.harvest_payments_protect()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare owner uuid;
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  select w.owner_id into owner from public.harvest_workers w where w.id = old.worker_id;
  -- Власник сезону і редактор його команди редагують як завгодно
  if owner = auth.uid() or public.is_team_editor_of(owner) then
    return new;
  end if;
  -- Працівник: лише status → 'confirmed' і дата підтвердження
  new.worker_id := old.worker_id;
  new.season_id := old.season_id;
  new.amount := old.amount;
  new.paid_at := old.paid_at;
  if new.status is distinct from old.status then
    if new.status = 'confirmed' then
      new.confirmed_at := now();
    else
      raise exception 'Недозволена зміна статусу виплати' using errcode = '42501';
    end if;
  else
    new.confirmed_at := old.confirmed_at;
  end if;
  return new;
end;
$$;

commit;
