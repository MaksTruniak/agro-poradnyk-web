// Поради на цей час для плану на тиждень: опубліковані поради за фенофазою (phase_tips)
// і агрокалендар місяця (agro_calendar). Однакова порада для кількох насаджень однієї культури — один раз.

import { tipFitsStage, type PlantingStageInfo } from './plantingStage'

export interface TipCrop {
  id: string
  farm_id: string
  crop_type: string
  group: string | null
  /** поточна фаза: відмічена або орієнтовна за сумою температур */
  phase: string | null
  stage: PlantingStageInfo | null
}

export interface SeasonTip {
  /** унікальний id у списку */
  id: string
  /** id у phase_tips / agro_calendar (для пояснення AI — лише agro_calendar) */
  tipId: string
  source: 'phase' | 'calendar'
  title: string
  description: string
  category: string
  urgency: 'high' | 'medium' | 'low' | string
  crop_type: string
  phase_key?: string
  cropIds: string[]
  farmIds: string[]
}

/**
 * Чи підходить культура з агрокалендаря культурі фермера. «Смородина» підходить «Смородині чорній»,
 * а «Смородина червона» — лише «Смородині червоній…».
 */
export function calendarCropMatches(farmerCrop: string, tipCrop: string) {
  const c = farmerCrop.toLowerCase().trim()
  const t = tipCrop.toLowerCase().trim()
  return !!t && (c === t || c.startsWith(t))
}

const add = (out: SeasonTip[], tip: Omit<SeasonTip, 'cropIds' | 'farmIds'>, crop: TipCrop) => {
  const same = out.find(o => o.id === tip.id)
  if (same) {
    if (!same.cropIds.includes(crop.id)) same.cropIds.push(crop.id)
    if (!same.farmIds.includes(crop.farm_id)) same.farmIds.push(crop.farm_id)
  } else {
    out.push({ ...tip, cropIds: [crop.id], farmIds: [crop.farm_id] })
  }
}

export function pickPhaseTips(crops: TipCrop[], tips: any[]): SeasonTip[] {
  const out: SeasonTip[] = []
  for (const c of crops) {
    if (!c.phase || !c.group) continue
    for (const t of tips) {
      if (t.crop_group !== c.group || t.phase_key !== c.phase || !tipFitsStage(t.stages, c.stage)) continue
      add(out, {
        id: `phase:${t.id}:${c.crop_type}`, tipId: t.id, source: 'phase', title: t.title, description: t.description ?? '',
        category: t.category, urgency: t.urgency, crop_type: c.crop_type, phase_key: c.phase,
      }, c)
    }
  }
  return out
}

export function pickCalendarTips(crops: TipCrop[], tips: any[]): SeasonTip[] {
  const out: SeasonTip[] = []
  for (const c of crops) {
    for (const t of tips) {
      if (!t.crop_type || !calendarCropMatches(c.crop_type, t.crop_type)) continue
      add(out, {
        id: `calendar:${t.id}`, tipId: t.id, source: 'calendar', title: t.title, description: t.description ?? '',
        category: t.category, urgency: t.urgency, crop_type: t.crop_type,
      }, c)
    }
  }
  return out
}

const RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }

/** Спершу поради за фазою, всередині — за важливістю */
export function seasonTips(crops: TipCrop[], phaseTips: any[], calendarTips: any[]): SeasonTip[] {
  const byUrgency = (a: SeasonTip, b: SeasonTip) => (RANK[a.urgency] ?? 1) - (RANK[b.urgency] ?? 1)
  return [...pickPhaseTips(crops, phaseTips).sort(byUrgency), ...pickCalendarTips(crops, calendarTips).sort(byUrgency)]
}

/** Тип нагадування за категорією поради */
export const TIP_REMINDER_TYPE: Record<string, string> = {
  irrigation: 'полив', harvest: 'збір', nutrition: 'підживлення', pest: 'обробка', disease: 'обробка',
}
