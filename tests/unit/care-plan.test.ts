import { describe, it, expect } from 'vitest'
import { careTasksDue, careWindow, CARE_TASKS, careTaskByKey } from '../../shared/utils/careTasks'
import { plantingYields, formatKg } from '../../shared/utils/plantingYield'
import { cropPlan, sortPlan, plantingNow, type PlanItem } from '../../shared/utils/weekPlan'
import { samePhase } from '../../shared/utils/phaseEstimate'
import { plantingStage } from '../../shared/utils/plantingStage'
import { addDays, type Forecast } from '../../shared/utils/weatherRisks'

const keys = (opts: Parameters<typeof careTasksDue>[0]) => careTasksDue(opts).map(t => t.key)

describe('догляд за сезоном', () => {
  it('ключі робіт унікальні й підходять під перевірку в базі', () => {
    const all = CARE_TASKS.map(t => t.key)
    expect(new Set(all).size).toBe(all.length)
    for (const k of all) expect(k).toMatch(/^[a-z_]{1,60}$/)
  })

  it('жовтень у яблуневому саду: листя, полив, побілка; без обрізки', () => {
    const k = keys({ group: 'fruit_pome', cropType: 'Яблуня', today: '2026-10-25' })
    expect(k).toEqual(expect.arrayContaining(['leaf_cleanup', 'water_recharge', 'whitewash_autumn']))
    expect(k).not.toContain('winter_pruning')
    expect(k).not.toContain('raspberry_canes')
  })

  it('малина восени — вирізати відплодоносні пагони, смородина — ні', () => {
    expect(keys({ group: 'berry_shrub', cropType: 'Малина', today: '2026-09-10' })).toContain('raspberry_canes')
    expect(keys({ group: 'berry_shrub', cropType: 'Смородина чорна', today: '2026-09-10' })).not.toContain('raspberry_canes')
  })

  it('лохина — перевірка pH двічі на рік', () => {
    expect(keys({ group: 'berry_shrub', cropType: 'Лохина', today: '2026-04-15' })).toContain('blueberry_ph')
    expect(keys({ group: 'berry_shrub', cropType: 'Лохина', today: '2026-09-15' })).toContain('blueberry_ph')
    expect(keys({ group: 'berry_shrub', cropType: 'Смородина', today: '2026-04-15' })).not.toContain('blueberry_ph')
  })

  it('фаза відома — фазові роботи лише на своїх фазах', () => {
    // Березень, але виноград уже розпускає листя — сухої підв'язки не пропонуємо
    expect(keys({ group: 'grape', cropType: 'Виноград', today: '2026-04-20', phaseKey: 'Розпускання бруньок' })).toContain('grape_tie_dry')
    expect(keys({ group: 'grape', cropType: 'Виноград', today: '2026-04-20', phaseKey: 'Розвиток листя та пагонів' })).not.toContain('grape_tie_dry')
    // Фаза невідома — за вікном дат
    expect(keys({ group: 'grape', cropType: 'Виноград', today: '2026-04-20' })).toContain('grape_tie_dry')
  })

  it('нормування зав\'язі — лише з урожаєм; формування — лише молоді', () => {
    const now = new Date('2026-06-10T12:00:00')
    const young = plantingStage('fruit_pome', 2025, now)
    const bearing = plantingStage('fruit_pome', 2015, now)
    expect(keys({ group: 'fruit_pome', cropType: 'Яблуня', today: '2026-06-10', stage: young })).not.toContain('fruit_thinning')
    expect(keys({ group: 'fruit_pome', cropType: 'Яблуня', today: '2026-06-10', stage: bearing })).toContain('fruit_thinning')
    expect(keys({ group: 'fruit_stone', cropType: 'Вишня', today: '2026-06-10', stage: bearing })).not.toContain('fruit_thinning')
    const march = new Date('2026-03-10T12:00:00')
    expect(keys({ group: 'fruit_pome', cropType: 'Яблуня', today: '2026-03-10', stage: plantingStage('fruit_pome', 2025, march) })).toContain('formative_young')
    expect(keys({ group: 'fruit_pome', cropType: 'Яблуня', today: '2026-03-10', stage: plantingStage('fruit_pome', 2010, march) })).not.toContain('formative_young')
    // Рік посадки невідомий — формування не пропонуємо
    expect(keys({ group: 'fruit_pome', cropType: 'Яблуня', today: '2026-03-10' })).not.toContain('formative_young')
  })

  it('виконана робота зникає до наступного сезону', () => {
    const due = careTasksDue({ group: 'fruit_pome', cropType: 'Яблуня', today: '2026-10-25' })
    const leaf = due.find(t => t.key === 'leaf_cleanup')!
    expect(leaf).toMatchObject({ period: '2026-10', until: '2026-11-30' })
    expect(keys({ group: 'fruit_pome', cropType: 'Яблуня', today: '2026-10-25', done: new Set(['leaf_cleanup:2026-10']) }))
      .not.toContain('leaf_cleanup')
    expect(keys({ group: 'fruit_pome', cropType: 'Яблуня', today: '2027-10-25', done: new Set(['leaf_cleanup:2026-10']) }))
      .toContain('leaf_cleanup')
  })

  it('вікно через Новий рік', () => {
    const t = { ...careTaskByKey('leaf_cleanup')!, windows: [['12-01', '01-31']] as [string, string][] }
    expect(careWindow(t, '2026-12-15')).toEqual({ period: '2026-12', until: '2027-01-31' })
    expect(careWindow(t, '2027-01-10')).toEqual({ period: '2026-12', until: '2027-01-31' })
    expect(careWindow(t, '2027-02-10')).toBeNull()
  })

  it('польові культури — без догляду', () => {
    expect(careTasksDue({ group: 'grain', cropType: 'Пшениця', today: '2026-10-25' })).toEqual([])
    expect(careTasksDue({ group: null, cropType: 'Щось', today: '2026-10-25' })).toEqual([])
  })
})

