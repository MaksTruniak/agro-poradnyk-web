// Паспорт партії в угоді: чи дотримано строків очікування препаратів до дати відвантаження.

import { addDays } from './weatherRisks'

export interface PassportTreatment {
  date: string
  product_name: string
  type: string | null
  dosage?: string | null
  phase?: string | null
  waiting_days: number | null
  source: 'techcard' | 'journal'
}

/** Обробки препаратами, для яких має бути строк очікування (не підживлення, полив тощо) */
export const needsWaiting = (t: Pick<PassportTreatment, 'type'>) => !t.type || t.type === 'захист' || t.type === 'обробка'

/** З якого дня можна збирати/відвантажувати після обробки; null — строку немає */
export const passportHarvestFrom = (t: PassportTreatment) =>
  t.waiting_days ? addDays(t.date.slice(0, 10), t.waiting_days) : null

export interface WaitingCheck {
  /** ok — усі строки минули до `on`; violated — є обробка, строк якої ще не минув; none — обробок препаратами немає */
  status: 'ok' | 'violated' | 'none'
  /** Найпізніша дата, з якої дозволено збір, і препарат */
  latest: { from: string; product: string } | null
  /** Обробки препаратами без вказаного строку очікування */
  unknown: number
}

/** Перевірка строків очікування на дату `on` (yyyy-mm-dd) — дату відвантаження або сьогодні */
export function waitingCheck(treatments: PassportTreatment[], on: string): WaitingCheck {
  const chem = treatments.filter(t => needsWaiting(t) && t.date.slice(0, 10) <= on)
  let latest: WaitingCheck['latest'] = null
  for (const t of chem) {
    const from = passportHarvestFrom(t)
    if (from && (!latest || from > latest.from)) latest = { from, product: t.product_name }
  }
  const unknown = chem.filter(t => t.waiting_days == null).length
  if (!chem.length) return { status: 'none', latest: null, unknown: 0 }
  return { status: latest && latest.from > on ? 'violated' : 'ok', latest, unknown }
}
