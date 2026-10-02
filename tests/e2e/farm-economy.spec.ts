import { test, expect } from '@playwright/test'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Журнал обробок, нагадування, економіка (витрати й ручні продажі) та аналітика фермера.
// Запити повторюють сторінки сайту; сторонній користувач — заготівельник.
// ПИШЕ в базу, тому лише з E2E_WRITE=1; після тесту все прибирається сервісним ключем.

const TAG = `E2E ${Date.now()}`


test.describe('Обробки, нагадування, економіка', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('buyer'), 'потрібні E2E_FARMER_* і E2E_BUYER_*')
  test.describe.configure({ mode: 'serial' })

  test.afterAll(async () => {
    const admin = serviceClient()
    const { userId } = await asUser('farmer')
    await admin.from('field_treatments').delete().eq('user_id', userId).like('product_name', `${TAG}%`)
    await admin.from('reminders').delete().eq('user_id', userId).like('description', `${TAG}%`)
    await admin.from('expenses').delete().eq('user_id', userId).like('description', `${TAG}%`)
    await admin.from('manual_sales').delete().eq('user_id', userId).like('crop_type', `${TAG}%`)
  })

  test('журнал обробок і нагадування до обробки', async () => {
    const farmer = await asUser('farmer')
    const stranger = await asUser('buyer')

    // treatments.vue → saveItem
    const { data: t, error } = await farmer.client.from('field_treatments').insert({
      user_id: farmer.userId, farm_id: null, farm_name: 'Поле 1', crop_type: 'Пшениця озима',
      treatment_date: new Date().toISOString().slice(0, 10), product_name: `${TAG} фунгіцид`, product_type: 'fungicide',
      dose_per_ha: 0.5, area_ha: 10, total_amount: 5, unit: 'л', notes: null,
    }).select('id').single()
    expect(error).toBeNull()

    const rem = await farmer.client.from('reminders').insert({
      user_id: farmer.userId, created_by: farmer.userId, description: `${TAG} фунгіцид`, type: 'обробка',
      scheduled_date: new Date(Date.now() + 86_400_000).toISOString(), from_agronomist: false,
    })
    expect(rem.error, 'нагадування до обробки не створюється').toBeNull()

    const { data: tHidden } = await stranger.client.from('field_treatments').select('id').eq('id', t!.id)
    expect(tHidden ?? [], 'сторонній бачить журнал обробок').toEqual([])
    const tForged = await stranger.client.from('field_treatments')
      .insert({ user_id: farmer.userId, treatment_date: '2026-01-01', product_name: 'чуже', product_type: 'other' })
    expect(tForged.error, 'сторонній записав обробку фермеру').not.toBeNull()
    await stranger.client.from('field_treatments').update({ product_name: 'зламано' }).eq('id', t!.id)
    await stranger.client.from('field_treatments').delete().eq('id', t!.id)
    const { data: tNow } = await farmer.client.from('field_treatments').select('product_name').eq('id', t!.id).single()
    expect(tNow?.product_name, 'сторонній змінив або видалив обробку').toBe(`${TAG} фунгіцид`)

    const { data: remHidden } = await stranger.client.from('reminders').select('id').eq('user_id', farmer.userId)
    expect(remHidden ?? [], 'сторонній бачить нагадування фермера').toEqual([])
  })

  test('нагадування: виконання переносить запис у журнал', async () => {
    const farmer = await asUser('farmer')
    const stranger = await asUser('buyer')

    // reminders.vue → addReminder (з даними для журналу)
    const { data: r, error } = await farmer.client.from('reminders').insert({
      user_id: farmer.userId, description: `${TAG} підживлення`, scheduled_date: new Date().toISOString(),
      type: 'підживлення', from_agronomist: false,
      journal_data: { farm_name: 'Поле 1', crop_type: 'Пшениця озима', product_name: `${TAG} селітра`, product_type: 'fertilizer', dose_per_ha: 100, unit: 'кг' },
    }).select('id, scheduled_date, journal_data').single()
    expect(error).toBeNull()

    await stranger.client.from('reminders').update({ completed_at: new Date().toISOString() }).eq('id', r!.id)
    const { data: notDone } = await farmer.client.from('reminders').select('completed_at').eq('id', r!.id).single()
    expect(notDone?.completed_at, 'сторонній позначив нагадування виконаним').toBeNull()

    // reminders.vue → markDone
    const jd = r!.journal_data as any
    const j = await farmer.client.from('field_treatments').insert({
      user_id: farmer.userId, farm_id: null, farm_name: jd.farm_name, crop_type: jd.crop_type,
      treatment_date: new Date(r!.scheduled_date).toISOString().slice(0, 10), product_name: jd.product_name,
      product_type: jd.product_type, dose_per_ha: jd.dose_per_ha, area_ha: null, total_amount: null, unit: jd.unit,
    })
    expect(j.error).toBeNull()
    const done = await farmer.client.from('reminders').update({ completed_at: new Date().toISOString() }).eq('id', r!.id)
    expect(done.error).toBeNull()
  })

  test('економіка: витрати й дохід бачить лише власник', async () => {
    const farmer = await asUser('farmer')
    const stranger = await asUser('buyer')

    // expenses.vue → saveExpense
    const { data: exp, error } = await farmer.client.from('expenses').insert({
      user_id: farmer.userId, farm_id: null, crop_type: 'Пшениця озима', category: 'fertilizer',
      description: `${TAG} добрива`, amount_uah: 12000, expense_date: new Date().toISOString().slice(0, 10),
    }).select('id').single()
    expect(error).toBeNull()

    // expenses.vue → saveIncome
    const income = await farmer.client.from('manual_sales').insert({
      user_id: farmer.userId, crop_type: `${TAG} Пшениця`, quantity_tons: 10, price_per_ton: 8000,
      sold_at: new Date().toISOString().slice(0, 10),
    }).select('id').single()
    expect(income.error, 'дохід в Економіці не зберігається').toBeNull()

    // deals.vue → ручний продаж зі сторінки угод теж має бути в Економіці
    const { data: dealsSale, error: dsErr } = await farmer.client.from('manual_sales').insert({
      user_id: farmer.userId, crop_type: `${TAG} Соняшник`, quantity_tons: 2, price_per_ton: 15000,
      sold_at: new Date().toISOString().slice(0, 10), buyer_name: 'Тест', buyer_iban: 'UA000000000000000000000000000',
    }).select('id, status').single()
    expect(dsErr).toBeNull()

    const { data: listed } = await farmer.client.from('manual_sales').select('id')
      .eq('user_id', farmer.userId).neq('status', 'cancelled').like('crop_type', `${TAG}%`)
    expect(listed?.length).toBe(2)

    const { data: expHidden } = await stranger.client.from('expenses').select('id').eq('id', exp!.id)
    expect(expHidden ?? [], 'сторонній бачить витрати').toEqual([])
    const { data: salesHidden } = await stranger.client.from('manual_sales').select('buyer_iban').eq('user_id', farmer.userId)
    expect(salesHidden ?? [], 'сторонній бачить продажі й реквізити покупців').toEqual([])
    const forged = await stranger.client.from('expenses')
      .insert({ user_id: farmer.userId, category: 'other', amount_uah: 1, expense_date: '2026-01-01' })
    expect(forged.error, 'сторонній записав витрату фермеру').not.toBeNull()
    await stranger.client.from('manual_sales').update({ status: 'cancelled' }).eq('id', dealsSale!.id)
    const { data: saleNow } = await farmer.client.from('manual_sales').select('status').eq('id', dealsSale!.id).single()
    expect(saleNow?.status, 'сторонній скасував продаж фермера').toBe(dealsSale!.status)
  })

  test('сторінки відкриваються без помилок і показують записи', async ({ page }) => {
    test.setTimeout(120_000)
    await login(page, 'farmer')
    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)

    const checks: [string, string][] = [
      ['/dashboard/treatments', `${TAG} фунгіцид`],
      ['/dashboard/reminders', `${TAG} фунгіцид`],
      ['/dashboard/expenses', `${TAG} добрива`],
      ['/dashboard/analytics', ''],
      ['/dashboard/deals', ''],
    ]
    for (const [path, text] of checks) {
      await page.goto(path)
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
      await page.waitForTimeout(800)
      await expectNoErrors(errors, path)
      expect(apiErrors, `Помилки Supabase на ${path}:\n${apiErrors.join('\n')}`).toEqual([])
      if (text) await expect(page.getByText(text).first(), `${path} не показує запис`).toBeVisible()
    }
  })
})
