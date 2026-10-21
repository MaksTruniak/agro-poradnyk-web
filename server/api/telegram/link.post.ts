import { randomBytes } from 'node:crypto'

// Посилання для прив'язки Telegram: t.me/agroprostir_bot?start=<одноразовий код на 15 хвилин>.
// Заодно (лише на продакшні) перевіряє, що вебхук бота вказує на цей сайт.
export default defineEventHandler(async (event) => {
  const { user, supabase } = await requireUser(event)
  if (!telegramEnabled()) throw createError({ statusCode: 503, message: 'Telegram-бот ще не налаштований' })

  await supabase.from('telegram_link_codes').delete().or(`user_id.eq.${user.id},expires_at.lt.${new Date().toISOString()}`)
  const code = randomBytes(18).toString('base64url')
  const { error } = await supabase.from('telegram_link_codes').insert({ code, user_id: user.id })
  if (error) throw createError({ statusCode: 500, message: error.message })

  if (process.env.VERCEL_ENV === 'production') {
    const url = `${SITE_URL}/api/telegram/webhook`
    try {
      const info = await telegramApi<{ url: string }>('getWebhookInfo', {})
      if (info.url !== url) {
        await telegramApi('setWebhook', { url, secret_token: telegramWebhookSecret(), allowed_updates: ['message'] })
        await telegramApi('setMyCommands', { commands: [
          { command: 'status', description: 'Що надсилає бот' },
          { command: 'stop', description: 'Відключити акаунт' },
        ] })
      }
    } catch (e) {
      console.error('[telegram] webhook setup', e)
    }
  }

  return { url: `https://t.me/${TELEGRAM_BOT}?start=${code}` }
})
