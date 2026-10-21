-- Строк стиглості сортів → орієнтовне вікно збору (shared/utils/ripening.ts). Безпечно запускати повторно.
-- Запускати ПІСЛЯ 20261022_telegram.sql.
--
-- varieties.ripening — група стиглості (дуже ранній … пізній); harvest_from / harvest_to — точні дати сорту (mm-dd),
--   якщо відомі; без них вікно береться з групи стиглості для культури.
-- Заповнює лише адмін: фермер може додати новий сорт, але без строків (тригер їх обнуляє).
-- Початкові групи стиглості — для поширених сортів; ПЕРЕВІРИТИ АГРОНОМОМ (адмінка → Культури → сорти).

begin;

alter table public.varieties add column if not exists ripening text;
alter table public.varieties add column if not exists harvest_from text;
alter table public.varieties add column if not exists harvest_to text;
alter table public.varieties drop constraint if exists varieties_ripening_check;
alter table public.varieties add constraint varieties_ripening_check check (
  (ripening is null or ripening in ('very_early', 'early', 'mid', 'mid_late', 'late'))
  and (harvest_from is null or harvest_from ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$')
  and (harvest_to is null or harvest_to ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$')
);

create or replace function public.varieties_ripening_admin_only()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.ripening := null;
    new.harvest_from := null;
    new.harvest_to := null;
  end if;
  return new;
end;
$$;

drop trigger if exists varieties_ripening_admin_only on public.varieties;
create trigger varieties_ripening_admin_only
  before insert on public.varieties
  for each row execute function public.varieties_ripening_admin_only();

-- Початкові дані: існуючі сорти отримують групу стиглості, відсутні додаються
create temporary table _seed (crop_type text, name text, ripening text) on commit drop;
insert into _seed values
  ('Лохина', 'Дюк', 'early'), ('Лохина', 'Спартан', 'early'), ('Лохина', 'Патріот', 'early'), ('Лохина', 'Дрейпер', 'early'),
  ('Лохина', 'Блюкроп', 'mid'), ('Лохина', 'Блюголд', 'mid'), ('Лохина', 'Блюрей', 'mid'), ('Лохина', 'Торо', 'mid'),
  ('Лохина', 'Нельсон', 'mid_late'), ('Лохина', 'Легасі', 'mid_late'), ('Лохина', 'Ліберті', 'mid_late'), ('Лохина', 'Герберт', 'mid_late'),
  ('Лохина', 'Елліот', 'late'), ('Лохина', 'Чандлер', 'late'), ('Лохина', 'Аврора', 'late'),
  ('Полуниця', 'Альба', 'early'), ('Полуниця', 'Клері', 'early'), ('Полуниця', 'Хоней', 'early'), ('Полуниця', 'Азія', 'early'),
  ('Полуниця', 'Ельсанта', 'mid'), ('Полуниця', 'Дарселект', 'mid'), ('Полуниця', 'Сирія', 'mid'),
  ('Полуниця', 'Флоренс', 'late'), ('Полуниця', 'Мальвіна', 'late'),
  ('Смородина чорна', 'Титанія', 'mid'), ('Смородина чорна', 'Бен Ломонд', 'mid_late'), ('Смородина чорна', 'Бен Тіран', 'late'),
  ('Малина', 'Глен Ампл', 'mid'), ('Малина', 'Глен Файн', 'mid'), ('Малина', 'Тюлямін', 'mid_late'), ('Малина', 'Октавія', 'late'),
  ('Ожина', 'Натчез', 'early'), ('Ожина', 'Трипл Краун', 'mid_late'), ('Ожина', 'Лох Несс', 'mid_late'),
  ('Ожина', 'Честер', 'late'), ('Ожина', 'Торнфрі', 'late'),
  ('Виноград', 'Аркадія', 'early'), ('Виноград', 'Кодрянка', 'early'), ('Виноград', 'Лідія', 'mid_late'),
  ('Виноград', 'Ізабелла', 'late'), ('Виноград', 'Молдова', 'late'),
  ('Виноград', 'Шардоне', 'mid'), ('Виноград', 'Совіньйон блан', 'mid'), ('Виноград', 'Мерло', 'mid_late'),
  ('Виноград', 'Рислінг', 'mid_late'), ('Виноград', 'Каберне Совіньйон', 'late'),
  ('Яблука', 'Білий налив', 'early'), ('Яблука', 'Гала', 'mid'), ('Яблука', 'Антонівка', 'mid'), ('Яблука', 'Чемпіон', 'mid'),
  ('Яблука', 'Голден', 'late'), ('Яблука', 'Симиренко', 'late'), ('Яблука', 'Фуджі', 'late'), ('Яблука', 'Айдаред', 'late'),
  ('Яблука', 'Джонаголд', 'late'), ('Яблука', 'Флоріна', 'late'),
  ('Черешня', 'Валерій Чкалов', 'early'), ('Черешня', 'Регіна', 'late'),
  ('Вишня', 'Шпанка', 'early'),
  ('Абрикос', 'Аврора', 'early');

update public.varieties v set ripening = s.ripening
from _seed s
where lower(v.crop_type) = lower(s.crop_type) and lower(v.name) = lower(s.name) and v.ripening is null;

insert into public.varieties (crop_type, name, ripening, is_active)
select s.crop_type, s.name, s.ripening, true from _seed s
where not exists (select 1 from public.varieties v where lower(v.crop_type) = lower(s.crop_type) and lower(v.name) = lower(s.name));

commit;
