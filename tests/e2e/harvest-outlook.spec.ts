import { test, expect } from '@playwright/test'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'
import { addDays } from '../../shared/utils/weatherRisks'
import { createClient } from '@supabase/supabase-js'

// «Скоро урожай» для заготівельника і «Хто купує» для фермера. ПИШЕ в базу — лише з E2E_WRITE=1; усе прибирається.
// Потрібна міграція 20261023_variety_ripening.sql.

const TAG = `E2E ${Date.now()}`
const ddmm = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`

test.describe('Скоро урожай і попит', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('buyer'), 'потрібні E2E_FARMER_* і E2E_BUYER_*')

  let farmId = '', varietyId = '', demandId = ''

  test.afterAll(async () => {
    const admin = serviceClient()
    if (demandId) await admin.from('buyer_crops').delete().eq('id', demandId)
    if (farmId) { await admin.from('farm_crops').delete().eq('farm_id', farmId); await admin.from('farms').delete().eq('id', farmId) }
    if (varietyId) await admin.from('varieties').delete().eq('id', varietyId)
  })

  test('заготівельник бачить майбутній збір, фермер — попит', async ({ browser, request }) => {
    const farmer = await asUser('farmer')
    const buyer = await asUser('buyer')
    const admin = serviceClient()
    const today = new Date().toLocaleDateString('sv-SE')
    const from = addDays(today, 5), to = addDays(today, 20)
    test.skip(from.slice(0, 4) !== to.slice(0, 4), 'вікно через Новий рік')
    const variety = `${TAG} сорт`

    const { data: v } = await admin.from('varieties').insert({ crop_type: 'Лохина', name: variety, ripening: 'mid', harvest_from: from.slice(5), harvest_to: to.slice(5) }).select('id').single()
    varietyId = v!.id
    const { data: farm } = await farmer.client.from('farms').insert({ user_id: farmer.userId, name: TAG, region: 'Київська', hectares: 5 }).select('id').single()
    farmId = farm!.id
    const { error } = await farmer.client.from('farm_crops').insert([
      { farm_id: farmId, crop_type: 'Лохина', variety, area_ha: 2, planting_year: 2018, planned_yield_t: 5, show_in_catalog: true },
      { farm_id: farmId, crop_type: 'Лохина', variety, area_ha: 1, planting_year: 2018, planned_yield_t: 5, show_in_catalog: false },
    ])
    expect(error).toBeNull()

    // Прихована культура: не видно ні без входу, ні сторонньому (міграція 20261026_farm_crops_privacy.sql)
    const { data: own } = await farmer.client.from('farm_crops').select('id, show_in_catalog').eq('farm_id', farmId)
    const hiddenId = own!.find((c: any) => c.show_in_catalog === false)!.id
    const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!, { auth: { persistSession: false } })
    expect((await anon.from('farm_crops').select('id').eq('id', hiddenId)).data ?? [], 'прихована культура видна без входу').toEqual([])
    expect((await buyer.client.from('farm_crops').select('id').eq('id', hiddenId)).data ?? [], 'прихована культура видна сторонньому').toEqual([])
    expect((await anon.from('farm_crops').select('id').eq('farm_id', farmId)).data, 'відкрита культура не видна без входу').toHaveLength(1)
    const { data: catalog } = await anon.rpc('get_farmers_with_crops')
    expect((catalog || []).find((f: any) => f.id === farmer.userId)?.crops ?? [], 'каталог фермерів без культур').toContain('Лохина')

    const { data: d, error: dErr } = await buyer.client.from('buyer_crops').insert({ user_id: buyer.userId, crop_type: 'Лохина', min_qty: 2, max_qty: 10, unit: 'т', notes: `${TAG} купую` }).select('id').single()
    expect(dErr).toBeNull()
    demandId = d!.id

    // ── Заготівельник ──
    const bCtx = await browser.newContext()
    const bp = await bCtx.newPage()
    const errors = collectErrors(bp)
    const apiErrors = collectApiErrors(bp)
    await login(bp, 'buyer')
    await bp.goto('/dashboard/harvest-outlook')
    const rows = bp.locator('[data-test="outlook-row"]').filter({ hasText: variety })
    await expect(rows, 'прихована культура потрапила в «Скоро урожай»').toHaveCount(1, { timeout: 15000 })
    await expect(rows).toContainText('через 5 днів')
    await expect(rows).toContainText(`збір ~${ddmm(from)}`)
    await expect(rows).toContainText('~10 т за планом')
    await expect(rows).toContainText('Київська')
    await expectNoErrors(errors, '«Скоро урожай»')
    expect(apiErrors, apiErrors.join('\n')).toEqual([])
    await bCtx.close()

    // Щотижнева зведенка заготівельнику (без надсилання)
    if (process.env.CRON_SECRET) {
      const res = await request.get(`/api/cron/week-digest?dry=1&user=${buyer.userId}`, { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } })
      const body = await res.json()
      const mine = body.buyers.find((b: any) => b.buyerId === buyer.userId)
      expect(JSON.stringify(mine?.lines ?? []), 'немає насадження в зведенці').toContain(variety)
    }

    // ── Фермер ──
    const fCtx = await browser.newContext()
    const fp = await fCtx.newPage()
    const fErrors = collectErrors(fp)
    await login(fp, 'farmer')
    await fp.goto(`/dashboard/farm/${farmId}`)
    const chip = fp.locator('[data-test="demand-chip"]').first()
    await expect(chip).toContainText(/Шукають: \d+ заготівельник/, { timeout: 15000 })
    await chip.click()
    await expect(fp.locator('[data-test="demand-row"]').filter({ hasText: `${TAG} купую` })).toContainText('Лохина · 2–10 т')
    await expectNoErrors(fErrors, '«Хто купує»')
    await fCtx.close()
  })
})
