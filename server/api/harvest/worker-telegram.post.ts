import { randomBytes } from 'node:crypto'

// Telegram збирача — для фермера: { workerId } → чи підключено; з { link: true } — ще й посилання
// t.me/agroprostir_bot?start=<код на 15 хвилин>, яке збирач відкриває зі свого телефону (без пароля).
export default defineEventHandler(async (event) => {
  const { user, supabase } = await requireUser(event)
  const body = await readBody(event).catch(() => ({}))
  const workerId = typeof body?.workerId === 'string' && /^[0-9a-f-]{36}$/.test(body.workerId) ? body.workerId : null
  if (!workerId) throw createError({ statusCode: 400, message: 'workerId' })

  const { data: worker } = await supabase.from('harvest_workers').select('id, owner_id, auth_user_id').eq('id', workerId).maybeSingle()
  if (!worker || !(await canManageWorkers(supabase, user.id, worker.owner_id))) throw createError({ statusCode: 404, message: 'Збирача не знайдено' })
  if (!worker.auth_user_id) throw createError({ statusCode: 400, message: 'У збирача немає входу — створіть його заново на сторінці збору' })

  const { data: link } = await supabase.from('telegram_links').select('chat_id').eq('user_id', worker.auth_user_id).maybeSingle()
  if (!body?.link) return { linked: !!link, enabled: telegramEnabled() }
  if (!telegramEnabled()) throw createError({ statusCode: 503, message: 'Telegram-бот ще не налаштований' })

  await supabase.from('telegram_link_codes').delete().or(`user_id.eq.${worker.auth_user_id},expires_at.lt.${new Date().toISOString()}`)
  const code = randomBytes(18).toString('base64url')
  const { error } = await supabase.from('telegram_link_codes').insert({ code, user_id: worker.auth_user_id })
  if (error) throw createError({ statusCode: 500, message: error.message })
  await ensureTelegramWebhook()
  return { linked: !!link, enabled: true, url: `https://t.me/${TELEGRAM_BOT}?start=${code}` }
})
