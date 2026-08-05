-- Seed crop_categories and crop_catalog with full Ukraine crop list
-- Run in Supabase SQL editor. Safe to re-run (ON CONFLICT DO NOTHING / DO UPDATE).

-- ─── 1. Категорії ────────────────────────────────────────────────────────────
INSERT INTO crop_categories (name, emoji, order_num) VALUES
  ('Зернові та круп''яні',      '🌾', 1),
  ('Олійні',                    '🌻', 2),
  ('Цукровмісні та технічні',   '🟣', 3),
  ('Коренеплоди',               '🥕', 4),
  ('Бульбоплоди',               '🥔', 5),
  ('Овочі',                     '🥬', 6),
  ('Бобові зернові',            '🫘', 7),
  ('Кормові трави',             '🌿', 8),
  ('Ягоди',                     '🍓', 9),
  ('Плодові дерева',            '🍎', 10),
  ('Горіхоплідні',              '🌰', 11),
  ('Виноград',                  '🍇', 12),
  ('Лікарські та ефіроолійні',  '💜', 13)
ON CONFLICT (name) DO UPDATE SET emoji = EXCLUDED.emoji, order_num = EXCLUDED.order_num;

-- ─── 2. Культури — заповнюємо і category (text), і category_id (uuid FK) ────

-- Зернові та круп'яні
INSERT INTO crop_catalog (name, emoji, category, category_id)
SELECT v.name, v.emoji, c.name, c.id
FROM (VALUES
  ('Пшениця озима',   '🌾'),
  ('Пшениця яра',     '🌾'),
  ('Кукурудза',       '🌽'),
  ('Ячмінь озимий',   '🌾'),
  ('Ячмінь ярий',     '🌾'),
  ('Жито озиме',      '🌾'),
  ('Овес',            '🌾'),
  ('Гречка',          '🌾'),
  ('Просо',           '🌾'),
  ('Сорго',           '🌾'),
  ('Рис',             '🍚'),
  ('Тритикале озиме', '🌾'),
  ('Тритикале яре',   '🌾'),
  ('Спельта',         '🌾'),
  ('Сориз',           '🌾')
) AS v(name, emoji)
JOIN crop_categories c ON c.name = 'Зернові та круп''яні'
ON CONFLICT (name) DO NOTHING;

-- Олійні
INSERT INTO crop_catalog (name, emoji, category, category_id)
SELECT v.name, v.emoji, c.name, c.id
FROM (VALUES
  ('Соняшник',       '🌻'),
  ('Ріпак озимий',   '🟡'),
  ('Ріпак ярий',     '🟡'),
  ('Соя',            '🫘'),
  ('Льон олійний',   '💙'),
  ('Льон-довгунець', '💙'),
  ('Гірчиця біла',   '🟡'),
  ('Гірчиця сиза',   '🟡'),
  ('Рижій',          '🌿'),
  ('Сафлор',         '🌼'),
  ('Мак олійний',    '🌺'),
  ('Коноплі',        '🌿'),
  ('Амарант',        '🌺'),
  ('Кунжут',         '🌿')
) AS v(name, emoji)
JOIN crop_categories c ON c.name = 'Олійні'
ON CONFLICT (name) DO NOTHING;

-- Цукровмісні та технічні
INSERT INTO crop_catalog (name, emoji, category, category_id)
SELECT v.name, v.emoji, c.name, c.id
FROM (VALUES
  ('Буряк цукровий', '🟣'),
  ('Цикорій',        '🌿'),
  ('Хміль',          '🌿'),
  ('Тютюн',          '🌿')
) AS v(name, emoji)
JOIN crop_categories c ON c.name = 'Цукровмісні та технічні'
ON CONFLICT (name) DO NOTHING;

