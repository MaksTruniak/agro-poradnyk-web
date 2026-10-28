// Препарати з @ у відповіді AI агронома: витягування згадок (сервер і браузер), результат звірки з каталогом.

export interface AiProduct {
  /** Текст після @, який займає назва (як написала модель, може бути у відмінку) */
  mention: string
  /** Назва з каталогу або як написала модель */
  name: string
  found: boolean
  slug?: string
  kind?: 'product' | 'fertilizer'
  /** Загальна назва добрива (сечовина, КАС) — не препарат, без попередження */
  generic?: boolean
}

// Слово назви: літери, цифри, «+», дефіс і апостроф усередині («КАС-32», «Фітоспорин-М», «Нутрівант Плюс»)
const WORD = "[\\p{L}\\p{N}](?:[\\p{L}\\p{N}+'’\\-]*[\\p{L}\\p{N}+])?"

/** @ і до 4 слів після нього; скільки з них — назва, визначає звірка з каталогом */
export const mentionRe = () => new RegExp(`@(${WORD}(?: ${WORD}){0,3})`, 'gu')

/** Тексти після @ без службових маркерів */
export const extractMentions = (text: string): string[] =>
  [...text.replace(/SCHEME_DETECTED/g, ' ').matchAll(mentionRe())].map(m => m[1]!)

/** Згадка, яку займає препарат у тексті після @ (найдовша зі звірених) */
export function productForMention(raw: string, products: AiProduct[]): AiProduct | null {
  let best: AiProduct | null = null
  for (const p of products) {
    if ((raw === p.mention || raw.startsWith(`${p.mention} `)) && (!best || p.mention.length > best.mention.length)) best = p
  }
  return best
}

/** Різні препарати (та сама назва в різних відмінках — один) */
export function uniqueProducts(products: AiProduct[]): AiProduct[] {
  const seen = new Map<string, AiProduct>()
  for (const p of products) {
    const key = p.found ? `${p.kind}:${p.slug}` : p.name.toLowerCase()
    if (!seen.has(key)) seen.set(key, p)
  }
  return [...seen.values()]
}

export const productHref = (p: AiProduct) => `/${p.kind === 'fertilizer' ? 'fertilizers' : 'pesticides'}/${p.slug}`

export const NOT_IN_CATALOG = 'Немає в каталозі АгроПростір, перевірте реєстрацію перед застосуванням'
