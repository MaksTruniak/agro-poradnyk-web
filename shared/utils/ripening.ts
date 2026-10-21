// Строк стиглості сорту → орієнтовне вікно збору (середній рік, центр України). Групу стиглості сорту задає адмін
// у довіднику сортів (varieties.ripening); точні дати сорту (harvest_from/harvest_to, mm-dd) — якщо відомі.
// Вікна — орієнтир для планування тари й працівників, а не прогноз: рік, район і догляд зсувають їх на 1–2 тижні.

export type Ripening = 'very_early' | 'early' | 'mid' | 'mid_late' | 'late'

export const RIPENING_LABELS: Record<Ripening, string> = {
  very_early: 'дуже ранній',
  early: 'ранній',
  mid: 'середній',
  mid_late: 'середньопізній',
  late: 'пізній',
}
export const RIPENING_ORDER: Ripening[] = ['very_early', 'early', 'mid', 'mid_late', 'late']

type Window = [string, string] // mm-dd
type CropWindows = Partial<Record<Ripening, Window>>

// Ключ — початок назви культури (нижній регістр)
const WINDOWS: { stem: string; windows: CropWindows }[] = [
  { stem: 'лохин', windows: { very_early: ['06-20', '07-05'], early: ['06-25', '07-15'], mid: ['07-05', '07-30'], mid_late: ['07-15', '08-10'], late: ['07-25', '08-25'] } },
  { stem: 'полуниц', windows: { very_early: ['05-25', '06-10'], early: ['06-01', '06-20'], mid: ['06-08', '06-30'], mid_late: ['06-15', '07-05'], late: ['06-20', '07-10'] } },
  { stem: 'суниц', windows: { very_early: ['05-25', '06-10'], early: ['06-01', '06-20'], mid: ['06-08', '06-30'], mid_late: ['06-15', '07-05'], late: ['06-20', '07-10'] } },
  { stem: 'малин', windows: { early: ['06-20', '07-10'], mid: ['07-01', '07-25'], mid_late: ['07-08', '07-31'], late: ['07-10', '08-05'] } },
  { stem: 'ожин', windows: { early: ['07-05', '07-31'], mid: ['07-20', '08-20'], mid_late: ['07-31', '08-31'], late: ['08-05', '09-15'] } },
  { stem: 'смородин', windows: { early: ['06-20', '07-10'], mid: ['07-01', '07-20'], mid_late: ['07-08', '07-25'], late: ['07-15', '08-05'] } },
  { stem: 'аґрус', windows: { early: ['06-25', '07-10'], mid: ['07-05', '07-25'], late: ['07-15', '08-05'] } },
  { stem: 'агрус', windows: { early: ['06-25', '07-10'], mid: ['07-05', '07-25'], late: ['07-15', '08-05'] } },
  { stem: 'йошт', windows: { mid: ['07-01', '07-25'] } },
  { stem: 'виноград', windows: { very_early: ['07-25', '08-15'], early: ['08-10', '08-31'], mid: ['08-25', '09-20'], mid_late: ['09-10', '10-05'], late: ['09-25', '10-20'] } },
  { stem: 'ябл', windows: { early: ['07-15', '08-20'], mid: ['08-25', '09-25'], mid_late: ['09-10', '10-10'], late: ['09-20', '10-20'] } },
  { stem: 'груш', windows: { early: ['07-20', '08-20'], mid: ['08-25', '09-20'], late: ['09-15', '10-15'] } },
  { stem: 'черешн', windows: { early: ['05-25', '06-10'], mid: ['06-08', '06-25'], late: ['06-20', '07-10'] } },
  { stem: 'вишн', windows: { early: ['06-15', '06-30'], mid: ['06-25', '07-15'], late: ['07-10', '07-31'] } },
  { stem: 'слив', windows: { early: ['07-15', '08-10'], mid: ['08-05', '08-31'], late: ['08-25', '09-25'] } },
  { stem: 'абрикос', windows: { early: ['07-01', '07-15'], mid: ['07-10', '07-31'], late: ['07-25', '08-15'] } },
  { stem: 'персик', windows: { early: ['07-05', '07-31'], mid: ['07-25', '08-25'], late: ['08-20', '09-20'] } },
  { stem: 'нектарин', windows: { early: ['07-05', '07-31'], mid: ['07-25', '08-25'], late: ['08-20', '09-20'] } },
]

const MMDD = /^\d{2}-\d{2}$/

export interface VarietyRipening {
  ripening?: string | null
  harvest_from?: string | null
  harvest_to?: string | null
}

export interface HarvestWindow {
  from: string // yyyy-mm-dd
  to: string
  ripening: Ripening | null
  /** «середній сорт» / «за даними сорту» */
  label: string
}

/** Вікно збору сорту в заданому році або null, якщо даних немає */
export function harvestWindow(cropType: string | null | undefined, v: VarietyRipening | null | undefined, year: number): HarvestWindow | null {
  if (!cropType || !v) return null
  const ripening = (RIPENING_ORDER as string[]).includes(v.ripening ?? '') ? v.ripening as Ripening : null
  if (v.harvest_from && v.harvest_to && MMDD.test(v.harvest_from) && MMDD.test(v.harvest_to)) {
    return { from: `${year}-${v.harvest_from}`, to: `${year}-${v.harvest_to}`, ripening, label: ripening ? `${RIPENING_LABELS[ripening]} сорт` : 'за даними сорту' }
  }
  if (!ripening) return null
  const name = cropType.toLowerCase().trim()
  const w = WINDOWS.find(x => name.startsWith(x.stem))?.windows[ripening]
  return w ? { from: `${year}-${w[0]}`, to: `${year}-${w[1]}`, ripening, label: `${RIPENING_LABELS[ripening]} сорт` } : null
}

/** Чи сорт цієї культури — той самий запис довідника (назви культур у довіднику й каталозі різняться: «Яблука» / «Яблуня») */
export function sameCropFamily(a: string, b: string) {
  const stem = (s: string) => s.toLowerCase().trim().split(/\s+/)[0]!.slice(0, 4)
  return stem(a) === stem(b)
}

/** «05–25.07» або «25.07–10.08» */
export function formatWindow(w: { from: string; to: string }) {
  const d = (iso: string) => iso.slice(8, 10)
  const m = (iso: string) => iso.slice(5, 7)
  return m(w.from) === m(w.to) ? `${d(w.from)}–${d(w.to)}.${m(w.to)}` : `${d(w.from)}.${m(w.from)}–${d(w.to)}.${m(w.to)}`
}

/** Збір скоро (за horizon днів до початку) або вже триває */
export function harvestStatus(w: HarvestWindow, today: string, horizon = 14): 'soon' | 'now' | null {
  if (today > w.to) return null
  if (today >= w.from) return 'now'
  const days = (Date.parse(w.from) - Date.parse(today)) / 86400000
  return days <= horizon ? 'soon' : null
}

/** Запис довідника для сорту насадження (назва сорту — без урахування регістру, культура — за першим словом) */
export function findVariety<T extends { crop_type: string; name: string }>(rows: T[], cropType: string, variety: string | null | undefined): T | null {
  if (!variety) return null
  const v = variety.toLowerCase().trim()
  return rows.find(r => r.name.toLowerCase().trim() === v && sameCropFamily(r.crop_type, cropType)) ?? null
}
