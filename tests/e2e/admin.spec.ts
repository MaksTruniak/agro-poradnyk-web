import { test, expect } from '@playwright/test'
import { anonClient, asUser, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

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

  test('вимкнений бренд і його товари зникають із сайту; адмін бачить усе', async ({ page }) => {
    const admin = serviceClient()
    // Бренд із товарами
    const { data: prod } = await admin.from('agro_products').select('id, slug, manufacturer_id').not('manufacturer_id', 'is', null).limit(1).single()
    const { data: brand } = await admin.from('agro_manufacturers').select('id, name, is_active').eq('id', prod!.manufacturer_id).single()
    try {
      await login(page, 'admin')
      await page.goto('/admin/brands')
      const row = page.locator('div', { hasText: brand!.name }).filter({ has: page.getByTitle('Вимкнути') }).last()
      await row.getByTitle('Вимкнути').click()
      await expect.poll(async () => (await admin.from('agro_manufacturers').select('is_active').eq('id', brand!.id).single()).data?.is_active).toBe(false)

      const anon = anonClient()
      expect((await anon.from('agro_manufacturers').select('id').eq('id', brand!.id)).data ?? []).toEqual([])
      expect((await anon.from('agro_products').select('id').eq('id', prod!.id)).data ?? [], 'товар вимкненого бренду видно гостю').toEqual([])
      const { data: unbranded } = await anon.from('agro_products').select('id').is('manufacturer_id', null).limit(1)
      expect(unbranded?.length, 'товари без бренду зникли').toBe(1)

      // Адмін (своєю сесією) бачить бренд і товар
      const { client } = await asUser('admin')
      expect((await client.from('agro_products').select('id').eq('id', prod!.id)).data?.length).toBe(1)
    } finally {
      await admin.from('agro_manufacturers').update({ is_active: brand!.is_active }).eq('id', brand!.id)
    }
  })

  test('адмін зберігає кредити AI і товари (раніше база мовчки відкидала зміни)', async () => {
    const { client } = await asUser('admin')
    const { data: lim } = await client.from('ai_plan_limits').select('plan, credits_base').limit(1).single()
    const upd = await client.from('ai_plan_limits').update({ credits_base: lim!.credits_base }).eq('plan', lim!.plan).select('plan')
    expect(upd.data?.length, 'кредити AI не зберігаються').toBe(1)
    const { data: p } = await client.from('agro_products').select('id, name').limit(1).single()
    const updP = await client.from('agro_products').update({ name: p!.name }).eq('id', p!.id).select('id')
    expect(updP.data?.length, 'товар не зберігається').toBe(1)

    // Решта довідників адмінки — те саме значення назад, нічого не змінюється
    const checks: [string, string, string][] = [
      ['plans', 'id', 'label'], ['loyalty_discounts', 'role', 'discount_percent'], ['crop_catalog', 'id', 'name'],
      ['varieties', 'id', 'name'], ['agro_diseases', 'id', 'name'], ['agro_pests', 'id', 'name'],
      ['agro_weeds', 'id', 'name'], ['agro_active_ingredients', 'id', 'name'], ['agro_calendar', 'id', 'title'],
      ['agro_product_details', 'id', 'dosage'],
    ]
    for (const [table, key, field] of checks) {
      const { data: row } = await client.from(table).select('*').limit(1).single()
      let q = client.from(table).update({ [field]: row[field] }).eq(key, row[key])
      if (table === 'loyalty_discounts') q = q.eq('renewal_year', row.renewal_year)
      const res = await q.select(key)
      expect(res.error, table).toBeNull()
      expect(res.data?.length, `адмін не може змінити ${table}`).toBeGreaterThan(0)
    }
  })

  test('товар: збереження з адмінки не стирає дані', async ({ page }) => {
    const admin = serviceClient()
    const { data: prod } = await admin.from('agro_products').select('*').eq('type', 'seed').not('manufacturer_id', 'is', null).limit(1).single()
    const { data: det } = await admin.from('agro_product_details').select('*').eq('id', prod!.id).maybeSingle()
    try {
      await login(page, 'admin')
      const errors = collectErrors(page)
      await page.goto('/admin/products')
      await page.getByPlaceholder(/Пошук/).fill(prod!.name)
      const row = page.locator('div.flex.items-center.gap-4', { hasText: prod!.slug }).first()
      await row.getByRole('button', { name: 'Редагувати' }).click()
      await page.getByRole('button', { name: /Зберегти/ }).click()
      await expect(page.getByText('Збережено')).toBeVisible({ timeout: 15000 })
      const { data: after } = await admin.from('agro_products').select('*').eq('id', prod!.id).single()
      expect(after).toEqual(prod)
      const { data: detAfter } = await admin.from('agro_product_details').select('*').eq('id', prod!.id).maybeSingle()
      expect(detAfter?.description ?? null).toBe(det?.description ?? null)
      expect(detAfter?.content_sections ?? null).toEqual(det?.content_sections ?? null)
      await expectNoErrors(errors, 'товарах')
    } finally {
      await admin.from('agro_products').update(prod!).eq('id', prod!.id)
      if (det) await admin.from('agro_product_details').update(det).eq('id', prod!.id)
      else await admin.from('agro_product_details').delete().eq('id', prod!.id)
    }
  })
})
