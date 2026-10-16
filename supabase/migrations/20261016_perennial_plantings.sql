-- Багаторічні насадження: групи культур, параметри насадження, журнал фенофаз.
-- Запускати ПІСЛЯ 20261002_team_access.sql і 20261008_agronomist_clients.sql.
--
-- Було:
--  • crop_catalog.group_key порожній у всіх культур — групу (а з нею й набір фенофаз) сайт вгадував
--    за назвою культури словником, скопійованим у двох сторінках захисту;
--  • виноград ішов як ягідний кущ, лохина й чорниця — разом із полуницею;
--  • культура на полі не мала параметрів насадження (рік посадки, підщепа, схема, к-сть рослин);
--  • поточну фенофазу насадження ніде не відмічали;
--  • серед системних фаз — тестові записи «Тест», «фівфів», «ффів».
-- Стало:
--  • group_key заповнено для всього каталогу, додано групу 'grape' і прапорець is_perennial;
--  • додано кілька багаторічних культур, яких бракувало;
--  • farm_crops — необов'язкові поля насадження;
--  • planting_phases — журнал фенофаз насадження (поточна фаза = останній запис);
--    читає й веде власник, його команда (редактор) і агроном з активною співпрацею;
--  • окремий набір фенофаз винограду, тестові фази прибрано.
-- Ключі наявних фаз не змінюються — на них посилаються program_treatments.phase.

begin;

-- ── 1. Каталог: групи культур ────────────────────────────────────────────────
alter table public.crop_catalog add column if not exists is_perennial boolean not null default false;

-- Культури, яких бракувало (категорія — з наявних рядків каталогу)
insert into public.crop_catalog (name, emoji, category, category_id)
select v.name, v.emoji, c.category, c.category_id
from (values
  ('Жимолость', '🫐', 'Ягоди'),
  ('Обліпиха',  '🟠', 'Ягоди'),
  ('Аронія',    '🫐', 'Ягоди'),
  ('Йошта',     '🫐', 'Ягоди'),
  ('Журавлина', '🔴', 'Ягоди'),
  ('Алича',     '🍑', 'Фрукти'),
  ('Мигдаль',   '🌰', 'Фрукти')
) as v(name, emoji, cat)
cross join lateral (
  select category, category_id from public.crop_catalog where category = v.cat limit 1
) c
where not exists (select 1 from public.crop_catalog cc where cc.name = v.name);

