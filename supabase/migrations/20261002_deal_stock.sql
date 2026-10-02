-- Склад продукції: списання при підтвердженні угоди.
-- Запускати ПІСЛЯ 20261001_deal_status_promotions.sql.
--
-- Було: залишок культури (farm_crops.stock_quantity) списував браузер того, хто підтвердив угоду.
-- Якщо підтверджував заготівельник (угоду запропонував фермер), правила farm_crops не дають йому змінити
-- культуру фермера — залишок не списувався.
-- Стало: списує база, коли угода переходить у 'confirmed' (хто б не підтвердив). Логіка та сама, що була
-- на сторінці чату: культура з угоди (farm_crop_id), інакше перша культура фермера з цим типом і вказаним
-- залишком; одиниця 'кг' перераховується; залишок не стає меншим за 0.

begin;

create or replace function public.deals_take_stock()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  crop record;
  current_tons numeric;
  new_tons numeric;
begin
  if not (new.status = 'confirmed' and old.status is distinct from 'confirmed') then
    return null;
  end if;
  if coalesce(new.quantity_tons, 0) <= 0 then
    return null;
  end if;

  if new.farm_crop_id is not null then
    select fc.id, fc.stock_quantity, fc.stock_unit into crop
    from public.farm_crops fc
    where fc.id = new.farm_crop_id;
  else
    select fc.id, fc.stock_quantity, fc.stock_unit into crop
    from public.farm_crops fc
    join public.farms f on f.id = fc.farm_id
    where f.user_id = new.farmer_id and fc.crop_type = new.crop_type and fc.stock_quantity is not null
    limit 1;
  end if;

  if crop.id is null or crop.stock_quantity is null then
    return null;
  end if;

  current_tons := case when crop.stock_unit = 'кг' then crop.stock_quantity / 1000 else crop.stock_quantity end;
  new_tons := greatest(0, current_tons - new.quantity_tons);
  update public.farm_crops
  set stock_quantity = case when crop.stock_unit = 'кг' then new_tons * 1000 else new_tons end
  where id = crop.id;
  return null;
end;
$$;

drop trigger if exists deals_take_stock on public.deals;
create trigger deals_take_stock
  after update on public.deals
  for each row execute function public.deals_take_stock();

commit;
