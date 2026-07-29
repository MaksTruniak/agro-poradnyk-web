export const CROP_SLUGS: Record<string, string> = {
  'Пшениця':          'wheat',
  'Пшениця озима':    'winter-wheat',
  'Пшениця яра':      'spring-wheat',
  'Кукурудза':        'corn',
  'Соняшник':         'sunflower',
  'Ріпак':            'rapeseed',
  'Ріпак озимий':     'winter-rapeseed',
  'Ріпак ярий':       'spring-rapeseed',
  'Соя':              'soybean',
  'Ячмінь':           'barley',
  'Ячмінь ярий':      'spring-barley',
  'Ячмінь озимий':    'winter-barley',
  'Жито':             'rye',
  'Жито озиме':       'winter-rye',
  'Буряк':            'sugarbeet',
  'Буряк цукровий':   'sugarbeet',
  'Буряк кормовий':   'fodder-beet',
  'Картопля':         'potato',
  'Томати':           'tomato',
  'Огірки':           'cucumber',
  'Морква':           'carrot',
  'Цибуля':           'onion',
  'Часник':           'garlic',
  'Капуста':          'cabbage',
  'Перець':           'pepper',
  'Полуниця':         'strawberry',
  'Смородина':        'currant',
  'Смородина чорна':  'black-currant',
  'Ожина':            'blackberry',
  'Малина':           'raspberry',
  'Виноград':         'grape',
  'Яблука':           'apple',
  'Груші':            'pear',
  'Черешня':          'cherry',
  'Слива':            'plum',
  'Горох':            'pea',
  'Нут':              'chickpea',
  'Квасоля':          'bean',
  'Сочевиця':         'lentil',
  'Льон':             'flax',
  'Гречка':           'buckwheat',
  'Просо':            'millet',
  'Сорго':            'sorghum',
  'Овес':             'oat',
  'Тритикале озиме':  'winter-triticale',
  'Спельта':          'spelt',
  'Люцерна':          'alfalfa',
  'Вика':             'vetch',
  'Люпин':            'lupine',
  'Гарбузи':          'pumpkin',
  'Кавун':            'watermelon',
  'Гірчиця':          'mustard',
  'Гірчиця біла':     'white-mustard',
  'Коноплі':          'hemp',
  'Амарант':          'amaranth',
  'Рижій':            'camelina',
  'Рис':              'rice',
  'Сориз':            'soriz',
}

// Зворотній маппінг slug → назва
export const SLUG_TO_CROP: Record<string, string> = Object.fromEntries(
  Object.entries(CROP_SLUGS).map(([name, slug]) => [slug, name])
)

export const CROP_EMOJI: Record<string, string> = {
  'Пшениця': '🌾', 'Пшениця озима': '🌾', 'Пшениця яра': '🌾',
  'Кукурудза': '🌽', 'Соняшник': '🌻',
  'Ріпак': '🟡', 'Ріпак озимий': '🟡', 'Ріпак ярий': '🟡',
  'Соя': '🫘', 'Ячмінь': '🌾', 'Ячмінь ярий': '🌾', 'Ячмінь озимий': '🌾',
  'Жито': '🌾', 'Жито озиме': '🌾',
  'Буряк': '🟣', 'Буряк цукровий': '🟣', 'Буряк кормовий': '🟣',
  'Картопля': '🥔', 'Томати': '🍅', 'Огірки': '🥒', 'Морква': '🥕',
  'Цибуля': '🧅', 'Часник': '🧄', 'Капуста': '🥬', 'Перець': '🌶️',
  'Полуниця': '🍓', 'Смородина': '🫐', 'Смородина чорна': '🫐', 'Ожина': '🫐', 'Малина': '🍒', 'Виноград': '🍇',
  'Яблука': '🍎', 'Груші': '🍐', 'Черешня': '🍒', 'Слива': '🍑',
  'Горох': '🫛', 'Нут': '🫘', 'Квасоля': '🫘', 'Сочевиця': '🫘',
  'Льон': '💙', 'Гречка': '⬛', 'Просо': '🌿', 'Сорго': '🌿',
  'Овес': '🌾', 'Тритикале озиме': '🌾', 'Спельта': '🌾',
  'Люцерна': '🌿', 'Вика': '🌿', 'Люпин': '🌿',
  'Гарбузи': '🎃', 'Кавун': '🍉',
  'Гірчиця': '🟤', 'Гірчиця біла': '🟤',
  'Коноплі': '🌿', 'Амарант': '🌺', 'Рижій': '🌿', 'Рис': '🍚',
}

export const cropToSlug = (crop: string): string => CROP_SLUGS[crop] || crop.toLowerCase().replace(/\s+/g, '-')
export const slugToCrop = (slug: string): string => SLUG_TO_CROP[slug] || slug
export const cropEmoji = (crop: string): string => CROP_EMOJI[crop] || '🌱'

const UA_MAP: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'h','ґ':'g','д':'d','е':'e','є':'ye','ж':'zh',
  'з':'z','и':'y','і':'i','ї':'yi','й':'y','к':'k','л':'l','м':'m','н':'n',
  'о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
  'ч':'ch','ш':'sh','щ':'shch','ь':'','ю':'yu','я':'ya',
}

export const transliterate = (text: string): string =>
  text.toLowerCase()
    .split('')
    .map(c => UA_MAP[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const brandToSlug = (brand: string | { slug?: string; name?: string } | null | undefined): string => {
  if (!brand) return ''
  const raw = typeof brand === 'string' ? brand : (brand.slug || brand.name || '')
  return transliterate(raw)
}
