// Строк очікування до збору: після обробки препаратом збирати можна не раніше done_at + waiting_days.

import { addDays } from './weatherRisks'

export interface WaitingTreatment {
  product_name: string
  status?: string | null
  done_at?: string | null
  waiting_days?: number | null
}

/** Фази, на яких урожай уже збирають або от-от почнуть */
export const HARVEST_PHASES = ['Дозрівання', 'Збір урожаю', 'Технічна стиглість', 'Початок достигання (м\'якнення ягід)']

/** З якого дня можна збирати після обробки; null — не виконана або строку немає */
export const harvestFrom = (t: WaitingTreatment) =>
  t.status === 'done' && t.done_at && t.waiting_days ? addDays(t.done_at.slice(0, 10), t.waiting_days) : null

/** Найпізніша дата, з якої дозволено збір, серед обробок, чий строк ще не минув (`today` — yyyy-mm-dd) */
export function activeWaiting(treatments: WaitingTreatment[], today: string) {
  let best: { from: string; product: string } | null = null
  for (const t of treatments) {
    const from = harvestFrom(t)
    if (from && from > today && (!best || from > best.from)) best = { from, product: t.product_name }
  }
  return best
}