update public.crop_catalog set group_key = g.group_key
from (values
  -- Багаторічні
  ('Аґрус', 'berry_shrub'), ('Горобина', 'berry_shrub'), ('Калина', 'berry_shrub'), ('Лохина', 'berry_shrub'),
  ('Малина', 'berry_shrub'), ('Ожина', 'berry_shrub'), ('Смородина біла', 'berry_shrub'),
  ('Смородина червона', 'berry_shrub'), ('Смородина чорна', 'berry_shrub'), ('Чорниця', 'berry_shrub'),
  ('Шипшина', 'berry_shrub'), ('Жимолость', 'berry_shrub'), ('Обліпиха', 'berry_shrub'),
  ('Аронія', 'berry_shrub'), ('Йошта', 'berry_shrub'), ('Журавлина', 'berry_shrub'),
  ('Полуниця', 'berry_herb'), ('Суниця', 'berry_herb'),
  ('Виноград столовий', 'grape'), ('Виноград технічний', 'grape'),
  ('Яблуня', 'fruit_pome'), ('Груша', 'fruit_pome'), ('Айва', 'fruit_pome'),
  ('Абрикос', 'fruit_stone'), ('Вишня', 'fruit_stone'), ('Нектарин', 'fruit_stone'), ('Персик', 'fruit_stone'),
  ('Слива', 'fruit_stone'), ('Черешня', 'fruit_stone'), ('Кизил', 'fruit_stone'), ('Алича', 'fruit_stone'),
  ('Інжир', 'fruit_stone'), ('Хурма', 'fruit_stone'),
  ('Горіх волоський', 'nut'), ('Каштан їстівний', 'nut'), ('Ліщина', 'nut'), ('Мигдаль', 'nut'),
  -- Польові
  ('Гречка', 'grain'), ('Жито', 'grain'), ('Овес', 'grain'), ('Просо', 'grain'), ('Пшениця озима', 'grain'),
  ('Пшениця яра', 'grain'), ('Сорго', 'grain'), ('Ячмінь', 'grain'),
  ('Кукурудза зернова', 'corn'), ('Кукурудза цукрова', 'corn'),
  ('Ріпак', 'oilseed'), ('Соняшник', 'oilseed'),
  ('Соя', 'legume'), ('Боби', 'legume'), ('Горох', 'legume'), ('Квасоля', 'legume'),
  ('Коноплі', 'technical'), ('Лаванда', 'technical'), ('Льон', 'technical'), ('М''ята', 'technical'),
  ('Меліса', 'technical'), ('Тютюн', 'technical'), ('Хміль', 'technical'), ('Цукровий буряк', 'technical'),
  -- Овочі та баштанні
  ('Баклажан', 'veg_nightshade'), ('Картопля', 'veg_nightshade'), ('Перець гострий', 'veg_nightshade'),
  ('Перець солодкий', 'veg_nightshade'), ('Томат', 'veg_nightshade'),
  ('Гарбуз', 'veg_cucurbit'), ('Кабачок', 'veg_cucurbit'), ('Кабачок цукіні', 'veg_cucurbit'),
  ('Огірок', 'veg_cucurbit'), ('Диня', 'veg_cucurbit'), ('Кавун', 'veg_cucurbit'),
  ('Капуста білокачанна', 'veg_brassica'), ('Капуста броколі', 'veg_brassica'),
  ('Капуста брюссельська', 'veg_brassica'), ('Капуста цвітна', 'veg_brassica'), ('Капуста червона', 'veg_brassica'),
  ('Цибуля ріпчаста', 'veg_allium'), ('Цибуля-порей', 'veg_allium'), ('Часник', 'veg_allium'),
  ('Буряк', 'veg_root'), ('Морква', 'veg_root'), ('Пастернак', 'veg_root'), ('Редиска', 'veg_root'),
  ('Редька', 'veg_root'), ('Ріпа', 'veg_root'),
  ('Артишок', 'veg_leaf'), ('Базилік', 'veg_leaf'), ('Кріп', 'veg_leaf'), ('Петрушка', 'veg_leaf'),
  ('Салат', 'veg_leaf'), ('Селера', 'veg_leaf'), ('Спаржа', 'veg_leaf'), ('Шпинат', 'veg_leaf')
) as g(name, group_key)
where crop_catalog.name = g.name;

update public.crop_catalog
set is_perennial = group_key in ('berry_shrub', 'berry_herb', 'grape', 'fruit_pome', 'fruit_stone', 'nut')
where group_key is not null;

-- Культури полів без прив'язки до каталогу — прив'язуємо за точною назвою
update public.farm_crops fc set catalog_id = c.id
from public.crop_catalog c
where fc.catalog_id is null and lower(trim(fc.crop_type)) = lower(c.name);

-- ── 2. Параметри насадження ──────────────────────────────────────────────────
alter table public.farm_crops add column if not exists planting_year integer;
alter table public.farm_crops add column if not exists rootstock text;
alter table public.farm_crops add column if not exists row_spacing_m numeric;
alter table public.farm_crops add column if not exists plant_spacing_m numeric;
alter table public.farm_crops add column if not exists plants_count integer;
alter table public.farm_crops add column if not exists trellis text;
alter table public.farm_crops add column if not exists irrigation text;

alter table public.farm_crops drop constraint if exists farm_crops_planting_check;
alter table public.farm_crops add constraint farm_crops_planting_check check (
  (planting_year is null or planting_year between 1900 and 2100)
  and (row_spacing_m is null or row_spacing_m > 0 and row_spacing_m <= 20)
  and (plant_spacing_m is null or plant_spacing_m > 0 and plant_spacing_m <= 20)
  and (plants_count is null or plants_count >= 0)
  and (irrigation is null or irrigation in ('none', 'drip', 'sprinkler', 'other'))
  and (rootstock is null or length(rootstock) <= 100)
  and (trellis is null or length(trellis) <= 100)
);

