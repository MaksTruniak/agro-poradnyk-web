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
