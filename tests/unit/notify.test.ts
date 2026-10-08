import { describe, expect, it } from 'vitest'
import { kyivDayBounds } from '../../server/utils/notify'

describe('kyivDayBounds — день за Києвом на UTC-сервері', () => {
  it('літній час (UTC+3)', () => {
    const { start, end } = kyivDayBounds(new Date('2026-07-15T10:00:00Z'))
    expect(start.toISOString()).toBe('2026-07-14T21:00:00.000Z')
    expect(end.toISOString()).toBe('2026-07-15T20:59:59.999Z')
  })

  it('зимовий час (UTC+2)', () => {
    const { start } = kyivDayBounds(new Date('2026-01-15T10:00:00Z'))
    expect(start.toISOString()).toBe('2026-01-14T22:00:00.000Z')
  })

  it('після київської півночі, коли в UTC ще вчора', () => {
    const { start } = kyivDayBounds(new Date('2026-07-14T22:30:00Z'))  // 01:30 15 липня за Києвом
    expect(start.toISOString()).toBe('2026-07-14T21:00:00.000Z')
  })
})
