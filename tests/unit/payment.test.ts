import { describe, expect, it } from 'vitest'
import { loyaltyYear, nextExpiry } from '../../server/utils/payment'

const now = new Date('2026-10-09T12:00:00Z')

describe('loyaltyYear — рік клієнта з першої оплати', () => {
  it('без оплат — 0', () => expect(loyaltyYear(null, now)).toBe(0))
  it('щомісячні оплати в перший рік — все ще 1-й рік', () => expect(loyaltyYear('2026-01-15T00:00:00Z', now)).toBe(1))
  it('через рік — 2-й', () => expect(loyaltyYear('2025-09-01T00:00:00Z', now)).toBe(2))
  it('через три роки — 4-й (знижка як за 3-й)', () => expect(loyaltyYear('2023-01-01T00:00:00Z', now)).toBe(4))
})

describe('nextExpiry — оплачені дні не згорають', () => {
  it('нова підписка — від сьогодні', () => {
    expect(nextExpiry(null, 'business', 1, now).toISOString()).toBe('2026-11-09T12:00:00.000Z')
  })
  it('продовження того самого плану до кінця терміну — від дати закінчення', () => {
    const cur = { plan: 'business', expires_at: '2026-10-20T00:00:00Z' }
    expect(nextExpiry(cur, 'business', 1, now).toISOString()).toBe('2026-11-20T00:00:00.000Z')
  })
  it('прострочена підписка — від сьогодні', () => {
    const cur = { plan: 'business', expires_at: '2026-09-01T00:00:00Z' }
    expect(nextExpiry(cur, 'business', 12, now).toISOString()).toBe('2027-10-09T12:00:00.000Z')
  })
  it('інший план — від сьогодні', () => {
    const cur = { plan: 'business', expires_at: '2026-10-20T00:00:00Z' }
    expect(nextExpiry(cur, 'business_pro', 1, now).toISOString()).toBe('2026-11-09T12:00:00.000Z')
  })
})
