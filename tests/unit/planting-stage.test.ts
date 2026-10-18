import { describe, it, expect } from 'vitest'
import { plantingStage, plantingStageLabel, phasesForStage, isFruitPhase, plantingStageInstructions } from '../../shared/utils/plantingStage'

const now = new Date('2026-10-18')

describe('plantingStage', () => {
  it('рік посадки — без урожаю для всіх груп', () => {
    for (const g of ['berry_shrub', 'berry_herb', 'grape', 'fruit_pome', 'fruit_stone', 'nut']) {
      expect(plantingStage(g, 2026, now)).toEqual({ stage: 'establishment', age: 0, fruiting: false })
    }
  })

  it('межі плодоношення за групами', () => {
    // полуниця: повний урожай з наступного року
    expect(plantingStage('berry_herb', 2025, now)?.stage).toBe('bearing')
    // ягідні кущі: 2-й рік — молоде з першим урожаєм, з 3-го — плодоносне
    expect(plantingStage('berry_shrub', 2025, now)).toEqual({ stage: 'young', age: 1, fruiting: true })
    expect(plantingStage('berry_shrub', 2024, now)?.stage).toBe('bearing')
    // виноград і кісточкові: без урожаю до 3 років
    expect(plantingStage('grape', 2024, now)).toEqual({ stage: 'young', age: 2, fruiting: false })
    expect(plantingStage('grape', 2023, now)?.stage).toBe('bearing')
    expect(plantingStage('fruit_stone', 2023, now)?.stage).toBe('bearing')
    // зерняткові — з 4, горіхові — з 6
    expect(plantingStage('fruit_pome', 2023, now)?.stage).toBe('young')
    expect(plantingStage('fruit_pome', 2022, now)?.stage).toBe('bearing')
    expect(plantingStage('nut', 2021, now)?.stage).toBe('young')
    expect(plantingStage('nut', 2020, now)?.stage).toBe('bearing')
  })

  it('без року, з майбутнім роком або для польових культур — без стадії', () => {
    expect(plantingStage('berry_shrub', null, now)).toBeNull()
    expect(plantingStage('berry_shrub', 2027, now)).toBeNull()
    expect(plantingStage('grain', 2020, now)).toBeNull()
    expect(plantingStage(null, 2020, now)).toBeNull()
  })

  it('підписи стадій', () => {
    expect(plantingStageLabel(plantingStage('berry_shrub', 2026, now))).toBe('рік посадки, урожаю немає')
    expect(plantingStageLabel(plantingStage('berry_shrub', 2025, now))).toBe('2-й рік вегетації, формування, перший невеликий урожай')
    expect(plantingStageLabel(plantingStage('grape', 2025, now))).toBe('2-й рік вегетації, формування, урожаю ще немає')
    expect(plantingStageLabel(plantingStage('berry_shrub', 2020, now))).toBe('плодоносне, 7-й рік вегетації')
  })
})

describe('фази для стадії', () => {
  const berryPhases = ['Спокій', 'Проростання / Набрякання бруньок', 'Розвиток листя', 'Цвітіння', 'Після цвітіння',
    'Формування плодів', 'Налив плодів', 'Дозрівання', 'Збір урожаю', 'Після збору', 'Підготовка до зими']
  const grapePhases = ['Сокорух / Набрякання бруньок', 'Поява суцвіть', 'Формування ягід', 'Змикання ґрон',
    "Початок достигання (м'якнення ягід)", 'Технічна стиглість', 'Визрівання лози / Листопад']

  it('фази плодів і збору розпізнаються', () => {
    expect(['Формування плодів', 'Налив плодів', 'Дозрівання', 'Збір урожаю', 'Після збору'].every(isFruitPhase)).toBe(true)
    expect(['Формування ягід', 'Змикання ґрон', "Початок достигання (м'якнення ягід)", 'Технічна стиглість'].every(isFruitPhase)).toBe(true)
    expect(['Спокій', 'Цвітіння', 'Після цвітіння', 'Розвиток листя', 'Визрівання лози / Листопад', 'Підготовка до зими'].some(isFruitPhase)).toBe(false)
  })

  it('рік посадки лохини — без фаз плодів і збору', () => {
    expect(phasesForStage(berryPhases, plantingStage('berry_shrub', 2026, now)))
      .toEqual(['Спокій', 'Проростання / Набрякання бруньок', 'Розвиток листя', 'Цвітіння', 'Після цвітіння', 'Підготовка до зими'])
  })

  it('молодий виноград — без ягід, але з визріванням лози', () => {
    expect(phasesForStage(grapePhases, plantingStage('grape', 2025, now)))
      .toEqual(['Сокорух / Набрякання бруньок', 'Поява суцвіть', 'Визрівання лози / Листопад'])
  })

  it('плодоносне і молоде з урожаєм — усі фази', () => {
    expect(phasesForStage(berryPhases, plantingStage('berry_shrub', 2020, now))).toEqual(berryPhases)
    expect(phasesForStage(berryPhases, plantingStage('berry_shrub', 2025, now))).toEqual(berryPhases)
    expect(phasesForStage(berryPhases, null)).toEqual(berryPhases)
  })

  it('інструкції для AI відрізняються за стадією', () => {
    const first = plantingStageInstructions('berry_shrub', plantingStage('berry_shrub', 2026, now))!
    expect(first).toContain('урожаю немає')
    expect(first).toContain('Квітки на молодих кущах видаляти')
    expect(plantingStageInstructions('berry_shrub', plantingStage('berry_shrub', 2020, now))).toContain('Плодоносне насадження, 7-й рік')
    expect(plantingStageInstructions('grain', null)).toBeNull()
  })
})

describe('tipFitsStage', () => {
  it('порада для всіх стадій або без року посадки — показується', async () => {
    const { tipFitsStage } = await import('../../shared/utils/plantingStage')
    const first = plantingStage('berry_shrub', 2026, now)
    expect(tipFitsStage(null, first)).toBe(true)
    expect(tipFitsStage(['establishment'], first)).toBe(true)
    expect(tipFitsStage(['young', 'bearing'], first)).toBe(false)
    expect(tipFitsStage(['young', 'bearing'], null)).toBe(true)
    expect(tipFitsStage(['establishment'], plantingStage('berry_shrub', 2019, now))).toBe(false)
  })
})
