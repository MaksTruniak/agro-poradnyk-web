import { createClient } from '@supabase/supabase-js'
import { extractMentions, type AiProduct } from '../../shared/utils/aiProducts'

// Звірка препаратів, які запропонувала модель, з каталогом платформи (agro_products, agro_fertilizers).
// Каталог кешується в пам'яті серверного екземпляра на годину — ~9 тис. назв, звірка без запитів до БД.

export interface CatalogProduct { id: string; name: string; slug: string; type: string; kind: 'product' | 'fertilizer'; norm: string; ingredients: string[] }

interface Catalog { products: CatalogProduct[]; loadedAt: number }

let cache: Catalog | null = null
let loading: Promise<Catalog> | null = null
const TTL_MS = 60 * 60 * 1000

// Клас препарату на початку назви в каталозі: «Фунгіцид Косайд 2000», «Регулятор росту Агрозин»,
// «Фунгіцид, протруйник Максим Стар» — модель пише без нього, тож у порівнянні відкидаємо
const CLASS_WORD = /^(фунгіцид(и|ний)?|гербіцид(и)?|інсектицид(и)?|акарицид(и)?|протруйник(и)?|регулятор(и)?|росту|рослин|біопрепарат(и)?|прилипач|ад'?ювант|ад|ювант|десикант|мікродобриво|добриво|інокулянт(и)?|біостимулятор|стимулятор|антистресант|родентицид(и)?|препарат|для|протруювання|обробки|насіння)$/u

/** Нормалізована назва: без регістру, лапок, ®/™, класу препарату на початку, препаративних форм і концентрацій */
export function normalizeName(name: string): string {
  const words = name
    .replace(/\([^)]*\)/g, ' ')
    .toLowerCase()
    .replace(/[«»"'’`®™©]/g, ' ')
    .replace(/\d+([.,]\d+)?\s*(%|г\/л|г\/кг|кг\/л)?/g, ' ')
    // \b у JS не працює з кирилицею — межі слова через \p{L}
    .replace(/(?<!\p{L})(к\.?\s?с|к\.?\s?е|в\.?\s?г|в\.?\s?р\.?\s?к|з\.?\s?п|т\.?\s?к\.?\s?с|м\.?\s?е|sc|ec|wg|wp|sl|se|od|ew|fs|cs|me|sg|ws|sp|ес|кс|вг|вдг|вр|зп|ке|ме|сп|рк)\.?(?!\p{L})/giu, ' ')
    .replace(/[^\p{L}\p{N}+\- ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
  while (words.length > 1 && CLASS_WORD.test(words[0]!.replace(/[’']/g, "'"))) words.shift()
  return words.join(' ')
}

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data } = await build(from, from + 999)
    out.push(...(data || []))
    if (!data || data.length < 1000) return out
  }
}

async function load(): Promise<Catalog> {
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const [products, fertilizers, links, ingredients] = await Promise.all([
    fetchAll<any>((a, b) => db.from('agro_products').select('id, name, slug, type').neq('type', 'seed').range(a, b)),
    fetchAll<any>((a, b) => db.from('agro_fertilizers').select('id, name, slug, composition').eq('is_active', true).range(a, b)),
    fetchAll<any>((a, b) => db.from('agro_product_ingredients').select('product_id, ingredient_id').range(a, b)),
    fetchAll<any>((a, b) => db.from('agro_active_ingredients').select('id, name').range(a, b)),
  ])
  const ingName = new Map(ingredients.map(i => [i.id, normalizeName(i.name)]))
  const ingByProduct = new Map<string, string[]>()
  for (const l of links) {
    const n = ingName.get(l.ingredient_id)
    if (n) ingByProduct.set(l.product_id, [...(ingByProduct.get(l.product_id) || []), n])
  }
  const all: CatalogProduct[] = [
    ...products.map(p => ({ id: p.id, name: p.name, slug: p.slug, type: p.type, kind: 'product' as const, norm: normalizeName(p.name), ingredients: ingByProduct.get(p.id) || [] })),
    ...fertilizers.map(f => ({ id: f.id, name: f.name, slug: f.slug, type: 'fertilizer', kind: 'fertilizer' as const, norm: normalizeName(f.name), ingredients: [] })),
  ].filter(p => p.norm)
  return { products: all, loadedAt: Date.now() }
}

export async function getCatalog(): Promise<Catalog> {
  if (cache && Date.now() - cache.loadedAt < TTL_MS) return cache
  loading ||= load().then(c => { cache = c; return c }).finally(() => { loading = null })
  return loading
}

/** Препарат каталогу за назвою: точний збіг або назва каталогу, що повністю входить у назву моделі (найдовша) */
export function findByName(catalog: Catalog, name: string): CatalogProduct | null {
  const norm = normalizeName(name)
  if (!norm) return null
  let best: CatalogProduct | null = null
  for (const p of catalog.products) {
    if (p.norm === norm) return p
    // «Амістар Екстра 280 SC» ↔ «Амістар Екстра»: усі слова назви каталогу є в назві моделі
    const words = p.norm.split(' ')
    if (words.length && words.every(w => w.length > 1 && ` ${norm} `.includes(` ${w} `)) && (!best || p.norm.length > best.norm.length)) best = p
  }
  return best
}

// Відмінкові закінчення: «@Децисом», «@Раундапу», «@Амістаром Екстра» → основа, як у каталозі
const ENDINGS = /(ами|ями|ові|еві|ою|ею|єю|ом|ем|ам|ям|ах|ях|у|ю|а|я|і|и|е|ї)$/u
export const stemWord = (w: string) => (w.length >= 5 ? w.replace(ENDINGS, '') : w)
// Ключ порівняння за основою: латинські літери-двійники кирилиці («Брексил Ca» ↔ «Брексил Са»),
// подвоєні літери («Челлендж» ↔ «Челендж»), і/и («Квадрис» ↔ «Квадріс») і м'який знак («Телдор» ↔ «Тельдор») не розрізняємо
const HOMOGLYPHS: Record<string, string> = { a: 'а', c: 'с', e: 'е', i: 'і', o: 'о', p: 'р', x: 'х', y: 'у', k: 'к', m: 'м', t: 'т', b: 'в', h: 'н' }
const stemName = (norm: string) => norm.split(' ').map(stemWord).join(' ')
  .replace(/[aceiopxykmtbh]/g, c => HOMOGLYPHS[c]!)
  .replace(/(\p{L})\1/gu, '$1')
  .replace(/і/g, 'и')
  .replace(/ь/g, '')

// Типові помилки моделі в назвах, які є в каталозі (пословно, після normalizeName)
const MISSPELLINGS: Record<string, string> = {
  свіч: 'світч', calypso: 'каліпсо', mospilan: 'моспілан', teldor: 'тельдор', люна: 'луна', експеріенс: 'експіріенс',
}
// «Мospilan», «Теldor» — кирилиця вперемішку з латиницею: зводимо до латиниці
const TO_LATIN: Record<string, string> = Object.fromEntries(Object.entries(HOMOGLYPHS).map(([lat, cyr]) => [cyr, lat]))
const unmix = (w: string) => (/\p{Script=Latin}/u.test(w) && /\p{Script=Cyrillic}/u.test(w) ? w.replace(/\p{Script=Cyrillic}/gu, c => TO_LATIN[c] || c) : w)
const fixSpelling = (norm: string) => norm.split(' ').map((w) => {
  const u = unmix(w)
  return MISSPELLINGS[u] || MISSPELLINGS[stemWord(u)] || u
}).join(' ')

const indexes = new WeakMap<Catalog, { exact: Map<string, CatalogProduct>; stem: Map<string, CatalogProduct> }>()
function catalogIndex(catalog: Catalog) {
  let idx = indexes.get(catalog)
  if (!idx) {
    idx = { exact: new Map(), stem: new Map() }
    // Дублі в каталозі («Хорус» і «Фунгіцид Хорус 75 WG») — беремо коротшу, чистішу назву
    const put = (map: Map<string, CatalogProduct>, key: string, p: CatalogProduct) => {
      const cur = map.get(key)
      if (!cur || p.name.length < cur.name.length) map.set(key, p)
    }
    for (const p of catalog.products) {
      put(idx.exact, p.norm, p)
      put(idx.stem, stemName(p.norm), p)
    }
    indexes.set(catalog, idx)
  }
  return idx
}

/** Препарати з @ у відповіді: найдовша назва каталогу на початку згадки (точно або з урахуванням відмінка) */
export function matchMentions(catalog: Catalog, text: string): AiProduct[] {
  const idx = catalogIndex(catalog)
  const out = new Map<string, AiProduct>()
  for (const raw of extractMentions(text)) {
    if (out.has(raw)) continue
    const words = raw.split(' ')
    let hit: AiProduct | null = null
    for (let n = words.length; n >= 1 && !hit; n--) {
      const mention = words.slice(0, n).join(' ')
      const norm = fixSpelling(normalizeName(mention))
      const p = norm ? idx.exact.get(norm) || idx.stem.get(stemName(norm)) : null
      if (p) hit = { mention, name: p.name, found: true, slug: p.slug, kind: p.kind }
    }
    if (!hit) {
      // Немає в каталозі: назва — перше слово й наступні з великої літери чи цифри («Фітоспорин Паста», «Хом 80»)
      let n = 1
      while (n < words.length && /^[\p{Lu}\p{N}]/u.test(words[n]!)) n++
      // «@Вертимек 1,8 КЕ» — цифри наприкінці (концентрація, норма) до назви не належать
      while (n > 1 && /^\p{N}[\p{N}.,]*$/u.test(words[n - 1]!)) n--
      const mention = words.slice(0, n).join(' ')
      hit = { mention, name: mention, found: false, ...(isGenericFertilizer(mention) ? { generic: true } : {}) }
    }
    out.set(raw, hit)
  }
  return [...out.values()]
}

// Класи з поля notes / type моделі → типи каталогу
const TYPE_HINTS: [RegExp, string[]][] = [
  [/фунгіцид/i, ['fungicide', 'biofungicide', 'biological_fungicide']],
  [/інсектицид|акарицид/i, ['insecticide', 'acaricide']],
  [/гербіцид/i, ['herbicide']],
  [/протруйник/i, ['seed_treatment']],
  [/десикант/i, ['desiccant']],
  [/регулятор росту|ретардант/i, ['growth_regulator', 'retardant']],
  [/ад.ювант|прилипач/i, ['adjuvant']],
  [/біопрепарат|стимулятор/i, ['bio_product', 'biostimulator']],
]

/** Препарат каталогу з тією самою діючою речовиною (і, якщо відомо, того самого класу) */
export function findByIngredient(catalog: Catalog, ingredient: string, classHint: string): CatalogProduct | null {
  const wanted = ingredient.split(/[+,;]| та | і /).map(normalizeName).filter(w => w.length > 3)
  if (!wanted.length) return null
  const types = TYPE_HINTS.find(([re]) => re.test(classHint))?.[1]
  // Кожна потрібна речовина має збігтися з речовиною препарату (з урахуванням відмінків — за основою слова)
  const stem = (w: string) => w.slice(0, Math.max(5, w.length - 2))
  const same = (a: string, b: string) => a.startsWith(stem(b)) || b.startsWith(stem(a))
  const candidates = catalog.products.filter(p =>
    p.ingredients.length && wanted.every(w => p.ingredients.some(i => same(i, w))) && (!types || types.includes(p.type)))
  // Назви на кшталт «Т 12» — малоінформативні для фермера, такі аналоги не пропонуємо
  const letters = (s: string) => (s.match(/\p{L}/gu) || []).length
  const readable = candidates.filter(p => letters(p.name) >= 4)
  if (!readable.length) return null
  candidates.length = 0
  candidates.push(...readable)
  // Перевага — та сама кількість речовин (без «зайвих» компонентів), далі — коротша назва
  candidates.sort((a, b) => Math.abs(a.ingredients.length - wanted.length) - Math.abs(b.ingredients.length - wanted.length) || a.name.length - b.name.length)
  return candidates[0]!
}

// Загальні назви добрив, яких немає в каталозі як окремих товарів
const GENERIC_FERTILIZER = /^(бордоськ\p{L}*|хелат\p{L}*|калімагнез\p{L}*|кальцій нітрат|нітрат кальцію|монофосфат\p{L}*|монокалій\p{L}*|сечовина|карбамід|аміачна селітра|аммиачная селитра|селітра|кас|сульфат амонію|сульфат калію|хлористий калій|калій хлористий|суперфосфат|амм?офос|діамм?офоска|нітроамм?офоска|азофоска|npk|н\s?п\s?к|гній|компост|вапно|доломітове борошно|бор|сульфат магнію|магній сірчанокислий|монокалійфосфат|монофосфат калію|сірка)(?!\p{L})/iu

export const isGenericFertilizer = (name: string) => GENERIC_FERTILIZER.test(normalizeName(name))

// Агрооперації (полив, мульчування, ручні роботи) — не препарати, у каталозі їх не шукаємо
const FIELD_OPERATION = /(вода|полив|зрошення|мульч|ручн|обрізк|видаленн|прищипуванн|прополюванн|скошуванн|підв'?язк|укритт?я|побілк|прорідженн|нормуванн)/iu

export const isFieldOperation = (type: string, name: string, activeIngredient?: string) =>
  type === 'полив' || (FIELD_OPERATION.test(name) && !(activeIngredient || '').trim())
