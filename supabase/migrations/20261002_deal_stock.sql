-- Склад продукції: списання при продажу і повернення при скасуванні.
-- Запускати ПІСЛЯ 20261001_deal_status_promotions.sql.
--
-- Було:
--  • залишок культури (farm_crops.stock_quantity) при угоді списував браузер того, хто підтвердив. Якщо
--    підтверджував заготівельник (угоду запропонував фермер), правила farm_crops не дають йому змінити культуру
--    фермера — залишок не списувався;
--  • ручний продаж списував залишок з браузера, а скасування угоди чи продажу нічого не повертало.
-- Стало (рахує база):
--  • угода переходить у 'confirmed' → списується з культури угоди (farm_crop_id), інакше з першої культури
--    фермера з цим типом і вказаним залишком;
--  • ручний продаж з deduct_from_stock і farm_crop_id → списується при створенні;
--  • скасування підтвердженої угоди / продажу повертає рівно те, що було списано
--    (stock_crop_id, stock_taken_tons — службові поля, з браузера не змінюються).
-- Одиниця 'кг' перераховується; залишок не стає меншим за 0.

begin;

alter table public.deals add column if not exists stock_crop_id uuid;
alter table public.deals add column if not exists stock_taken_tons numeric;
alter table public.manual_sales add column if not exists stock_taken_tons numeric;

-- Списати p_tons з культури; повертає фактично списане (не більше залишку)
create or replace function public.stock_take(p_crop_id uuid, p_tons numeric)
returns numeric
language plpgsql
security definer
set search_path to 'public'
as $$
declare crop record; current_tons numeric; taken numeric;
begin
  select id, stock_quantity, stock_unit into crop from public.farm_crops where id = p_crop_id for update;
  if crop.id is null or crop.stock_quantity is null or coalesce(p_tons, 0) <= 0 then
    return null;
  end if;
  current_tons := case when crop.stock_unit = 'кг' then crop.stock_quantity / 1000 else crop.stock_quantity end;
  taken := least(greatest(current_tons, 0), p_tons);
  update public.farm_crops
  set stock_quantity = case when crop.stock_unit = 'кг' then (current_tons - taken) * 1000 else current_tons - taken end
  where id = crop.id;
  return taken;
end;
$$;

-- Повернути p_tons на культуру
create or replace function public.stock_return(p_crop_id uuid, p_tons numeric)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_crop_id is null or coalesce(p_tons, 0) <= 0 then
    return;
  end if;
  update public.farm_crops
  set stock_quantity = coalesce(stock_quantity, 0) + case when stock_unit = 'кг' then p_tons * 1000 else p_tons end
  where id = p_crop_id;
end;
$$;

revoke all on function public.stock_take(uuid, numeric) from public, anon, authenticated;
revoke all on function public.stock_return(uuid, numeric) from public, anon, authenticated;

-- ── Угоди ────────────────────────────────────────────────────────────────────
drop trigger if exists deals_take_stock on public.deals;
drop function if exists public.deals_take_stock();

create or replace function public.deals_stock()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare crop_id uuid;
begin
  if tg_op = 'INSERT' then
    new.stock_crop_id := null;
    new.stock_taken_tons := null;
    return new;
  end if;

  -- Службові поля змінює лише ця функція
  new.stock_crop_id := old.stock_crop_id;
  new.stock_taken_tons := old.stock_taken_tons;

  if new.status = 'confirmed' and old.status is distinct from 'confirmed' and old.stock_taken_tons is null then
    crop_id := old.farm_crop_id;
    if crop_id is null then
      select fc.id into crop_id
      from public.farm_crops fc join public.farms f on f.id = fc.farm_id
      where f.user_id = old.farmer_id and fc.crop_type = old.crop_type and fc.stock_quantity is not null
      limit 1;
    end if;
    if crop_id is not null then
      new.stock_crop_id := crop_id;
      new.stock_taken_tons := public.stock_take(crop_id, old.quantity_tons);
    end if;
  elsif new.status = 'cancelled' and old.status = 'confirmed' and old.stock_taken_tons is not null then
    perform public.stock_return(old.stock_crop_id, old.stock_taken_tons);
    new.stock_taken_tons := null;
  end if;
  return new;
end;
$$;

-- Ім'я після deals_protect (тригери BEFORE виконуються за алфавітом) — статус уже перевірено
drop trigger if exists deals_zz_stock on public.deals;
create trigger deals_zz_stock
  before insert or update on public.deals
  for each row execute function public.deals_stock();

-- ── Ручні продажі ─────────────────────────────────────────────────────────────
create or replace function public.manual_sales_stock()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op = 'INSERT' then
    new.stock_taken_tons := null;
    if coalesce(new.deduct_from_stock, false) and new.farm_crop_id is not null
       and coalesce(new.status, 'active') <> 'cancelled'
       and exists (select 1 from public.farm_crops fc join public.farms f on f.id = fc.farm_id
                   where fc.id = new.farm_crop_id and f.user_id = new.user_id) then
      new.stock_taken_tons := public.stock_take(new.farm_crop_id, new.quantity_tons);
    end if;
    return new;
  end if;

  new.stock_taken_tons := old.stock_taken_tons;
  new.farm_crop_id := old.farm_crop_id;
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' and old.stock_taken_tons is not null then
    perform public.stock_return(old.farm_crop_id, old.stock_taken_tons);
    new.stock_taken_tons := null;
  end if;
  return new;
end;
$$;

drop trigger if exists manual_sales_stock on public.manual_sales;
create trigger manual_sales_stock
  before insert or update on public.manual_sales
  for each row execute function public.manual_sales_stock();

commit;
