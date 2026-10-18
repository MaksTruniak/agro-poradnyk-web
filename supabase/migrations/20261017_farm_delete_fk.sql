-- Видалення поля й культури: правильні зовнішні ключі і прибирання «сиріт».
-- Безпечно запускати повторно.
--
-- Було:
--  • manual_sales.farm_crop_id без правила ON DELETE — поле з ручним продажем не видалялось (409);
--  • protection_programs.farm_crop_id взагалі без ключа — після видалення культури її програма захисту
--    з обробками лишалась у базі назавжди (на момент міграції — 10 таких програм);
--  • reminders.treatment_id без ключа;
--  • продаж, що посилається на вже видалену культуру, не давав відновити ключ.
-- Стало:
--  • тригер продажу більше не повертає прив'язку до вже видаленої культури;
--  • доступи агронома до поля (field_shares) видаляються разом з полем;
--  • продажі, угоди, чати, витрати та інша історія при видаленні поля/культури лишаються,
--    лише без прив'язки (ON DELETE SET NULL);
--  • програма захисту видаляється разом із культурою, її обробки — разом із програмою,
--    нагадування про обробку — разом з обробкою (ON DELETE CASCADE);
--  • осиротілі програми (культури вже немає) і їх обробки видалено.

begin;

-- Замінює ключ на колонці (будь-яку назву) на новий з указаним правилом видалення
create or replace function pg_temp.set_fk(tbl regclass, col text, ref_tbl regclass, ref_col text, on_delete text)
returns void language plpgsql as $$
declare
  old_name text;
begin
  for old_name in
    select c.conname from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f' and c.conrelid = tbl and a.attname = col and array_length(c.conkey, 1) = 1
  loop
    execute format('alter table %s drop constraint %I', tbl, old_name);
  end loop;
  execute format('alter table %s add constraint %I foreign key (%I) references %s (%I) on delete %s',
    tbl, replace(tbl::text, 'public.', '') || '_' || col || '_fkey', col, ref_tbl, ref_col, on_delete);
end;
$$;

-- ── 0. Тригер продажу ────────────────────────────────────────────────────────
-- manual_sales_stock (20261002_deal_stock.sql) при будь-якому оновленні повертав старий farm_crop_id —
-- через це не працювало і прибирання сиріт, і ON DELETE SET NULL. Тепер обнулити прив'язку можна,
-- лише якщо культури вже немає; перечепити продаж на іншу культуру, як і раніше, не можна.
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
  if new.farm_crop_id is null and not exists (select 1 from public.farm_crops fc where fc.id = old.farm_crop_id) then
    new.stock_taken_tons := null;  -- культуру видалено: повертати списане нікуди
  else
    new.farm_crop_id := old.farm_crop_id;
  end if;
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' and new.stock_taken_tons is not null then
    perform public.stock_return(old.farm_crop_id, old.stock_taken_tons);
    new.stock_taken_tons := null;
  end if;
  return new;
end;
$$;

-- ── 1. Сироти ────────────────────────────────────────────────────────────────
update public.manual_sales s set farm_crop_id = null
where s.farm_crop_id is not null
  and not exists (select 1 from public.farm_crops fc where fc.id = s.farm_crop_id);

update public.deals d set farm_crop_id = null
where d.farm_crop_id is not null
  and not exists (select 1 from public.farm_crops fc where fc.id = d.farm_crop_id);

delete from public.reminders r
where r.treatment_id is not null
  and not exists (select 1 from public.program_treatments t where t.id = r.treatment_id);

delete from public.program_treatments t
where exists (
  select 1 from public.protection_programs p
  where p.id = t.program_id and p.farm_crop_id is not null
    and not exists (select 1 from public.farm_crops fc where fc.id = p.farm_crop_id)
);

delete from public.protection_programs p
where p.farm_crop_id is not null
  and not exists (select 1 from public.farm_crops fc where fc.id = p.farm_crop_id);

-- ── 2. Ключі ─────────────────────────────────────────────────────────────────
select pg_temp.set_fk('public.manual_sales',        'farm_crop_id', 'public.farm_crops',         'id', 'set null');
select pg_temp.set_fk('public.protection_programs', 'farm_crop_id', 'public.farm_crops',         'id', 'cascade');
select pg_temp.set_fk('public.program_treatments',  'program_id',   'public.protection_programs', 'id', 'cascade');
select pg_temp.set_fk('public.reminders',           'treatment_id', 'public.program_treatments',  'id', 'cascade');
-- Доступ агронома до поля без самого поля не має сенсу (а field_shares_protect не дає обнулити farm_id)
select pg_temp.set_fk('public.field_shares',        'farm_id',      'public.farms',               'id', 'cascade');

-- Решта ключів на farms / farm_crops без правила видалення → SET NULL (історія лишається)
do $$
declare
  fk record;
begin
  for fk in
    select c.conrelid::regclass as tbl, c.confrelid::regclass as ref_tbl,
           a.attname as col, ra.attname as ref_col, a.attnotnull as notnull
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    join pg_attribute ra on ra.attrelid = c.confrelid and ra.attnum = c.confkey[1]
    where c.contype = 'f'
      and c.confrelid in ('public.farms'::regclass, 'public.farm_crops'::regclass)
      and c.confdeltype in ('a', 'r')
      and array_length(c.conkey, 1) = 1
  loop
    if fk.notnull then
      raise notice 'NOT NULL, не змінено: %.%', fk.tbl, fk.col;
    else
      perform pg_temp.set_fk(fk.tbl, fk.col, fk.ref_tbl, fk.ref_col, 'set null');
      raise notice 'ON DELETE SET NULL: %.%', fk.tbl, fk.col;
    end if;
  end loop;
end;
$$;

commit;
