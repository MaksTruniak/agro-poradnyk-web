import { createHash } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { asUser, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Прив'язка Telegram-бота: одноразовий код → /start у вебхуку → чат прив'язаний. Чужий чат не підставити.
// Повний сценарій — лише з TELEGRAM_BOT_TOKEN у .env (секрет вебхука похідний від токена).
const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const webhookSecret = () => createHash('sha256').update(`${TOKEN}:webhook`).digest('hex').slice(0, 48)

test.describe('Telegram', () => {
  test.skip(!hasAccount('farmer') || !process.env.E2E_WRITE, 'потрібен фермер і E2E_WRITE=1')

  test('вебхук без секрету й прямий запис прив’язки — заборонені', async ({ request }) => {
    const farmer = await asUser('farmer')
    const hook = await request.post('/api/telegram/webhook', { data: { message: { chat: { id: 1, type: 'private' }, text: '/start x' } } })
    expect(hook.status()).toBe(401)
    const ins = await farmer.client.from('telegram_links').insert({ user_id: farmer.userId, chat_id: 123456789 })
    expect(ins.error, 'клієнт сам прив’язав чат').not.toBeNull()
    const codes = await farmer.client.from('telegram_link_codes').select('code')
    expect(codes.data ?? [], 'клієнт бачить коди').toEqual([])
    const unauth = await request.post('/api/telegram/link')
    expect(unauth.status()).toBe(401)
  })

  test('підключення через /start і відключення в налаштуваннях', async ({ page, context }) => {
    test.skip(!TOKEN, 'потрібен TELEGRAM_BOT_TOKEN у .env')
    const farmer = await asUser('farmer')
    const admin = serviceClient()
    const chatId = 900_000_000 + Math.floor(Math.random() * 1_000_000)
    const { data: before } = await admin.from('telegram_links').select('*').eq('user_id', farmer.userId).maybeSingle()
    try {
      const errors = collectErrors(page)
      await login(page, 'farmer')
      await page.goto('/dashboard/settings#telegram')
      if (before) await page.getByTestId('tg-unlink').click()
      // Посилання на бота відкривається в новій вкладці — перехоплюємо, у Telegram не йдемо
      await context.route('https://t.me/**', route => route.fulfill({ status: 200, body: 'ok' }))
      const [popup] = await Promise.all([context.waitForEvent('page'), page.getByTestId('tg-link').click()])
      await popup.waitForURL(/t\.me\/agroprostir_bot\?start=/)
      const code = new URL(popup.url()).searchParams.get('start')!
      await popup.close()
      await expect(page.getByText('Чекаємо підтвердження в Telegram…')).toBeVisible()

      const send = (text: string, secret = webhookSecret()) => page.request.post('/api/telegram/webhook', {
        headers: { 'x-telegram-bot-api-secret-token': secret },
        data: { update_id: 1, message: { message_id: 1, chat: { id: chatId, type: 'private' }, from: { id: chatId, username: 'e2e_tester' }, text } },
      })
      expect((await send(`/start ${code}`, 'wrong')).status()).toBe(401)
      expect((await send('/start неправильнийкод')).status()).toBe(200)
      expect((await admin.from('telegram_links').select('user_id').eq('chat_id', chatId)).data).toEqual([])

      expect((await send(`/start ${code}`)).status()).toBe(200)
      expect((await admin.from('telegram_links').select('user_id, username').eq('chat_id', chatId)).data)
        .toEqual([{ user_id: farmer.userId, username: 'e2e_tester' }])
      // Код одноразовий
      expect((await admin.from('telegram_link_codes').select('code').eq('code', code)).data).toEqual([])

      await expect(page.getByText(/Підключено — @e2e_tester/)).toBeVisible({ timeout: 10000 })
      await page.getByTestId('tg-tg_frost').uncheck()
      await expect.poll(async () => (await admin.from('notification_settings').select('tg_frost').eq('user_id', farmer.userId).maybeSingle()).data)
        .toEqual({ tg_frost: false })

      await page.getByTestId('tg-unlink').click()
      await expect(page.getByTestId('tg-link')).toBeVisible()
      expect((await admin.from('telegram_links').select('user_id').eq('user_id', farmer.userId)).data).toEqual([])
      await expectNoErrors(errors, 'налаштуваннях Telegram')
    } finally {
      await admin.from('telegram_links').delete().eq('chat_id', chatId)
      await admin.from('telegram_link_codes').delete().eq('user_id', farmer.userId)
      await admin.from('notification_settings').update({ tg_frost: true }).eq('user_id', farmer.userId)
      if (before) await admin.from('telegram_links').upsert(before)
    }
  })
})
