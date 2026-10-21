// План робіт по насадженню на найближчий тиждень: погодні ризики, строк очікування, обробки з техкарти
// на поточній фазі, догляд за сезоном, перевірка фази. Нагадування додає сторінка плану окремо.

import { phasesForStage, plantingStage } from './plantingStage'
import { estimatePhase, effectivePhase, shouldSuggestPhase, samePhase, type DegreeDays } from './phaseEstimate'
import { weatherRisks, RISK_ICONS, type Forecast } from './weatherRisks'
import { activeWaiting, HARVEST_PHASES, type WaitingTreatment } from './waitingPeriod'
import { careTasksDue } from './careTasks'
import { formatWindow, harvestStatus, harvestWindow, type VarietyRipening } from './ripening'

export type PlanKind = 'risk' | 'waiting' | 'harvest' | 'treatment' | 'care' | 'phase' | 'reminder'

export interface PlanItem {
  id: string
  kind: PlanKind
  priority: 'high' | 'normal'
  /** дата події (yyyy-mm-dd): ніч заморозку, дата нагадування, кінець вікна догляду */
  date: string | null
  icon: string
  title: string
  detail: string
  farmId: string | null
  cropId: string | null
  careKey?: string
  carePeriod?: string
  reminderId?: string
}

export interface PlanTreatment extends WaitingTreatment {
  id: string
  phase?: string | null
  dosage?: string | null
  type?: string | null
}

export interface PlanCropInput {
  crop: { id: string; farm_id: string; crop_type: string; variety?: string | null; planting_year?: number | null }
  group: string | null
  /** фази культури в порядку сезону (ключі growth_phases) */
  phases: string[]
  current: { phase_key: string; observed_at: string } | null
  dd: DegreeDays | null
  forecast: Forecast | null
  program: PlanTreatment[]
  /** обробки з журналу, внесені вручну (для строку очікування) */
  journal?: WaitingTreatment[]
  careDone?: Set<string>
  /** строк стиглості сорту з довідника */
  variety?: VarietyRipening | null
}

const TYPE_LABEL: Record<string, string> = { захист: 'Обробка', підживлення: 'Підживлення', полив: 'Полив' }
const KIND_ORDER: PlanKind[] = ['risk', 'waiting', 'reminder', 'harvest', 'treatment', 'phase', 'care']

/** Поточна фаза й підказка для насадження */
export function plantingNow(input: Pick<PlanCropInput, 'crop' | 'group' | 'phases' | 'current' | 'dd'>, now = new Date()) {
  const stage = plantingStage(input.group, input.crop.planting_year, now)
  const options = phasesForStage(input.phases, stage)
  const estimate = input.dd ? estimatePhase(input.group, input.dd, options, stage, now) : null
  const phase = estimate ? effectivePhase(estimate, input.current, options, now) : input.current?.phase_key ?? null
  const hint = shouldSuggestPhase(estimate, input.current, options, now) ? estimate : null
  return { stage, options, estimate, phase, hint }
}

