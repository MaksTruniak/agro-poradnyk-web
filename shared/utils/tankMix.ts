// Калькулятор робочого розчину: норма з техкарти (текст) → скільки препарату й води на площу і на кожну заправку бака.
// Норма в техкарті — вільний текст: «0.3 л/га», «2–3 л/га», «5 мл на 10 л води», «20 г на кущ», «10 кг/га (1000 л/га)».

export type BaseUnit = 'л' | 'кг'

export type Dose =
  /** норма на гектар; amountMax — для діапазону «2–3 л/га» */
  | { kind: 'per_ha'; amount: number; amountMax: number; unit: BaseUnit; waterPerHa: number | null }
  /** концентрація: amount (у базових одиницях) на perLiters літрів розчину */
  | { kind: 'concentration'; amount: number; amountMax: number; unit: BaseUnit; perLiters: number }
  /** на рослину (кущ, дерево) */
  | { kind: 'per_plant'; amount: number; amountMax: number; unit: BaseUnit }

const num = (s: string) => Number(s.replace(',', '.'))
const UNIT: Record<string, { unit: BaseUnit; k: number }> = {
  'л': { unit: 'л', k: 1 }, 'мл': { unit: 'л', k: 0.001 },
  'кг': { unit: 'кг', k: 1 }, 'г': { unit: 'кг', k: 0.001 }, 'т': { unit: 'кг', k: 1000 },
}
const AMOUNT = String.raw`(\d+(?:[.,]\d+)?)(?:\s*[-–—]\s*(\d+(?:[.,]\d+)?))?\s*(мл|л|кг|г|т)\.?`

export function parseDosage(text: string | null | undefined): Dose | null {
  if (!text) return null
  const s = text.toLowerCase().replace(/\s+/g, ' ').trim()
  const water = s.match(/(\d+(?:[.,]\d+)?)\s*л\s*(?:води\s*)?(?:\/|на\s*)\s*га/g)
  const amountOf = (m: RegExpMatchArray) => {
    const u = UNIT[m[3]!]!
    const a = num(m[1]!) * u.k
    return { amount: a, amountMax: m[2] ? num(m[2]) * u.k : a, unit: u.unit }
  }

  // «5 мл на 10 л води», «10 г / 10 л»
  const conc = s.match(new RegExp(`^${AMOUNT}\\s*(?:на|/)\\s*(\\d+(?:[.,]\\d+)?)?\\s*л(?:\\s|\\.|$|ітр)`))
  if (conc && !/га/.test(s.slice(0, conc[0].length + 3))) {
    return { kind: 'concentration', ...amountOf(conc), perLiters: conc[4] ? num(conc[4]) : 1 }
  }
  // «20 г на кущ / дерево / рослину / лунку»
  const plant = s.match(new RegExp(`^${AMOUNT}\\s*(?:на|/)\\s*(?:1\\s*)?(?:кущ|дерев|рослин|лунк|саджан)`))
  if (plant) return { kind: 'per_plant', ...amountOf(plant) }
  // «0.3 л/га», «150 кг/га (1000 л/га)»
  const ha = s.match(new RegExp(`^${AMOUNT}\\s*(?:\\/|на\\s*)\\s*(?:1\\s*)?га`))
  if (ha) {
    // Витрата води — другий «… л/га» у дужках (перший — сама норма, якщо вона в літрах)
    const w = water?.find((x, i) => i > 0 || !s.startsWith(x)) ?? null
    const waterPerHa = w ? num(w.match(/\d+(?:[.,]\d+)?/)![0]) : null
    return { kind: 'per_ha', ...amountOf(ha), waterPerHa: waterPerHa && waterPerHa >= 50 ? waterPerHa : null }
  }
  return null
}

/** Типова витрата робочого розчину для обприскування, л/га — орієнтир, уточнюється за етикеткою і технікою */
export const DEFAULT_WATER_PER_HA: Record<string, number> = {
  berry_shrub: 500, berry_herb: 400, grape: 600, fruit_pome: 1000, fruit_stone: 1000, nut: 1000,
}
export const defaultWaterPerHa = (group: string | null | undefined) => (group && DEFAULT_WATER_PER_HA[group]) || 300

export interface TankMixInput {
  dose: Dose
  areaHa: number
  waterPerHa: number
  tankL: number
  plants?: number | null
}

export interface TankMix {
  /** препарату всього (базові одиниці; для діапазону — min і max) */
  product: [number, number]
  unit: BaseUnit
  /** робочого розчину всього, л (null — для норми на рослину без розчину) */
  water: number | null
  tanks: number
  /** на повну заправку */
  perTank: [number, number] | null
  /** остання неповна заправка: скільки розчину і препарату */
  lastTank: { water: number; product: [number, number] } | null
}

const pair = (a: number, b: number, k: number): [number, number] => [a * k, b * k]

export function tankMix({ dose, areaHa, waterPerHa, tankL, plants }: TankMixInput): TankMix | null {
  if (dose.kind === 'per_plant') {
    if (!plants || plants <= 0) return null
    return { product: pair(dose.amount, dose.amountMax, plants), unit: dose.unit, water: null, tanks: 0, perTank: null, lastTank: null }
  }
  if (!(areaHa > 0) || !(waterPerHa > 0) || !(tankL > 0)) return null
  const water = areaHa * waterPerHa
  // Препарат на літр розчину
  const perL = dose.kind === 'per_ha'
    ? pair(dose.amount, dose.amountMax, 1 / waterPerHa)
    : pair(dose.amount, dose.amountMax, 1 / dose.perLiters)
  const tanks = Math.ceil(water / tankL - 1e-9)
  const rest = water - (tanks - 1) * tankL
  const full = rest >= tankL - 1e-6
  return {
    product: pair(perL[0], perL[1], water),
    unit: dose.unit,
    water,
    tanks,
    perTank: tanks > 1 || full ? pair(perL[0], perL[1], tankL) : null,
    lastTank: full ? null : { water: rest, product: pair(perL[0], perL[1], rest) },
  }
}

/** «1,25 л», «350 мл», «2,4 кг», «80 г»; діапазон — «1,2–1,8 л» */
export function formatAmount(v: [number, number] | number, unit: BaseUnit) {
  const [a, b] = Array.isArray(v) ? v : [v, v]
  const small = b < 1
  const u = small ? (unit === 'л' ? 'мл' : 'г') : unit
  const k = small ? 1000 : 1
  const f = (x: number) => {
    const y = x * k
    const digits = y >= 100 ? 0 : y >= 10 ? 1 : 2
    return Number(y.toFixed(digits)).toLocaleString('uk-UA', { maximumFractionDigits: digits })
  }
  return Math.abs(a - b) < 1e-9 ? `${f(a)} ${u}` : `${f(a)}–${f(b)} ${u}`
}