-- Коренеплоди
INSERT INTO crop_catalog (name, emoji, category, category_id)
SELECT v.name, v.emoji, c.name, c.id
FROM (VALUES
  ('Морква',            '🥕'),
  ('Буряк столовий',    '🟣'),
  ('Буряк кормовий',    '🟣'),
  ('Пастернак',         '🌿'),
  ('Петрушка коренева', '🌿'),
  ('Селера коренева',   '🌿'),
  ('Редька',            '🌿'),
  ('Редиска',           '🌿'),
  ('Ріпа',              '🌿'),
  ('Бруква',            '🌿'),
  ('Хрін',              '🌿')
) AS v(name, emoji)
JOIN crop_categories c ON c.name = 'Коренеплоди'
ON CONFLICT (name) DO NOTHING;

-- Бульбоплоди
INSERT INTO crop_catalog (name, emoji, category, category_id)
SELECT v.name, v.emoji, c.name, c.id
FROM (VALUES
  ('Картопля',   '🥔'),
  ('Топінамбур', '🌻'),
  ('Батат',      '🍠')
) AS v(name, emoji)
JOIN crop_categories c ON c.name = 'Бульбоплоди'
ON CONFLICT (name) DO NOTHING;

-- Овочі
INSERT INTO crop_catalog (name, emoji, category, category_id)
SELECT v.name, v.emoji, c.name, c.id
FROM (VALUES
  ('Томати',                '🍅'),
  ('Огірки',                '🥒'),
  ('Перець солодкий',       '🫑'),
  ('Перець гострий',        '🌶️'),
  ('Баклажани',             '🍆'),
  ('Кабачки',               '🥒'),
  ('Патисони',              '🌿'),
  ('Гарбузи',               '🎃'),
  ('Кавун',                 '🍉'),
  ('Диня',                  '🍈'),
  ('Капуста білоголова',    '🥬'),
  ('Капуста червоноголова', '🥬'),
  ('Капуста цвітна',        '🥦'),
  ('Капуста броколі',       '🥦'),
  ('Капуста брюссельська',  '🥬'),
  ('Капуста савойська',     '🥬'),
  ('Капуста кольрабі',      '🥬'),
  ('Цибуля ріпчаста',       '🧅'),
  ('Цибуля-порей',          '🌿'),
  ('Цибуля-шалот',          '🧅'),
  ('Часник',                '🧄'),
  ('Салат',                 '🥬'),
  ('Шпинат',                '🌿'),
  ('Щавель',                '🌿'),
  ('Кріп',                  '🌿'),
  ('Петрушка',              '🌿'),
  ('Кінза',                 '🌿'),
  ('Базилік',               '🌿'),
  ('Чабер',                 '🌿')
) AS v(name, emoji)
JOIN crop_categories c ON c.name = 'Овочі'
ON CONFLICT (name) DO NOTHING;

-- Бобові зернові
INSERT INTO crop_catalog (name, emoji, category, category_id)
SELECT v.name, v.emoji, c.name, c.id
FROM (VALUES
  ('Горох',               '🫛'),
  ('Квасоля',             '🫘'),
  ('Нут',                 '🫘'),
  ('Сочевиця',            '🫘'),
  ('Люпин білий',         '🌿'),
  ('Люпин жовтий',        '🌿'),
  ('Люпин вузьколистий',  '🌿'),
  ('Вика',                '🌿'),
  ('Боби кормові',        '🫘')
) AS v(name, emoji)
JOIN crop_categories c ON c.name = 'Бобові зернові'
ON CONFLICT (name) DO NOTHING;

-- Кормові трави
INSERT INTO crop_catalog (name, emoji, category, category_id)
SELECT v.name, v.emoji, c.name, c.id
FROM (VALUES
  ('Люцерна',          '🌿'),
  ('Конюшина червона', '🍀'),
  ('Конюшина біла',    '🍀'),
  ('Суданська трава',  '🌿'),
  ('Еспарцет',         '🌿'),
  ('Тимофіївка',       '🌿'),
  ('Костриця',         '🌿'),
  ('Райграс',          '🌿')
) AS v(name, emoji)
JOIN crop_categories c ON c.name = 'Кормові трави'
ON CONFLICT (name) DO NOTHING;