describe('урожайність по роках', () => {
  it('ручний запис має перевагу, т/га, зміна, собівартість, виручка', () => {
    const rows = plantingYields({
      areaHa: 2,
      manual: [{ year: 2026, yield_kg: '6400', note: 'заморозок' }],
      harvest: [
        { weight_kg: 3000, recorded_at: '2025-07-01T10:00:00Z' }, { weight_kg: 2000, recorded_at: '2025-07-05T10:00:00Z' },
        { weight_kg: 999, recorded_at: '2026-07-01T10:00:00Z' },
      ],
      expenses: [{ amount_uah: 48000, expense_date: '2026-04-01' }, { amount_uah: '16000', expense_date: '2026-06-01' }, { amount_uah: 10000, expense_date: '2025-05-01' }],
      sales: [{ total: 128000, date: '2026-07-20' }],
    })
    expect(rows.map(r => r.year)).toEqual([2026, 2025])
    expect(rows[0]).toMatchObject({ kg: 6400, source: 'manual', tPerHa: 3.2, expenses: 64000, revenue: 128000, costPerKg: 10, change: 28, note: 'заморозок' })
    expect(rows[1]).toMatchObject({ kg: 5000, source: 'harvest', tPerHa: 2.5, costPerKg: 2, change: null })
  })

  it('без площі й витрат — без т/га і собівартості; порожньо — порожньо', () => {
    const [r] = plantingYields({ areaHa: null, manual: [{ year: 2026, yield_kg: 800 }], harvest: [], expenses: [], sales: [] })
    expect(r).toMatchObject({ tPerHa: null, costPerKg: null })
    expect(plantingYields({ areaHa: 1, manual: [], harvest: [], expenses: [{ amount_uah: 5, expense_date: '2026-01-01' }], sales: [] })).toEqual([])
  })

  it('формат ваги', () => {
    expect(formatKg(850)).toBe('850 кг')
    expect(formatKg(3240)).toBe('3,2 т')
  })
})

