import { test, expect } from '@playwright/test'
import { account, asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Співробітник команди працює з даними господарства власника: редактор — як власник, переглядач — лише читає,
// видалений — нічого. Власник — фермер, співробітник — заготівельник (тимчасово додається в команду).
// Потрібна міграція 20261002_team_access.sql. ПИШЕ в базу — лише з E2E_WRITE=1; все прибирається сервісним ключем.

const TAG = `E2E ${Date.now()}`

test.describe('Команда: доступ до даних господарства', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('buyer'), 'потрібні E2E_FARMER_* і E2E_BUYER_*')
  test.describe.configure({ mode: 'serial' })

  const email = account('buyer').email.toLowerCase()
  let farmId = ''
  let chemId = ''
  const dealIds: string[] = []

  const setRole = async (role: 'editor' | 'viewer') => {
    const farmer = await asUser('farmer')
    const { error } = await farmer.client.rpc('upsert_team_member', { p_owner_id: farmer.userId, p_email: email, p_role: role, p_position: null })
    expect(error).toBeNull()
  }

  test.beforeAll(async () => {
    const farmer = await asUser('farmer')
    const member = await asUser('buyer')
    const admin = serviceClient()
    const { data: existing } = await admin.from('team_members').select('id').eq('owner_id', farmer.userId).eq('email', email)
    test.skip(!!existing?.length, 'заготівельник уже в команді тестового фермера')
    await setRole('editor')
    const { data: row } = await admin.from('team_members').select('token').eq('owner_id', farmer.userId).eq('email', email).single()
    const { error } = await member.client.rpc('accept_team_invite', { p_token: row!.token, p_name: null })
    expect(error).toBeNull()

    const { data: farm } = await farmer.client.from('farms').insert({ user_id: farmer.userId, name: `${TAG} поле`, hectares: 10 }).select('id').single()
    farmId = farm!.id
    const { data: chem } = await farmer.client.from('farm_inventory').insert({ user_id: farmer.userId, name: `${TAG} гербіцид`, quantity: 0, unit: 'л' }).select('id').single()
    chemId = chem!.id
    await farmer.client.from('farm_inventory_log').insert({ inventory_id: chemId, user_id: farmer.userId, type: 'in', quantity: 50 })
  })

  test.afterAll(async () => {
    const admin = serviceClient()
    const { userId } = await asUser('farmer')
    await admin.from('team_members').delete().eq('owner_id', userId).eq('email', email)
    if (dealIds.length) await admin.from('deals').delete().in('id', dealIds)
    await admin.from('manual_sales').delete().eq('user_id', userId).like('crop_type', `${TAG}%`)
    await admin.from('farm_inventory').delete().eq('user_id', userId).like('name', `${TAG}%`)
    const fuels = (await admin.from('fuel_inventory').select('id').eq('user_id', userId).like('fuel_type', `${TAG}%`)).data ?? []
    if (fuels.length) await admin.from('fuel_log').delete().in('fuel_id', fuels.map(f => f.id))
    await admin.from('fuel_inventory').delete().eq('user_id', userId).like('fuel_type', `${TAG}%`)
    await admin.from('equipment').delete().eq('user_id', userId).like('name', `${TAG}%`)
    await admin.from('reminders').delete().eq('user_id', userId).like('description', `${TAG}%`)
    await admin.from('field_treatments').delete().eq('user_id', userId).like('product_name', `${TAG}%`)
    await admin.from('expenses').delete().eq('user_id', userId).like('description', `${TAG}%`)
    await admin.from('harvest_seasons').delete().eq('owner_id', userId).like('crop', `${TAG}%`)
    const farms = (await admin.from('farms').select('id').eq('user_id', userId).like('name', `${TAG}%`)).data ?? []
    if (farms.length) {
      await admin.from('farm_crops').delete().in('farm_id', farms.map(f => f.id))
      await admin.from('farms').delete().in('id', farms.map(f => f.id))
    }
  })

  test('редактор працює з даними власника', async () => {
    const farmer = await asUser('farmer')
    const member = await asUser('buyer')
    const m = member.client
    const owner = farmer.userId

    // Склад: бачить, рухає, додає
    const { data: chem } = await m.from('farm_inventory').select('quantity').eq('id', chemId).single()
    expect(Number(chem?.quantity), 'редактор не бачить склад власника').toBe(50)
    expect((await m.from('farm_inventory_log').insert({ inventory_id: chemId, user_id: member.userId, type: 'out', quantity: 20 })).error).toBeNull()
    const { data: after } = await m.from('farm_inventory').select('quantity').eq('id', chemId).single()
    expect(Number(after!.quantity)).toBe(30)
    expect((await m.from('farm_inventory').insert({ user_id: owner, name: `${TAG} добриво`, quantity: 0, unit: 'кг' })).error).toBeNull()
    const { data: fuel, error: fuelErr } = await m.from('fuel_inventory').insert({ user_id: owner, fuel_type: `${TAG} Дизель`, quantity: 0, unit: 'л' }).select('id').single()
    expect(fuelErr).toBeNull()
    expect((await m.from('fuel_log').insert({ fuel_id: fuel!.id, user_id: member.userId, type: 'in', quantity: 100 })).error).toBeNull()
    expect((await m.from('equipment').insert({ user_id: owner, name: `${TAG} МТЗ`, type: 'Трактор', status: 'ok' })).error).toBeNull()

    // Поля, культури, журнал, нагадування, витрати, облік збору
    const upd = await m.from('farms').update({ hectares: 12 }).eq('id', farmId).select('id')
    expect(upd.data?.length, 'редактор не може змінити поле').toBe(1)
    expect((await m.from('farm_crops').insert({ farm_id: farmId, crop_type: 'Пшениця озима', area_ha: 5 })).error).toBeNull()
    expect((await m.from('field_treatments').insert({ user_id: owner, treatment_date: '2026-10-01', product_name: `${TAG} фунгіцид`, product_type: 'fungicide' })).error).toBeNull()
    expect((await m.from('reminders').insert({ user_id: owner, created_by: member.userId, description: `${TAG} обробка`, scheduled_date: new Date().toISOString(), type: 'обробка', from_agronomist: false })).error).toBeNull()
    expect((await m.from('expenses').insert({ user_id: owner, category: 'other', amount_uah: 100, expense_date: '2026-10-01', description: `${TAG} витрата` })).error).toBeNull()
    expect((await m.from('harvest_seasons').insert({ owner_id: owner, crop: `${TAG} полуниця`, price_per_kg: 10, status: 'active' })).error).toBeNull()

    // Підписку й команду власника не змінює
    await m.from('team_members').update({ role: 'editor' }).eq('owner_id', owner).neq('email', email)
    const sub = await m.from('subscriptions').update({ plan: 'business_pro' }).eq('user_id', owner).select('id')
    expect(sub.data ?? [], 'редактор змінив підписку власника').toEqual([])
  })

  test('угоди господарства: редактор бачить і веде ручні продажі, особистих дій немає', async ({ page, browser }) => {
    test.setTimeout(120_000)
    test.skip(!hasAccount('agronomist'), 'потрібен E2E_AGRONOMIST_* як сторонній покупець')
    const farmer = await asUser('farmer')
    const member = await asUser('buyer')
    const counterparty = await asUser('agronomist')
    const admin = serviceClient()

    // Угоди фермера з іншим покупцем (співробітник не є стороною угоди)
    for (const [status, crop] of [['confirmed', `${TAG} Пшениця`], ['completed', `${TAG} Соняшник`]] as const) {
      const { data } = await admin.from('deals').insert({
        farmer_id: farmer.userId, buyer_id: counterparty.userId, proposed_by: counterparty.userId,
        crop_type: crop, quantity_tons: 5, price_per_ton: 9000, status,
        confirmed_at: new Date().toISOString(), completed_at: status === 'completed' ? new Date().toISOString() : null,
      }).select('id').single()
      dealIds.push(data!.id)
    }
    const { data: seen } = await member.client.from('deals').select('id').in('id', dealIds)
    expect(seen?.length, 'співробітник не бачить угод господарства').toBe(2)
    const cancel = await member.client.from('deals').update({ status: 'cancelled' }).eq('id', dealIds[0]!).select('id')
    expect(cancel.data ?? [], 'співробітник скасував угоду власника').toEqual([])

    // deals.vue → saveManual від імені господарства
    const { data: sale, error } = await member.client.from('manual_sales').insert({
      user_id: farmer.userId, crop_type: `${TAG} Кукурудза`, quantity_tons: 2, sold_at: '2026-10-01',
    }).select('id').single()
    expect(error, 'редактор не може додати ручний продаж').toBeNull()

    await login(page, 'buyer')
    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)
    await page.goto('/dashboard/deals')
    await expect(page.getByText(`${TAG} Пшениця`).first(), 'угоди господарства не показано').toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(`${TAG} Кукурудза`).first(), 'ручні продажі господарства не показано').toBeVisible()
    await expect(page.getByRole('button', { name: /Накладна/ }), 'співробітнику показано накладну').toHaveCount(0)
    await expect(page.getByRole('button', { name: /Оцінити/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Додати вручну/ })).toBeVisible()
    await expectNoErrors([...errors, ...apiErrors], 'угоди співробітника')

    // Власник: завершену угоду скасувати не можна — кнопки немає
    const ownerCtx = await browser.newContext()
    const ownerPage = await ownerCtx.newPage()
    await login(ownerPage, 'farmer')
    await ownerPage.goto('/dashboard/deals')
    const completedRow = ownerPage.locator('div.flex.items-center.gap-4', { hasText: `${TAG} Соняшник` })
    await expect(completedRow).toBeVisible({ timeout: 15_000 })
    await expect(completedRow.getByRole('button', { name: 'Скасувати' }), 'скасування завершеної угоди').toHaveCount(0)
    const confirmedRow = ownerPage.locator('div.flex.items-center.gap-4', { hasText: `${TAG} Пшениця` })
    await expect(confirmedRow.getByRole('button', { name: 'Скасувати' })).toBeVisible()
    await ownerCtx.close()
    await admin.from('manual_sales').delete().eq('id', sale!.id)
  })

  test('переглядач лише читає', async () => {
    await setRole('viewer')
    const farmer = await asUser('farmer')
    const member = await asUser('buyer')
    const m = member.client

    const { data: chem } = await m.from('farm_inventory').select('quantity').eq('id', chemId).single()
    expect(Number(chem?.quantity), 'переглядач не бачить склад власника').toBe(30)
    expect((await m.from('farm_inventory_log').insert({ inventory_id: chemId, user_id: member.userId, type: 'out', quantity: 5 })).error, 'переглядач списав зі складу').not.toBeNull()
    expect((await m.from('farm_inventory').insert({ user_id: farmer.userId, name: `${TAG} чуже`, quantity: 0, unit: 'л' })).error, 'переглядач додав на склад').not.toBeNull()
    expect((await m.from('farms').update({ hectares: 99 }).eq('id', farmId).select('id')).data ?? []).toEqual([])
    expect((await m.from('expenses').insert({ user_id: farmer.userId, category: 'other', amount_uah: 1, expense_date: '2026-10-01', description: `${TAG} переглядач` })).error).not.toBeNull()
    const { data: rem } = await m.from('reminders').select('id').eq('user_id', farmer.userId).like('description', `${TAG}%`)
    expect(rem?.length, 'переглядач не бачить нагадувань власника').toBe(1)
  })

  test('у браузері співробітник одразу бачить склад власника', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page, 'buyer')
    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)
    await page.goto('/dashboard/inventory/chemicals')
    await expect(page.getByText(`${TAG} гербіцид`).first(), 'склад власника не показано').toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Ви переглядаєте дані').first()).toBeVisible()
    // Переглядач: без кнопок запису
    await expect(page.getByRole('button', { name: /Витрачено/ })).toHaveCount(0)
    await page.goto('/dashboard/inventory/fuel')
    await expect(page.getByText(`${TAG} Дизель`).first(), 'пальне власника не показано').toBeVisible({ timeout: 15_000 })
    await page.goto('/dashboard/inventory/equipment')
    await expect(page.getByText(`${TAG} МТЗ`).first(), 'техніку власника не показано').toBeVisible({ timeout: 15_000 })
    await expectNoErrors([...errors, ...apiErrors], 'склад співробітника')
  })

  test('видалений співробітник більше нічого не бачить', async () => {
    const farmer = await asUser('farmer')
    const member = await asUser('buyer')
    await farmer.client.from('team_members').delete().eq('owner_id', farmer.userId).eq('email', email)
    const { data } = await member.client.from('farm_inventory').select('id').eq('id', chemId)
    expect(data ?? [], 'видалений співробітник бачить склад').toEqual([])
  })
})
