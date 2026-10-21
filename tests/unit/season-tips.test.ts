import { describe, it, expect } from 'vitest'
import { calendarCropMatches, seasonTips, type TipCrop } from '../../shared/utils/seasonTips'
import { plantingStage } from '../../shared/utils/plantingStage'

const now = new Date('2026-05-12T12:00:00')
const crop = (id: string, farm: string, crop_type: string, phase: string | null, year = 2020): TipCrop =>
  ({ id, farm_id: farm, crop_type, group: 'berry_shrub', phase, stage: plantingStage('berry_shrub', year, now) })

describe('поради на цей час', () => {
  it('культура агрокалендаря: загальна назва підходить уточненій, але не навпаки', () => {
    expect(calendarCropMatches('Смородина чорна', 'смородина')).toBe(true)
    expect(calendarCropMatches('Смородина чорна', 'Смородина червона')).toBe(false)
    expect(calendarCropMatches('Смородина червона', 'Смородина червона')).toBe(true)
    expect(calendarCropMatches('Лохина', '')).toBe(false)
  })

  it('порада за фазою — лише на поточній фазі й стадії; однакова культура на двох полях — один раз', () => {
    const tips = seasonTips(
      [crop('a', 'f1', 'Лохина', 'Цвітіння'), crop('b', 'f2', 'Лохина', 'Цвітіння'), crop('c', 'f2', 'Лохина', 'Цвітіння', 2026), crop('d', 'f3', 'Лохина', null)],
      [
        { id: 1, crop_group: 'berry_shrub', phase_key: 'Цвітіння', title: 'Запилення', urgency: 'low', category: 'preparation', stages: ['bearing'] },
        { id: 2, crop_group: 'berry_shrub', phase_key: 'Цвітіння', title: 'Перший рік', urgency: 'high', category: 'pruning', stages: ['establishment'] },
        { id: 3, crop_group: 'berry_shrub', phase_key: 'Після цвітіння', title: 'Інша фаза', urgency: 'high', category: 'disease' },
      ],
      [],
    )
    expect(tips.map(t => [t.title, t.cropIds, t.farmIds])).toEqual([
      ['Перший рік', ['c'], ['f2']],
      ['Запилення', ['a', 'b'], ['f1', 'f2']],
    ])
  })

  it('агрокалендар — після порад за фазою, за важливістю', () => {
    const tips = seasonTips([crop('a', 'f1', 'Смородина чорна', null)], [], [
      { id: 'x', crop_type: 'смородина', title: 'Обрізка', urgency: 'low', category: 'pruning' },
      { id: 'y', crop_type: 'Смородина чорна', title: 'Кліщ', urgency: 'high', category: 'pest' },
      { id: 'z', crop_type: 'Лохина', title: 'Не наша', urgency: 'high', category: 'pest' },
    ])
    expect(tips.map(t => [t.id, t.source])).toEqual([['calendar:y', 'calendar'], ['calendar:x', 'calendar']])
  })
})
