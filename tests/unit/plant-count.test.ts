import { describe, it, expect } from 'vitest'
import { plantCount, blockRows } from '../../shared/utils/plantCount'

describe('живі рослини', () => {
  it('без кварталів — від кількості в насадженні', () => {
    const c = plantCount(1000, [], [
      { event_date: '2025-04-01', kind: 'loss', count: 30 },
      { event_date: '2026-03-20', kind: 'loss', count: 20 },
      { event_date: '2026-04-10', kind: 'replant', count: 40 },
    ], 2026)
    expect(c).toMatchObject({ planted: 1000, lost: 50, replanted: 40, alive: 990, lossPct: 5, lostThisYear: 20, mismatch: false })
  })

  it('з кварталами — сума кварталів, події по кварталах, розбіжність з насадженням', () => {
    const blocks = [{ id: 'a', name: 'К1', plants_count: 600, rows_from: 1, rows_to: 12 }, { id: 'b', name: 'К2', plants_count: 500 }]
    const c = plantCount(1000, blocks, [
      { block_id: 'a', event_date: '2026-03-01', kind: 'loss', count: 10 },
      { block_id: null, event_date: '2026-03-01', kind: 'loss', count: 5 },
      { block_id: 'b', event_date: '2026-04-01', kind: 'replant', count: 3 },
    ], 2026)
    expect(c).toMatchObject({ planted: 1100, lost: 15, replanted: 3, alive: 1088, mismatch: true })
    expect(c.byBlock.map(b => [b.block.name, b.alive])).toEqual([['К1', 590], ['К2', 503]])
    expect(blockRows(blocks[0]!)).toBe('ряди 1–12')
    expect(blockRows({ rows_from: 5, rows_to: 5 })).toBe('ряд 5')
    expect(blockRows({})).toBe('')
  })

  it('невідома кількість — без відсотка, живих не менше нуля', () => {
    expect(plantCount(null, [], [{ event_date: '2026-01-01', kind: 'loss', count: 7 }], 2026)).toMatchObject({ planted: 0, alive: 0, lossPct: null })
  })
})
