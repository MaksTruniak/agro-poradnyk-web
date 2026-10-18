import { describe, it, expect } from 'vitest'
import { buildCardPrompt, cardPhases, normalizeCardPhases } from '../../server/utils/cardPrompt'
import { matchPhase } from '../../server/utils/phases'

const now = new Date('2026-10-18')
const phases = ['Спокій', 'Проростання / Набрякання бруньок', 'Розвиток листя', 'Цвітіння', 'Після цвітіння',
  'Формування плодів', 'Налив плодів', 'Дозрівання', 'Збір урожаю', 'Після збору', 'Підготовка до зими']
const base = { cropType: 'Лохина', variety: 'Дюк', areaHa: 2, phases, cropGroup: 'berry_shrub', now }

describe('промпт техкарти за стадією насадження', () => {
  it('рік посадки: інструкції без урожаю, у списку фаз немає збору', () => {
    const p = buildCardPrompt({ ...base, plantingYear: 2026 })
    expect(p).toContain('СТАДІЯ НАСАДЖЕННЯ')
    expect(p).toContain('урожаю немає')
    expect(p).toContain('Урожаю цього сезону немає')
    const list = p.split('ТІЛЬКИ дослівно з цього списку, у його порядку: ')[1]!.split('\n')[0]!
    expect(list).toBe('Спокій; Проростання / Набрякання бруньок; Розвиток листя; Цвітіння; Після цвітіння; Підготовка до зими')
  })

  it('плодоносне: повна схема і всі фази', () => {
    const p = buildCardPrompt({ ...base, plantingYear: 2019 })
    expect(p).toContain('Плодоносне насадження, 8-й рік вегетації')
    expect(p).not.toContain('Урожаю цього сезону немає')
    expect(cardPhases({ ...base, plantingYear: 2019 })).toEqual(phases)
  })

  it('без року посадки чи для польової культури — як раніше', () => {
    expect(buildCardPrompt({ ...base, plantingYear: null })).not.toContain('СТАДІЯ НАСАДЖЕННЯ')
    expect(buildCardPrompt({ ...base, cropType: 'Пшениця озима', cropGroup: 'grain', plantingYear: 2026 })).not.toContain('СТАДІЯ НАСАДЖЕННЯ')
    // невідома група з браузера ігнорується
    expect(buildCardPrompt({ ...base, cropGroup: 'bogus', plantingYear: 2026 })).not.toContain('СТАДІЯ НАСАДЖЕННЯ')
  })

  it('відповідь моделі: фази зводяться до довідника, збір прибирається в рік посадки', () => {
    const fromModel = [
      { name: 'Розпускання листя', treatments: [] },
      { name: 'Збір урожаю', treatments: [] },
      { name: 'Дозрівання ягід', treatments: [] },
      { name: 'підготовка до зими', treatments: [] },
    ]
    const first = normalizeCardPhases(fromModel, { ...base, plantingYear: 2026 }, matchPhase)
    expect(first.map(p => p.name)).toEqual(['Розпускання листя', 'Підготовка до зими'])
    const bearing = normalizeCardPhases(fromModel, { ...base, plantingYear: 2019 }, matchPhase)
    expect(bearing.map(p => p.name)).toEqual(['Розпускання листя', 'Збір урожаю', 'Дозрівання', 'Підготовка до зими'])
  })
})
