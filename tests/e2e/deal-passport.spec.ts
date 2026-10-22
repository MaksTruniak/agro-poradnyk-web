import { test, expect } from '@playwright/test'
import { asUser, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'
import { waitingCheck } from '../../shared/utils/dealPassport'

// Паспорт партії в угоді: фермер бачить і відкриває, заготівельник — лише відкритий, сторонній — ні.
// ПИШЕ в базу, тому лише з E2E_WRITE=1; після тесту все прибирається сервісним ключем.

const TAG = `E2E паспорт ${Date.now()}`
const today = new Date().toLocaleDateString('sv-SE')
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toLocaleDateString('sv-SE')

test('строк очікування: порушено, дотримано, невідомо', () => {
  const t = (date: string, waiting_days: number | null, type = 'захист') => ({ date, product_name: 'X', type, waiting_days, source: 'journal' as const })
  expect(waitingCheck([], '2026-07-10').status).toBe('none')
  expect(waitingCheck([t('2026-07-01', 20)], '2026-07-10')).toMatchObject({ status: 'violated', latest: { from: '2026-07-21' } })
  expect(waitingCheck([t('2026-06-01', 20)], '2026-07-10')).toMatchObject({ status: 'ok', unknown: 0 })
  expect(waitingCheck([t('2026-06-01', null)], '2026-07-10')).toMatchObject({ status: 'ok', unknown: 1 })
  // Підживлення строку не потребує; обробки після дати відвантаження не враховуються
  expect(waitingCheck([t('2026-07-05', null, 'підживлення'), t('2026-07-20', 30)], '2026-07-10').status).toBe('none')
})

test.describe('Паспорт партії', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('buyer'), 'потрібні E2E_FARMER_* і E2E_BUYER_*')
  test.describe.configure({ mode: 'serial' })

  let farmId = ''
  let cropId = ''
  let dealId = ''

  test.afterAll(async () => {
    const admin = serviceClient()
    if (dealId) await admin.from('deals').delete().eq('id', dealId)
    if (farmId) {
      const { data: progs } = await admin.from('protection_programs').select('id').eq('farm_crop_id', cropId)
      const pids = (progs ?? []).map(p => p.id)
      if (pids.length) {
        await admin.from('program_treatments').delete().in('program_id', pids)
        await admin.from('protection_programs').delete().in('id', pids)
      }
      await admin.from('field_treatments').delete().eq('farm_id', farmId)
      await admin.from('planting_phases').delete().eq('farm_crop_id', cropId)
      await admin.from('farm_crops').delete().eq('farm_id', farmId)
      await admin.from('farms').delete().eq('id', farmId)
    }
  })

  test('фермер відкриває паспорт, заготівельник бачить лише відкритий', async () => {
    const farmer = await asUser('farmer')
    const buyer = await asUser('buyer')
    const admin = serviceClient()

    const { data: farm } = await farmer.client.from('farms').insert({ user_id: farmer.userId, name: TAG, hectares: 2, address: 'вул. Таємна, 1' }).select('id').single()
    farmId = farm!.id
    const { data: crop } = await farmer.client.from('farm_crops')
      .insert({ farm_id: farmId, crop_type: 'Лохина', variety: 'Блюкроп', area_ha: 2, planting_year: 2021, show_in_catalog: false }).select('id').single()
    cropId = crop!.id

    // Техкарта: фунгіцид 3 дні тому зі строком 20 днів — строк ще не минув
    const { data: prog } = await farmer.client.from('protection_programs').insert({ farm_crop_id: cropId, name: 'Програма' }).select('id').single()
    const tr = await farmer.client.from('program_treatments').insert({
      program_id: prog!.id, phase: 'Цвітіння', phase_order: 5, type: 'захист', product_name: 'Світч', dosage: '1 кг/га',
      status: 'done', done_at: daysAgo(3), waiting_days: 20, notes: 'приватна примітка',
    })
    expect(tr.error).toBeNull()
    // Журнал: підживлення на цьому полі, і обробка іншої культури — не має потрапити
    await farmer.client.from('field_treatments').insert([
      { user_id: farmer.userId, farm_id: farmId, farm_name: TAG, crop_type: 'Лохина', treatment_date: daysAgo(10), product_name: 'Кальцієва селітра', product_type: 'підживлення', dose_per_ha: 5, unit: 'кг' },
      { user_id: farmer.userId, farm_id: farmId, farm_name: TAG, crop_type: 'Малина', treatment_date: daysAgo(5), product_name: 'Чужий препарат', product_type: 'захист' },
    ])
    await farmer.client.from('planting_phases').insert({ farm_crop_id: cropId, phase_key: 'Цвітіння', observed_at: daysAgo(20) })

    const { data: deal, error } = await admin.from('deals').insert({
      farmer_id: farmer.userId, buyer_id: buyer.userId, farm_crop_id: cropId, crop_type: 'Лохина',
      quantity_tons: 1.5, price_per_ton: 90000, status: 'confirmed', confirmed_at: new Date().toISOString(),
    }).select('id').single()
    expect(error).toBeNull()
    dealId = deal!.id

    // Фермер бачить повний паспорт
    const { data: own } = await farmer.client.rpc('deal_passport', { p_deal_id: dealId })
    expect(own).toMatchObject({ shared: false, can_share: true, crop: { crop_type: 'Лохина', variety: 'Блюкроп', planting_year: 2021 } })
    expect(own.treatments.map((t: any) => t.product_name).sort()).toEqual(['Кальцієва селітра', 'Світч'])
    expect(JSON.stringify(own)).not.toContain('приватна примітка')
    expect(JSON.stringify(own)).not.toContain('Таємна')
    expect(own.phases).toHaveLength(1)

    // Заготівельник: поки закрито — лише угода; журнали напряму теж не видно
    const { data: closed } = await buyer.client.rpc('deal_passport', { p_deal_id: dealId })
    expect(closed).toMatchObject({ shared: false, can_share: false, crop: null })
    expect(closed.treatments).toBeUndefined()
    const { data: direct } = await buyer.client.from('program_treatments').select('id').eq('program_id', prog!.id)
    expect(direct ?? []).toEqual([])
    const forged = await buyer.client.rpc('share_deal_passport', { p_deal_id: dealId, p_shared: true })
    expect(forged.error, 'заготівельник відкрив паспорт сам').not.toBeNull()
    const forgedRow = await buyer.client.from('deal_passport_shares').insert({ deal_id: dealId })
    expect(forgedRow.error).not.toBeNull()

    // Сторонній нічого не бачить
    if (hasAccount('agronomist')) {
      const stranger = await asUser('agronomist')
      const { data: none } = await stranger.client.rpc('deal_passport', { p_deal_id: dealId })
      expect(none).toBeNull()
    }

    // Фермер відкриває — заготівельник бачить обробки
    const share = await farmer.client.rpc('share_deal_passport', { p_deal_id: dealId, p_shared: true })
    expect(share.error).toBeNull()
    const { data: open } = await buyer.client.rpc('deal_passport', { p_deal_id: dealId })
    expect(open).toMatchObject({ shared: true, crop: { variety: 'Блюкроп' } })
    expect(open.treatments).toHaveLength(2)
    expect(waitingCheck(open.treatments, today).status).toBe('violated')
  })

  test('сторінка паспорта: заготівельник бачить строк очікування, фермер закриває доступ', async ({ browser }) => {
    const bctx = await browser.newContext()
    const bpage = await bctx.newPage()
    const errors = collectErrors(bpage)
    await login(bpage, 'buyer')
    await bpage.goto('/dashboard/deals')
    await bpage.locator(`[data-test="deal-passport-link"][href="/dashboard/deal-passport/${dealId}"]`).click()
    await expect(bpage.locator('[data-test="passport-waiting"]')).toHaveAttribute('data-status', 'violated')
    await expect(bpage.locator('[data-test="passport-waiting"]')).toContainText('Світч')
    await expect(bpage.locator('[data-test="passport-treatment"]')).toHaveCount(2)
    await expect(bpage.locator('[data-test="passport-share"]')).toHaveCount(0)
    await expectNoErrors(errors, 'паспорт партії (заготівельник)')

    const fctx = await browser.newContext()
    const fpage = await fctx.newPage()
    await login(fpage, 'farmer')
    await fpage.goto(`/dashboard/deal-passport/${dealId}`)
    await expect(fpage.locator('[data-test="passport-share"]')).toContainText('Заготівельник бачить паспорт')
    await fpage.locator('[data-test="passport-share-toggle"]').click()
    await expect(fpage.locator('[data-test="passport-share"]')).toContainText('Паспорт бачите лише ви')

    await bpage.reload()
    await expect(bpage.locator('[data-test="passport-empty"]')).toContainText('ще не відкрив')
    await bctx.close()
    await fctx.close()
  })
})
