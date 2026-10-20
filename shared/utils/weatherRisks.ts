// Погодні ризики для багаторічних насаджень: заморозки на чутливих фазах і погода для інфекцій
// (парша, мілдью, сіра гниль, моніліоз). Прості агрономічні правила, пороги орієнтовні —
// звіряти з агрономом. Температура — повітря на 2 м; у низинах і біля ґрунту холодніше.

export interface Forecast {
  /** дати yyyy-mm-dd за Києвом */
  daily: { time: string[]; tmin: (number | null)[]; tmean: (number | null)[]; precip: (number | null)[] }
  /** години yyyy-mm-ddThh:mm за Києвом */
  hourly: { time: string[]; temp: (number | null)[]; rh: (number | null)[]; precip: (number | null)[] }
}

export type RiskKind = 'frost' | 'scab' | 'mildew' | 'botrytis' | 'monilia'

export interface WeatherRisk {
  kind: RiskKind
  level: 'medium' | 'high'
  /** дата (yyyy-mm-dd), до якої належить ризик */
  date: string
  /** ризик уже був (минулі 2 доби), а не в прогнозі */
  past: boolean
  title: string
  advice: string
}

export const RISK_ICONS: Record<RiskKind, string> = {
  frost: '❄️', scab: '🍂', mildew: '🍇', botrytis: '🍓', monilia: '🌸',
}

// Критична температура повітря (≈10% пошкоджень) за фазою
const FROST_CRIT: Record<string, number> = {
  'Проростання / Набрякання бруньок': -4,
  'Сокорух / Набрякання бруньок': -3.5,
  'Розвиток листя': -2.5,
  'Розпускання бруньок': -1.5,
  'Розвиток пагонів / Кущіння': -2,
  'Розвиток листя та пагонів': -1,
  'Поява суцвіть': -1,
  'Цвітіння': -1.5,
  'Після цвітіння': -1,
  'Формування плодів': -1,
  'Формування ягід': -1,
}
const FROST_CRIT_BY_GROUP: Record<string, Record<string, number>> = {
  berry_herb: { 'Розвиток пагонів / Кущіння': -1.5, 'Цвітіння': -1 },
}
/** Наскільки тепліше за критичну ще попереджаємо (біля ґрунту й у низинах холодніше) */
const FROST_MARGIN = 2

const SCAB_PHASES = ['Розвиток листя', 'Розвиток пагонів / Кущіння', 'Цвітіння', 'Після цвітіння', 'Формування плодів']
const MILDEW_PHASES = ['Розвиток листя та пагонів', 'Поява суцвіть', 'Цвітіння', 'Формування ягід', 'Змикання ґрон']
const BOTRYTIS_PHASES: Record<string, string[]> = {
  berry_herb: ['Цвітіння', 'Після цвітіння', 'Формування плодів', 'Налив плодів', 'Дозрівання', 'Збір урожаю'],
  berry_shrub: ['Цвітіння', 'Після цвітіння', 'Формування плодів', 'Налив плодів', 'Дозрівання', 'Збір урожаю'],
  grape: ['Змикання ґрон', 'Початок достигання (м\'якнення ягід)', 'Технічна стиглість', 'Збір урожаю'],
}
const MONILIA_PHASES = ['Розвиток пагонів / Кущіння', 'Цвітіння']

