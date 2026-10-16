import { describe, it, expect } from 'vitest'
import { guessCropGroup, isPerennialGroup } from '../../app/utils/cropGroups'

describe('guessCropGroup', () => {
  it('виноград — окрема група, не ягідний кущ', () => {
    expect(guessCropGroup('Виноград технічний')).toBe('grape')
  })

  it('лохина — кущ, полуниця — трав\'яниста', () => {
    expect(guessCropGroup('Лохина')).toBe('berry_shrub')
    expect(guessCropGroup('Полуниця ремонтантна')).toBe('berry_herb')
  })

  it('точний збіг важливіший за підрядок', () => {
    expect(guessCropGroup('Цукровий буряк')).toBe('technical')
    expect(guessCropGroup('Буряк')).toBe('veg_root')
  })

  it('невідома культура — без групи', () => {
    expect(guessCropGroup('Ківано')).toBeNull()
    expect(guessCropGroup('')).toBeNull()
  })
})

describe('isPerennialGroup', () => {
  it('багаторічні — ягідні, плодові, виноград, горіхи', () => {
    expect(isPerennialGroup('grape')).toBe(true)
    expect(isPerennialGroup('berry_shrub')).toBe(true)
    expect(isPerennialGroup('grain')).toBe(false)
    expect(isPerennialGroup(null)).toBe(false)
  })
})
