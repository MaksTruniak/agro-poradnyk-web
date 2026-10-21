// Вебхук бота: /start <код> — прив'язати чат до акаунту, /stop — відв'язати, /status — що надсилаємо.
// Запит приймається лише з секретом вебхука в заголовку (його знає тільки Telegram).
export default defineEventHandler(async (event) => {
  if (!telegramEnabled() || getHeader(event, 'x-telegram-bot-api-secret-token') !== telegramWebhookSecret()) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  const update = await readBody(event).catch(() => null)
  const msg = update?.message
  const chatId = msg?.chat?.id
  const text: string = typeof msg?.text === 'string' ? msg.text.trim() : ''
  if (!chatId || msg.chat.type !== 'private' || !text) return { ok: true }

  const supabase = serviceClient()
  const reply = (html: string, button?: { text: string; url: string }) =>
    sendTelegram(chatId, html, button).catch(e => console.error('[telegram webhook] reply', e?.message ?? e))
  const [command, arg] = text.split(/\s+/, 2)

  if (command === '/start' && arg) {
    const { data: code } = await supabase.from('telegram_link_codes').select('user_id, expires_at').eq('code', arg).maybeSingle()
    if (!code || new Date(code.expires_at) < new Date()) {
      await reply('Посилання застаріло. Відкрийте <b>Налаштування → Telegram</b> на сайті й натисніть «Підключити Telegram» ще раз.',
        { text: 'Налаштування', url: `${SITE_URL}/dashboard/settings#telegram` })
      return { ok: true }
    }
    await supabase.from('telegram_link_codes').delete().eq('code', arg)
    // Один чат — один акаунт: якщо цей чат був прив'язаний до іншого акаунту, переносимо
    await supabase.from('telegram_links').delete().eq('chat_id', chatId)
    const { error } = await supabase.from('telegram_links').upsert({
      user_id: code.user_id, chat_id: chatId, username: msg.from?.username?.slice(0, 64) ?? null, linked_at: new Date().toISOString(),
    })
    if (error) {
      console.error('[telegram webhook] link', error)
      await reply('Не вдалося підключити. Спробуйте ще раз за хвилину.')
      return { ok: true }
    }
    await reply(
      '✅ <b>Telegram підключено до АгроПростору.</b>\n\nСюди приходитимуть:\n• план на тиждень — щопонеділка;\n• попередження про сильний заморозок;\n• нагадування на день.\n\nЩо саме надсилати — у налаштуваннях на сайті. Відключити — /stop.',
      { text: 'План на тиждень', url: `${SITE_URL}/dashboard/week` },
    )
    return { ok: true }
  }

  const { data: link } = await supabase.from('telegram_links').select('user_id').eq('chat_id', chatId).maybeSingle()
  if (command === '/stop') {
    if (link) await supabase.from('telegram_links').delete().eq('chat_id', chatId)
    await reply(link ? 'Акаунт відключено — більше нічого не надсилатимемо. Підключити знову можна в налаштуваннях на сайті.' : 'Цей чат не підключений до акаунту.')
    return { ok: true }
  }
  if (link) {
    await reply('Бот надсилає план на тиждень, попередження про заморозки й нагадування. Налаштувати — на сайті, відключити — /stop.',
      { text: 'Налаштування', url: `${SITE_URL}/dashboard/settings#telegram` })
  } else {
    await reply('Щоб отримувати план робіт і попередження, підключіть бота в <b>Налаштуваннях</b> на сайті АгроПростір.',
      { text: 'Відкрити налаштування', url: `${SITE_URL}/dashboard/settings#telegram` })
  }
  return { ok: true }
})
