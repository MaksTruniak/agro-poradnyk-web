-- Склад: залишок рахує база за журналом руху.
--
-- Було: сторінка рахувала новий залишок у браузері (значення на момент відкриття ± рух) і записувала його.
-- Дві людини (власник і редактор команди, або дві вкладки) затирали зміни одна одної.
-- Стало: запис у farm_inventory_log / fuel_log ('in' / 'out') атомарно змінює quantity; залишок не менший за 0.
-- Сторінки складу більше не оновлюють quantity самі (новий запис створюється з 0 і рухом 'in').

begin;

create or replace function public.inventory_log_apply()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare delta numeric := case when new.type = 'in' then new.quantity else -new.quantity end;
begin
  if tg_table_name = 'farm_inventory_log' then
    update public.farm_inventory set quantity = greatest(0, coalesce(quantity, 0) + delta) where id = new.inventory_id;
  else
    update public.fuel_inventory set quantity = greatest(0, coalesce(quantity, 0) + delta) where id = new.fuel_id;
  end if;
  return null;
end;
$$;

drop trigger if exists inventory_log_apply on public.farm_inventory_log;
create trigger inventory_log_apply
  after insert on public.farm_inventory_log
  for each row execute function public.inventory_log_apply();

drop trigger if exists inventory_log_apply on public.fuel_log;
create trigger inventory_log_apply
  after insert on public.fuel_log
  for each row execute function public.inventory_log_apply();

commit;
