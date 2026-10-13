import { test, expect } from '@playwright/test'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Чати фермер ↔ агроном: автор повідомлення, чужі повідомлення, учасники чату, непрочитані, листування через сайт.
// ПИШЕ в базу, тому лише з E2E_WRITE=1; прибирається сервісним ключем. Потрібні міграції 20261008_chats_protect.sql і 20261013_chat_free_limit.sql.

const TAG = `E2E ${Date.now()}`

test.describe('Чати', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('agronomist'), 'потрібні E2E_FARMER_* і E2E_AGRONOMIST_*')
  test.describe.configure({ mode: 'serial' })

  let chatId = ''

  test.afterAll(async () => {
    const admin = serviceClient()
    if (chatId) {
      await admin.from('messages').delete().eq('chat_id', chatId)
      await admin.from('chats').delete().eq('id', chatId)
    }
    const farmer = await asUser('farmer')
    await admin.from('chats').delete().eq('farmer_id', farmer.userId).eq('agronomist_id', farmer.userId)
  })

  test('правила бази: автор, чужі повідомлення, учасники', async () => {
    const farmer = await asUser('farmer')
    const agronomist = await asUser('agronomist')

    const { data: chat, error } = await farmer.client.from('chats')
      .insert({ farmer_id: farmer.userId, agronomist_id: agronomist.userId, type: 'human', is_unlocked: true, title: TAG })
      .select('id').single()
    expect(error).toBeNull()
    chatId = chat!.id

    const self = await farmer.client.from('chats').insert({ farmer_id: farmer.userId, agronomist_id: farmer.userId, type: 'human' })
    expect(self.error, 'чат сам із собою').not.toBeNull()

    // Автора визначає база: фермер не напише від імені агронома
    const { data: m1 } = await farmer.client.from('messages')
      .insert({ chat_id: chatId, role: 'assistant', content: `${TAG} від фермера`, is_read: true })
      .select('id, role, is_read').single()
    expect(m1).toMatchObject({ role: 'user', is_read: false })

    const { data: m2 } = await agronomist.client.from('messages')
      .insert({ chat_id: chatId, role: 'user', content: `${TAG} від агронома` }).select('id, role').single()
    expect(m2!.role).toBe('assistant')

    const pixel = await agronomist.client.from('messages')
      .insert({ chat_id: chatId, content: TAG, image_url: 'https://example.com/pixel.png' })
    expect(pixel.error, 'стороннє посилання на картинку').not.toBeNull()

    // Чуже повідомлення не змінити і не видалити
    const edit = await agronomist.client.from('messages').update({ content: 'підмінено' }).eq('id', m1!.id)
    expect(edit.error, 'агроном змінив повідомлення фермера').not.toBeNull()
    const del = await agronomist.client.from('messages').delete().eq('id', m1!.id)
    expect(del.error, 'агроном видалив повідомлення фермера').not.toBeNull()

    // «Прочитано» ставить отримувач, а не автор
    const own = await farmer.client.from('messages').update({ is_read: true }).eq('id', m1!.id)
    expect(own.error, 'автор позначив своє повідомлення прочитаним').not.toBeNull()
    const read = await agronomist.client.from('messages').update({ is_read: true }).eq('id', m1!.id).select('is_read').single()
    expect(read.data?.is_read).toBe(true)
    await farmer.client.from('messages').update({ is_read: true }).eq('id', m2!.id)

    // Учасників чату не змінити, чат не видалити
    if (hasAccount('buyer')) {
      const stranger = await asUser('buyer')
      const moved = await farmer.client.from('chats').update({ agronomist_id: stranger.userId }).eq('id', chatId).select('agronomist_id').single()
      expect(moved.data?.agronomist_id).toBe(agronomist.userId)
      const { data: hidden } = await stranger.client.from('messages').select('id').eq('chat_id', chatId)
      expect(hidden ?? []).toEqual([])
      const intrude = await stranger.client.from('messages').insert({ chat_id: chatId, content: TAG })
      expect(intrude.error, 'сторонній написав у чужий чат').not.toBeNull()
    }
    const wipe = await agronomist.client.from('chats').delete().eq('id', chatId)
    expect(wipe.error, 'учасник видалив чат').not.toBeNull()
    const { data: still } = await serviceClient().from('messages').select('id').eq('chat_id', chatId)
    expect(still?.length).toBe(2)
  })

  test('безкоштовний ліміт: 2000 символів на місяць без угоди, видно в чаті', async ({ browser }) => {
    test.setTimeout(120_000)
    const farmer = await asUser('farmer')
    const agronomist = await asUser('agronomist')
    const admin = serviceClient()
    const { data: active } = await admin.from('agreements').select('id')
      .eq('farmer_id', farmer.userId).eq('agronomist_id', agronomist.userId).eq('status', 'active').limit(1)
    test.skip(!!active?.length, 'між тестовими акаунтами активна угода — ліміт не діє')

    // Фермер (власний акаунт власника) тимчасово на безкоштовному тарифі; підписка відновлюється
    const { data: sub } = await admin.from('subscriptions').select('id, plan, expires_at')
      .eq('user_id', farmer.userId).eq('profile', 'farmer').maybeSingle()
    let freeChat = ''
    try {
      if (sub) await admin.from('subscriptions').update({ plan: 'basic', expires_at: null }).eq('id', sub.id)
      const { data: chat } = await farmer.client.from('chats')
        .insert({ farmer_id: farmer.userId, agronomist_id: agronomist.userId, type: 'human' }).select('id').single()
      freeChat = chat!.id

      const { data: used } = await farmer.client.rpc('chat_free_chars_used')
      const left = 2000 - Number(used)
      const tooLong = await farmer.client.from('messages').insert({ chat_id: freeChat, content: 'я'.repeat(left + 1) })
      expect(tooLong.error?.hint, 'понад ліміт').toBe('chat_free_limit')

      if (left >= 10) {
        const { data: ok, error } = await farmer.client.from('messages')
          .insert({ chat_id: freeChat, content: `${TAG}`.slice(0, 10).padEnd(10, '.') }).select('free_chars').single()
        expect(error).toBeNull()
        expect(ok!.free_chars).toBe(10)
        const { data: after } = await farmer.client.rpc('chat_free_chars_used')
        expect(Number(after)).toBe(Number(used) + 10)
        // free_chars не підробити
        const forged = await farmer.client.from('messages').insert({ chat_id: freeChat, content: 'x', free_chars: -5000 } as never).select('free_chars').single()
        expect(forged.data?.free_chars).toBe(1)
      }

      // Агроном відповідає без обмежень
      const reply = await agronomist.client.from('messages').insert({ chat_id: freeChat, content: 'я'.repeat(2500) }).select('free_chars').single()
      expect(reply.error).toBeNull()
      expect(reply.data!.free_chars).toBe(0)

      const page = await (await browser.newContext()).newPage()
      await login(page, 'farmer')
      const errors = collectErrors(page)
      await page.goto(`/dashboard/chats/${freeChat}`)
      const { data: nowUsed } = await farmer.client.rpc('chat_free_chars_used')
      if (2000 - Number(nowUsed) > 0) {
        await expect(page.getByTestId('chat-free-left')).toContainText('із 2 000 символів')
        await page.getByPlaceholder(/Введіть повідомлення/).fill('я'.repeat(2001))
        await expect(page.getByTestId('chat-free-left')).toContainText('задовге')
      } else {
        await expect(page.getByText(/символів цього місяця використано/)).toBeVisible()
      }
      await expectNoErrors(errors, 'чаті з лімітом')
    } finally {
      if (freeChat) {
        await admin.from('messages').delete().eq('chat_id', freeChat)
        await admin.from('chats').delete().eq('id', freeChat)
      }
      if (sub) await admin.from('subscriptions').update({ plan: sub.plan, expires_at: sub.expires_at }).eq('id', sub.id)
    }
  })

  test('листування через сайт: агроном пише, фермер бачить непрочитане', async ({ browser }) => {
    test.skip(!chatId, 'немає тестового чату')
    test.setTimeout(120_000)
    const text = `${TAG} привіт із сайту`

    const agroPage = await (await browser.newContext()).newPage()
    await login(agroPage, 'agronomist')
    const agroErrors = collectErrors(agroPage)
    const agroApi = collectApiErrors(agroPage)
    await agroPage.goto(`/dashboard/chats/${chatId}`)
    const box = agroPage.getByPlaceholder(/Введіть повідомлення/)
    await box.fill(text)
    await box.press('Enter')
    await expect(agroPage.getByText(text)).toBeVisible()
    await expect.poll(async () => {
      const { data } = await serviceClient().from('messages').select('role').eq('chat_id', chatId).eq('content', text)
      return data?.[0]?.role
    }).toBe('assistant')
    await expectNoErrors(agroErrors, 'чаті агронома')
    expect(agroApi, agroApi.join('\n')).toEqual([])

    const farmerPage = await (await browser.newContext()).newPage()
    await login(farmerPage, 'farmer')
    const farmerErrors = collectErrors(farmerPage)
    await farmerPage.goto('/dashboard/chats')
    const row = farmerPage.locator(`a[href="/dashboard/chats/${chatId}"]`)
    await expect(row).toContainText(text)
    await expect(row.locator('.bg-agro.rounded-full')).toHaveText('1')  // непрочитане від агронома

    await row.click()
    await expect(farmerPage.getByText(text)).toBeVisible()
    await expect.poll(async () => {
      const { data } = await serviceClient().from('messages').select('is_read').eq('chat_id', chatId).eq('content', text)
      return data?.[0]?.is_read
    }).toBe(true)
    await expectNoErrors(farmerErrors, 'чаті фермера')
  })
})
