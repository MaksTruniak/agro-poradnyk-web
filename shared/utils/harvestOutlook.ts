// «Скоро урожай» для заготівельника: насадження, які фермери показують у каталозі, з орієнтовним вікном збору
// за строком стиглості сорту. Обсяг — лише за плановою врожайністю, яку фермер вказав сам (т/га × площа).

import { harvestWindow, sameCropFamily, type HarvestWindow, type VarietyRipening } from './ripening'
import { plantingStage } from './plantingStage'

export interface OutlookCrop {
  id: string
  farm_id: string
  crop_type: string
  variety: string | null
  area_ha: number | null
  planting_year: number | null
  planned_yield_t: number | null
}

export interface OutlookItem {
  crop: OutlookCrop
  window: HarvestWindow
  /** днів до початку збору (≤ 0 — збір триває) */
  inDays: number
  /** очікуваний обсяг, т (null — фермер не вказав плановий урожай) */
  tons: number | null
}

const days = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86400000)

/**
 * Насадження з вікном збору, що ще не минуло, у межах horizon днів від сьогодні.
 * Молоді насадження без урожаю пропускаються.
 */
export function harvestOutlook(
  crops: OutlookCrop[],
  opts: { today: string; horizon: number; groupOf: (cropType: string) => string | null; varietyOf: (c: OutlookCrop) => VarietyRipening | null },
): OutlookItem[] {
  const year = Number(opts.today.slice(0, 4))
  const out: OutlookItem[] = []
  for (const c of crops) {
    const stage = plantingStage(opts.groupOf(c.crop_type), c.planting_year)
    if (stage && !stage.fruiting) continue
    // Цьогорічне вікно; якщо вже минуло — наступного року
    let w = harvestWindow(c.crop_type, opts.varietyOf(c), year)
    if (w && w.to < opts.today) w = harvestWindow(c.crop_type, opts.varietyOf(c), year + 1)
    if (!w) continue
    const inDays = days(opts.today, w.from)
    if (inDays > opts.horizon) continue
    const tons = c.planned_yield_t && c.area_ha ? Math.round(c.planned_yield_t * c.area_ha * 10) / 10 : null
    out.push({ crop: c, window: w, inDays, tons })
  }
  return out.sort((a, b) => a.window.from.localeCompare(b.window.from) || (b.tons ?? 0) - (a.tons ?? 0))
}

/** Чи запит заготівельника («Лохина», «смородина») стосується культури фермера */
export const demandMatches = (buyerCrop: string, cropType: string) => {
  const b = buyerCrop.toLowerCase().trim(), c = cropType.toLowerCase().trim()
  return !!b && (c.startsWith(b) || b.startsWith(c) || sameCropFamily(b, c))
}

/** «через 12 днів», «збір триває», «завтра» */
export function whenLabel(inDays: number) {
  if (inDays <= 0) return 'збір триває'
  if (inDays === 1) return 'завтра'
  const m10 = inDays % 10, m100 = inDays % 100
  const word = m10 === 1 && m100 !== 11 ? 'день' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'дні' : 'днів'
  return `через ${inDays} ${word}`
}
