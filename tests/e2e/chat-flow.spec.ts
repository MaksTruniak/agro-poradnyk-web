import { test, expect } from '@playwright/test'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Чати фермер ↔ агроном: автор повідомлення, чужі повідомлення, учасники чату, непрочитані, листування через сайт.
// ПИШЕ в базу, тому лише з E2E_WRITE=1; прибирається сервісним ключем. Потрібна міграція 20261008_chats_protect.sql.

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
