import { test, expect } from '@playwright/test'
import { asUser, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Адмінка: верифікація заготівельника й агронома доходить до значків на публічних сторінках,
// пошук користувача за ім'ям. ПИШЕ в базу (позначки верифікації, профіль агронома) — лише з E2E_WRITE=1;
// усе повертається як було.

test.describe('Адмінка', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест змінює позначки верифікації)')
  test.skip(!hasAccount('admin') || !hasAccount('buyer') || !hasAccount('agronomist'), 'потрібні E2E_ADMIN_*, E2E_BUYER_*, E2E_AGRONOMIST_*')
  test.describe.configure({ mode: 'serial' })

  const FLAGS = 'is_verified, is_verified_buyer, is_verified_agronomist, verification_requested, edrpou'
  const saved: Record<string, any> = {}
  let createdProfileId = ''

  test.beforeAll(async () => {
    const admin = serviceClient()
    for (const role of ['buyer', 'agronomist'] as const) {
      const { userId } = await asUser(role)
      const { data } = await admin.from('users').select(FLAGS).eq('id', userId).single()
      saved[role] = data
    }
  })

  test.afterAll(async () => {
    const admin = serviceClient()
    for (const role of ['buyer', 'agronomist'] as const) {
      const { userId } = await asUser(role)
      if (saved[role]) await admin.from('users').update(saved[role]).eq('id', userId)
    }
    if (createdProfileId) await admin.from('agronomist_profiles').delete().eq('id', createdProfileId)
  })

  test('заготівельник: запит на верифікацію → адмін схвалює → значок на сторінці', async ({ page }) => {
    const buyer = await asUser('buyer')
    const admin = serviceClient()
    await admin.from('users').update({ is_verified: false, is_verified_buyer: false, verification_requested: false }).eq('id', buyer.userId)
    // Так запит надсилає сторінка налаштувань
    const req = await buyer.client.from('users').update({ edrpou: '12345678', verification_requested: true }).eq('id', buyer.userId)
    expect(req.error).toBeNull()
    const { data: me } = await admin.from('users').select('name, company_name').eq('id', buyer.userId).single()

    await login(page, 'admin')
    const errors = collectErrors(page)
    await page.goto('/admin')
    await page.getByRole('button', { name: /Заготівельники/ }).click()
    const row = page.locator('div.flex.items-center.gap-4', { hasText: me!.company_name || me!.name })
    await row.getByRole('button', { name: 'Верифікувати' }).click()
    await expect.poll(async () => {
      const { data } = await admin.from('users').select('is_verified, is_verified_buyer').eq('id', buyer.userId).single()
      return data?.is_verified && data.is_verified_buyer
    }).toBe(true)
    await expectNoErrors(errors, 'адмінці')
  })

  test('агроном: адмін схвалює → «Перевірений агроном» на публічній сторінці', async ({ page }) => {
    const agronomist = await asUser('agronomist')
    const admin = serviceClient()
    await admin.from('users').update({ is_verified_agronomist: false }).eq('id', agronomist.userId)
    let { data: profile } = await admin.from('agronomist_profiles').select('id').eq('user_id', agronomist.userId).maybeSingle()
    if (!profile) {
      const { data } = await agronomist.client.from('agronomist_profiles').insert({ user_id: agronomist.userId, bio: 'E2E адмінка' }).select('id').single()
      profile = data
      createdProfileId = data!.id
    } else {
      await admin.from('agronomist_profiles').update({ is_verified: false }).eq('id', profile.id)
    }
    const { data: me } = await admin.from('users').select('name').eq('id', agronomist.userId).single()

    await login(page, 'admin')
    await page.goto('/admin')
    const card = page.locator('.card', { hasText: me!.name }).filter({ has: page.locator('button.btn-primary') }).first()
    await card.locator('button.btn-primary').click()
    await expect.poll(async () => {
      const { data } = await admin.from('users').select('is_verified_agronomist').eq('id', agronomist.userId).single()
      return data?.is_verified_agronomist
    }).toBe(true)

    await page.goto(`/agronomist/${agronomist.userId}`)
    await expect(page.getByText('Перевірений агроном')).toBeVisible({ timeout: 15000 })
  })

  test('користувачі: пошук за ім\'ям', async ({ page }) => {
    const buyer = await asUser('buyer')
    const { data: me } = await serviceClient().from('users').select('name').eq('id', buyer.userId).single()
    const { data: authUser } = await serviceClient().auth.admin.getUserById(buyer.userId)
    test.skip(!authUser.user?.user_metadata?.name && !authUser.user?.user_metadata?.full_name, 'у заготівельника немає імені в профілі входу')

    await login(page, 'admin')
    await page.goto('/admin/users')
    await page.getByPlaceholder(/Пошук/).fill((authUser.user!.user_metadata.name || me!.name).split(' ')[0])
    await expect(page.getByText(authUser.user!.email!).first()).toBeVisible({ timeout: 15000 })
  })

  test('сторінки адмінки не відкриваються звичайному користувачу', async ({ page }) => {
    await login(page, 'buyer')
    for (const path of ['/admin/plans', '/admin/ai-limits', '/admin/agro-calendar', '/admin/crop-types', '/admin/loyalty-discounts']) {
      await page.goto(path)
      await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    }
  })
})
