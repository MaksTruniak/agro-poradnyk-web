import { describe, it, expect } from 'vitest'
import { degreeDays, estimatePhase, shouldSuggestPhase, PHASE_GDD } from '../../shared/utils/phaseEstimate'
import { plantingStage } from '../../shared/utils/plantingStage'

const BERRY = ['Спокій', 'Проростання / Набрякання бруньок', 'Розвиток листя', 'Розвиток пагонів / Кущіння', 'Цвітіння',
  'Після цвітіння', 'Формування плодів', 'Налив плодів', 'Дозрівання', 'Збір урожаю', 'Після збору', 'Підготовка до зими']
const GRAPE = ['Спокій', 'Сокорух / Набрякання бруньок', 'Розпускання бруньок', 'Розвиток листя та пагонів', 'Поява суцвіть',
  'Цвітіння', 'Формування ягід', 'Змикання ґрон', 'Початок достигання (м\'якнення ягід)', 'Технічна стиглість',
  'Збір урожаю', 'Визрівання лози / Листопад', 'Підготовка до зими']
const at = (iso: string) => new Date(iso + 'T12:00:00')
const bearing = plantingStage('berry_shrub', 2018, at('2026-05-15'))

describe('degreeDays', () => {
  it('сумує лише тепло понад базу, пропуски даних не рахує', () => {
    expect(degreeDays([3, 6, 12.4, null, 5], 5)).toBe(8)
    expect(degreeDays([3, 6, 12.4], 10)).toBe(2)
  })
})

describe('estimatePhase', () => {
  it('пороги кожної групи йдуть по зростанню', () => {
    for (const table of Object.values(PHASE_GDD))
      for (let i = 1; i < table.length; i++) expect(table[i]![1]).toBeGreaterThan(table[i - 1]![1])
  })

  it('кущові ягідні за САТ: ранньої весни спокій, далі цвітіння, влітку збір', () => {
    expect(estimatePhase('berry_shrub', { gdd5: 10, gdd10: 0 }, BERRY, bearing, at('2026-03-10'))).toBe('Спокій')
    expect(estimatePhase('berry_shrub', { gdd5: 230, gdd10: 60 }, BERRY, bearing, at('2026-05-10'))).toBe('Цвітіння')
    expect(estimatePhase('berry_shrub', { gdd5: 1000, gdd10: 560 }, BERRY, bearing, at('2026-07-01'))).toBe('Збір урожаю')
  })

  it('виноград рахується з базою 10 °C', () => {
    expect(estimatePhase('grape', { gdd5: 600, gdd10: 260 }, GRAPE, null, at('2026-06-10'))).toBe('Цвітіння')
  })

  it('рік посадки: замість фаз урожаю — остання фаза росту', () => {
    const young = plantingStage('berry_shrub', 2026, at('2026-07-01'))
    expect(estimatePhase('berry_shrub', { gdd5: 1000, gdd10: 560 }, BERRY, young, at('2026-07-01'))).toBe('Після цвітіння')
  })

  it('восени й узимку — за датою', () => {
    const dd = { gdd5: 2400, gdd10: 1480 }
    expect(estimatePhase('berry_shrub', dd, BERRY, bearing, at('2026-10-19'))).toBe('Підготовка до зими')
    expect(estimatePhase('grape', dd, GRAPE, null, at('2026-12-05'))).toBe('Спокій')
  })

  it('без даних або для польових культур — нічого', () => {
    expect(estimatePhase('berry_shrub', null, BERRY, bearing)).toBeNull()
    expect(estimatePhase('grain', { gdd5: 300, gdd10: 100 }, ['Сходи'], null)).toBeNull()
  })
})

describe('shouldSuggestPhase', () => {
  const now = at('2026-05-20')
  it('пропонує, якщо фазу не відмічали або відмічали торік', () => {
    expect(shouldSuggestPhase('Цвітіння', null, BERRY, now)).toBe(true)
    expect(shouldSuggestPhase('Цвітіння', { phase_key: 'Підготовка до зими', observed_at: '2025-10-20' }, BERRY, now)).toBe(true)
  })
  it('пропонує лише наступну фазу, не відкочує ту, що фермер відмітив пізнішою', () => {
    expect(shouldSuggestPhase('Цвітіння', { phase_key: 'Розвиток листя', observed_at: '2026-04-20' }, BERRY, now)).toBe(true)
    expect(shouldSuggestPhase('Цвітіння', { phase_key: 'Цвітіння', observed_at: '2026-05-12' }, BERRY, now)).toBe(false)
    expect(shouldSuggestPhase('Цвітіння', { phase_key: 'Після цвітіння', observed_at: '2026-05-18' }, BERRY, now)).toBe(false)
  })
  it('пізньої осені спокій іде після підготовки до зими', () => {
    expect(shouldSuggestPhase('Спокій', { phase_key: 'Підготовка до зими', observed_at: '2026-10-20' }, BERRY, at('2026-11-25'))).toBe(true)
  })
})
