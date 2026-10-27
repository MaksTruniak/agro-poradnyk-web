import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

// Telegram-бот @agroprostir_bot. Токен — TELEGRAM_BOT_TOKEN (секрет у Vercel); без нього бот вимкнений.
export const TELEGRAM_BOT = 'agroprostir_bot'
export const SITE_URL = 'https://agroprostir.com.ua'

export const telegramEnabled = () => !!process.env.TELEGRAM_BOT_TOKEN

/** Секрет вебхука (заголовок X-Telegram-Bot-Api-Secret-Token) — похідний від токена, окрема змінна не потрібна */
export const telegramWebhookSecret = () =>
  createHash('sha256').update(`${process.env.TELEGRAM_BOT_TOKEN}:webhook`).digest('hex').slice(0, 48)

export const tgEscape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function telegramApi<T = any>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await $fetch<{ ok: boolean; result: T; description?: string }>(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`,
    { method: 'POST', body, ignoreResponseError: true },
  )
  if (!res?.ok) {
    const err: any = new Error(`Telegram ${method}: ${res?.description ?? 'error'}`)
    err.telegram = res
    throw err
  }
  return res.result
}

/** Повідомлення в чат (HTML). Кнопка-посилання — опційно. */
export function sendTelegram(chatId: number | string, html: string, button?: { text: string; url: string }) {
  return telegramApi('sendMessage', {
    chat_id: chatId,
    text: html,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(button ? { reply_markup: { inline_keyboard: [[button]] } } : {}),
  })
}

type InlineButton = { text: string; url: string } | { text: string; callback_data: string }

/** Повідомлення з довільною клавіатурою (inline-кнопки з callback або постійна клавіатура внизу чату) */
export function sendTelegramMarkup(chatId: number | string, html: string, replyMarkup: Record<string, unknown>) {
  return telegramApi('sendMessage', { chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: replyMarkup })
}

export const inlineKeyboard = (rows: InlineButton[][]) => ({ inline_keyboard: rows })

/** Картинка (PNG) з підписом — multipart, бо JSON не передає файл */
export async function sendTelegramPhoto(chatId: number | string, png: Buffer, caption: string, replyMarkup?: Record<string, unknown>) {
  const form = new FormData()
  form.append('chat_id', String(chatId))
  form.append('caption', caption)
  form.append('parse_mode', 'HTML')
  if (replyMarkup) form.append('reply_markup', JSON.stringify(replyMarkup))
  form.append('photo', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'qr.png')
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`, { method: 'POST', body: form })
  const json: any = await res.json().catch(() => null)
  if (!json?.ok) {
    const err: any = new Error(`Telegram sendPhoto: ${json?.description ?? res.status}`)
    err.telegram = json
    throw err
  }
  return json.result
}

/**
 * Вебхук бота має вказувати на цей сайт і приймати повідомлення й натискання inline-кнопок.
 * Лише на продакшні; помилки лише в лог (не заважаємо отримати посилання).
 */
export async function ensureTelegramWebhook() {
  if (process.env.VERCEL_ENV !== 'production') return
  const url = `${SITE_URL}/api/telegram/webhook`
  try {
    const info = await telegramApi<{ url: string; allowed_updates?: string[] }>('getWebhookInfo', {})
    if (info.url !== url || !info.allowed_updates?.includes('callback_query')) {
      await telegramApi('setWebhook', { url, secret_token: telegramWebhookSecret(), allowed_updates: ['message', 'callback_query'] })
      await telegramApi('setMyCommands', { commands: [
        { command: 'status', description: 'Що надсилає бот' },
        { command: 'stop', description: 'Відключити акаунт' },
      ] })
    }
  } catch (e) {
    console.error('[telegram] webhook setup', e)
  }
}

/** null — особисте повідомлення (акт огляду від агронома), без перемикача в налаштуваннях */
export type TelegramKind = 'week_plan' | 'frost' | 'reminders' | null

/**
 * Надіслати користувачу в Telegram, якщо чат прив'язано і цей вид не вимкнено.
 * Якщо користувач заблокував бота — відв'язуємо чат. Повертає true, якщо надіслано.
 */
export async function notifyTelegram(
  supabase: SupabaseClient, userId: string, kind: TelegramKind, html: string, button?: { text: string; url: string },
) {
  if (!telegramEnabled()) return false
  const [{ data: link }, { data: settings }] = await Promise.all([
    supabase.from('telegram_links').select('chat_id').eq('user_id', userId).maybeSingle(),
    supabase.from('notification_settings').select('tg_week_plan, tg_frost, tg_reminders').eq('user_id', userId).maybeSingle(),
  ])
  if (!link?.chat_id) return false
  if (kind && (settings as any)?.[`tg_${kind}`] === false) return false
  try {
    await sendTelegram(link.chat_id, html, button)
    return true
  } catch (e: any) {
    if (e?.telegram?.error_code === 403) await supabase.from('telegram_links').delete().eq('user_id', userId)
    else console.error('[telegram]', userId, e?.message ?? e)
    return false
  }
}
