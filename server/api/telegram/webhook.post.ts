import { WORKER_BUTTONS, WORKER_KEYBOARD, seasonMessage, todayMessage, workerWelcome } from '~~/shared/utils/harvestBot'

// Вебхук бота: /start <код> — прив'язати чат до акаунту, /stop — відв'язати, /status — що надсилаємо.
// Збирач врожаю (акаунт з harvest_workers.auth_user_id) отримує свої кнопки: QR, «Сьогодні», «Сезон»,
// і підтверджує виплату inline-кнопкою «Отримав» (callback pay:<id>).
// Запит приймається лише з секретом вебхука в заголовку (його знає тільки Telegram).
export default defineEventHandler(async (event) => {
  if (!telegramEnabled() || getHeader(event, 'x-telegram-bot-api-secret-token') !== telegramWebhookSecret()) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  const update = await readBody(event).catch(() => null)
  if (update?.callback_query) return handleCallback(update.callback_query)
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
    const worker = await workerByAuth(supabase, code.user_id)
    if (worker) {
      await sendTelegramMarkup(chatId, workerWelcome(worker.first_name), WORKER_KEYBOARD).catch(e => console.error('[telegram webhook] worker welcome', e?.message ?? e))
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
  const worker = link ? await workerByAuth(supabase, link.user_id) : null
  if (worker) {
    await workerReply(chatId, worker, command === '/qr' ? WORKER_BUTTONS.qr : command === '/today' ? WORKER_BUTTONS.today : command === '/season' ? WORKER_BUTTONS.season : text)
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

/** Відповідь збирачу: QR для зважування, підсумки за день і сезон; інше — підказка з кнопками */
async function workerReply(chatId: number, worker: BotWorker, text: string) {
  const db = serviceClient()
  const send = (html: string) => sendTelegramMarkup(chatId, html, WORKER_KEYBOARD).catch(e => console.error('[harvest bot] reply', e?.message ?? e))
  if (text === WORKER_BUTTONS.qr) {
    const active = (await workerSeasons(db, worker.id)).filter(s => s.status === 'active').slice(0, 3)
    if (!active.length) return send('Зараз немає активного сезону збору. Коли фермер додасть вас у сезон, тут буде ваш QR для зважування.')
    for (const s of active) {
      const caption = `📷 <b>${tgEscape(`${worker.first_name} ${worker.last_name ?? ''}`.trim())}</b>\n${tgEscape(s.variety ? `${s.crop} (${s.variety})` : s.crop)} — покажіть бригадиру для зважування`
      await sendTelegramPhoto(chatId, await qrPng(weighUrl(s.seasonId, worker.id)), caption, WORKER_KEYBOARD)
        .catch(e => console.error('[harvest bot] qr', e?.message ?? e))
    }
    return
  }
  if (text === WORKER_BUTTONS.today) return send(todayMessage(await workerSeasons(db, worker.id)))
  if (text === WORKER_BUTTONS.season) return send(seasonMessage(await workerSeasons(db, worker.id)))
  return send(`Оберіть кнопку внизу: ${WORKER_BUTTONS.qr} — для зважування, ${WORKER_BUTTONS.today} і ${WORKER_BUTTONS.season} — зібране й зароблене. Відключити — /stop.`)
}

/** «Отримав» під повідомленням про виплату: підтвердити можна лише свою виплату, що ще очікує */
async function handleCallback(cq: any) {
  const db = serviceClient()
  const chatId = cq?.message?.chat?.id
  const answer = (text: string) => telegramApi('answerCallbackQuery', { callback_query_id: cq.id, text }).catch(() => {})
  const m = typeof cq?.data === 'string' ? cq.data.match(/^pay:([0-9a-f-]{36})$/) : null
  if (!chatId || !m) { await answer('Невідома дія'); return { ok: true } }

  const { data: link } = await db.from('telegram_links').select('user_id').eq('chat_id', chatId).maybeSingle()
  const worker = link ? await workerByAuth(db, link.user_id) : null
  if (!worker) { await answer('Цей чат не підключений до збирача'); return { ok: true } }

  const { data: paid } = await db.from('harvest_payments').update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', m[1]).eq('worker_id', worker.id).eq('status', 'pending').select('id').maybeSingle()
  await answer(paid ? 'Отримання підтверджено' : 'Ця виплата вже підтверджена')
  if (paid && cq.message?.message_id) {
    await telegramApi('editMessageText', {
      chat_id: chatId, message_id: cq.message.message_id, parse_mode: 'HTML',
      text: `${tgEscape(cq.message.text || 'Виплата')}\n\n✅ Отримання підтверджено`,
    }).catch(() => {})
  }
  return { ok: true }
}
