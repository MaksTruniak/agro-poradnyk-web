// Орієнтовна фенофаза багаторічного насадження за сумою активних температур (САТ) з 1 січня.
// Це підказка «мабуть, уже …?» — фазу підтверджує фермер. Пороги орієнтовні, для типових сортів
// у Центральній Україні; їх варто звіряти з агрономом.
//
// САТ — сума (середня добова − база) за дні, коли середня вища за базу. База 5 °C для ягідних і плодових,
// 10 °C для винограду (як прийнято у виноградарстві).

import { phasesForStage, type PlantingStageInfo } from './plantingStage'

export interface DegreeDays {
  /** САТ з базою 5 °C з 1 січня */
  gdd5: number
  /** САТ з базою 10 °C з 1 січня */
  gdd10: number
}

/** [фаза, з якої САТ вона починається] — у порядку фаз */
export const PHASE_GDD: Record<string, [string, number][]> = {
  berry_shrub: [
    ['Проростання / Набрякання бруньок', 30], ['Розвиток листя', 70], ['Розвиток пагонів / Кущіння', 120],
    ['Цвітіння', 200], ['Після цвітіння', 300], ['Формування плодів', 380], ['Налив плодів', 500],
    ['Дозрівання', 800], ['Збір урожаю', 950], ['Після збору', 1300],
  ],
  berry_herb: [
    ['Проростання / Набрякання бруньок', 20], ['Розвиток листя', 50], ['Розвиток пагонів / Кущіння', 120],
    ['Цвітіння', 230], ['Після цвітіння', 330], ['Формування плодів', 380], ['Налив плодів', 430],
    ['Дозрівання', 500], ['Збір урожаю', 560], ['Після збору', 800],
  ],
  fruit_pome: [
    ['Проростання / Набрякання бруньок', 50], ['Розвиток листя', 100], ['Розвиток пагонів / Кущіння', 170],
    ['Цвітіння', 250], ['Після цвітіння', 330], ['Формування плодів', 400], ['Налив плодів', 700],
    ['Дозрівання', 1700], ['Збір урожаю', 1900], ['Після збору', 2300],
  ],
  fruit_stone: [
    ['Проростання / Набрякання бруньок', 35], ['Розвиток листя', 80], ['Розвиток пагонів / Кущіння', 120],
    ['Цвітіння', 150], ['Після цвітіння', 230], ['Формування плодів', 300], ['Налив плодів', 500],
    ['Дозрівання', 900], ['Збір урожаю', 1050], ['Після збору', 1400],
  ],
  nut: [
    ['Проростання / Набрякання бруньок', 120], ['Розвиток листя', 180], ['Розвиток пагонів / Кущіння', 250],
    ['Цвітіння', 300], ['Після цвітіння', 380], ['Формування плодів', 450], ['Налив плодів', 900],
    ['Дозрівання', 1800], ['Збір урожаю', 2000], ['Після збору', 2300],
  ],
  grape: [
    ['Сокорух / Набрякання бруньок', 10], ['Розпускання бруньок', 40], ['Розвиток листя та пагонів', 80],
    ['Поява суцвіть', 150], ['Цвітіння', 250], ['Формування ягід', 330], ['Змикання ґрон', 500],
    ['Початок достигання (м\'якнення ягід)', 800], ['Технічна стиглість', 1100], ['Збір урожаю', 1250],
    ['Визрівання лози / Листопад', 1400],
  ],
}

const WINTER_PREP = 'Підготовка до зими'
const DORMANCY = 'Спокій'

export const degreeDays = (dailyMeans: (number | null)[], base: number) =>
  Math.round(dailyMeans.reduce<number>((s, t) => s + (t != null && t > base ? t - base : 0), 0))

/**
 * Орієнтовна фаза: восени й узимку — за датою (з 15.10 підготовка до зими, з 20.11 до весни — спокій,
 * поки САТ не дійде до першого порогу), решту року — за САТ.
 * `allowed` — фази, які культура взагалі має (з growth_phases); фази без урожаю прибирає `stage`.
 */
export function estimatePhase(group: string | null | undefined, dd: DegreeDays | null, allowed: string[],
  stage: PlantingStageInfo | null, now = new Date()): string | null {
  const table = group ? PHASE_GDD[group] : null
  if (!table || !dd) return null
  const keys = phasesForStage(allowed, stage)
  const has = (k: string) => keys.includes(k)
  const m = now.getMonth() + 1, d = now.getDate()
  if ((m === 11 && d >= 20) || m === 12) return has(DORMANCY) ? DORMANCY : null
  if (m >= 10 && (m > 10 || d >= 15)) return has(WINTER_PREP) ? WINTER_PREP : null

  const sum = group === 'grape' ? dd.gdd10 : dd.gdd5
  let found: string | null = null
  for (const [key, from] of table) if (sum >= from && has(key)) found = key
  if (found) return found
  return sum < table[0]![1] && has(DORMANCY) ? DORMANCY : null
}

/**
 * Чи пропонувати фермеру підтвердити орієнтовну фазу: якщо в цьому році фазу ще не відмічали
 * або відмічена раніша за орієнтовну. Пізнішу фазу, яку фермер уже відмітив, не «відкочуємо».
 */
export function shouldSuggestPhase(estimate: string | null, current: { phase_key: string; observed_at: string } | null,
  orderedKeys: string[], now = new Date()): boolean {
  if (!estimate) return false
  if (!current) return true
  if (current.phase_key === estimate) return false
  if (Number(current.observed_at.slice(0, 4)) < now.getFullYear()) return true
  const ci = orderedKeys.indexOf(current.phase_key)
  // Пізньої осені «Спокій» іде після всіх фаз сезону, хоч і стоїть у списку першим
  const ei = estimate === DORMANCY && now.getMonth() >= 10 ? orderedKeys.length : orderedKeys.indexOf(estimate)
  if (ci < 0) return true
  return ei > ci
}
