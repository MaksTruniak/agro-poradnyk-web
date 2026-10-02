import { test, expect } from '@playwright/test'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Поля, культури, сівозміна і технологічна карта фермера.
// Сторонній користувач — заготівельник (без співпраці з фермером).
// ПИШЕ в базу, тому лише з E2E_WRITE=1; після тесту все прибирається сервісним ключем.

const TAG = `E2E ${Date.now()}`



test.describe('Поля, культури, техкарта', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('buyer'), 'потрібні E2E_FARMER_* і E2E_BUYER_*')
  test.describe.configure({ mode: 'serial' })

  let farmId = ''
  let cropId = ''
  let programId = ''
  let treatmentId = ''
  const phaseKeys: string[] = []
  const varietyNames: string[] = []

  test.afterAll(async () => {
    const admin = serviceClient()
    if (treatmentId) await admin.from('reminders').delete().eq('treatment_id', treatmentId)
    if (farmId) {
      const { data: crops } = await admin.from('farm_crops').select('id').eq('farm_id', farmId)
      const cropIds = (crops ?? []).map(c => c.id)
      const { data: progs } = await admin.from('protection_programs').select('id').in('farm_crop_id', cropIds)
      const progIds = (progs ?? []).map(p => p.id)
      if (progIds.length) {
        await admin.from('program_treatments').delete().in('program_id', progIds)
        await admin.from('protection_programs').delete().in('id', progIds)
      }
      await admin.from('crop_rotation').delete().eq('farm_id', farmId)
      await admin.from('farm_crops').delete().eq('farm_id', farmId)
      await admin.from('farms').delete().eq('id', farmId)
    }
    if (phaseKeys.length) await admin.from('growth_phases').delete().in('key', phaseKeys)
    if (varietyNames.length) await admin.from('varieties').delete().in('name', varietyNames)
  })

  test('поле: адреса й кадастр лише у власника', async () => {
    const farmer = await asUser('farmer')
    const stranger = await asUser('buyer')

    const { data: farm, error } = await farmer.client.from('farms').insert({
      user_id: farmer.userId, name: TAG, region: 'Київська', city: 'Біла Церква',
      hectares: 50, cadastral_number: '3220400000:01:001:0001', address: 'вул. Тестова, 1',
    }).select('id').single()
    expect(error).toBeNull()
    farmId = farm!.id

    const { data: hidden } = await stranger.client.from('farms').select('id').eq('id', farmId)
    expect(hidden ?? [], 'сторонній бачить приватні дані поля').toEqual([])

    const { data: pub } = await stranger.client.from('public_farms').select('*').eq('id', farmId).single()
    expect(pub).toMatchObject({ name: TAG, hectares: 50 })
    expect(pub).not.toHaveProperty('cadastral_number')
    expect(pub).not.toHaveProperty('address')

    await stranger.client.from('farms').update({ name: 'зламано' }).eq('id', farmId)
    await stranger.client.from('farms').delete().eq('id', farmId)
    const { data: still } = await farmer.client.from('farms').select('name').eq('id', farmId).single()
    expect(still?.name, 'сторонній змінив або видалив поле').toBe(TAG)

    const forged = await stranger.client.from('farms').insert({ user_id: farmer.userId, name: 'чуже поле', hectares: 1 })
    expect(forged.error, 'сторонній створив поле від імені фермера').not.toBeNull()
  })

  test('культури й сівозміна: пише лише власник поля', async () => {
    const farmer = await asUser('farmer')
    const stranger = await asUser('buyer')

    const { data: crop, error } = await farmer.client.from('farm_crops').insert({
      farm_id: farmId, crop_type: 'Пшениця озима', variety: null, area_ha: 20,
      planned_yield_t: 6, stock_quantity: 100, stock_unit: 'т', show_in_catalog: true,
    }).select('id').single()
    expect(error).toBeNull()
    cropId = crop!.id

    const foreignCrop = await stranger.client.from('farm_crops').insert({ farm_id: farmId, crop_type: 'Бур\'ян', area_ha: 1 })
    expect(foreignCrop.error, 'сторонній додав культуру на чуже поле').not.toBeNull()
    await stranger.client.from('farm_crops').update({ stock_quantity: 0, area_ha: 999 }).eq('id', cropId)
    await stranger.client.from('farm_crops').delete().eq('id', cropId)
    const { data: cropNow } = await farmer.client.from('farm_crops').select('stock_quantity, area_ha').eq('id', cropId).single()
    expect(cropNow, 'сторонній змінив або видалив культуру').toMatchObject({ stock_quantity: 100, area_ha: 20 })

    // Свою культуру фермер не може «перенести» на чуже поле
    const { data: otherFarm } = await stranger.client.from('public_farms').select('id').neq('user_id', farmer.userId).limit(1)
    if (otherFarm?.length) {
      await farmer.client.from('farm_crops').update({ farm_id: otherFarm[0]!.id }).eq('id', cropId)
      const { data: moved } = await serviceClient().from('farm_crops').select('farm_id').eq('id', cropId).single()
      expect(moved!.farm_id, 'фермер переніс культуру на чуже поле').toBe(farmId)
    }

    const rot = await farmer.client.from('crop_rotation')
      .insert({ farm_id: farmId, year: 2025, crop_type: 'Соняшник', area_ha: 20, actual_yield_t: 3 }).select('id').single()
    expect(rot.error).toBeNull()

    const { data: rotHidden } = await stranger.client.from('crop_rotation').select('id').eq('farm_id', farmId)
    expect(rotHidden ?? [], 'сторонній бачить сівозміну').toEqual([])
    const rotForged = await stranger.client.from('crop_rotation').insert({ farm_id: farmId, year: 2024, crop_type: 'Кукурудза' })
    expect(rotForged.error, 'сторонній записав сівозміну на чуже поле').not.toBeNull()
  })

  test('сорти: фермер додає новий, але не змінює довідник', async () => {
    const farmer = await asUser('farmer')
    const name = `${TAG} сорт`
    const add = await farmer.client.from('varieties').insert({ crop_type: 'Пшениця озима', name })
    expect(add.error).toBeNull()
    varietyNames.push(name)

    const { data: existing } = await farmer.client.from('varieties').select('id, name').neq('name', name).limit(1).single()
    if (existing) {
      await farmer.client.from('varieties').update({ name: 'зламано' }).eq('id', existing.id)
      await farmer.client.from('varieties').delete().eq('id', existing.id)
      const { data: kept } = await serviceClient().from('varieties').select('name').eq('id', existing.id).single()
      expect(kept?.name, 'фермер змінив або видалив сорт з довідника').toBe(existing.name)
    }
  })

  test('техкарта: програма й обробки лише власника', async () => {
    const farmer = await asUser('farmer')
    const stranger = await asUser('buyer')

    // Чужу програму на культуру фермера створити не можна
    const forgedProg = await stranger.client.from('protection_programs').insert({ farm_crop_id: cropId, name: 'чужа програма' })
    expect(forgedProg.error, 'сторонній створив техкарту для чужої культури').not.toBeNull()

    // Так створює програму сторінка техкарти
    const { data: prog, error } = await farmer.client.from('protection_programs').upsert({
      farm_crop_id: cropId, name: 'Програма для Пшениця озима', description: 'E2E',
    }, { onConflict: 'farm_crop_id' }).select('id').single()
    expect(error).toBeNull()
    programId = prog!.id

    const { data: t, error: tErr } = await farmer.client.from('program_treatments').insert({
      program_id: programId, phase: 'Кущіння', phase_order: 3, type: 'захист', product_name: 'Тест-фунгіцид', dosage: '0.5',
    }).select('id, status').single()
    expect(tErr).toBeNull()
    treatmentId = t!.id

    const st = await farmer.client.from('program_treatments').update({ status: 'done' }).eq('id', treatmentId).select('status').single()
    expect(st.data?.status).toBe('done')

    const { data: progHidden } = await stranger.client.from('protection_programs').select('id').eq('id', programId)
    expect(progHidden ?? [], 'сторонній бачить техкарту фермера').toEqual([])
    const { data: tHidden } = await stranger.client.from('program_treatments').select('id').eq('program_id', programId)
    expect(tHidden ?? [], 'сторонній бачить обробки фермера').toEqual([])

    const foreignT = await stranger.client.from('program_treatments').insert({ program_id: programId, type: 'захист', product_name: 'чуже' })
    expect(foreignT.error, 'сторонній додав обробку в чужу техкарту').not.toBeNull()
    await stranger.client.from('program_treatments').update({ product_name: 'зламано' }).eq('id', treatmentId)
    await stranger.client.from('program_treatments').delete().eq('id', treatmentId)
    const { data: tNow } = await farmer.client.from('program_treatments').select('product_name').eq('id', treatmentId).single()
    expect(tNow?.product_name, 'сторонній змінив або видалив обробку').toBe('Тест-фунгіцид')

    // Нагадування про обробку — лише власнику
    const rem = await farmer.client.from('reminders').insert({
      user_id: farmer.userId, created_by: farmer.userId, treatment_id: treatmentId, description: 'Тест-фунгіцид',
      scheduled_date: new Date(Date.now() + 86_400_000).toISOString(), type: 'обробка', from_agronomist: false,
    })
    expect(rem.error).toBeNull()
    const { data: remHidden } = await stranger.client.from('reminders').select('id').eq('treatment_id', treatmentId)
    expect(remHidden ?? [], 'сторонній бачить нагадування фермера').toEqual([])
    const remForged = await stranger.client.from('reminders').insert({
      user_id: farmer.userId, created_by: stranger.userId, description: 'спам', scheduled_date: new Date().toISOString(), type: 'обробка',
    })
    expect(remForged.error, 'сторонній створив нагадування фермеру').not.toBeNull()
  })

  test('техкарта: власна фаза росту не з’являється в інших', async () => {
    const farmer = await asUser('farmer')
    const stranger = await asUser('buyer')
    const key = `${TAG} фаза`
    const { error } = await farmer.client.from('growth_phases')
      .insert({ key, emoji: '🌱', order_num: 99, is_default: false, created_by: farmer.userId })
    expect(error).toBeNull()
    phaseKeys.push(key)

    // Так фази завантажує useGrowthPhases: системні + власні
    const visibleTo = (uid: string) => `created_by.is.null,created_by.eq.${uid}`
    const { data: own } = await farmer.client.from('growth_phases').select('key').or(visibleTo(farmer.userId)).eq('key', key)
    expect(own?.length).toBe(1)
    const { data: seen } = await stranger.client.from('growth_phases').select('key').or(visibleTo(stranger.userId)).eq('key', key)
    expect(seen ?? [], 'фаза одного фермера видна всім').toEqual([])
  })

  test('AI-чат: «Додати до технологічної карти» створює програму', async () => {
    const farmer = await asUser('farmer')
    // Так створює програму AI-чат, коли для культури її ще немає
    const { data: c2 } = await farmer.client.from('farm_crops')
      .insert({ farm_id: farmId, crop_type: 'Ріпак озимий', area_ha: 5 }).select('id').single()
    const { error } = await farmer.client.from('protection_programs')
      .insert({ farm_crop_id: c2!.id, name: 'Схема для Ріпак озимий' })
    expect(error, 'AI-чат не може створити техкарту').toBeNull()
  })

  test('сторінки поля й техкарти відкриваються без помилок', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page, 'farmer')
    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)

    for (const path of [
      '/dashboard/fields',
      `/dashboard/farm/${farmId}`,
      `/dashboard/protection?farmCropId=${cropId}&cropType=${encodeURIComponent('Пшениця озима')}`,
      `/dashboard/protection/${farmId}`,
    ]) {
      await page.goto(path)
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
      await page.waitForTimeout(800)
      await expectNoErrors(errors, path)
      expect(apiErrors, `Помилки Supabase на ${path}:\n${apiErrors.join('\n')}`).toEqual([])
    }

    await page.goto(`/dashboard/farm/${farmId}`)
    await expect(page.getByText(TAG).first()).toBeVisible()
    await expect(page.getByText('Пшениця озима').first()).toBeVisible()
    await page.goto(`/dashboard/protection?farmCropId=${cropId}&cropType=${encodeURIComponent('Пшениця озима')}`)
    await expect(page.getByText('Тест-фунгіцид').first()).toBeVisible()
  })
})
