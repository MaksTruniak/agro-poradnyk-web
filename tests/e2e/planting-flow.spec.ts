import { test, expect } from '@playwright/test'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'
import { estimatePhase, shouldSuggestPhase } from '../../shared/utils/phaseEstimate'
import { plantingStage, phasesForStage } from '../../shared/utils/plantingStage'
import { plantingNow } from '../../shared/utils/weekPlan'
import { careTasksDue } from '../../shared/utils/careTasks'
import { addDays } from '../../shared/utils/weatherRisks'
import type { Page } from '@playwright/test'

// Багаторічні насадження: параметри насадження і журнал фенофаз на сторінці поля.
// ПИШЕ в базу, тому лише з E2E_WRITE=1; тимчасове поле видаляється сервісним ключем.

const TAG = `E2E ${Date.now()}`
const ddmm = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`

// Фільтр «Всі поля» у журналі обробок (UiAppSelect)
async function selectFarm(page: Page, name: string) {
  await page.getByRole('button', { name: 'Всі поля' }).click()
  await page.getByRole('button', { name, exact: true }).last().click()
}

// Погода без ризиків на сьогодні — щоб план не залежав від справжнього прогнозу
async function mockMildWeather(page: Page, today: string, dd: { gdd5: number; gdd10: number }) {
  const days = [-2, -1, 0, 1, 2, 3].map(n => addDays(today, n))
  const hourly = { time: [] as string[], temp: [] as number[], rh: [] as number[], precip: [] as number[] }
  for (const d of days) for (let h = 0; h < 24; h++) { hourly.time.push(`${d}T${String(h).padStart(2, '0')}:00`); hourly.temp.push(14); hourly.rh.push(60); hourly.precip.push(0) }
  await page.route('**/api/weather/degree-days**', r => r.fulfill({ json: { region: 'Київська', date: today, ...dd } }))
  await page.route('**/api/weather/forecast**', r => r.fulfill({ json: {
    region: 'Київська', today, hourly,
    daily: { time: days, tmin: days.map(() => 8), tmean: days.map(() => 14), precip: days.map(() => 0) },
  } }))
}

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
    if (cropId) await admin.from('reminders').delete().eq('farm_crop_id', cropId)
    await admin.from('expenses').delete().eq('farm_id', farmId)
    await admin.from('field_treatments').delete().eq('farm_id', farmId)
    await admin.from('farm_crops').delete().eq('farm_id', farmId) // журнал фаз, догляд, урожай — каскадом
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

  test('підказка фази за сумою активних температур', async ({ page, request }) => {
    const res = await request.get('/api/weather/degree-days?region=' + encodeURIComponent('Київська область'))
    expect(res.ok()).toBe(true)
    const dd = await res.json()
    expect(dd.region).toBe('Київська')
    expect(dd.gdd5).toBeGreaterThanOrEqual(dd.gdd10)
    expect((await request.get('/api/weather/degree-days?region=Марс')).status()).toBe(400)

    const { data: phases } = await serviceClient().from('growth_phases').select('key, order_num, crop_groups').is('created_by', null).order('order_num')
    const keys = (phases || []).filter((p: any) => !p.crop_groups?.length || p.crop_groups.includes('berry_shrub')).map((p: any) => p.key)
    const stage = plantingStage('berry_shrub', 2021)
    const estimate = estimatePhase('berry_shrub', dd, phasesForStage(keys, stage), stage)
    const expected = shouldSuggestPhase(estimate, { phase_key: 'Цвітіння', observed_at: new Date().toLocaleDateString('sv-SE') }, keys)

    const errors = collectErrors(page)
    await login(page, 'farmer')
    await page.goto(`/dashboard/farm/${farmId}`)
    await expect(page.getByRole('button', { name: /Цвітіння з \d\d\.\d\d/ })).toBeVisible()
    const hint = page.getByRole('button', { name: /^Мабуть, уже .+\? Відмітити$/ })
    if (!expected) {
      await expect(hint).toHaveCount(0)
    } else {
      await expect(hint).toContainText(estimate!)
      await hint.click()
      await expect(page.getByText(/орієнтовно за погодою: сума активних температур \d+ °C/)).toBeVisible()
      await expect(page.locator('.phase-option-active')).toContainText(estimate!)
      await page.getByRole('button', { name: 'Закрити' }).click()
    }
    await expectNoErrors(errors, 'сторінці поля')
  })

  test('погодні ризики: заморозок на цвітінні (травень, прогноз підставлено)', async ({ page }) => {
    const days = ['2026-05-10', '2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15']
    const hourly = { time: [] as string[], temp: [] as number[], rh: [] as number[], precip: [] as number[] }
    for (const d of days) for (let h = 0; h < 24; h++) { hourly.time.push(`${d}T${String(h).padStart(2, '0')}:00`); hourly.temp.push(14); hourly.rh.push(60); hourly.precip.push(0) }
    await page.clock.setFixedTime(new Date('2026-05-12T09:00:00'))
    await page.route('**/api/weather/degree-days**', r => r.fulfill({ json: { region: 'Київська', date: '2026-05-12', gdd5: 230, gdd10: 70 } }))
    await page.route('**/api/weather/forecast**', r => r.fulfill({ json: {
      region: 'Київська', today: '2026-05-12', hourly,
      daily: { time: days, tmin: [6, 5, 4, -2.4, 3, 6], tmean: [12, 12, 11, 8, 10, 12], precip: [0, 0, 0, 0, 0, 0] },
    } }))
    const errors = collectErrors(page)
    await login(page, 'farmer')
    await page.goto(`/dashboard/farm/${farmId}`)
    await expect(page.getByText('Заморозок до −2,4 °C у ніч на 13.05')).toBeVisible()
    await expect(page.getByText(/На фазі «Цвітіння» пошкодження можливі вже від −1,5 °C/)).toBeVisible()
    await expectNoErrors(errors, 'сторінці поля')
  })

  test('строк очікування: після обробки — «збір не раніше»', async ({ page }) => {
    const farmer = await asUser('farmer')
    const { data: program, error } = await farmer.client.from('protection_programs')
      .insert({ farm_crop_id: cropId, name: TAG }).select('id').single()
    expect(error).toBeNull()
    const doneAt = new Date().toLocaleDateString('sv-SE')
    const { error: tErr } = await farmer.client.from('program_treatments').insert({
      program_id: program!.id, phase: 'Цвітіння', type: 'захист', product_name: 'Світч 62,5 WG', status: 'done', done_at: doneAt, waiting_days: 14,
    })
    expect(tErr, 'потрібна міграція 20261019_waiting_days_weather_alerts.sql').toBeNull()
    const until = new Date(Date.now() + 14 * 864e5).toLocaleDateString('sv-SE')

    const errors = collectErrors(page)
    await login(page, 'farmer')
    await page.goto(`/dashboard/farm/${farmId}`)
    await expect(page.getByText(`⏳ Строк очікування: збір не раніше ${until.slice(8, 10)}.${until.slice(5, 7)}`)).toBeVisible()
    await expect(page.getByText('Після обробки «Світч 62,5 WG».', { exact: false })).toBeVisible()
    await expectNoErrors(errors, 'сторінці поля')
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

  test('план на тиждень: техкарта на поточній фазі, строк очікування, догляд', async ({ page }) => {
    const farmer = await asUser('farmer')
    const admin = serviceClient()
    const today = new Date().toLocaleDateString('sv-SE')
    const dd = { gdd5: 2500, gdd10: 1200 }
    await mockMildWeather(page, today, dd)

    const { data: phases } = await admin.from('growth_phases').select('key, crop_groups').is('created_by', null).order('order_num')
    const keys = (phases || []).filter((p: any) => !p.crop_groups?.length || p.crop_groups.includes('berry_shrub')).map((p: any) => p.key)
    const { data: cur } = await admin.from('planting_phases').select('phase_key, observed_at').eq('farm_crop_id', cropId)
      .order('observed_at', { ascending: false }).order('created_at', { ascending: false }).limit(1).single()
    const now = plantingNow({ crop: { id: cropId, farm_id: farmId, crop_type: 'Лохина', planting_year: 2021 }, group: 'berry_shrub', phases: keys, current: cur, dd })
    expect(now.phase).toBeTruthy()

    const { data: program } = await admin.from('protection_programs').select('id').eq('farm_crop_id', cropId).single()
    const { error } = await farmer.client.from('program_treatments').insert({
      program_id: program!.id, phase: now.phase, type: 'підживлення', product_name: `${TAG} Калімагнезія`, dosage: '200 кг/га', status: 'planned',
    })
    expect(error).toBeNull()
    // Опублікована порада на поточній фазі — тепер у плані, а не в нагадуваннях
    const { data: tip, error: tipErr } = await admin.from('phase_tips').insert({
      crop_group: 'berry_shrub', phase_key: now.phase, title: `${TAG} порада плану`, description: 'E2E', category: 'nutrition', urgency: 'high', is_published: true,
    }).select('id').single()
    expect(tipErr).toBeNull()
    tipIds.push(tip!.id)
    const care = careTasksDue({ group: 'berry_shrub', cropType: 'Лохина', phaseKey: now.phase, stage: plantingStage('berry_shrub', 2021), today })
    const until = addDays(today, 14)

    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)
    await login(page, 'farmer')
    await page.goto('/dashboard/week')
    const section = page.locator('section').filter({ has: page.getByRole('heading', { name: TAG, exact: true }) })
    await expect(section.getByText(`Підживлення: ${TAG} Калімагнезія`)).toBeVisible()
    await expect(section.getByText(`За техкартою на фазі «${now.phase}» · 200 кг/га`)).toBeVisible()
    await expect(section.getByText(`Збір не раніше ${ddmm(until)}`)).toBeVisible()
    await expect(section.getByText('Строк очікування після обробки «Світч 62,5 WG».')).toBeVisible()
    for (const c of care) await expect(section.locator('[data-kind="care"]').filter({ hasText: c.title })).toBeVisible()

    // Нагадування з пункту техкарти — на завтра, прив'язане до насадження
    const treatmentRow = section.locator('[data-kind="treatment"]').filter({ hasText: `${TAG} Калімагнезія` })
    await treatmentRow.getByRole('button', { name: '🔔 Нагадати' }).click()
    await expect(treatmentRow.locator('input[type="date"]')).toHaveValue(addDays(today, 1))
    await treatmentRow.getByRole('button', { name: 'Зберегти' }).click()
    await expect(page.getByText('Нагадування додано')).toBeVisible()
    const { data: rem } = await admin.from('reminders').select('description, type, farm_id, user_id').eq('farm_crop_id', cropId)
    expect(rem).toEqual([{ description: `Підживлення: ${TAG} Калімагнезія — Лохина`, type: 'обробка', farm_id: farmId, user_id: farmer.userId }])

    const tips = page.locator('[data-test="week-tips"]')
    if (await tips.isVisible()) {
      // В акаунті можуть бути й інші насадження на цій фазі — беремо рядок тестового поля
      const row = tips.locator('[data-source="phase"]').filter({ hasText: `${TAG} порада плану` }).filter({ hasText: `Лохина · ${TAG}` })
      await expect(row).toContainText(`фаза «${now.phase}»`)
      await row.getByRole('button', { name: '🔔 Нагадати' }).click()
      await row.getByRole('button', { name: 'Зберегти' }).click()
      await expect.poll(async () => (await admin.from('reminders').select('type, farm_crop_id')
        .eq('description', `${TAG} порада плану — Лохина`)).data).toEqual([{ type: 'підживлення', farm_crop_id: cropId }])
    } else {
      await expect(page.locator('[data-test="week-tips-locked"]')).toBeVisible()
    }

    if (care.length) {
      const first = section.locator('[data-kind="care"]').filter({ hasText: care[0]!.title })
      await first.getByRole('button', { name: '✓ Зроблено' }).click()
      await expect(first).toHaveCount(0)
      const { data: log } = await admin.from('planting_care_log').select('task_key, period, created_by').eq('farm_crop_id', cropId)
      expect(log).toEqual([{ task_key: care[0]!.key, period: care[0]!.period, created_by: farmer.userId }])
      // На сторінці поля виконаний догляд теж зник
      await page.goto(`/dashboard/farm/${farmId}`)
      if (care.length > 1) await expect(page.locator('.care-block')).toContainText(care[1]!.title)
      await expect(page.locator('.care-block').getByText(care[0]!.title, { exact: true })).toHaveCount(0)
    }

    await page.goto('/dashboard/reminders')
    await expect(page.locator('[data-test="reminders-week-link"]')).toBeVisible()
    await expect(page.getByText('Актуально зараз')).toHaveCount(0)

    await page.goto('/dashboard')
    await expect(page.locator('[data-test="week-plan-widget"]')).toBeVisible({ timeout: 15000 })
    await expectNoErrors(errors, 'плані на тиждень')
    expect(apiErrors, apiErrors.join('\n')).toEqual([])
  })

  test('урожайність: урожай за рік, т/га, собівартість; сторонній не бачить', async ({ page }) => {
    const farmer = await asUser('farmer')
    const stranger = await asUser('buyer')
    const year = new Date().getFullYear()
    const { error: eErr } = await farmer.client.from('expenses').insert({
      user_id: farmer.userId, farm_id: farmId, crop_type: 'Лохина', category: 'other', description: TAG,
      amount_uah: 32000, expense_date: `${year}-03-15`,
    })
    expect(eErr).toBeNull()

    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)
    await login(page, 'farmer')
    await page.goto(`/dashboard/farm/${farmId}`)
    await page.getByRole('button', { name: '🧺 Внести урожай' }).click()
    const modal = page.locator('[data-test="yield-modal"]')
    await expect(modal.getByText('Даних про урожай ще немає')).toBeVisible()
    await modal.locator('[data-test="yield-tons"]').fill('3,2')
    await modal.getByRole('button', { name: 'Зберегти' }).click()
    const row = modal.locator('tbody tr').first()
    await expect(row).toContainText(String(year))
    await expect(row).toContainText('3,2 т')
    await expect(row).toContainText('1,6')
    await expect(row).toContainText('32 000 грн')
    await expect(row).toContainText('10')
    await expect(row).toContainText('внесено вручну')
    await modal.getByRole('button', { name: '✕' }).first().click()
    await expect(page.getByRole('button', { name: `🧺 3,2 т у ${year} · 1,6 т/га · собівартість 10 грн/кг` })).toBeVisible()

    const { data: hidden } = await stranger.client.from('planting_yields').select('id').eq('farm_crop_id', cropId)
    expect(hidden ?? [], 'сторонній бачить урожай').toEqual([])
    const forged = await stranger.client.from('planting_yields').insert({ farm_crop_id: cropId, year: year - 1, yield_kg: 1 })
    expect(forged.error, 'сторонній вніс урожай у чуже насадження').not.toBeNull()
    const forgedCare = await stranger.client.from('planting_care_log').insert({ farm_crop_id: cropId, task_key: 'mulch', period: `${year}-04` })
    expect(forgedCare.error, 'сторонній відмітив догляд у чужому насадженні').not.toBeNull()

    await expectNoErrors(errors, 'вікні урожайності')
    expect(apiErrors, apiErrors.join('\n')).toEqual([])
  })

  test('журнал обробок: виконане з техкарти, строк очікування, друк', async ({ page }) => {
    const farmer = await asUser('farmer')
    const today = new Date().toLocaleDateString('sv-SE')
    const { error } = await farmer.client.from('field_treatments').insert({
      user_id: farmer.userId, farm_id: farmId, farm_name: TAG, crop_type: 'Лохина', treatment_date: today,
      product_name: `${TAG} Фітоверм`, product_type: 'захист', waiting_days: 3,
    })
    expect(error, 'потрібна міграція 20261020_care_yields.sql').toBeNull()
    const bad = await farmer.client.from('field_treatments').insert({
      user_id: farmer.userId, farm_id: farmId, treatment_date: today, product_name: 'x', product_type: 'захист', waiting_days: 400,
    })
    expect(bad.error, 'база прийняла строк очікування 400 днів').not.toBeNull()

    await page.context().addInitScript(() => { window.print = () => {} })
    const errors = collectErrors(page)
    await login(page, 'farmer')
    await page.goto('/dashboard/treatments')
    await expect(page.getByRole('heading', { name: 'Журнал обробок' })).toBeVisible()
    if (await page.getByText('Перейти на Бізнес →').isVisible()) {
      test.info().annotations.push({ type: 'skip', description: 'у фермера немає тарифу Бізнес — журнал недоступний' })
      return
    }
    await selectFarm(page, TAG)
    const tech = page.locator('.card').filter({ hasText: 'Світч 62,5 WG' })
    await expect(tech).toContainText('з техкарти')
    await expect(tech).toContainText('фаза: Цвітіння')
    await expect(tech).toContainText('⏳ 14 дн')
    await expect(tech.getByRole('link', { name: 'Техкарта →' })).toBeVisible()
    const manual = page.locator('.card').filter({ hasText: `${TAG} Фітоверм` })
    const from = addDays(today, 3)
    await expect(manual).toContainText(`⏳ 3 дн · збір з ${ddmm(from)}.${from.slice(0, 4)}`)

    const popupPromise = page.waitForEvent('popup')
    await page.getByRole('button', { name: 'Друк / PDF' }).click()
    const popup = await popupPromise
    await expect(popup.getByRole('heading', { name: 'Журнал обробок насаджень' })).toBeVisible()
    await expect(popup.getByRole('heading', { name: `${TAG} — Лохина` })).toBeVisible()
    await expect(popup.getByText('Світч 62,5 WG')).toBeVisible()
    await expect(popup.getByText(`${TAG} Фітоверм`)).toBeVisible()
    await expect(popup.getByText('Відповідальна особа (ПІБ, підпис)')).toBeVisible()
    await popup.close()
    await expectNoErrors(errors, 'журналі обробок')
  })

  test('щотижневий лист: план у листі, вимикається в налаштуваннях', async ({ page, request }) => {
    test.skip(!process.env.CRON_SECRET, 'потрібен CRON_SECRET')
    const farmer = await asUser('farmer')
    const admin = serviceClient()
    const url = `/api/cron/week-digest?dry=1&user=${farmer.userId}`
    const auth = { Authorization: `Bearer ${process.env.CRON_SECRET}` }
    expect((await request.get(url)).status(), 'cron без секрету').toBe(401)

    const { data: before } = await admin.from('notification_settings').select('week_digest').eq('user_id', farmer.userId).maybeSingle()
    try {
      await admin.from('notification_settings').delete().eq('user_id', farmer.userId)
      const on = await (await request.get(url, { headers: auth })).json()
      expect(on.users, 'лист не зібрано').toHaveLength(1)
      expect(on.users[0].lines.length).toBeGreaterThan(0)
      expect(JSON.stringify(on.users[0].lines), 'у листі немає тестового насадження').toContain('Лохина')

      const errors = collectErrors(page)
      await login(page, 'farmer')
      await page.goto('/dashboard/settings#notifications')
      const toggle = page.locator('[data-test="week-digest-toggle"]')
      await expect(toggle).toBeChecked()
      await toggle.uncheck()
      await expect.poll(async () => (await admin.from('notification_settings').select('week_digest').eq('user_id', farmer.userId).maybeSingle()).data)
        .toEqual({ week_digest: false })
      expect(on.users[0].email).toBe(true)
      const off = await (await request.get(url, { headers: auth })).json()
      expect(off.users[0]?.email, 'лист надсилається попри вимкнення').toBe(false)

      // Чужі налаштування не видно і не змінити
      const stranger = await asUser('buyer')
      const { data: seen } = await stranger.client.from('notification_settings').select('user_id').eq('user_id', farmer.userId)
      expect(seen ?? []).toEqual([])
      const forged = await stranger.client.from('notification_settings').upsert({ user_id: farmer.userId, week_digest: true })
      expect(forged.error, 'сторонній змінив чужі налаштування').not.toBeNull()
      await expectNoErrors(errors, 'налаштуваннях листів')
    } finally {
      await admin.from('notification_settings').delete().eq('user_id', farmer.userId)
      if (before) await admin.from('notification_settings').insert({ user_id: farmer.userId, week_digest: before.week_digest })
    }
  })

  test('калькулятор робочого розчину в техкарті', async ({ page }) => {
    const farmer = await asUser('farmer')
    const admin = serviceClient()
    const { data: program } = await admin.from('protection_programs').select('id').eq('farm_crop_id', cropId).single()
    const { error } = await farmer.client.from('program_treatments').insert([
      { program_id: program!.id, phase: 'Цвітіння', type: 'захист', product_name: `${TAG} Свіч`, dosage: '0.3 л/га', status: 'planned' },
      { program_id: program!.id, phase: 'Цвітіння', type: 'підживлення', product_name: `${TAG} Гранули`, dosage: '20 г на кущ', status: 'planned' },
      { program_id: program!.id, phase: 'Цвітіння', type: 'захист', product_name: `${TAG} Без норми`, dosage: 'за етикеткою', status: 'planned' },
      { program_id: program!.id, phase: 'Цвітіння', type: 'підживлення', product_name: `${TAG} Сульфат калію`, dosage: '150 кг/га', status: 'planned' },
    ])
    expect(error).toBeNull()

    const errors = collectErrors(page)
    await login(page, 'farmer')
    await page.addInitScript(() => { try { localStorage.removeItem('agro_tank_l') } catch {} })
    await page.goto(`/dashboard/protection?farmCropId=${cropId}&cropType=${encodeURIComponent('Лохина')}`)
    const row = (name: string) => page.locator('div.flex.items-start.gap-3').filter({ hasText: name })
    await expect(row(`${TAG} Без норми`).locator('[data-test="tank-mix-open"]')).toHaveCount(0)

    await row(`${TAG} Свіч`).locator('[data-test="tank-mix-open"]').click()
    const modal = page.locator('[data-test="tank-mix-modal"]')
    await expect(modal.locator('[data-test="tm-area"]')).toHaveValue('2')
    await expect(modal.locator('[data-test="tm-water"]')).toHaveValue('500') // лохина — типово 500 л/га
    await modal.locator('[data-test="tm-tank"]').fill('400')
    await expect(modal.locator('[data-test="tm-total"]')).toHaveText('600 мл')
    await expect(modal.locator('[data-test="tm-per-tank"]')).toContainText('2 повні заправки по 400 л — 240 мл препарату в кожну')
    await expect(modal.locator('[data-test="tm-last-tank"]')).toContainText('Остання заправка — 200 л розчину, 120 мл препарату')
    await modal.getByRole('button', { name: 'Закрити' }).click()

    await row(`${TAG} Гранули`).locator('[data-test="tank-mix-open"]').click()
    await expect(modal.locator('[data-test="tm-plants"]')).toHaveValue('6667')
    await expect(modal.locator('[data-test="tm-result"]')).toContainText('133 кг')
    await modal.getByRole('button', { name: 'Закрити' }).click()

    // 150 кг/га сухого добрива — внесення в ґрунт: лише скільки всього і на рослину
    await row(`${TAG} Сульфат калію`).locator('[data-test="tank-mix-open"]').click()
    await expect(modal.locator('[data-test="tm-spray"]')).not.toBeChecked()
    await expect(modal.locator('[data-test="tm-total"]')).toHaveText('300 кг')
    await expect(modal.locator('[data-test="tm-result"]')).toContainText('≈ 45 г на рослину (6667 шт)')
    await expect(modal.locator('[data-test="tm-tank"]')).toHaveCount(0)
    await expectNoErrors(errors, 'калькуляторі розчину')
  })
})
