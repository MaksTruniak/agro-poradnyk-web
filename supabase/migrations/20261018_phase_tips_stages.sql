-- Поради за фазами з урахуванням віку насадження.
-- Запускати ПІСЛЯ 20261017_phase_tips.sql. Безпечно запускати повторно.
--
-- Було: порада показувалась усім насадженням групи, незалежно від віку — кущу першого року радили
-- вирізати 5–6-річні гілки і стежити за строками очікування перед збором.
-- Стало: phase_tips.stages — для яких стадій порада (establishment — рік посадки, young — молоде,
-- bearing — плодоносне); порожньо — для всіх. Стадію рахує сайт (shared/utils/plantingStage.ts).
-- Наявні чернетки розмічено, додано чернетки для року посадки (усі — неопубліковані).

begin;

alter table public.phase_tips add column if not exists stages text[];
alter table public.phase_tips drop constraint if exists phase_tips_stages_check;
alter table public.phase_tips add constraint phase_tips_stages_check
  check (stages is null or (cardinality(stages) > 0 and stages <@ array['establishment', 'young', 'bearing']));

-- ── Розмітка наявних порад (група + назва) ───────────────────────────────────
update public.phase_tips t set stages = v.stages
from (values
  ('berry_shrub', 'Санітарна обрізка кущів',                      array['young', 'bearing']),
  ('berry_shrub', 'Азотне підживлення на старті вегетації',       array['young', 'bearing']),
  ('berry_shrub', 'Нормування молодих пагонів малини',            array['young', 'bearing']),
  ('berry_shrub', 'Захист бджіл під час цвітіння',                array['young', 'bearing']),
  ('berry_shrub', 'Профілактика сірої гнилі',                     array['young', 'bearing']),
  ('berry_shrub', 'Рівномірний полив',                            array['young', 'bearing']),
  ('berry_shrub', 'Калійне підживлення',                          array['young', 'bearing']),
  ('berry_shrub', 'Контроль плодової мушки (дрозофіли SWD)',      array['young', 'bearing']),
  ('berry_shrub', 'Перевірити строки очікування',                 array['young', 'bearing']),
  ('berry_shrub', 'Вирізати пагони малини, що відплодоносили',    array['young', 'bearing']),
  ('berry_shrub', 'Обробка проти плямистостей листя',             array['young', 'bearing']),

  ('berry_herb', 'Весняне очищення плантації',                    array['young', 'bearing']),
  ('berry_herb', 'Азотне підживлення на відростанні',             array['young', 'bearing']),
  ('berry_herb', 'Захист від сірої гнилі',                        array['young', 'bearing']),
  ('berry_herb', 'Захист від заморозків',                         array['young', 'bearing']),
  ('berry_herb', 'Полив без зволоження ягід',                     array['young', 'bearing']),
  ('berry_herb', 'Контроль дрозофіли SWD і гнилих ягід',          array['young', 'bearing']),
  ('berry_herb', 'Строки очікування і охолодження',               array['young', 'bearing']),
  ('berry_herb', 'Видалення вусів і старого листя',               array['young', 'bearing']),

  ('grape', 'Обрізка лози',                                       array['young', 'bearing']),
  ('grape', 'Суха підв''язка лози',                               array['young', 'bearing']),
  ('grape', 'Обламування зайвих пагонів',                         array['young', 'bearing']),
  ('grape', 'Бор для запилення',                                  array['bearing']),
  ('grape', 'Без інсектицидів під час цвітіння',                  array['young', 'bearing']),
  ('grape', 'Обробка після цвітіння',                             array['bearing']),
  ('grape', 'Гронова листокрутка',                                array['bearing']),
  ('grape', 'Обробка всередину грона перед змиканням',            array['bearing']),
  ('grape', 'Проріджування листя в зоні ґрон',                    array['bearing']),
  ('grape', 'Обмежити азот і полив',                              array['bearing']),
  ('grape', 'Захист від ос і птахів',                             array['bearing']),
  ('grape', 'Контроль цукристості й кислотності',                 array['bearing']),
  ('grape', 'Збір у суху погоду',                                 array['bearing']),

  ('fruit_pome', 'Захист бджіл',                                  array['bearing']),
  ('fruit_pome', 'Яблунева плодожерка — пастки',                  array['bearing']),
  ('fruit_pome', 'Нормування зав''язі',                           array['bearing']),
  ('fruit_pome', 'Кальцій для лежкості',                          array['bearing']),
  ('fruit_pome', 'Друге покоління плодожерки',                    array['bearing']),
  ('fruit_pome', 'Визначити строк знімання',                      array['bearing']),

  ('fruit_stone', 'Моніліальний опік',                            array['bearing']),
  ('fruit_stone', 'Захист бджіл',                                 array['bearing']),
  ('fruit_stone', 'Вишнева муха і сливова плодожерка',            array['bearing']),
  ('fruit_stone', 'Профілактика розтріскування черешні',          array['bearing']),

  ('nut', 'Горіхова плодожерка і муха',                           array['bearing']),
  ('nut', 'Своєчасне знімання і сушіння',                         array['bearing'])
) as v(crop_group, title, stages)
where t.crop_group = v.crop_group and t.title = v.title and t.stages is null;

