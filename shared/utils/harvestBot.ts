// Тексти Telegram-бота для збирачів врожаю (HTML для parse_mode=HTML). Чисті функції — 1:1 у тестах.

export interface SeasonStats {
  crop: string
  variety: string | null
  pricePerKg: number
  todayKg: number
  todayAmount: number
  seasonKg: number
  seasonAmount: number
  paidConfirmed: number
  paidPending: number
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const fmtKg = (n: number) => `${(Math.round(n * 10) / 10).toLocaleString('uk-UA', { maximumFractionDigits: 1 })} кг`
export const fmtUah = (n: number) => `${Math.round(n).toLocaleString('uk-UA')} грн`
const fmtPrice = (n: number) => `${n.toLocaleString('uk-UA', { maximumFractionDigits: 2 })} грн/кг`
const cropName = (s: { crop: string; variety: string | null }) => esc(s.variety ? `${s.crop} (${s.variety})` : s.crop)

/** Кнопки внизу чату збирача — замість команд */
export const WORKER_BUTTONS = { qr: '📷 Мій QR', today: '📊 Сьогодні', season: '🌿 Сезон' } as const
export const WORKER_KEYBOARD = {
  keyboard: [[{ text: WORKER_BUTTONS.qr }, { text: WORKER_BUTTONS.today }], [{ text: WORKER_BUTTONS.season }]],
  resize_keyboard: true,
  is_persistent: true,
}

export function workerWelcome(firstName: string) {
  return `✅ <b>${esc(firstName)}, Telegram підключено.</b>\n\n`
    + 'Сюди приходитимуть:\n• кожне зважування — кілограми й сума;\n• виплати — з кнопкою «Отримав».\n\n'
    + `${WORKER_BUTTONS.qr} — показати бригадиру для зважування.\n${WORKER_BUTTONS.today} і ${WORKER_BUTTONS.season} — скільки зібрано й зароблено.\n\nВідключити — /stop.`
}

export function weighMessage(s: SeasonStats, weightKg: number, amount: number) {
  return `⚖️ <b>+${fmtKg(weightKg)}</b> · ${cropName(s)} · ${fmtUah(amount)}\n`
    + `Сьогодні: ${fmtKg(s.todayKg)} · ${fmtUah(s.todayAmount)}\n`
    + `За сезон: ${fmtKg(s.seasonKg)} · ${fmtUah(s.seasonAmount)}`
}

export function paymentMessage(s: SeasonStats, amount: number) {
  return `💵 <b>Виплата ${fmtUah(amount)}</b> · ${cropName(s)}\n`
    + 'Якщо отримали гроші — натисніть «Отримав».'
}

export const toPay = (s: SeasonStats) => Math.max(0, s.seasonAmount - s.paidConfirmed - s.paidPending)

export function todayMessage(stats: SeasonStats[]) {
  const active = stats.filter(s => s.todayKg > 0)
  if (!active.length) return '📊 Сьогодні зважувань ще не було.'
  const lines = active.map(s => `• ${cropName(s)}: <b>${fmtKg(s.todayKg)}</b> · ${fmtUah(s.todayAmount)}`)
  const kg = active.reduce((a, s) => a + s.todayKg, 0)
  const sum = active.reduce((a, s) => a + s.todayAmount, 0)
  return `📊 <b>Сьогодні</b>\n${lines.join('\n')}${active.length > 1 ? `\nРазом: <b>${fmtKg(kg)}</b> · ${fmtUah(sum)}` : ''}`
}

export function seasonMessage(stats: SeasonStats[]) {
  if (!stats.length) return '🌿 Ви ще не додані в жоден сезон збору.'
  return stats.map(s => [
    `🌿 <b>${cropName(s)}</b> · ${fmtPrice(s.pricePerKg)}`,
    `Зібрано: <b>${fmtKg(s.seasonKg)}</b> · ${fmtUah(s.seasonAmount)}`,
    `Виплачено: ${fmtUah(s.paidConfirmed)}${s.paidPending ? ` · очікує підтвердження ${fmtUah(s.paidPending)}` : ''}`,
    `До виплати: <b>${fmtUah(toPay(s))}</b>`,
  ].join('\n')).join('\n\n')
}