-- ── 3. Журнал фенофаз ────────────────────────────────────────────────────────
create table if not exists public.planting_phases (
  id uuid primary key default gen_random_uuid(),
  farm_crop_id uuid not null references public.farm_crops(id) on delete cascade,
  phase_key text not null check (length(phase_key) between 1 and 120),
  observed_at date not null default current_date,
  note text check (note is null or length(note) <= 1000),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists planting_phases_crop_idx on public.planting_phases (farm_crop_id, observed_at desc);

alter table public.planting_phases enable row level security;

-- Автор запису — завжди той, хто записав
create or replace function public.planting_phases_protect()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.farm_crop_id := old.farm_crop_id;
  end if;
  return new;
end;
$$;

drop trigger if exists planting_phases_protect on public.planting_phases;
create trigger planting_phases_protect
  before insert or update on public.planting_phases
  for each row execute function public.planting_phases_protect();

drop policy if exists "owner: all" on public.planting_phases;
create policy "owner: all" on public.planting_phases
  for all to authenticated
  using (public.farm_crop_owner(farm_crop_id) = auth.uid())
  with check (public.farm_crop_owner(farm_crop_id) = auth.uid());

drop policy if exists "team: read" on public.planting_phases;
drop policy if exists "team: editor insert" on public.planting_phases;
drop policy if exists "team: editor update" on public.planting_phases;
drop policy if exists "team: editor delete" on public.planting_phases;
create policy "team: read" on public.planting_phases
  for select to authenticated using (public.is_team_member_of(public.farm_crop_owner(farm_crop_id)));
create policy "team: editor insert" on public.planting_phases
  for insert to authenticated with check (public.is_team_editor_of(public.farm_crop_owner(farm_crop_id)));
create policy "team: editor update" on public.planting_phases
  for update to authenticated
  using (public.is_team_editor_of(public.farm_crop_owner(farm_crop_id)))
  with check (public.is_team_editor_of(public.farm_crop_owner(farm_crop_id)));
create policy "team: editor delete" on public.planting_phases
  for delete to authenticated using (public.is_team_editor_of(public.farm_crop_owner(farm_crop_id)));

drop policy if exists "agronomist: read" on public.planting_phases;
drop policy if exists "agronomist: insert" on public.planting_phases;
drop policy if exists "agronomist: update" on public.planting_phases;
drop policy if exists "agronomist: delete" on public.planting_phases;
create policy "agronomist: read" on public.planting_phases
  for select to authenticated using (public.is_agronomist_of(public.farm_crop_owner(farm_crop_id)));
create policy "agronomist: insert" on public.planting_phases
  for insert to authenticated with check (public.is_agronomist_of(public.farm_crop_owner(farm_crop_id)));
create policy "agronomist: update" on public.planting_phases
  for update to authenticated
  using (public.is_agronomist_of(public.farm_crop_owner(farm_crop_id)))
  with check (public.is_agronomist_of(public.farm_crop_owner(farm_crop_id)));
create policy "agronomist: delete" on public.planting_phases
  for delete to authenticated using (public.is_agronomist_of(public.farm_crop_owner(farm_crop_id)));

grant select, insert, update, delete on public.planting_phases to authenticated;

-- ── 4. Фенофази ──────────────────────────────────────────────────────────────
-- Тестові системні фази (ніде не використані)
delete from public.growth_phases
where created_by is null and key in ('Тест', 'фівфів', 'ффів')
  and not exists (select 1 from public.program_treatments t where t.phase = growth_phases.key);

-- Спільні фази, що підходять і винограду
update public.growth_phases
set crop_groups = array_append(crop_groups, 'grape')
where created_by is null
  and key in ('Спокій', 'Цвітіння', 'Збір урожаю', 'Підготовка до зими')
  and not ('grape' = any(crop_groups));

-- Фази винограду (BBCH для винограду)
insert into public.growth_phases (key, emoji, order_num, is_default, bbch_from, bbch_to, crop_groups)
select v.key, v.emoji, v.order_num, true, v.bbch_from, v.bbch_to, array['grape']
from (values
  ('Сокорух / Набрякання бруньок',        '💧', 2,  1,  3),
  ('Розпускання бруньок',                 '🌱', 3,  5,  9),
  ('Розвиток листя та пагонів',           '🌿', 4,  11, 19),
  ('Поява суцвіть',                       '🌾', 5,  53, 57),
  ('Формування ягід',                     '🫐', 8,  71, 75),
  ('Змикання ґрон',                       '🍇', 9,  77, 79),
  ('Початок достигання (м''якнення ягід)', '🟣', 10, 81, 83),
  ('Технічна стиглість',                  '🍷', 11, 85, 89),
  ('Визрівання лози / Листопад',          '🍂', 13, 91, 97)
) as v(key, emoji, order_num, bbch_from, bbch_to)
where not exists (select 1 from public.growth_phases p where p.key = v.key and p.created_by is null);

commit;
