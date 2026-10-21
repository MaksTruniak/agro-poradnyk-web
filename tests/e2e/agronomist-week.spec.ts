import { test, expect, type Page } from '@playwright/test'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'
import { plantingNow } from '../../shared/utils/weekPlan'
import { addDays } from '../../shared/utils/weatherRisks'

// «Клієнти цього тижня»: агроном з активною співпрацею бачить план насаджень клієнта й пише пораду в чат.
// ПИШЕ в базу (поле фермера, співпраця, обробка) — лише з E2E_WRITE=1; усе прибирається.

const TAG = `E2E ${Date.now()}`

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

test.describe('Агроном: клієнти цього тижня', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('agronomist'), 'потрібні E2E_FARMER_* і E2E_AGRONOMIST_*')

  let farmId = '', agreementId = ''
  const newChats: string[] = []

  test.afterAll(async () => {
    const admin = serviceClient()
    for (const id of newChats) { await admin.from('messages').delete().eq('chat_id', id); await admin.from('chats').delete().eq('id', id) }
    if (agreementId) await admin.from('agreements').delete().eq('id', agreementId)
    if (farmId) { await admin.from('farm_crops').delete().eq('farm_id', farmId); await admin.from('farms').delete().eq('id', farmId) }
  })

  test('план клієнта і порада в чат', async ({ page }) => {
    const farmer = await asUser('farmer')
    const agronomist = await asUser('agronomist')
    const admin = serviceClient()
    const { data: existing } = await admin.from('agreements').select('id')
      .eq('agronomist_id', agronomist.userId).eq('farmer_id', farmer.userId).in('status', ['pending', 'active'])
    test.skip(!!existing?.length, 'між тестовими акаунтами вже є співпраця')

    const { data: farm, error } = await farmer.client.from('farms')
      .insert({ user_id: farmer.userId, name: TAG, region: 'Київська', hectares: 3 }).select('id').single()
    expect(error).toBeNull()
    farmId = farm!.id
    const { data: crop } = await farmer.client.from('farm_crops')
      .insert({ farm_id: farmId, crop_type: 'Лохина', area_ha: 2, planting_year: 2021 }).select('id').single()
    const { data: ag } = await admin.from('agreements').insert({
      farmer_id: farmer.userId, agronomist_id: agronomist.userId, status: 'active', started_at: new Date().toISOString(), message: TAG,
    }).select('id').single()
    agreementId = ag!.id

    const today = new Date().toLocaleDateString('sv-SE')
    const dd = { gdd5: 2500, gdd10: 1200 }
    const { data: phases } = await admin.from('growth_phases').select('key, crop_groups').is('created_by', null).order('order_num')
    const keys = (phases || []).filter((p: any) => !p.crop_groups?.length || p.crop_groups.includes('berry_shrub')).map((p: any) => p.key)
    const now = plantingNow({ crop: { id: crop!.id, farm_id: farmId, crop_type: 'Лохина', planting_year: 2021 }, group: 'berry_shrub', phases: keys, current: null, dd })
    const { data: program } = await farmer.client.from('protection_programs').insert({ farm_crop_id: crop!.id, name: TAG }).select('id').single()
    await farmer.client.from('program_treatments').insert({
      program_id: program!.id, phase: now.phase, type: 'захист', product_name: `${TAG} Світч`, dosage: '1 кг/га', status: 'planned',
    })

    const { data: chatsBefore } = await admin.from('chats').select('id').eq('farmer_id', farmer.userId).eq('agronomist_id', agronomist.userId)
    await mockMildWeather(page, today, dd)
    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)
    await login(page, 'agronomist')
    await page.goto('/dashboard/clients-week')
    const { data: profile } = await admin.from('public_profiles').select('name').eq('id', farmer.userId).single()
    await expect(page.locator('[data-test="clients-summary"]')).toContainText(profile!.name, { timeout: 15000 })
    const section = page.locator('[data-test="client-section"]').filter({ has: page.getByRole('heading', { name: profile!.name }) })
    const row = section.locator('[data-kind="treatment"]').filter({ hasText: `${TAG} Світч` })
    await expect(row).toContainText(`За техкартою на фазі «${now.phase}» · 1 кг/га`)
    await expectNoErrors(errors, 'клієнтах цього тижня')
    expect(apiErrors, apiErrors.join('\n')).toEqual([])

    await row.locator('[data-test="write-client"]').click()
    await page.waitForURL(/\/dashboard\/chats\/[0-9a-f-]+\?draft=/)
    const chatId = page.url().match(/chats\/([0-9a-f-]+)/)![1]!
    if (!(chatsBefore || []).some((c: any) => c.id === chatId)) newChats.push(chatId)
    await expect(page.locator('textarea').first()).toHaveValue(new RegExp(`^Обробка: ${TAG} Світч \\(Лохина, ${TAG}\\)\\. За техкартою`))
  })
})
