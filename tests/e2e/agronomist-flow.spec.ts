import { test, expect } from '@playwright/test'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Агроном: поля клієнтів, програми захисту клієнта, тариф клієнта, ліміт клієнтів Базового тарифу,
// службові поля кабінету агронома. ПИШЕ в базу, тому лише з E2E_WRITE=1; прибирається сервісним ключем.
// Потрібна міграція 20261008_agronomist_clients.sql.

const TAG = `E2E ${Date.now()}`

// Обидва блоки тимчасово змінюють підписку тестового агронома — увесь файл по черзі
test.describe.configure({ mode: 'serial' })

test.describe('Агроном і клієнти', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('agronomist'), 'потрібні E2E_FARMER_* і E2E_AGRONOMIST_*')
  test.describe.configure({ mode: 'serial' })

  const agreementIds: string[] = []
  let farmId = ''
  let cropId = ''
  let programId = ''
  let createdProgram = false

  test.beforeAll(async () => {
    const farmer = await asUser('farmer')
    const agronomist = await asUser('agronomist')
    const admin = serviceClient()

    const { data: existing } = await admin.from('agreements').select('id')
      .eq('agronomist_id', agronomist.userId).in('status', ['pending', 'active'])
    if (existing?.length) return  // у тестового агронома вже є співпраця — тести пропустяться

    const { data: farms } = await farmer.client.from('farms').select('id, farm_crops(id)').order('created_at')
    const farm = farms?.find((f: any) => f.farm_crops?.length)
    if (!farm) return
    farmId = farm.id
    cropId = farm.farm_crops[0].id

    // Активна співпраця без конкретного поля — як запит із чату
    const { data: ag } = await admin.from('agreements').insert({
      farmer_id: farmer.userId, agronomist_id: agronomist.userId, status: 'active',
      started_at: new Date().toISOString(), message: TAG,
    }).select('id').single()
    agreementIds.push(ag!.id)

    const { data: prog } = await admin.from('protection_programs').select('id').eq('farm_crop_id', cropId).maybeSingle()
    if (prog) programId = prog.id
    else {
      const { data: created } = await admin.from('protection_programs')
        .insert({ farm_crop_id: cropId, name: `${TAG} програма` }).select('id').single()
      programId = created!.id
      createdProgram = true
    }
  })

  test.afterAll(async () => {
    const admin = serviceClient()
    if (programId) await admin.from('program_treatments').delete().eq('program_id', programId).like('product_name', `${TAG}%`)
    if (createdProgram) await admin.from('protection_programs').delete().eq('id', programId)
    if (agreementIds.length) await admin.from('agreements').delete().in('id', agreementIds)
  })

  test('поля клієнта: угода без поля показує всі поля фермера', async ({ page }) => {
    test.skip(!agreementIds.length, 'немає поля з культурою у фермера або в агронома вже є співпраця')
    const { data: farm } = await serviceClient().from('farms').select('name').eq('id', farmId).single()

    await login(page, 'agronomist')
    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)
    await page.goto('/dashboard/agronomist-fields')
    await expect(page.getByRole('heading', { name: farm!.name })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Поки немає полів клієнтів')).toHaveCount(0)

    await page.getByRole('link', { name: /Програма/ }).first().click()
    await page.waitForURL(/\/dashboard\/protection\//)
    await expect(page.getByText('Ліміт технічних карт')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Створити програму/ })).toHaveCount(0)
    await expectNoErrors(errors, 'полях клієнтів')
    expect(apiErrors, apiErrors.join('\n')).toEqual([])
  })

  test('агроном веде програму захисту клієнта, сторонні — ні', async () => {
    test.skip(!agreementIds.length, 'немає поля з культурою у фермера або в агронома вже є співпраця')
    const farmer = await asUser('farmer')
    const agronomist = await asUser('agronomist')

    const { data: progs } = await agronomist.client.from('protection_programs').select('id').eq('farm_crop_id', cropId)
    expect(progs?.map(p => p.id)).toEqual([programId])

    const { data: t, error } = await agronomist.client.from('program_treatments').insert({
      program_id: programId, phase: 'e2e', phase_order: 99, type: 'підживлення', product_name: `${TAG} препарат`,
    }).select('id').single()
    expect(error).toBeNull()

    const upd = await agronomist.client.from('program_treatments').update({ status: 'done' }).eq('id', t!.id).select('status').single()
    expect(upd.data?.status).toBe('done')

    // Фермер бачить запис агронома у своїй програмі
    const { data: seen } = await farmer.client.from('program_treatments').select('id').eq('id', t!.id)
    expect(seen?.length).toBe(1)

    // Тариф клієнта — лише так/ні, і лише своєму агроному
    const { data: sub } = await serviceClient().from('subscriptions').select('plan, expires_at')
      .eq('user_id', farmer.userId).eq('profile', 'farmer').maybeSingle()
    const paid = !!sub && ['business', 'business_pro', 'premium'].includes(sub.plan) && (!sub.expires_at || new Date(sub.expires_at) > new Date())
    const { data: paidRpc, error: rpcErr } = await agronomist.client.rpc('client_has_paid_plan', { p_farmer: farmer.userId })
    expect(rpcErr).toBeNull()
    expect(paidRpc).toBe(paid)

    if (hasAccount('buyer')) {
      const stranger = await asUser('buyer')
      const { data: hidden } = await stranger.client.from('protection_programs').select('id').eq('id', programId)
      expect(hidden ?? []).toEqual([])
      const forged = await stranger.client.from('program_treatments')
        .insert({ program_id: programId, phase: 'e2e', product_name: `${TAG} чужий` })
      expect(forged.error, 'сторонній додав обробку в чужу програму').not.toBeNull()
      const { data: strangerPaid } = await stranger.client.rpc('client_has_paid_plan', { p_farmer: farmer.userId })
      expect(strangerPaid).toBeNull()
    }

    const del = await agronomist.client.from('program_treatments').delete().eq('id', t!.id).select('id')
    expect(del.data?.length).toBe(1)

    // Після завершення співпраці доступ зникає
    await serviceClient().from('agreements').update({ status: 'completed', ended_at: new Date().toISOString() }).eq('id', agreementIds[0]!)
    const { data: after } = await agronomist.client.from('protection_programs').select('id').eq('id', programId)
    expect(after ?? []).toEqual([])
    const late = await agronomist.client.from('program_treatments')
      .insert({ program_id: programId, phase: 'e2e', product_name: `${TAG} після` })
    expect(late.error, 'агроном пише в програму після завершення співпраці').not.toBeNull()
  })

  test('Базовий тариф агронома — до 2 активних клієнтів', async () => {
    test.skip(!hasAccount('buyer') || !hasAccount('admin'), 'потрібні ще два акаунти як «клієнти»')
    const farmer = await asUser('farmer')
    const agronomist = await asUser('agronomist')
    const admin = serviceClient()

    const { data: busy } = await admin.from('agreements').select('id')
      .eq('agronomist_id', agronomist.userId).eq('status', 'active')
    test.skip(!!busy?.length, 'у тестового агронома вже є активні клієнти')

    // Тестовий агроном може бути на PRO (пробний період) — на час тесту переводимо на Базовий
    const { data: sub } = await admin.from('subscriptions').select('id, expires_at')
      .eq('user_id', agronomist.userId).eq('profile', 'agronomist').maybeSingle()
    if (sub) await admin.from('subscriptions').update({ expires_at: '2000-01-01T00:00:00Z' }).eq('id', sub.id)
    try {
      // Два активні клієнти
      for (const role of ['buyer', 'admin'] as const) {
        const { userId } = await asUser(role)
        const { data } = await admin.from('agreements').insert({
          farmer_id: userId, agronomist_id: agronomist.userId, status: 'active', started_at: new Date().toISOString(), message: TAG,
        }).select('id').single()
        agreementIds.push(data!.id)
      }

      // Третій запит — агроном не може прийняти
      const { data: req } = await farmer.client.from('agreements')
        .insert({ farmer_id: farmer.userId, agronomist_id: agronomist.userId, message: TAG }).select('id').single()
      agreementIds.push(req!.id)
      const accept = await agronomist.client.from('agreements').update({ status: 'active' }).eq('id', req!.id)
      expect(accept.error?.message).toContain('до 2 активних клієнтів')

      // Звільнилось місце — приймає
      await admin.from('agreements').update({ status: 'completed' }).eq('id', agreementIds[agreementIds.length - 2]!)
      const retry = await agronomist.client.from('agreements').update({ status: 'active' }).eq('id', req!.id).select('status').single()
      expect(retry.error).toBeNull()
      expect(retry.data?.status).toBe('active')
    } finally {
      if (sub) await admin.from('subscriptions').update({ expires_at: sub.expires_at }).eq('id', sub.id)
    }
  })

  test('кабінет агронома: зберігається, службові поля не підробити', async () => {
    const agronomist = await asUser('agronomist')
    const cols = 'id, bio, is_verified, rating, reviews_count, max_clients, promotion_plan'
    let { data: before } = await agronomist.client.from('agronomist_profiles').select(cols).eq('user_id', agronomist.userId).maybeSingle()
    let createdProfile = false
    if (!before) {
      // Немає профілю — агроном створює його сам, як на сайті; службові поля база обнуляє
      const { data, error } = await agronomist.client.from('agronomist_profiles')
        .insert({ user_id: agronomist.userId, bio: TAG, is_verified: true, rating: 5, reviews_count: 999, promotion_plan: 'top' })
        .select(cols).single()
      expect(error).toBeNull()
      expect(data).toMatchObject({ is_verified: false, rating: null, reviews_count: null, promotion_plan: null })
      before = data
      createdProfile = true
    }

    const { data: after, error } = await agronomist.client.from('agronomist_profiles').update({
      bio: `${TAG} про себе`, is_verified: true, rating: 5, reviews_count: 999, max_clients: 999, promotion_plan: 'top',
    }).eq('id', before!.id).select('bio, is_verified, rating, reviews_count, max_clients, promotion_plan').single()
    try {
      expect(error).toBeNull()
      expect(after!.bio).toBe(`${TAG} про себе`)
      expect(after).toMatchObject({
        is_verified: before!.is_verified, rating: before!.rating, reviews_count: before!.reviews_count,
        max_clients: before!.max_clients, promotion_plan: before!.promotion_plan,
      })
    } finally {
      if (createdProfile) await serviceClient().from('agronomist_profiles').delete().eq('id', before!.id)
      else await serviceClient().from('agronomist_profiles').update({ bio: before!.bio }).eq('id', before!.id)
    }
  })
})

