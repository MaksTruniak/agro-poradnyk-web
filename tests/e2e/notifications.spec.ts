import { test, expect } from '@playwright/test'
import { notifyUser } from '../../server/utils/notify'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Сповіщення в кабінеті: щоранкові задачі (склад, нагадування) створюють їх через notifyUser.
// Самі cron-задачі тут не викликаються — вони надсилають листи всім користувачам.
// ПИШЕ в базу, тому лише з E2E_WRITE=1; прибирається сервісним ключем.

const TAG = `E2E ${Date.now()}`

test.describe('Сповіщення', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer'), 'потрібні E2E_FARMER_*')
  test.describe.configure({ mode: 'serial' })

  test.afterAll(async () => {
    const { userId } = await asUser('farmer')
    await serviceClient().from('farm_notifications').delete().eq('user_id', userId).like('title', `${TAG}%`)
  })

  test('щоденна перевірка не плодить дублікатів, поки сповіщення не прочитане', async () => {
    const { userId } = await asUser('farmer')
    const admin = serviceClient()
    const { data: before } = await admin.from('farm_notifications').select('id').eq('user_id', userId).eq('type', 'inventory_low').eq('is_read', false)
    test.skip(!!before?.length, 'у тестового фермера вже є непрочитане сповіщення про склад')

    await notifyUser(admin, userId, { type: 'inventory_low', title: `${TAG} склад`, body: 'Гербіцид: 2 л (мін. 5)' })
    await notifyUser(admin, userId, { type: 'inventory_low', title: `${TAG} склад`, body: 'Гербіцид: 1 л (мін. 5)' })
    const { data: rows } = await admin.from('farm_notifications').select('id, body, is_read').eq('user_id', userId).like('title', `${TAG}%`)
    expect(rows).toHaveLength(1)
    expect(rows![0]!.body).toBe('Гербіцид: 1 л (мін. 5)')

    // Прочитане — наступна перевірка створює нове
    await admin.from('farm_notifications').update({ is_read: true }).eq('id', rows![0]!.id)
    await notifyUser(admin, userId, { type: 'inventory_low', title: `${TAG} склад`, body: 'Гербіцид: 0 л (мін. 5)' })
    const { count } = await admin.from('farm_notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).like('title', `${TAG}%`)
    expect(count).toBe(2)
  })

  test('сповіщення бачить лише власник', async () => {
    test.skip(!hasAccount('buyer'), 'потрібен E2E_BUYER_*')
    const farmer = await asUser('farmer')
    const stranger = await asUser('buyer')
    const { data: own } = await farmer.client.from('farm_notifications').select('id').like('title', `${TAG}%`)
    expect(own?.length).toBeGreaterThan(0)
    const { data: hidden } = await stranger.client.from('farm_notifications').select('id').eq('user_id', farmer.userId)
    expect(hidden ?? []).toEqual([])
    const forged = await stranger.client.from('farm_notifications').insert({ user_id: farmer.userId, type: 'inventory_low', title: `${TAG} підробка` })
    expect(forged.error, 'сторонній створив сповіщення фермеру').not.toBeNull()
  })

  test('сторінка: лічильник у меню, позначити прочитаним', async ({ page }) => {
    const { userId } = await asUser('farmer')
    await notifyUser(serviceClient(), userId, { type: 'treatment_soon', title: `${TAG} нагадування`, body: '09:00 — Обприскування' })

    await login(page, 'farmer')
    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)
    const { count: unread } = await serviceClient().from('farm_notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false)

    await page.goto('/dashboard/notifications')
    const navItem = page.locator('nav a[href="/dashboard/notifications"]')
    await expect(navItem).toContainText(String(unread))

    const card = page.locator('.card', { hasText: `${TAG} нагадування` })
    await expect(card).toContainText('09:00 — Обприскування')
    await expect(card.getByRole('link', { name: /До нагадувань/ })).toBeVisible()
    await card.getByTitle('Позначити прочитаним').click()
    await expect(card.getByTitle('Позначити прочитаним')).toHaveCount(0)
    await expect.poll(async () => {
      const { data } = await serviceClient().from('farm_notifications').select('is_read').eq('user_id', userId).eq('title', `${TAG} нагадування`).single()
      return data?.is_read
    }).toBe(true)
    if (unread === 1) await expect(navItem.locator('.bg-red-500')).toHaveCount(0)
    else await expect(navItem).toContainText(String(unread! - 1))

    await expectNoErrors(errors, 'сповіщеннях')
    expect(apiErrors, apiErrors.join('\n')).toEqual([])
  })
})
