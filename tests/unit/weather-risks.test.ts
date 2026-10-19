import { describe, it, expect } from 'vitest'
import { weatherRisks, wetPeriods, scabHoursNeeded, addDays, type Forecast } from '../../shared/utils/weatherRisks'
import { effectivePhase } from '../../shared/utils/phaseEstimate'

const TODAY = '2026-05-10'
const DAYS = [-2, -1, 0, 1, 2, 3].map(n => addDays(TODAY, n))

// Прогноз: щоденні значення + погодинні, з можливістю задати «мокрі» години
function forecast(opts: { tmin?: number[]; tmean?: number[]; precip?: number[]; wet?: { day: number; from: number; hours: number; t: number }[] } = {}): Forecast {
  const time: string[] = [], temp: number[] = [], rh: number[] = [], precip: number[] = []
  DAYS.forEach((d, di) => {
    for (let h = 0; h < 24; h++) {
      const w = opts.wet?.find(w => w.day === di && h >= w.from && h < w.from + w.hours)
      time.push(`${d}T${String(h).padStart(2, '0')}:00`)
      temp.push(w ? w.t : 18); rh.push(w ? 96 : 60); precip.push(w ? 0.5 : 0)
    }
  })
  return {
    daily: { time: DAYS, tmin: opts.tmin ?? DAYS.map(() => 8), tmean: opts.tmean ?? DAYS.map(() => 15), precip: opts.precip ?? DAYS.map(() => 0) },
    hourly: { time, temp, rh, precip },
  }
}

describe('заморозки', () => {
  it('на цвітінні: −2 °C — високий ризик, −0,5 °C — попередження', () => {
    const high = weatherRisks('berry_shrub', 'Цвітіння', forecast({ tmin: [5, 5, 4, -2, 1, 3] }), TODAY)
    expect(high).toHaveLength(1)
    expect(high[0]).toMatchObject({ kind: 'frost', level: 'high', date: '2026-05-11', past: false })
    expect(high[0]!.title).toBe('Заморозок до −2 °C у ніч на 11.05')
    expect(weatherRisks('berry_shrub', 'Цвітіння', forecast({ tmin: [5, 5, 4, -0.5, 1, 3] }), TODAY)[0]?.level).toBe('medium')
  })
  it('на спокої, після збору і в минулому заморозки не цікаві', () => {
    expect(weatherRisks('berry_shrub', 'Спокій', forecast({ tmin: [-5, -5, -5, -5, -5, -5] }), TODAY)).toEqual([])
    expect(weatherRisks('berry_shrub', 'Після збору', forecast({ tmin: [-5, -5, -5, -5, -5, -5] }), TODAY)).toEqual([])
    expect(weatherRisks('berry_shrub', 'Цвітіння', forecast({ tmin: [-5, -5, 4, 4, 4, 4] }), TODAY)).toEqual([])
  })
  it('для полуниці на цвітінні поріг вищий', () => {
    expect(weatherRisks('berry_herb', 'Цвітіння', forecast({ tmin: [5, 5, -1, 5, 5, 5] }), TODAY)[0]?.level).toBe('high')
  })
})

describe('інфекції', () => {
  it('таблиця Міллса: що тепліше, то менше годин потрібно', () => {
    expect(scabHoursNeeded(5)).toBeGreaterThan(scabHoursNeeded(11))
    expect(scabHoursNeeded(11)).toBeGreaterThan(scabHoursNeeded(20))
  })
  it('мокрі години з допуском у 1 суху годину', () => {
    const p = wetPeriods(forecast({ wet: [{ day: 2, from: 2, hours: 5, t: 12 }, { day: 2, from: 8, hours: 4, t: 12 }] }).hourly)
    expect(p.map(x => x.hours)).toEqual([10])
  })
  it('парша: 16 год зволоження при 11 °C вчора — куративна обробка', () => {
    const r = weatherRisks('fruit_pome', 'Розвиток листя', forecast({ wet: [{ day: 1, from: 4, hours: 16, t: 11 }] }), TODAY)
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ kind: 'scab', level: 'high', past: true, date: '2026-05-09' })
    expect(r[0]!.advice).toContain('72 год')
  })
  it('парша не загрожує винограду й зерняткам після формування плодів', () => {
    const fc = forecast({ wet: [{ day: 3, from: 0, hours: 20, t: 12 }] })
    expect(weatherRisks('grape', 'Цвітіння', fc, TODAY).some(r => r.kind === 'scab')).toBe(false)
    expect(weatherRisks('fruit_pome', 'Налив плодів', fc, TODAY)).toEqual([])
  })
  it('мілдью: 12 мм за 2 доби при 16 °C у прогнозі', () => {
    const r = weatherRisks('grape', 'Розвиток листя та пагонів', forecast({ precip: [0, 0, 0, 4, 8, 0], tmean: [15, 15, 15, 16, 16, 15] }), TODAY)
    expect(r).toEqual([expect.objectContaining({ kind: 'mildew', level: 'high', date: '2026-05-12', past: false })])
  })
  it('сіра гниль на цвітінні полуниці і моніліоз черешні', () => {
    const fc = forecast({ wet: [{ day: 3, from: 0, hours: 16, t: 17 }] })
    expect(weatherRisks('berry_herb', 'Цвітіння', fc, TODAY)[0]).toMatchObject({ kind: 'botrytis', level: 'high' })
    expect(weatherRisks('fruit_stone', 'Цвітіння', fc, TODAY)[0]).toMatchObject({ kind: 'monilia', level: 'high' })
  })
  it('без фази чи групи — нічого', () => {
    expect(weatherRisks(null, 'Цвітіння', forecast(), TODAY)).toEqual([])
    expect(weatherRisks('berry_shrub', null, forecast(), TODAY)).toEqual([])
  })
})

describe('effectivePhase', () => {
  const keys = ['Спокій', 'Розвиток листя', 'Цвітіння', 'Після цвітіння']
  const now = new Date('2026-05-10T12:00:00')
  it('орієнтовна, якщо фермер не встиг відмітити; інакше відмічена', () => {
    expect(effectivePhase('Цвітіння', { phase_key: 'Розвиток листя', observed_at: '2026-04-20' }, keys, now)).toBe('Цвітіння')
    expect(effectivePhase('Цвітіння', { phase_key: 'Після цвітіння', observed_at: '2026-05-09' }, keys, now)).toBe('Після цвітіння')
    expect(effectivePhase(null, { phase_key: 'Цвітіння', observed_at: '2025-05-09' }, keys, now)).toBeNull()
  })
})