describe('план на тиждень', () => {
  const TODAY = '2026-05-12'
  const now = new Date(`${TODAY}T10:00:00`)
  const DAYS = [-2, -1, 0, 1, 2, 3].map(n => addDays(TODAY, n))
  const fc = (tmin: number[]): Forecast => ({
    daily: { time: DAYS, tmin, tmean: DAYS.map(() => 14), precip: DAYS.map(() => 0) },
    hourly: { time: [], temp: [], rh: [], precip: [] },
  })
  const PHASES = ['Спокій', 'Проростання / Набрякання бруньок', 'Розвиток листя', 'Розвиток пагонів / Кущіння', 'Цвітіння',
    'Після цвітіння', 'Формування плодів', 'Налив плодів', 'Дозрівання', 'Збір урожаю', 'Після збору', 'Підготовка до зими']
  const base = {
    crop: { id: 'c1', farm_id: 'f1', crop_type: 'Смородина чорна', planting_year: 2020 },
    group: 'berry_shrub', phases: PHASES, current: null, dd: { gdd5: 230, gdd10: 80 },
  }

  it('фаза за САТ, заморозок, обробка з техкарти на цій фазі (стара назва фази), строк очікування', () => {
    expect(plantingNow(base, now).phase).toBe('Цвітіння')
    const items = cropPlan({
      ...base,
      forecast: fc([8, 8, 6, -2.5, 4, 6]),
      program: [
        { id: 't1', product_name: 'Топаз', phase: 'Цвітіння', type: 'захист', status: 'planned', dosage: '5 мл на 10 л' },
        { id: 't2', product_name: 'Бордоська суміш', phase: 'Набрякання бруньок', type: 'захист', status: 'planned' },
        { id: 't3', product_name: 'Хорус', phase: 'Розвиток листя', type: 'захист', status: 'done', done_at: '2026-05-05', waiting_days: 14 },
      ],
    }, TODAY, now)
    const byKind = (k: string) => items.filter(i => i.kind === k)
    expect(byKind('risk')).toHaveLength(1)
    expect(byKind('risk')[0]).toMatchObject({ priority: 'high', icon: '❄️', date: '2026-05-13' })
    expect(byKind('treatment').map(i => i.title)).toEqual(['Обробка: Топаз'])
    expect(byKind('treatment')[0]!.detail).toBe('За техкартою на фазі «Цвітіння» · 5 мл на 10 л')
    expect(byKind('waiting')[0]).toMatchObject({ title: 'Збір не раніше 19.05', priority: 'normal' })
    expect(byKind('phase')[0]!.title).toBe('Перевірте фенофазу: мабуть, уже «Цвітіння»')
  })

  it('стара назва фази в техкарті збігається з нинішнім ключем', () => {
    expect(samePhase('Набрякання бруньок', 'Проростання / Набрякання бруньок')).toBe(true)
    expect(samePhase('Цвітіння', 'Після цвітіння')).toBe(false)
    expect(samePhase(null, 'Цвітіння')).toBe(false)
    const items = cropPlan({
      ...base, dd: { gdd5: 40, gdd10: 0 }, forecast: null,
      program: [{ id: 't2', product_name: 'Бордоська суміш', phase: 'Набрякання бруньок', type: 'захист', status: 'planned' }],
    }, TODAY, now)
    expect(items.find(i => i.kind === 'treatment')?.title).toBe('Обробка: Бордоська суміш')
  })

  it('строк очікування на фазі збору — терміново; ручний запис журналу теж рахується', () => {
    const items = cropPlan({
      ...base, dd: { gdd5: 1000, gdd10: 400 }, forecast: null, program: [],
      journal: [{ product_name: 'Світч', status: 'done', done_at: '2026-05-10', waiting_days: 7 }],
    }, TODAY, now)
    expect(items.find(i => i.kind === 'waiting')).toMatchObject({ priority: 'high', title: 'Збір не раніше 17.05' })
  })

  it('порядок: термінове, далі за датою, догляд у кінці', () => {
    const it = (id: string, kind: PlanItem['kind'], priority: PlanItem['priority'], date: string | null): PlanItem =>
      ({ id, kind, priority, date, icon: '', title: id, detail: '', farmId: null, cropId: null })
    const sorted = sortPlan([
      it('care', 'care', 'normal', '2026-05-13'), it('rem', 'reminder', 'normal', '2026-05-14'),
      it('frost', 'risk', 'high', '2026-05-15'), it('treat', 'treatment', 'normal', null), it('late', 'reminder', 'high', '2026-05-01'),
    ])
    expect(sorted.map(i => i.id)).toEqual(['late', 'frost', 'rem', 'treat', 'care'])
  })
})