export function cropPlan(input: PlanCropInput, today: string, now = new Date()): PlanItem[] {
  const { crop } = input
  const base = { farmId: crop.farm_id, cropId: crop.id }
  const { stage, phase, hint } = plantingNow(input, now)
  const items: PlanItem[] = []

  for (const r of weatherRisks(input.group, phase, input.forecast, today)) {
    items.push({
      ...base, id: `risk:${crop.id}:${r.kind}`, kind: 'risk', priority: r.level === 'high' ? 'high' : 'normal',
      date: r.date, icon: RISK_ICONS[r.kind], title: r.title, detail: r.advice,
    })
  }

  const w = activeWaiting([...input.program, ...(input.journal ?? [])], today)
  if (w) {
    const harvesting = !!phase && HARVEST_PHASES.includes(phase)
    items.push({
      ...base, id: `waiting:${crop.id}`, kind: 'waiting', priority: harvesting ? 'high' : 'normal', date: w.from,
      icon: '⏳', title: `Збір не раніше ${w.from.slice(8, 10)}.${w.from.slice(5, 7)}`,
      detail: `Строк очікування після обробки «${w.product}».${harvesting ? ' Насадження вже на фазі збору — до цієї дати не збирати і не продавати.' : ''}`,
    })
  }

  // Збір за строком стиглості сорту: за 2 тижні до початку вікна і поки триває (не для насаджень без урожаю)
  const hw = stage && !stage.fruiting ? null : harvestWindow(crop.crop_type, input.variety, Number(today.slice(0, 4)))
  const hs = hw ? harvestStatus(hw, today) : null
  if (hw && hs) {
    items.push({
      ...base, id: `harvest:${crop.id}`, kind: 'harvest', priority: 'normal', date: hs === 'now' ? hw.to : hw.from, icon: '🧺',
      title: hs === 'now' ? `Збір${crop.variety ? ` «${crop.variety}»` : ''}: орієнтовно до ${hw.to.slice(8, 10)}.${hw.to.slice(5, 7)}` : `Скоро збір${crop.variety ? ` «${crop.variety}»` : ''}: орієнтовно з ${hw.from.slice(8, 10)}.${hw.from.slice(5, 7)}`,
      detail: `${hw.label[0]!.toUpperCase()}${hw.label.slice(1)}, у середній рік ${formatWindow(hw)}. Підготуйте тару, працівників і збут; перевірте строк очікування після обробок.`,
    })
  }

  if (phase) {
    for (const t of input.program) {
      if (t.status === 'done' || !samePhase(t.phase, phase)) continue
      items.push({
        ...base, id: `treatment:${t.id}`, kind: 'treatment', priority: 'normal', date: null,
        icon: t.type === 'підживлення' ? '🌱' : t.type === 'полив' ? '💧' : '🧪',
        title: `${TYPE_LABEL[t.type ?? ''] ?? 'Обробка'}: ${t.product_name}`,
        detail: `За техкартою на фазі «${phase}»${t.dosage ? ` · ${t.dosage}` : ''}`,
      })
    }
  }

  if (hint) {
    items.push({
      ...base, id: `phase:${crop.id}`, kind: 'phase', priority: 'normal', date: null, icon: '🌿',
      title: `Перевірте фенофазу: мабуть, уже «${hint}»`,
      detail: 'Орієнтовно за сумою активних температур. Відмітьте фазу на сторінці поля — план, ризики й поради стануть точнішими.',
    })
  }

  for (const c of careTasksDue({ group: input.group, cropType: crop.crop_type, phaseKey: phase, stage, today, done: input.careDone })) {
    items.push({
      ...base, id: `care:${crop.id}:${c.key}`, kind: 'care', priority: 'normal', date: c.until, icon: '🛠️',
      title: c.title, detail: c.advice, careKey: c.key, carePeriod: c.period,
    })
  }

  return items
}

/** Спершу термінове, далі за датою, далі за видом */
export function sortPlan(items: PlanItem[]) {
  return [...items].sort((a, b) =>
    (a.priority === b.priority ? 0 : a.priority === 'high' ? -1 : 1)
    || (a.kind === 'care' || b.kind === 'care' ? KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) : 0)
    || (a.date ?? '9999').localeCompare(b.date ?? '9999')
    || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind))
}

export interface AssembleInput {
  /** усі культури господарства; план — лише для багаторічних (groupOf → багаторічна група) */
  crops: { id: string; farm_id: string; crop_type: string; variety?: string | null; planting_year?: number | null; catalog_id?: string | null }[]
  farmRegion: (farmId: string) => string | null
  groupOf: (crop: AssembleInput['crops'][number]) => string | null
  isPerennial: (group: string | null) => boolean
  phasesOf: (crop: AssembleInput['crops'][number], group: string | null) => string[]
  /** відмітки фаз, найновіші першими */
  phaseRows: { farm_crop_id: string; phase_key: string; observed_at: string }[]
  programs: { farm_crop_id: string; program_treatments?: PlanTreatment[] | null }[]
  journal: { farm_id: string; crop_type: string | null; product_name: string; treatment_date: string; waiting_days: number | null }[]
  care: { farm_crop_id: string; task_key: string; period: string }[]
  reminders: { id: string; description: string; scheduled_date: string; farm_id: string | null; farm_crop_id: string | null }[]
  /** строк стиглості сорту культури (довідник сортів) */
  varietyOf?: (crop: AssembleInput['crops'][number]) => VarietyRipening | null
  weather: (region: string | null) => { dd: DegreeDays | null; fc: (Forecast & { today?: string }) | null }
  today: string
  /** часовий пояс для дат нагадувань (на сервері — Europe/Kyiv) */
  timeZone?: string
  now?: Date
}

