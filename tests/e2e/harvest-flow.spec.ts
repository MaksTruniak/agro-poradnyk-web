import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Збір урожаю: власник (фермер) створює збирача через API, сезон, записи збору й виплати;
// збирач входить своїм акаунтом; сторонній — заготівельник.
// ПИШЕ в базу і створює акаунт збирача, тому лише з E2E_WRITE=1; все прибирається сервісним ключем.

const TAG = `E2E ${Date.now()}`
const PHONE = `+38099${String(Date.now()).slice(-7)}`
const PASSWORD = `E2e-${Date.now()}-Pass!`

test.describe('Збір урожаю: власник ↔ збирач', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('buyer'), 'потрібні E2E_FARMER_* і E2E_BUYER_*')
  test.describe.configure({ mode: 'serial' })

  let farmId = ''
  let cropId = ''
  let seasonId = ''
  let otherSeasonId = ''
  let workerId = ''
  let workerAuthId = ''
  let paymentId = ''
  let recordId = ''
  let worker: SupabaseClient

  test.afterAll(async () => {
    const admin = serviceClient()
    for (const sid of [seasonId, otherSeasonId].filter(Boolean)) {
      await admin.from('harvest_payments').delete().eq('season_id', sid)
      await admin.from('harvest_records').delete().eq('season_id', sid)
      await admin.from('harvest_season_workers').delete().eq('season_id', sid)
      await admin.from('harvest_seasons').delete().eq('id', sid)
    }
    if (workerId) await admin.from('harvest_workers').delete().eq('id', workerId)
    if (workerAuthId) await admin.auth.admin.deleteUser(workerAuthId)
    if (farmId) {
      await admin.from('farm_crops').delete().eq('farm_id', farmId)
      await admin.from('farms').delete().eq('id', farmId)
    }
  })

  test('власник створює збирача через API', async ({ request }) => {
    const farmer = await asUser('farmer')
    const unauth = await request.post('/api/harvest/create-worker', { data: { first_name: 'Е2Е', last_name: 'Збирач', phone: PHONE, password: PASSWORD } })
    expect(unauth.status(), 'збирача створено без входу').toBe(401)

    const res = await request.post('/api/harvest/create-worker', {
      headers: { Authorization: `Bearer ${farmer.token}` },
      data: { first_name: 'Е2Е', last_name: TAG, phone: PHONE, password: PASSWORD },
    })
    const body = await res.json()
    expect(res.status(), JSON.stringify(body)).toBe(200)
    workerId = body.worker.id
    workerAuthId = body.worker.auth_user_id
    expect(body.worker.owner_id).toBe(farmer.userId)

    // Сторонній не може створити збирача від імені чужого господарства
    const stranger = await asUser('buyer')
    const forged = await request.post('/api/harvest/create-worker', {
      headers: { Authorization: `Bearer ${stranger.token}` },
      data: { owner_id: farmer.userId, first_name: 'Чужий', last_name: 'Збирач', phone: '+380990000001', password: PASSWORD },
    })
    expect(forged.status(), 'сторонній створив збирача фермеру').toBe(403)
  })

  test('власник веде сезон, записи й виплати', async () => {
    const farmer = await asUser('farmer')

    const { data: farm } = await farmer.client.from('farms').insert({ user_id: farmer.userId, name: TAG, hectares: 5 }).select('id').single()
    farmId = farm!.id
    const { data: crop } = await farmer.client.from('farm_crops').insert({ farm_id: farmId, crop_type: 'Полуниця', area_ha: 2 }).select('id').single()
    cropId = crop!.id

    // harvest/index.vue → createSeason
    const season = await farmer.client.from('harvest_seasons').insert({
      owner_id: farmer.userId, farm_crop_id: cropId, crop: 'Полуниця', variety: null, price_per_kg: 10, status: 'active',
    }).select('id').single()
    expect(season.error).toBeNull()
    seasonId = season.data!.id
    const other = await farmer.client.from('harvest_seasons').insert({
      owner_id: farmer.userId, farm_crop_id: cropId, crop: 'Полуниця', price_per_kg: 12, status: 'active',
    }).select('id').single()
    otherSeasonId = other.data!.id

    // harvest/[id].vue → addWorkers, saveRecord, savePay
    const sw = await farmer.client.from('harvest_season_workers').insert([{ season_id: seasonId, worker_id: workerId, custom_price_per_kg: null }])
    expect(sw.error).toBeNull()
    const rec = await farmer.client.from('harvest_records').insert({
      worker_id: workerId, season_id: seasonId, weight_kg: 50, price_per_kg: 10, recorded_by: farmer.userId,
    }).select('id, amount').single()
    expect(rec.error).toBeNull()
    expect(Number(rec.data!.amount)).toBe(500)
    recordId = rec.data!.id
    const pay = await farmer.client.from('harvest_payments').insert({
      worker_id: workerId, season_id: seasonId, amount: 300, status: 'pending',
    }).select('id').single()
    expect(pay.error).toBeNull()
    paymentId = pay.data!.id
  })

  test('збирач бачить лише своє і лише підтверджує виплату', async () => {
    worker = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!, { auth: { persistSession: false } })
    const email = `${PHONE.replace(/\D/g, '')}@harvest.agroprostir.local`
    const { error } = await worker.auth.signInWithPassword({ email, password: PASSWORD })
    expect(error).toBeNull()

    const { data: me } = await worker.from('harvest_workers').select('id').eq('auth_user_id', workerAuthId).single()
    expect(me?.id).toBe(workerId)
    const { data: seasons } = await worker.from('harvest_season_workers').select('season_id, harvest_seasons(id)').eq('worker_id', workerId)
    expect(seasons?.map(s => s.season_id)).toEqual([seasonId])
    const { data: recs } = await worker.from('harvest_records').select('id').eq('worker_id', workerId)
    expect(recs?.length).toBe(1)

    // Чужі дані господарства недоступні
    const { data: farms } = await worker.from('farms').select('id').eq('id', farmId)
    expect(farms ?? [], 'збирач бачить поля власника').toEqual([])
    const { data: otherSeason } = await worker.from('harvest_seasons').select('id').eq('id', otherSeasonId)
    expect(otherSeason ?? [], 'збирач бачить сезон, де він не працює').toEqual([])

    // Накрутки: власні записи збору, вага, ціна сезону, сума виплати
    const fakeRec = await worker.from('harvest_records').insert({ worker_id: workerId, season_id: seasonId, weight_kg: 1000, price_per_kg: 10 })
    expect(fakeRec.error, 'збирач сам записав собі збір').not.toBeNull()
    await worker.from('harvest_records').update({ weight_kg: 5000 }).eq('id', recordId)
    await worker.from('harvest_seasons').update({ price_per_kg: 1000 }).eq('id', seasonId)
    await worker.from('harvest_season_workers').update({ custom_price_per_kg: 1000 }).eq('season_id', seasonId).eq('worker_id', workerId)
    const admin = serviceClient()
    const { data: recNow } = await admin.from('harvest_records').select('weight_kg').eq('id', recordId).single()
    expect(Number(recNow!.weight_kg), 'збирач змінив вагу').toBe(50)
    const { data: seasonNow } = await admin.from('harvest_seasons').select('price_per_kg').eq('id', seasonId).single()
    expect(Number(seasonNow!.price_per_kg), 'збирач змінив ціну сезону').toBe(10)
    const { data: swNow } = await admin.from('harvest_season_workers').select('custom_price_per_kg').eq('season_id', seasonId).single()
    expect(swNow!.custom_price_per_kg, 'збирач поставив собі ціну').toBeNull()

    // harvest-worker.vue → confirmPayment (спроба заодно змінити суму)
    const conf = await worker.from('harvest_payments').update({ status: 'confirmed', confirmed_at: new Date().toISOString(), amount: 99999 })
      .eq('id', paymentId).select('status, amount').single()
    expect(conf.error).toBeNull()
    expect(conf.data!.status).toBe('confirmed')
    expect(Number(conf.data!.amount), 'збирач змінив суму виплати').toBe(300)
    const fakePay = await worker.from('harvest_payments').insert({ worker_id: workerId, season_id: seasonId, amount: 1000, status: 'confirmed' })
    expect(fakePay.error, 'збирач створив собі виплату').not.toBeNull()
  })

  test('сторонній не бачить і не пише в збір урожаю', async () => {
    const stranger = await asUser('buyer')
    for (const [table, col, id] of [
      ['harvest_seasons', 'id', seasonId], ['harvest_workers', 'id', workerId],
      ['harvest_records', 'season_id', seasonId], ['harvest_payments', 'season_id', seasonId],
      ['harvest_season_workers', 'season_id', seasonId],
    ] as const) {
      const { data } = await stranger.client.from(table).select('id').eq(col, id)
      expect(data ?? [], `сторонній бачить ${table}`).toEqual([])
    }
    const rec = await stranger.client.from('harvest_records').insert({ worker_id: workerId, season_id: seasonId, weight_kg: 1, price_per_kg: 1 })
    expect(rec.error, 'сторонній записав збір').not.toBeNull()
    const pay = await stranger.client.from('harvest_payments').insert({ worker_id: workerId, season_id: seasonId, amount: 1, status: 'pending' })
    expect(pay.error, 'сторонній записав виплату').not.toBeNull()
    const sw = await stranger.client.from('harvest_season_workers').insert({ season_id: seasonId, worker_id: workerId })
    expect(sw.error, 'сторонній додав збирача в сезон').not.toBeNull()
  })

  test('сторінки власника і кабінет збирача', async ({ page, browser }) => {
    test.setTimeout(120_000)
    await login(page, 'farmer')
    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)
    await page.goto('/dashboard/harvest?tab=workers')
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    await expect(page.getByText(TAG).first(), 'немає збирача в списку').toBeVisible({ timeout: 10_000 })
    await page.goto(`/dashboard/harvest/${seasonId}`)
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    await expect(page.getByText(TAG).first(), 'немає збирача в сезоні').toBeVisible({ timeout: 10_000 })
    await page.goto(`/dashboard/harvest/workers/${workerId}`)
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    await expectNoErrors([...errors, ...apiErrors], 'сторінки збору власника')

    // Кабінет збирача: вхід за телефоном
    const ctx = await browser.newContext()
    const wp = await ctx.newPage()
    const wErrors = collectErrors(wp)
    const wApi = collectApiErrors(wp)
    await wp.goto('/harvest-worker')
    await wp.locator('input[type="tel"]').fill(PHONE)
    await wp.locator('input[type="password"]').fill(PASSWORD)
    await wp.locator('input[type="password"]').press('Enter')
    await expect(wp.getByText('Полуниця').first(), 'збирач не бачить свій сезон').toBeVisible({ timeout: 15_000 })
    await wp.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    await expectNoErrors([...wErrors, ...wApi], 'кабінет збирача')
    await ctx.close()
  })
})