const ddmm = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`
const fmtT = (t: number) => `${t > 0 ? '+' : ''}${String(Math.round(t * 10) / 10).replace('.', ',').replace('-', '−')}`

/** Годин зволоження за таблицею Міллса, потрібних для інфекції парші при середній температурі */
export const scabHoursNeeded = (t: number) =>
  t < 6 ? 30 : t < 8 ? 20 : t < 10 ? 15 : t < 12 ? 13 : t < 14 ? 11 : t < 17 ? 10 : t <= 24 ? 9 : 14

interface WetPeriod { start: string; hours: number; meanT: number }

/** Безперервні періоди зволоження: опади або вологість від 90% (з допуском у 1 суху годину) */
export function wetPeriods(h: Forecast['hourly']): WetPeriod[] {
  const out: WetPeriod[] = []
  let cur: { start: string; temps: number[]; dryRun: number } | null = null
  const close = () => {
    if (cur) {
      const temps = cur.temps.slice(0, cur.temps.length - cur.dryRun)
      if (temps.length) out.push({ start: cur.start, hours: temps.length, meanT: temps.reduce((a, b) => a + b, 0) / temps.length })
    }
    cur = null
  }
  for (let i = 0; i < h.time.length; i++) {
    const t = h.temp[i], rh = h.rh[i], p = h.precip[i]
    if (t == null) { close(); continue }
    const wet = (p ?? 0) >= 0.1 || (rh ?? 0) >= 90
    if (wet) {
      if (!cur) cur = { start: h.time[i]!, temps: [], dryRun: 0 }
      cur.temps.push(t); cur.dryRun = 0
    } else if (cur && cur.dryRun === 0) {
      cur.temps.push(t); cur.dryRun = 1
    } else close()
  }
  close()
  return out
}

/**
 * Ризики для насадження на поточній фазі. `today` — сьогоднішня дата yyyy-mm-dd за Києвом:
 * заморозки — від сьогодні на 3 ночі вперед, інфекції — також за минулі 2 доби.
 */
export function weatherRisks(group: string | null | undefined, phaseKey: string | null | undefined,
  fc: Forecast | null, today: string): WeatherRisk[] {
  if (!group || !phaseKey || !fc) return []
  const risks: WeatherRisk[] = []
  const lastDay = addDays(today, 3)

  // ── Заморозки ──
  const crit = FROST_CRIT_BY_GROUP[group]?.[phaseKey] ?? FROST_CRIT[phaseKey]
  if (crit != null) {
    let worst: { date: string; t: number } | null = null
    fc.daily.time.forEach((d, i) => {
      const t = fc.daily.tmin[i]
      if (t == null || d < today || d > lastDay) return
      if (t <= crit + FROST_MARGIN && (!worst || t < worst.t)) worst = { date: d, t }
    })
    if (worst) {
      const w = worst as { date: string; t: number }
      risks.push({
        kind: 'frost', level: w.t <= crit ? 'high' : 'medium', date: w.date, past: false,
        title: `Заморозок до ${fmtT(w.t)} °C у ніч на ${ddmm(w.date)}`,
        advice: `На фазі «${phaseKey}» пошкодження можливі вже від ${fmtT(crit)} °C, у низинах і біля ґрунту холодніше на 1–3 °C. `
          + 'Підготуйте захист: дощування під час заморозку, укривний матеріал, димові шашки.',
      })
    }
  }

  const periods = wetPeriods(fc.hourly).filter(p => p.start.slice(0, 10) >= addDays(today, -2) && p.start.slice(0, 10) <= lastDay)
  type Cand = { p: WetPeriod; level: 'medium' | 'high' }
  const pick = (cands: Cand[]) =>
    cands.sort((a, b) => (a.level === b.level ? 0 : a.level === 'high' ? -1 : 1) || a.p.start.localeCompare(b.p.start))[0]

  // ── Парша (зерняткові) ──
  if (group === 'fruit_pome' && SCAB_PHASES.includes(phaseKey)) {
    const best = pick(periods.flatMap<Cand>(p => {
      const need = scabHoursNeeded(p.meanT)
      return p.hours >= need ? [{ p, level: 'high' as const }] : p.hours >= need * 0.7 ? [{ p, level: 'medium' as const }] : []
    }))
    if (best) {
      const date = best.p.start.slice(0, 10), past = date < today
      risks.push({
        kind: 'scab', level: best.level, date, past,
        title: `Ризик парші: ${best.p.hours} год зволоження при ${fmtT(best.p.meanT)} °C (${ddmm(date)})`,
        advice: past
          ? 'Якщо захисної обробки перед дощем не було — фунгіцид з куративною дією протягом 72 год від початку зволоження.'
          : 'Захисна обробка до початку дощу.',
      })
    }
  }

  // ── Мілдью (виноград): правило «трьох десяток» ──
  if (group === 'grape' && MILDEW_PHASES.includes(phaseKey)) {
    let best: { date: string; rain: number; t: number; level: 'medium' | 'high' } | null = null
    fc.daily.time.forEach((d, i) => {
      if (d < addDays(today, -2) || d > lastDay) return
      const t = fc.daily.tmean[i], rain = (fc.daily.precip[i] ?? 0) + (fc.daily.precip[i - 1] ?? 0)
      if (t == null || t < 10 || rain < 5) return
      const level = rain >= 10 ? 'high' as const : 'medium' as const
      if (!best || (level === 'high' && best.level !== 'high')) best = { date: d, rain, t, level }
    })
    if (best) {
      const b = best as { date: string; rain: number; t: number; level: 'medium' | 'high' }
      const past = b.date < today
      risks.push({
        kind: 'mildew', level: b.level, date: b.date, past,
        title: `Ризик мілдью: ${Math.round(b.rain)} мм опадів за 2 доби при ${fmtT(b.t)} °C (${ddmm(b.date)})`,
        advice: past
          ? 'Після дощу — фунгіцид з куративною дією протягом 2–3 днів, якщо захисту перед дощем не було.'
          : 'Захисна обробка до дощу.',
      })
    }
  }

  // ── Сіра гниль (ягідні, виноград) ──
  if (BOTRYTIS_PHASES[group]?.includes(phaseKey)) {
    const best = pick(periods.flatMap<Cand>(p => p.meanT < 12 || p.meanT > 26 ? []
      : p.hours >= 15 ? [{ p, level: 'high' as const }] : p.hours >= 10 ? [{ p, level: 'medium' as const }] : []))
    if (best) {
      const date = best.p.start.slice(0, 10)
      risks.push({
        kind: 'botrytis', level: best.level, date, past: date < today,
        title: `Ризик сірої гнилі: ${best.p.hours} год вологи при ${fmtT(best.p.meanT)} °C (${ddmm(date)})`,
        advice: 'Обробка проти сірої гнилі перед дощем з урахуванням строку очікування до збору; уражені ягоди збирати й виносити з ділянки.',
      })
    }
  }

  // ── Моніліоз (кісточкові на цвітінні) ──
  if (group === 'fruit_stone' && MONILIA_PHASES.includes(phaseKey)) {
    const best = pick(periods.flatMap<Cand>(p => p.meanT < 10 || p.meanT > 25 ? []
      : p.hours >= 12 ? [{ p, level: 'high' as const }] : p.hours >= 6 ? [{ p, level: 'medium' as const }] : []))
    if (best) {
      const date = best.p.start.slice(0, 10)
      risks.push({
        kind: 'monilia', level: best.level, date, past: date < today,
        title: `Ризик моніліозу: ${best.p.hours} год вологи при ${fmtT(best.p.meanT)} °C (${ddmm(date)})`,
        advice: 'Фунгіцид проти моніліозу на початку і в повне цвітіння, до дощу.',
      })
    }
  }

  return risks
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