/** План по всіх культурах господарства + фази для порад (спільне для сторінки й щотижневого листа) */
export function assemblePlan(a: AssembleInput) {
  const out: PlanItem[] = []
  const current = (id: string) => a.phaseRows.find(r => r.farm_crop_id === id) ?? null
  const cropPhases: { id: string; farm_id: string; crop_type: string; group: string | null; phase: string | null; stage: ReturnType<typeof plantingStage> }[] = []

  for (const crop of a.crops) {
    const group = a.groupOf(crop)
    if (!a.isPerennial(group)) {
      cropPhases.push({ id: crop.id, farm_id: crop.farm_id, crop_type: crop.crop_type, group, phase: current(crop.id)?.phase_key ?? null, stage: plantingStage(group, crop.planting_year, a.now) })
      continue
    }
    const w = a.weather(a.farmRegion(crop.farm_id))
    const input: PlanCropInput = {
      crop,
      group,
      phases: a.phasesOf(crop, group),
      current: current(crop.id),
      dd: w.dd,
      forecast: w.fc,
      program: a.programs.filter(p => p.farm_crop_id === crop.id).flatMap(p => p.program_treatments || []),
      journal: a.journal
        .filter(j => j.farm_id === crop.farm_id && j.crop_type && crop.crop_type.startsWith(j.crop_type.split(' (')[0]!))
        .map(j => ({ product_name: j.product_name, status: 'done', done_at: j.treatment_date, waiting_days: j.waiting_days })),
      careDone: new Set(a.care.filter(c => c.farm_crop_id === crop.id).map(c => `${c.task_key}:${c.period}`)),
      variety: a.varietyOf?.(crop) ?? null,
    }
    out.push(...cropPlan(input, w.fc?.today ?? a.today, a.now))
    const now = plantingNow(input, a.now)
    cropPhases.push({ id: crop.id, farm_id: crop.farm_id, crop_type: crop.crop_type, group, phase: now.phase, stage: now.stage })
  }

  const tz = a.timeZone ? { timeZone: a.timeZone } : {}
  for (const r of a.reminders) {
    const date = new Date(r.scheduled_date).toLocaleDateString('sv-SE', tz)
    const crop = a.crops.find(c => c.id === r.farm_crop_id)
    const late = date < a.today
    out.push({
      id: `reminder:${r.id}`, kind: 'reminder', priority: late ? 'high' : 'normal', date,
      icon: '🔔', title: r.description,
      detail: late ? 'Прострочене нагадування' : `Нагадування · ${new Date(r.scheduled_date).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', ...tz })}`,
      farmId: r.farm_id ?? crop?.farm_id ?? null, cropId: crop?.id ?? null, reminderId: r.id,
    })
  }

  return { items: sortPlan(out), cropPhases }
}

/** Рядки щотижневого листа: план уже відсортований (термінове першим); однакова робота догляду на кількох
 *  насадженнях — один рядок зі списком культур; решта — «і ще N» */
export function planDigest(
  items: PlanItem[],
  names: { crop: (id: string | null) => string | null; farm: (id: string | null) => string | null },
  limit = 12,
) {
  const ddmm = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`
  const groups: PlanItem[][] = []
  for (const i of items) {
    const same = i.kind === 'care' ? groups.find(g => g[0]!.kind === 'care' && g[0]!.careKey === i.careKey && g[0]!.carePeriod === i.carePeriod) : null
    if (same) same.push(i)
    else groups.push([i])
  }
  const lines = groups.slice(0, limit).map(g => {
    const i = g[0]!
    const when = i.date && i.kind === 'care' ? `до ${ddmm(i.date)}` : i.date && i.kind === 'reminder' ? ddmm(i.date) : ''
    let where: string[]
    if (g.length === 1) where = [names.crop(i.cropId), names.farm(i.farmId)].filter(Boolean) as string[]
    else {
      const crops = [...new Set(g.map(x => names.crop(x.cropId)).filter(Boolean))] as string[]
      where = [crops.length > 3 ? `${crops.slice(0, 3).join(', ')} і ще ${crops.length - 3}` : crops.join(', ')]
    }
    return { icon: i.icon, title: i.title, meta: [...where, when].filter(Boolean).join(' · '), urgent: i.priority === 'high' }
  })
  return { lines, more: Math.max(0, groups.length - limit), urgent: items.filter(i => i.priority === 'high').length }
}
