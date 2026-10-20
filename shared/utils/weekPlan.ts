// План робіт по насадженню на найближчий тиждень: погодні ризики, строк очікування, обробки з техкарти
// на поточній фазі, догляд за сезоном, перевірка фази. Нагадування додає сторінка плану окремо.

import { phasesForStage, plantingStage } from './plantingStage'
import { estimatePhase, effectivePhase, shouldSuggestPhase, samePhase, type DegreeDays } from './phaseEstimate'
import { weatherRisks, RISK_ICONS, type Forecast } from './weatherRisks'
import { activeWaiting, HARVEST_PHASES, type WaitingTreatment } from './waitingPeriod'
import { careTasksDue } from './careTasks'

export type PlanKind = 'risk' | 'waiting' | 'treatment' | 'care' | 'phase' | 'reminder'

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
  crop: { id: string; farm_id: string; crop_type: string; planting_year?: number | null }
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
}

const TYPE_LABEL: Record<string, string> = { захист: 'Обробка', підживлення: 'Підживлення', полив: 'Полив' }
const KIND_ORDER: PlanKind[] = ['risk', 'waiting', 'reminder', 'treatment', 'phase', 'care']

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
