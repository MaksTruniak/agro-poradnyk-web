import { describe, it, expect } from 'vitest'
import { parseDosage, tankMix, formatAmount, defaultWaterPerHa } from '../../shared/utils/tankMix'

describe('розбір норми з техкарти', () => {
  it('норма на гектар, діапазон, витрата води в дужках', () => {
    expect(parseDosage('0.3 л/га')).toEqual({ kind: 'per_ha', amount: 0.3, amountMax: 0.3, unit: 'л', waterPerHa: null })
    expect(parseDosage('2–3 л/га')).toMatchObject({ amount: 2, amountMax: 3 })
    expect(parseDosage('0,25 кг/га')).toMatchObject({ amount: 0.25, unit: 'кг' })
    expect(parseDosage('300 г/га')).toMatchObject({ amount: 0.3, unit: 'кг' })
    expect(parseDosage('10 кг/га (1000 л/га)')).toMatchObject({ amount: 10, waterPerHa: 1000 })
    expect(parseDosage('25 кг/га (5% розчин, 500 л/га)')).toMatchObject({ amount: 25, waterPerHa: 500 })
    expect(parseDosage('40 л/га')).toMatchObject({ amount: 40, waterPerHa: null })
  })

  it('концентрація і норма на рослину', () => {
    expect(parseDosage('5 мл на 10 л води')).toEqual({ kind: 'concentration', amount: 0.005, amountMax: 0.005, unit: 'л', perLiters: 10 })
    expect(parseDosage('1 г на 10 л води')).toMatchObject({ kind: 'concentration', amount: 0.001, unit: 'кг' })
    expect(parseDosage('20 г на кущ')).toEqual({ kind: 'per_plant', amount: 0.02, amountMax: 0.02, unit: 'кг' })
    expect(parseDosage('100 г на дерево')).toMatchObject({ kind: 'per_plant', amount: 0.1 })
  })

  it('незрозуміле — null', () => {
    expect(parseDosage('за етикеткою')).toBeNull()
    expect(parseDosage('')).toBeNull()
    expect(parseDosage(null)).toBeNull()
  })
})

describe('розрахунок заправок', () => {
  it('2 га, 500 л/га, бак 400 л: 3 заправки, остання неповна', () => {
    const m = tankMix({ dose: parseDosage('0.3 л/га')!, areaHa: 2, waterPerHa: 500, tankL: 400 })!
    expect(m.water).toBe(1000)
    expect(m.tanks).toBe(3)
    expect(m.product[0]).toBeCloseTo(0.6)
    expect(m.perTank![0]).toBeCloseTo(0.24)
    expect(m.lastTank!.water).toBeCloseTo(200)
    expect(m.lastTank!.product[0]).toBeCloseTo(0.12)
  })

  it('рівно повні заправки — без неповної', () => {
    const m = tankMix({ dose: parseDosage('1 кг/га')!, areaHa: 1, waterPerHa: 400, tankL: 200 })!
    expect(m).toMatchObject({ tanks: 2, lastTank: null })
    expect(m.perTank![0]).toBeCloseTo(0.5)
  })

  it('менше одного бака — лише неповна заправка', () => {
    const m = tankMix({ dose: parseDosage('5 мл на 10 л води')!, areaHa: 0.2, waterPerHa: 500, tankL: 400 })!
    expect(m).toMatchObject({ tanks: 1, perTank: null })
    expect(m.lastTank!.water).toBeCloseTo(100)
    expect(m.product[0]).toBeCloseTo(0.05)
  })

  it('на кущ — множимо на кількість рослин; без рослин — null', () => {
    expect(tankMix({ dose: parseDosage('20 г на кущ')!, areaHa: 1, waterPerHa: 0, tankL: 0, plants: 3000 })!.product).toEqual([60, 60])
    expect(tankMix({ dose: parseDosage('20 г на кущ')!, areaHa: 1, waterPerHa: 0, tankL: 0 })).toBeNull()
  })

  it('формат і типова витрата води', () => {
    expect(formatAmount(0.24, 'л')).toBe('240 мл')
    expect(formatAmount([1.2, 1.8], 'л')).toBe('1,2–1,8 л')
    expect(formatAmount(12.5, 'кг')).toBe('12,5 кг')
    expect(defaultWaterPerHa('fruit_pome')).toBe(1000)
    expect(defaultWaterPerHa(null)).toBe(300)
  })
})
