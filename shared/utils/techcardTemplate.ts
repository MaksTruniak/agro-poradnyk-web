// Шаблони техкарт: схема обробок за фенофазами без статусів і дат — зберегти з техкарти й застосувати до іншої культури.

export interface TemplateItem {
  phase: string | null
  phase_order: number | null
  type: string
  product_name: string
  dosage: string | null
  notes: string | null
  waiting_days: number | null
}

interface TreatmentLike {
  phase?: string | null
  phase_order?: number | null
  type?: string | null
  product_name: string
  dosage?: string | null
  notes?: string | null
  waiting_days?: number | null
}

const key = (t: { phase?: string | null; product_name: string }) => `${t.phase ?? ''}\u0000${t.product_name.trim().toLowerCase()}`

/** Шаблон з обробок техкарти: фази в порядку техкарти, обробки — у порядку фаз */
export function templateFromTreatments(treatments: TreatmentLike[], activePhases: string[]) {
  const items: TemplateItem[] = treatments
    .filter(t => t.product_name?.trim())
    .map(t => ({
      phase: t.phase ?? null,
      phase_order: t.phase_order ?? null,
      type: t.type || 'захист',
      product_name: t.product_name.trim(),
      dosage: t.dosage?.trim() || null,
      notes: t.notes?.trim() || null,
      waiting_days: t.waiting_days ?? null,
    }))
    .sort((a, b) => (a.phase_order ?? 99) - (b.phase_order ?? 99))
  const phases = [...new Set([...activePhases, ...items.map(i => i.phase).filter((p): p is string => !!p)])]
  return { phases, items }
}

/** Що додати до техкарти з шаблону: обробки, яких там ще немає (та сама фаза й препарат), і нові фази */
export function planTemplateApply(
  template: { phases: string[]; items: TemplateItem[] },
  existing: TreatmentLike[],
  activePhases: string[],
) {
  const have = new Set(existing.map(key))
  const seen = new Set<string>()
  const toInsert = template.items.filter(i => {
    const k = key(i)
    if (have.has(k) || seen.has(k)) return false
    seen.add(k)
    return true
  })
  const phases = [...new Set([...activePhases, ...template.phases, ...toInsert.map(i => i.phase).filter((p): p is string => !!p)])]
  return { toInsert, phases, skipped: template.items.length - toInsert.length }
}
