import { test, expect } from '@playwright/test'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Багаторічні насадження: параметри насадження і журнал фенофаз на сторінці поля.
// ПИШЕ в базу, тому лише з E2E_WRITE=1; тимчасове поле видаляється сервісним ключем.

const TAG = `E2E ${Date.now()}`

test.describe('Насадження і фенофази', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('buyer'), 'потрібні E2E_FARMER_* і E2E_BUYER_*')
  test.describe.configure({ mode: 'serial' })

  let farmId = ''
  let cropId = ''
  const tipIds: string[] = []

  test.beforeAll(async () => {
    const farmer = await asUser('farmer')
    const { data, error } = await farmer.client.from('farms')
      .insert({ user_id: farmer.userId, name: TAG, region: 'Київська', hectares: 5 }).select('id').single()
    expect(error).toBeNull()
    farmId = data!.id
  })

  test.afterAll(async () => {
    const admin = serviceClient()
    if (tipIds.length) await admin.from('phase_tips').delete().in('id', tipIds)
    if (!farmId) return
    await admin.from('farm_crops').delete().eq('farm_id', farmId) // журнал фаз видаляється каскадом
    await admin.from('farms').delete().eq('id', farmId)
  })

  test('сторінка поля: насадження лохини і відмітка фази', async ({ page }) => {
    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)
    await login(page, 'farmer')
    await page.goto(`/dashboard/farm/${farmId}`)
    await page.getByRole('button', { name: 'Додати' }).first().click()

    const search = page.getByPlaceholder('Почніть вводити назву...')
    // Польова культура — без полів насадження
    await search.fill('Пшениця оз')
    await page.locator('button', { hasText: 'Пшениця озима' }).first().click()
    await expect(page.getByText('Насадження', { exact: true })).toHaveCount(0)

    await search.fill('Лохина')
    await page.locator('button', { hasText: 'Лохина' }).first().click()
    await expect(page.getByText('Насадження', { exact: true })).toBeVisible()

    await page.getByPlaceholder('0.0').first().fill('2')
    await page.getByPlaceholder(String(new Date().getFullYear())).fill('2021')
    await page.getByPlaceholder('Напр. М9').fill('власнокоренева')
    await page.getByPlaceholder('3.0').fill('3')
    await page.getByPlaceholder('1.0').fill('1')
    await expect(page.getByText('≈ 6 667 за схемою')).toBeVisible()
    await page.getByRole('button', { name: 'Додати', exact: true }).last().click()

    await expect(page.getByText(/посадка 2021 \(\d+ (рік|роки|років)\) · підщепа власнокоренева · 3×1 м · 6\s667 рослин/)).toBeVisible()
    await expect(page.getByText(`плодоносне, ${new Date().getFullYear() - 2021 + 1}-й рік вегетації`)).toBeVisible()

    const { data: crop } = await serviceClient().from('farm_crops')
      .select('id, catalog_id, planting_year, rootstock, row_spacing_m, plant_spacing_m, plants_count')
      .eq('farm_id', farmId).single()
    expect(crop).toMatchObject({ planting_year: 2021, rootstock: 'власнокоренева', row_spacing_m: 3, plant_spacing_m: 1, plants_count: 6667 })
    expect(crop!.catalog_id, 'культура не прив’язана до каталогу').not.toBeNull()
    cropId = crop!.id

    await page.getByRole('button', { name: '+ Відмітити фенофазу' }).click()
    await expect(page.getByRole('button', { name: /Підготовка до зими/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Колосіння/ }), 'для лохини показано фази зернових').toHaveCount(0)
    await page.getByRole('button', { name: /^🌸 Цвітіння$/ }).click()
    await page.getByPlaceholder('Напр. 30% квіток розкрилось').fill('E2E')
    await page.getByRole('button', { name: 'Відмітити фазу' }).click()
    await expect(page.getByRole('button', { name: /Цвітіння з \d\d\.\d\d/ })).toBeVisible()

    const farmer = await asUser('farmer')
    const { data: phases } = await serviceClient().from('planting_phases').select('phase_key, note, created_by').eq('farm_crop_id', cropId)
    expect(phases).toEqual([{ phase_key: 'Цвітіння', note: 'E2E', created_by: farmer.userId }])

    await expectNoErrors(errors, 'сторінці поля')
    expect(apiErrors, apiErrors.join('\n')).toEqual([])
  })

  test('журнал фаз: лише власник, автора не підробити', async () => {
    const farmer = await asUser('farmer')
    const stranger = await asUser('buyer')

    const { data: hidden } = await stranger.client.from('planting_phases').select('id').eq('farm_crop_id', cropId)
    expect(hidden ?? [], 'сторонній бачить журнал фаз').toEqual([])

    const forged = await stranger.client.from('planting_phases').insert({ farm_crop_id: cropId, phase_key: 'Спокій' })
    expect(forged.error, 'сторонній записав фазу в чуже насадження').not.toBeNull()

    const { data: own, error } = await farmer.client.from('planting_phases')
      .insert({ farm_crop_id: cropId, phase_key: 'Після цвітіння', created_by: stranger.userId }).select('id, created_by').single()
    expect(error).toBeNull()
    expect(own!.created_by, 'автор запису підмінений').toBe(farmer.userId)

    await stranger.client.from('planting_phases').update({ phase_key: 'зламано' }).eq('id', own!.id)
    await stranger.client.from('planting_phases').delete().eq('id', own!.id)
    const { data: still } = await farmer.client.from('planting_phases').select('phase_key').eq('id', own!.id).single()
    expect(still?.phase_key, 'сторонній змінив або видалив запис').toBe('Після цвітіння')

    const bad = await farmer.client.from('farm_crops').update({ irrigation: 'полив з відра' }).eq('id', cropId)
    expect(bad.error, 'база прийняла невідомий тип зрошення').not.toBeNull()
  })

  test('поради за фазою: фермер бачить лише опубліковані', async ({ page }) => {
    const farmer = await asUser('farmer')
    const admin = serviceClient()
    const { data: tips, error } = await admin.from('phase_tips').insert([
      { crop_group: 'berry_shrub', phase_key: 'Цвітіння', title: `${TAG} опублікована`, description: 'E2E порада', category: 'pruning', urgency: 'high', is_published: true },
      { crop_group: 'berry_shrub', phase_key: 'Цвітіння', title: `${TAG} чернетка`, description: 'E2E', category: 'disease', urgency: 'low', is_published: false },
    ]).select('id, is_published')
    expect(error).toBeNull()
    tipIds.push(...tips!.map(t => t.id))

    const { data: seen } = await farmer.client.from('phase_tips').select('title').like('title', `${TAG}%`)
    expect(seen?.map(t => t.title)).toEqual([`${TAG} опублікована`])

    const forged = await farmer.client.from('phase_tips').insert({ crop_group: 'grape', phase_key: 'Цвітіння', title: 'спам', is_published: true })
    expect(forged.error, 'фермер додав пораду').not.toBeNull()
    await farmer.client.from('phase_tips').update({ title: 'зламано' }).eq('id', tipIds[0]!)
    const { data: kept } = await admin.from('phase_tips').select('title').eq('id', tipIds[0]!).single()
    expect(kept?.title, 'фермер змінив пораду').toBe(`${TAG} опублікована`)

    const errors = collectErrors(page)
    await login(page, 'farmer')
    await page.goto(`/dashboard/farm/${farmId}`)
    // Поточна фаза — «Після цвітіння» (попередній тест); обираємо «Цвітіння», щоб побачити її поради
    await page.getByRole('button', { name: /Після цвітіння з \d\d\.\d\d/ }).click()
    await page.getByRole('button', { name: /^🌸 Цвітіння$/ }).click()
    await expect(page.getByText('Що робити на фазі «Цвітіння»')).toBeVisible()
    await expect(page.getByText(`${TAG} опублікована`)).toBeVisible()
    await expect(page.getByText(`${TAG} чернетка`)).toHaveCount(0)
    await expectNoErrors(errors, 'вікні фенофази')
  })

  test('поле з продажем видаляється, продаж лишається без прив’язки', async () => {
    const farmer = await asUser('farmer')
    const admin = serviceClient()
    const { data: farm } = await farmer.client.from('farms')
      .insert({ user_id: farmer.userId, name: `${TAG} видалення`, hectares: 1 }).select('id').single()
    const { data: crop } = await farmer.client.from('farm_crops')
      .insert({ farm_id: farm!.id, crop_type: 'Смородина чорна', area_ha: 1, stock_quantity: 5, stock_unit: 'т' }).select('id').single()
    const { data: sale, error } = await farmer.client.from('manual_sales').insert({
      user_id: farmer.userId, crop_type: `${TAG} продаж`, quantity_tons: 1, price_per_ton: 1,
      sold_at: '2026-10-16', farm_crop_id: crop!.id, deduct_from_stock: true,
    }).select('id').single()
    expect(error).toBeNull()
    try {
      const del = await farmer.client.from('farms').delete().eq('id', farm!.id).select('id')
      expect(del.error, 'база не дала видалити поле з продажем').toBeNull()
      expect(del.data).toHaveLength(1)
      const { data: kept } = await admin.from('manual_sales').select('farm_crop_id').eq('id', sale!.id).single()
      expect(kept, 'продаж видалився разом із полем').toEqual({ farm_crop_id: null })
    } finally {
      await admin.from('manual_sales').delete().eq('id', sale!.id)
      await admin.from('farm_crops').delete().eq('farm_id', farm!.id)
      await admin.from('farms').delete().eq('id', farm!.id)
    }
  })

  test('рік посадки: без фаз збору, поради лише для першого року', async ({ page }) => {
    const farmer = await asUser('farmer')
    const admin = serviceClient()
    const year = new Date().getFullYear()
    const { data: farm } = await farmer.client.from('farms')
      .insert({ user_id: farmer.userId, name: `${TAG} молоде`, hectares: 1 }).select('id').single()
    const { data: crop } = await farmer.client.from('farm_crops')
      .insert({ farm_id: farm!.id, crop_type: 'Лохина', area_ha: 1, planting_year: year }).select('id').single()
    const { data: tips } = await admin.from('phase_tips').insert([
      { crop_group: 'berry_shrub', phase_key: 'Цвітіння', title: `${TAG} перший рік`, description: 'E2E', category: 'pruning', urgency: 'high', is_published: true, stages: ['establishment'] },
      { crop_group: 'berry_shrub', phase_key: 'Цвітіння', title: `${TAG} плодоносне`, description: 'E2E', category: 'disease', urgency: 'high', is_published: true, stages: ['bearing'] },
    ]).select('id')
    tipIds.push(...(tips ?? []).map(t => t.id))
    try {
      const errors = collectErrors(page)
      await login(page, 'farmer')
      await page.goto(`/dashboard/farm/${farm!.id}`)
      await expect(page.getByText(`посадка ${year} (цього року)`)).toBeVisible()
      await expect(page.getByText('рік посадки, урожаю немає')).toBeVisible()
      await page.getByRole('button', { name: '+ Відмітити фенофазу' }).click()
      await expect(page.getByRole('button', { name: /^🌸 Цвітіння$/ })).toBeVisible()
      for (const fruit of [/Збір урожаю/, /Дозрівання/, /Формування плодів/]) {
        await expect(page.getByRole('button', { name: fruit }), `фаза ${fruit} для куща першого року`).toHaveCount(0)
      }
      await page.getByRole('button', { name: /^🌸 Цвітіння$/ }).click()
      await expect(page.getByText(`${TAG} перший рік`)).toBeVisible()
      await expect(page.getByText(`${TAG} плодоносне`)).toHaveCount(0)
      await expectNoErrors(errors, 'вікні фенофази молодого насадження')
    } finally {
      await admin.from('farm_crops').delete().eq('id', crop!.id)
      await admin.from('farms').delete().eq('id', farm!.id)
    }
  })
})