// Просування агронома: PRO піднімає профіль (не частіше ніж раз на 5 днів) і виділяє картку в каталозі;
// без PRO / «Топ» підняти не можна, а щоденна expire_promotions знімає прострочене.
// ПИШЕ в базу (профіль агронома, тимчасово — термін підписки), тому лише з E2E_WRITE=1.

test.describe('Просування агронома', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('agronomist'), 'потрібні E2E_AGRONOMIST_*')
  test.describe.configure({ mode: 'serial' })

  let profileId = ''
  let createdProfile = false
  let original: Record<string, any> | null = null
  let sub: { id: string; plan: string; expires_at: string | null } | null = null

  test.beforeAll(async () => {
    const agronomist = await asUser('agronomist')
    const admin = serviceClient()
    const { data: s } = await admin.from('subscriptions').select('id, plan, expires_at')
      .eq('user_id', agronomist.userId).eq('profile', 'agronomist').maybeSingle()
    sub = s
    const { data: p } = await admin.from('agronomist_profiles')
      .select('id, boosted_at, is_highlighted, promotion_plan, promotion_expires_at').eq('user_id', agronomist.userId).maybeSingle()
    if (p) { profileId = p.id; original = p }
    else {
      const { data } = await agronomist.client.from('agronomist_profiles')
        .insert({ user_id: agronomist.userId, bio: TAG, region: 'Київська область' }).select('id').single()
      profileId = data!.id
      createdProfile = true
    }
  })

  test.afterAll(async () => {
    const admin = serviceClient()
    if (sub) await admin.from('subscriptions').update({ plan: sub.plan, expires_at: sub.expires_at }).eq('id', sub.id)
    if (createdProfile) await admin.from('agronomist_profiles').delete().eq('id', profileId)
    else if (original) await admin.from('agronomist_profiles').update(original).eq('id', profileId)
  })

  test('PRO піднімає профіль раз на 5 днів, картка виділена в каталозі', async ({ page }) => {
    const agronomist = await asUser('agronomist')
    const admin = serviceClient()
    if (!sub) test.skip(true, 'у тестового агронома немає підписки агронома')
    await admin.from('subscriptions').update({ plan: 'pro', expires_at: new Date(Date.now() + 30 * 864e5).toISOString() }).eq('id', sub!.id)
    await admin.from('agronomist_profiles').update({ boosted_at: null, is_highlighted: false }).eq('id', profileId)

    // Кабінет піднімає PRO-агронома сам (як на сайті)
    await login(page, 'agronomist')
    await expect.poll(async () => {
      const { data } = await admin.from('agronomist_profiles').select('is_highlighted, boosted_at').eq('id', profileId).single()
      return data?.is_highlighted && !!data.boosted_at
    }, { timeout: 15000 }).toBe(true)
    const { data: boosted } = await admin.from('agronomist_profiles').select('boosted_at').eq('id', profileId).single()

    // Повторне підняття раніше ніж за 5 днів база ігнорує, дату з браузера теж
    const again = await agronomist.client.from('agronomist_profiles')
      .update({ boosted_at: new Date(Date.now() + 365 * 864e5).toISOString(), is_highlighted: true }).eq('id', profileId)
      .select('boosted_at').single()
    expect(again.error).toBeNull()
    expect(again.data!.boosted_at).toBe(boosted!.boosted_at)

    const { data: me } = await admin.from('users').select('name').eq('id', agronomist.userId).single()
    await page.goto('/agronomists')
    const card = page.locator('.card', { hasText: me!.name }).first()
    await expect(card).toBeVisible({ timeout: 15000 })
    await expect(card.getByText('PRO', { exact: true })).toBeVisible()
  })

  test('без PRO підняти не можна; прострочене знімає щоденна перевірка', async () => {
    const agronomist = await asUser('agronomist')
    const admin = serviceClient()
    if (!sub) test.skip(true, 'у тестового агронома немає підписки агронома')

    // PRO закінчився
    await admin.from('subscriptions').update({ expires_at: '2000-01-01T00:00:00Z' }).eq('id', sub!.id)
    await admin.from('agronomist_profiles').update({ boosted_at: '2000-01-01T00:00:00Z', is_highlighted: true }).eq('id', profileId)
    const { data: res } = await admin.rpc('expire_promotions')
    expect(res.unhighlighted).toBeGreaterThanOrEqual(1)
    const { data: after } = await admin.from('agronomist_profiles').select('is_highlighted').eq('id', profileId).single()
    expect(after!.is_highlighted).toBe(false)

    const self = await agronomist.client.from('agronomist_profiles')
      .update({ boosted_at: new Date().toISOString(), is_highlighted: true }).eq('id', profileId).select('boosted_at, is_highlighted').single()
    expect(self.data).toMatchObject({ boosted_at: '2000-01-01T00:00:00+00:00', is_highlighted: false })

    // Прострочений «Топ»
    await admin.from('agronomist_profiles').update({ promotion_plan: 'top', promotion_expires_at: '2000-01-01T00:00:00Z' }).eq('id', profileId)
    await admin.rpc('expire_promotions')
    const { data: top } = await admin.from('agronomist_profiles').select('promotion_plan').eq('id', profileId).single()
    expect(top!.promotion_plan).toBeNull()

    // Клієнт не може викликати щоденну перевірку і сам дати собі «Топ»
    const rpc = await agronomist.client.rpc('expire_promotions')
    expect(rpc.error).not.toBeNull()
    const forged = await agronomist.client.from('agronomist_profiles')
      .update({ promotion_plan: 'top', promotion_expires_at: '2099-01-01T00:00:00Z' }).eq('id', profileId).select('promotion_plan').single()
    expect(forged.data!.promotion_plan).toBeNull()
  })
})
