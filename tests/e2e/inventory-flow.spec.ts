import { test, expect } from '@playwright/test'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Склад фермера: хімія, пальне, техніка (з журналами руху). Запити повторюють сторінки сайту.
// Сторонній користувач — заготівельник. ПИШЕ в базу, тому лише з E2E_WRITE=1; прибирається сервісним ключем.

const TAG = `E2E ${Date.now()}`

test.describe('Склад: хімія, пальне, техніка', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('buyer'), 'потрібні E2E_FARMER_* і E2E_BUYER_*')
  test.describe.configure({ mode: 'serial' })

  let chemId = ''
  let fuelId = ''

  test.afterAll(async () => {
    const admin = serviceClient()
    const { userId } = await asUser('farmer')
    if (chemId) await admin.from('farm_inventory_log').delete().eq('inventory_id', chemId)
    if (fuelId) await admin.from('fuel_log').delete().eq('fuel_id', fuelId)
    await admin.from('farm_inventory').delete().eq('user_id', userId).like('name', `${TAG}%`)
    await admin.from('fuel_inventory').delete().eq('user_id', userId).like('fuel_type', `${TAG}%`)
    await admin.from('equipment').delete().eq('user_id', userId).like('name', `${TAG}%`)
  })

  test('хімія: прихід, витрата, бачить лише власник', async () => {
    const farmer = await asUser('farmer')
    const stranger = await asUser('buyer')

    // chemicals.vue → addItem
    const { data, error } = await farmer.client.from('farm_inventory').insert({
      user_id: farmer.userId, name: `${TAG} гербіцид`, quantity: 100, unit: 'л', farm_id: null, min_quantity: 10,
    }).select().single()
    expect(error).toBeNull()
    chemId = data!.id
    const inLog = await farmer.client.from('farm_inventory_log').insert({ inventory_id: chemId, user_id: farmer.userId, type: 'in', quantity: 100 })
    expect(inLog.error).toBeNull()

    // chemicals.vue → saveLog
    const out = await farmer.client.from('farm_inventory_log')
      .insert({ inventory_id: chemId, user_id: farmer.userId, type: 'out', quantity: 30, field_id: null, note: 'обробка' })
    expect(out.error).toBeNull()
    const upd = await farmer.client.from('farm_inventory').update({ quantity: 70 }).eq('id', chemId)
    expect(upd.error).toBeNull()

    const { data: hidden } = await stranger.client.from('farm_inventory').select('id').eq('id', chemId)
    expect(hidden ?? [], 'сторонній бачить склад').toEqual([])
    const { data: logHidden } = await stranger.client.from('farm_inventory_log').select('id').eq('inventory_id', chemId)
    expect(logHidden ?? [], 'сторонній бачить журнал складу').toEqual([])
    const forgedLog = await stranger.client.from('farm_inventory_log').insert({ inventory_id: chemId, user_id: stranger.userId, type: 'out', quantity: 70 })
    expect(forgedLog.error, 'сторонній списав хімію зі складу фермера').not.toBeNull()
    await stranger.client.from('farm_inventory').update({ quantity: 0 }).eq('id', chemId)
    const { data: now } = await farmer.client.from('farm_inventory').select('quantity').eq('id', chemId).single()
    expect(Number(now!.quantity), 'сторонній змінив залишок').toBe(70)
  })

  test('пальне: прихід і заправка, бачить лише власник', async () => {
    const farmer = await asUser('farmer')
    const stranger = await asUser('buyer')

    // fuel.vue → addItem
    const { data, error } = await farmer.client.from('fuel_inventory').insert({
      user_id: farmer.userId, fuel_type: `${TAG} Дизель`, quantity: 1000, unit: 'л', price_per_unit: 55, min_quantity: 100,
    }).select().single()
    expect(error).toBeNull()
    fuelId = data!.id
    expect((await farmer.client.from('fuel_log').insert({ fuel_id: fuelId, user_id: farmer.userId, type: 'in', quantity: 1000 })).error).toBeNull()

    // fuel.vue → saveLog
    const out = await farmer.client.from('fuel_log')
      .insert({ fuel_id: fuelId, user_id: farmer.userId, type: 'out', quantity: 200, vehicle: 'МТЗ-82', note: null })
    expect(out.error).toBeNull()
    expect((await farmer.client.from('fuel_inventory').update({ quantity: 800 }).eq('id', fuelId)).error).toBeNull()

    const { data: hidden } = await stranger.client.from('fuel_inventory').select('id').eq('id', fuelId)
    expect(hidden ?? [], 'сторонній бачить пальне').toEqual([])
    const { data: logHidden } = await stranger.client.from('fuel_log').select('id').eq('fuel_id', fuelId)
    expect(logHidden ?? [], 'сторонній бачить журнал пального').toEqual([])
    const forgedLog = await stranger.client.from('fuel_log').insert({ fuel_id: fuelId, user_id: stranger.userId, type: 'out', quantity: 800 })
    expect.soft(forgedLog.error, 'сторонній дописав журнал пального фермера (міграція 20261002_fuel_log_owner.sql)').not.toBeNull()
  })

  test('техніка: бачить і змінює лише власник', async () => {
    const farmer = await asUser('farmer')
    const stranger = await asUser('buyer')

    // equipment.vue → saveItem
    const { data, error } = await farmer.client.from('equipment').insert({
      name: `${TAG} трактор`, type: 'Трактор', year: 2015, status: 'ok', next_service_date: null, notes: null, user_id: farmer.userId,
    }).select('id').single()
    expect(error).toBeNull()
    const edit = await farmer.client.from('equipment').update({ status: 'repair' }).eq('id', data!.id).select('status').single()
    expect(edit.error).toBeNull()

    const { data: hidden } = await stranger.client.from('equipment').select('id').eq('id', data!.id)
    expect(hidden ?? [], 'сторонній бачить техніку').toEqual([])
    await stranger.client.from('equipment').delete().eq('id', data!.id)
    const { data: still } = await farmer.client.from('equipment').select('id').eq('id', data!.id)
    expect(still?.length, 'сторонній видалив техніку').toBe(1)
  })

  test('сторінки складу показують записи', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page, 'farmer')
    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)
    for (const [path, text] of [
      ['/dashboard/inventory/chemicals', `${TAG} гербіцид`],
      ['/dashboard/inventory/fuel', `${TAG} Дизель`],
      ['/dashboard/inventory/equipment', `${TAG} трактор`],
    ] as const) {
      await page.goto(path)
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
      await expect(page.getByText(text).first(), `${path} не показує запис`).toBeVisible({ timeout: 10_000 })
      await expectNoErrors([...errors, ...apiErrors], path)
    }
  })
})