-- Ягоди
INSERT INTO crop_catalog (name, emoji, category, category_id)
SELECT v.name, v.emoji, c.name, c.id
FROM (VALUES
  ('Суниця',         '🍓'),
  ('Полуниця',       '🍓'),
  ('Малина',         '🍒'),
  ('Ожина',          '🫐'),
  ('Смородина чорна','🫐'),
  ('Порічки червоні','🔴'),
  ('Порічки жовті',  '🟡'),
  ('Порічки білі',   '⚪'),
  ('Агрус',          '🍈'),
  ('Лохина',         '🫐'),
  ('Журавлина',      '🔴'),
  ('Обліпиха',       '🟠'),
  ('Шипшина',        '🌹'),
  ('Калина',         '🔴'),
  ('Бузина',         '🟣'),
  ('Аронія',         '🟣'),
  ('Актинідія',      '🥝'),
  ('Жимолость',      '🫐')
) AS v(name, emoji)
JOIN crop_categories c ON c.name = 'Ягоди'
ON CONFLICT (name) DO NOTHING;

-- Плодові дерева
INSERT INTO crop_catalog (name, emoji, category, category_id)
SELECT v.name, v.emoji, c.name, c.id
FROM (VALUES
  ('Яблуня',  '🍎'),
  ('Груша',   '🍐'),
  ('Слива',   '🍑'),
  ('Черешня', '🍒'),
  ('Вишня',   '🍒'),
  ('Персик',  '🍑'),
  ('Нектарин','🍑'),
  ('Абрикос', '🍑'),
  ('Айва',    '🍐'),
  ('Кизил',   '🔴'),
  ('Алича',   '🟡')
) AS v(name, emoji)
JOIN crop_categories c ON c.name = 'Плодові дерева'
ON CONFLICT (name) DO NOTHING;

-- Горіхоплідні
INSERT INTO crop_catalog (name, emoji, category, category_id)
SELECT v.name, v.emoji, c.name, c.id
FROM (VALUES
  ('Волоський горіх', '🌰'),
  ('Ліщина',          '🌰'),
  ('Фундук',          '🌰'),
  ('Мигдаль',         '🌰')
) AS v(name, emoji)
JOIN crop_categories c ON c.name = 'Горіхоплідні'
ON CONFLICT (name) DO NOTHING;

-- Виноград
INSERT INTO crop_catalog (name, emoji, category, category_id)
SELECT v.name, v.emoji, c.name, c.id
FROM (VALUES
  ('Виноград столовий',  '🍇'),
  ('Виноград технічний', '🍷')
) AS v(name, emoji)
JOIN crop_categories c ON c.name = 'Виноград'
ON CONFLICT (name) DO NOTHING;

-- Лікарські та ефіроолійні
INSERT INTO crop_catalog (name, emoji, category, category_id)
SELECT v.name, v.emoji, c.name, c.id
FROM (VALUES
  ('Лаванда',  '💜'),
  ('Ромашка',  '🌼'),
  ('Звіробій', '🌼'),
  ('Валеріана','🌿'),
  ('Меліса',   '🌿'),
  ('М''ята',   '🌿'),
  ('Ехінацея', '🌺'),
  ('Кмин',     '🌿'),
  ('Фенхель',  '🌿'),
  ('Коріандр', '🌿'),
  ('Чебрець',  '🌿'),
  ('Розмарин', '🌿')
) AS v(name, emoji)
JOIN crop_categories c ON c.name = 'Лікарські та ефіроолійні'
ON CONFLICT (name) DO NOTHING;

-- ─── 3. Оновити category_id для вже існуючих записів (якщо були без FK) ──────
UPDATE crop_catalog cc
SET category_id = c.id
FROM crop_categories c
WHERE cc.category = c.name
  AND cc.category_id IS NULL;
