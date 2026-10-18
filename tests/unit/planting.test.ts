import { describe, it, expect } from 'vitest'
import { plantsFromScheme, plantingAge, plantingSummary, plantingPayload, emptyPlantingForm } from '../../app/utils/planting'

const now = new Date('2026-10-16')

describe('plantsFromScheme', () => {
  it('рахує рослини за схемою', () => {
    expect(plantsFromScheme(1, 3, 1)).toBe(3333)
    expect(plantsFromScheme(2.5, 4, 0.5)).toBe(12500)
  })
  it('без повної схеми — null', () => {
    expect(plantsFromScheme(1, 3, null)).toBeNull()
    expect(plantsFromScheme(0, 3, 1)).toBeNull()
  })
})

describe('plantingAge', () => {
  it('вік у роках, майбутній рік — null', () => {
    expect(plantingAge(2019, now)).toBe(7)
    expect(plantingAge(2030, now)).toBeNull()
    expect(plantingAge(null, now)).toBeNull()
  })
})

describe('plantingSummary', () => {
  it('збирає опис насадження', () => {
    expect(plantingSummary({ planting_year: 2021, rootstock: 'М9', row_spacing_m: 3.5, plant_spacing_m: 1, plants_count: 2857, irrigation: 'drip' }, now))
      .toBe('посадка 2021 (5 років) · підщепа М9 · 3,5×1 м · 2 857 рослин · крапельне')
  })
  it('відмінювання років', () => {
    expect(plantingSummary({ planting_year: 2025 }, now)).toBe('посадка 2025 (1 рік)')
    expect(plantingSummary({ planting_year: 2023 }, now)).toBe('посадка 2023 (3 роки)')
    expect(plantingSummary({ planting_year: 2015 }, now)).toBe('посадка 2015 (11 років)')
    expect(plantingSummary({ planting_year: 2026 }, now)).toBe('посадка 2026 (цього року)')
  })
  it('порожнє насадження — порожній рядок', () => {
    expect(plantingSummary({}, now)).toBe('')
  })
})

describe('plantingPayload', () => {
  it('кількість рослин зі схеми, якщо не введена', () => {
    const f = { ...emptyPlantingForm(), planting_year: '2020', row_spacing_m: '3', plant_spacing_m: '1,5', irrigation: 'drip' }
    expect(plantingPayload(f, 2)).toEqual({
      planting_year: 2020, rootstock: null, row_spacing_m: 3, plant_spacing_m: 1.5,
      plants_count: 4444, trellis: null, irrigation: 'drip',
    })
  })
  it('введена кількість важливіша, некоректні значення — null', () => {
    const f = { ...emptyPlantingForm(), planting_year: '1800', row_spacing_m: '-1', plant_spacing_m: '50', plants_count: '1200' }
    expect(plantingPayload(f, 1)).toMatchObject({ planting_year: null, row_spacing_m: null, plant_spacing_m: null, plants_count: 1200 })
  })
})