-- ── Чернетки для року посадки ────────────────────────────────────────────────
insert into public.phase_tips (crop_group, phase_key, order_num, category, urgency, title, description, stages)
select v.crop_group, v.phase_key, v.order_num, v.category, v.urgency, v.title, v.description, array['establishment']
from (values
  ('berry_shrub', 'Проростання / Набрякання бруньок', 0, 'nutrition', 'medium', 'Обережне живлення молодих кущів',
   'Азот — малими дозами, дробно (краще фертигацією): надлишок солей пошкоджує ще слабке коріння. Лохині — лише амонійні форми й контроль pH 4,5–5,5.'),
  ('berry_shrub', 'Розвиток листя', 0, 'irrigation', 'high', 'Полив для приживлення',
   'Перші тижні після посадки — регулярний полив невеликими нормами: коренева система ще мала, кущ легко пересихає.'),
  ('berry_shrub', 'Розвиток пагонів / Кущіння', 0, 'preparation', 'medium', 'Чистий від бур''янів рядок',
   'Молоді кущі погано конкурують з бур''янами: мульча або ручна прополка в рядку, без гербіцидів безпосередньо під кущем.'),
  ('berry_shrub', 'Цвітіння', 0, 'pruning', 'high', 'Видалити квітки на кущах першого року',
   'Квітки й зав''язь на молодих кущах видаляти — уся сила має йти в коріння і пагони, а не в ягоди.'),
  ('berry_herb', 'Розвиток листя', 0, 'irrigation', 'high', 'Полив для приживлення розсади',
   'Після посадки — щоденний або частий полив невеликими нормами, поки розсада не вкорениться.'),
  ('berry_herb', 'Цвітіння', 0, 'pruning', 'high', 'Видалити квітконоси після весняної посадки',
   'У рік весняної посадки квітконоси видаляють — рослина сформує сильніший кущ і більший урожай наступного року.'),
  ('grape', 'Розвиток листя та пагонів', 0, 'pruning', 'high', 'Формування: один сильний пагін',
   'Залишити один найсильніший пагін і підв''язати до кілка, інші видалити; пасинки прищипувати.'),
  ('grape', 'Розвиток листя та пагонів', 0, 'irrigation', 'high', 'Полив і мульча саджанців',
   'Регулярний полив у перший рік, мульча навколо саджанця — коріння молодого винограду неглибоке.'),
  ('fruit_pome', 'Спокій', 0, 'pruning', 'high', 'Обрізка саджанця після посадки',
   'Одразу після весняної посадки вкоротити центральний провідник і бічні гілки для закладання крони; підв''язати до опори.'),
  ('fruit_pome', 'Розвиток листя', 0, 'irrigation', 'high', 'Полив і пристовбурне коло',
   'Регулярний полив, чисте від трави пристовбурне коло або мульча; стежити за попелицею на молодих пагонах.'),
  ('fruit_stone', 'Спокій', 0, 'pruning', 'high', 'Обрізка саджанця після посадки',
   'Навесні після посадки вкоротити провідник і гілки для закладання крони; захистити штамб від сонячних опіків і гризунів.'),
  ('fruit_stone', 'Розвиток листя', 0, 'irrigation', 'high', 'Полив і пристовбурне коло',
   'Регулярний полив у перший рік, пристовбурне коло без бур''янів, мульча.')
) as v(crop_group, phase_key, order_num, category, urgency, title, description)
where not exists (
  select 1 from public.phase_tips t where t.crop_group = v.crop_group and t.phase_key = v.phase_key and t.title = v.title
);

commit;
