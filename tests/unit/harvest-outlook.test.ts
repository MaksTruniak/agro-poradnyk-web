import { describe, it, expect } from 'vitest'
import { harvestOutlook, demandMatches, whenLabel, type OutlookCrop } from '../../shared/utils/harvestOutlook'

const crop = (id: string, over: Partial<OutlookCrop> = {}): OutlookCrop =>
  ({ id, farm_id: 'f', crop_type: 'Лохина', variety: 'Блюкроп', area_ha: 2, planting_year: 2018, planned_yield_t: 5, ...over })
const opts = (today: string, horizon = 60) => ({
  today, horizon, groupOf: () => 'berry_shrub',
  varietyOf: (c: OutlookCrop) => (c.variety === 'Блюкроп' ? { ripening: 'mid' } : c.variety === 'Дюк' ? { ripening: 'early' } : null),
})

describe('скоро урожай', () => {
  it('вікно за сортом, обсяг за плановою врожайністю, сортування за початком', () => {
    const items = harvestOutlook([crop('mid'), crop('early', { variety: 'Дюк', planned_yield_t: null }), crop('none', { variety: null })], opts('2026-06-20'))
    expect(items.map(i => [i.crop.id, i.window.from, i.inDays, i.tons])).toEqual([
      ['early', '2026-06-25', 5, null],
      ['mid', '2026-07-05', 15, 10],
    ])
  })

  it('поза горизонтом і молоді насадження — не показуємо; минуле вікно — наступного року', () => {
    expect(harvestOutlook([crop('a')], opts('2026-03-01', 30))).toEqual([])
    expect(harvestOutlook([crop('young', { planting_year: 2026 })], opts('2026-06-20'))).toEqual([])
    const next = harvestOutlook([crop('a')], opts('2026-10-01', 365))
    expect(next[0]!.window.from).toBe('2027-07-05')
  })

  it('попит: збіг культур і підписи строку', () => {
    expect(demandMatches('лохина', 'Лохина')).toBe(true)
    expect(demandMatches('Смородина', 'Смородина чорна')).toBe(true)
    expect(demandMatches('Яблука', 'Яблуня')).toBe(true)
    expect(demandMatches('Малина', 'Лохина')).toBe(false)
    expect([whenLabel(0), whenLabel(1), whenLabel(3), whenLabel(12), whenLabel(21)]).toEqual(['збір триває', 'завтра', 'через 3 дні', 'через 12 днів', 'через 21 день'])
  })
})
