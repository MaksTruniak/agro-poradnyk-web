import { createHash } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { asUser, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'
import { seasonMessage, todayMessage, toPay, weighMessage, type SeasonStats } from '../../shared/utils/harvestBot'

// Telegram-бот збирача: підключення без пароля, повідомлення про зважування/виплату (один раз), «Отримав» кнопкою.
// Telegram не викликається по-справжньому: дев-сервер і тест запускаються з однаковим TELEGRAM_BOT_TOKEN
// (можна фальшивим) — вебхук приймаємо з тим самим секретом, а відповіді бота просто не доходять.
// ПИШЕ в базу (збирач, сезон, зважування, виплати, прив'язка чату) — лише з E2E_WRITE=1; усе прибирається.

const TAG = `E2E бот ${Date.now()}`
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const SECRET = { 'x-telegram-bot-api-secret-token': createHash('sha256').update(`${TOKEN}:webhook`).digest('hex').slice(0, 48) }

const stats = (o: Partial<SeasonStats> = {}): SeasonStats => ({
  crop: 'Лохина', variety: 'Блюкроп', pricePerKg: 20, todayKg: 0, todayAmount: 0, seasonKg: 0, seasonAmount: 0, paidConfirmed: 0, paidPending: 0, ...o,
})

test('тексти бота: зважування, сьогодні, сезон, до виплати', () => {
  // Тисячі в uk-UA розділяє нерозривний пробіл — у перевірці зводимо до звичайного
  const sp = (t: string) => t.replace(/\s/g, ' ')
  const s = stats({ todayKg: 48, todayAmount: 960, seasonKg: 310.5, seasonAmount: 6210, paidConfirmed: 3000, paidPending: 1000 })
  expect(sp(weighMessage(s, 12.4, 248))).toContain('+12,4 кг')
  expect(sp(weighMessage(s, 12.4, 248))).toContain('Сьогодні: 48 кг · 960 грн')
  expect(todayMessage([stats()])).toContain('ще не було')
  expect(toPay(s)).toBe(2210)
  expect(sp(seasonMessage([s]))).toContain('До виплати: <b>2 210 грн</b>')
  expect(seasonMessage([s])).toContain('Лохина (Блюкроп)')
  expect(weighMessage(stats({ crop: '<b>' }), 1, 1)).toContain('&lt;b&gt;')
})

test.describe('Telegram-бот збирача', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює збирача й сезон)')
  test.skip(!hasAccount('farmer') || !hasAccount('buyer'), 'потрібні E2E_FARMER_* і E2E_BUYER_*')
  test.skip(!TOKEN, 'потрібен TELEGRAM_BOT_TOKEN (той самий, що в дев-сервера; можна фальшивий)')
  test.describe.configure({ mode: 'serial' })

  const chatId = 900_000_000 + Math.floor(Math.random() * 1e6)
  const strangerChat = chatId + 1
  let worker: { id: string; auth_user_id: string } | null = null
  let seasonId = ''

  test.afterAll(async () => {
    const admin = serviceClient()
    await admin.from('telegram_links').delete().in('chat_id', [chatId, strangerChat])
    if (worker) {
      await admin.from('telegram_link_codes').delete().eq('user_id', worker.auth_user_id)
      await admin.from('harvest_payments').delete().eq('worker_id', worker.id)
      await admin.from('harvest_records').delete().eq('worker_id', worker.id)
      await admin.from('harvest_season_workers').delete().eq('worker_id', worker.id)
      await admin.from('harvest_workers').delete().eq('id', worker.id)
      await admin.auth.admin.deleteUser(worker.auth_user_id)
    }
    if (seasonId) await admin.from('harvest_seasons').delete().eq('id', seasonId)
  })

  test('підключення без пароля, зважування й виплата один раз, «Отримав» у боті', async ({ request }) => {
    const farmer = await asUser('farmer')
    const stranger = await asUser('buyer')
    const admin = serviceClient()
    const auth = (t: string) => ({ Authorization: `Bearer ${t}` })
    const hook = (body: unknown) => request.post('/api/telegram/webhook', { headers: SECRET, data: body })
    const say = (chat: number, text: string) => hook({ message: { chat: { id: chat, type: 'private' }, from: { username: 'e2e' }, text } })

    // Збирач і сезон фермера
    const created = await request.post('/api/harvest/create-worker', {
      headers: auth(farmer.token),
      data: { first_name: 'E2E', last_name: TAG, phone: `+38099${String(Date.now()).slice(-7)}`, password: 'TestPass1!' },
    })
    expect(created.status()).toBe(200)
    worker = (await created.json()).worker ?? (await created.json())
    expect(worker!.auth_user_id).toBeTruthy()
    const { data: season } = await admin.from('harvest_seasons').insert({ owner_id: farmer.userId, crop: 'Лохина', variety: TAG, price_per_kg: 20, status: 'active' }).select('id').single()
    seasonId = season!.id
    await admin.from('harvest_season_workers').insert({ season_id: seasonId, worker_id: worker!.id })

    // Фермер бачить стан і отримує посилання; чужий — ні
    const status = await (await request.post('/api/harvest/worker-telegram', { headers: auth(farmer.token), data: { workerId: worker!.id } })).json()
    expect(status).toMatchObject({ linked: false, enabled: true })
    expect((await request.post('/api/harvest/worker-telegram', { headers: auth(stranger.token), data: { workerId: worker!.id, link: true } })).status()).toBe(404)
    const { url } = await (await request.post('/api/harvest/worker-telegram', { headers: auth(farmer.token), data: { workerId: worker!.id, link: true } })).json()
    const code = String(url).split('start=')[1]
    expect(url).toMatch(/^https:\/\/t\.me\/agroprostir_bot\?start=/)

    // Без секрету вебхук не приймає; /start <код> прив'язує чат саме до збирача
    expect((await request.post('/api/telegram/webhook', { data: { message: { chat: { id: chatId, type: 'private' }, text: `/start ${code}` } } })).status()).toBe(401)
    expect((await say(chatId, `/start ${code}`)).status()).toBe(200)
    const { data: link } = await admin.from('telegram_links').select('user_id').eq('chat_id', chatId).single()
    expect(link!.user_id).toBe(worker!.auth_user_id)
    expect((await (await request.post('/api/harvest/worker-telegram', { headers: auth(farmer.token), data: { workerId: worker!.id } })).json()).linked).toBe(true)
    // Код одноразовий
    expect((await admin.from('telegram_link_codes').select('code').eq('code', code)).data).toEqual([])

    // Кнопки збирача відповідають без помилок
    for (const t of ['📷 Мій QR', '📊 Сьогодні', '🌿 Сезон', 'привіт']) expect((await say(chatId, t)).status()).toBe(200)

    // Зважування: повідомлення один раз, чужому — 404
    const { data: rec } = await admin.from('harvest_records').insert({ worker_id: worker!.id, season_id: seasonId, weight_kg: 12.4, price_per_kg: 20, recorded_by: farmer.userId }).select('id').single()
    expect((await request.post('/api/harvest/notify', { headers: auth(stranger.token), data: { recordId: rec!.id } })).status()).toBe(404)
    expect((await request.post('/api/harvest/notify', { headers: auth(farmer.token), data: { recordId: rec!.id } })).status()).toBe(200)
    const { data: r1 } = await admin.from('harvest_records').select('tg_notified_at').eq('id', rec!.id).single()
    expect(r1!.tg_notified_at, 'зважування не позначено як надіслане').toBeTruthy()
    await request.post('/api/harvest/notify', { headers: auth(farmer.token), data: { recordId: rec!.id } })
    const { data: r2 } = await admin.from('harvest_records').select('tg_notified_at').eq('id', rec!.id).single()
    expect(r2!.tg_notified_at, 'повідомлення надіслано вдруге').toBe(r1!.tg_notified_at)

    // Виплата: «Отримав» підтверджує лише з чату цього збирача
    const { data: pay } = await admin.from('harvest_payments').insert({ worker_id: worker!.id, season_id: seasonId, amount: 200, status: 'pending' }).select('id').single()
    expect((await request.post('/api/harvest/notify', { headers: auth(farmer.token), data: { paymentId: pay!.id } })).status()).toBe(200)
    const press = (chat: number) => hook({ callback_query: { id: 'e2e', data: `pay:${pay!.id}`, message: { chat: { id: chat }, message_id: 1, text: 'Виплата' } } })
    expect((await press(strangerChat)).status()).toBe(200)
    expect((await admin.from('harvest_payments').select('status').eq('id', pay!.id).single()).data!.status, 'підтвердив чужий чат').toBe('pending')
    expect((await press(chatId)).status()).toBe(200)
    const { data: confirmed } = await admin.from('harvest_payments').select('status, confirmed_at').eq('id', pay!.id).single()
    expect(confirmed).toMatchObject({ status: 'confirmed' })
    expect(confirmed!.confirmed_at).toBeTruthy()

    // /stop — відключити
    expect((await say(chatId, '/stop')).status()).toBe(200)
    expect((await admin.from('telegram_links').select('user_id').eq('chat_id', chatId)).data).toEqual([])
  })

  test('картка збирача: кнопка «Підключити Telegram» дає посилання й QR', async ({ page }) => {
    test.skip(!worker, 'збирача не створено')
    const errors = collectErrors(page)
    await login(page, 'farmer')
    await page.goto(`/dashboard/harvest/workers/${worker!.id}`)
    await page.locator('[data-test="worker-telegram-link"]').click({ timeout: 15000 })
    await expect(page.locator('[data-test="worker-telegram-url"]')).toContainText('t.me/agroprostir_bot?start=')
    await expectNoErrors(errors, 'картці збирача')
  })
})
