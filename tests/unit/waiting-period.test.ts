import { describe, it, expect } from 'vitest'
import { harvestFrom, activeWaiting } from '../../shared/utils/waitingPeriod'

describe('строк очікування', () => {
  it('дата збору = дата обробки + строк', () => {
    expect(harvestFrom({ product_name: 'Хорус', status: 'done', done_at: '2026-06-25', waiting_days: 21 })).toBe('2026-07-16')
    expect(harvestFrom({ product_name: 'Хорус', status: 'planned', done_at: null, waiting_days: 21 })).toBeNull()
    expect(harvestFrom({ product_name: 'Сульфат калію', status: 'done', done_at: '2026-06-25', waiting_days: 0 })).toBeNull()
  })
  it('серед обробок — найпізніший строк, що ще не минув', () => {
    const list = [
      { product_name: 'Хорус', status: 'done', done_at: '2026-06-25', waiting_days: 21 },
      { product_name: 'Світч', status: 'done', done_at: '2026-07-01', waiting_days: 7 },
      { product_name: 'Топаз', status: 'done', done_at: '2026-05-01', waiting_days: 20 },
    ]
    expect(activeWaiting(list, '2026-07-05')).toEqual({ from: '2026-07-16', product: 'Хорус' })
    expect(activeWaiting(list, '2026-07-16')).toBeNull()
  })
})
