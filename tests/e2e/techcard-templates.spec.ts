import { test, expect } from '@playwright/test'
import { asUser, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'
import { planTemplateApply, templateFromTreatments } from '../../shared/utils/techcardTemplate'

// Шаблони техкарт агронома: зберегти техкарту клієнта як шаблон, застосувати до іншої культури, керувати шаблонами.
// ПИШЕ в базу (поля фермера, співпраця, техкарти, шаблон) — лише з E2E_WRITE=1; усе прибирається.

const TAG = `E2E шаблон ${Date.now()}`

test('шаблон: з техкарти без статусів, застосування без дублів', () => {
  const tpl = templateFromTreatments([
    { phase: 'Цвітіння', phase_order: 5, type: 'захист', product_name: ' Світч ', dosage: '1 кг/га', waiting_days: 7, status: 'done', done_at: '2026-05-01' } as any,
    { phase: 'Спокій', phase_order: 1, type: 'захист', product_name: 'Мідь', dosage: null },
  ], ['Спокій', 'Цвітіння', 'Ріст пагонів'])
  expect(tpl.items.map(i => i.product_name)).toEqual(['Мідь', 'Світч'])
  expect(tpl.items[1]).toEqual({ phase: 'Цвітіння', phase_order: 5, type: 'захист', product_name: 'Світч', dosage: '1 кг/га', notes: null, waiting_days: 7 })
  expect(tpl.phases).toEqual(['Спокій', 'Цвітіння', 'Ріст пагонів'])

  const plan = planTemplateApply(tpl, [{ phase: 'Цвітіння', product_name: 'світч' }], ['Цвітіння'])
  expect(plan.toInsert.map(i => i.product_name)).toEqual(['Мідь'])
  expect(plan.skipped).toBe(1)
  expect(plan.phases).toEqual(['Цвітіння', 'Спокій', 'Ріст пагонів'])
})

test.describe('Шаблони техкарт', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('agronomist'), 'потрібні E2E_FARMER_* і E2E_AGRONOMIST_*')
  test.describe.configure({ mode: 'serial' })

  const farmIds: string[] = []
  let agreementId = ''

  test.afterAll(async () => {
    const admin = serviceClient()
    await admin.from('techcard_templates').delete().like('name', `${TAG}%`)
    if (agreementId) await admin.from('agreements').delete().eq('id', agreementId)
    for (const farmId of farmIds) {
      const { data: crops } = await admin.from('farm_crops').select('id').eq('farm_id', farmId)
      const { data: progs } = await admin.from('protection_programs').select('id').in('farm_crop_id', (crops ?? []).map(c => c.id))
      const pids = (progs ?? []).map(p => p.id)
      if (pids.length) {
        await admin.from('program_treatments').delete().in('program_id', pids)
        await admin.from('protection_programs').delete().in('id', pids)
      }
      await admin.from('farm_crops').delete().eq('farm_id', farmId)
      await admin.from('farms').delete().eq('id', farmId)
    }
  })

  test('агроном зберігає техкарту клієнта як шаблон і застосовує до іншої культури', async ({ page }) => {
    const farmer = await asUser('farmer')
    const agronomist = await asUser('agronomist')
    const admin = serviceClient()
    const { data: existing } = await admin.from('agreements').select('id')
      .eq('agronomist_id', agronomist.userId).eq('farmer_id', farmer.userId).in('status', ['pending', 'active'])
    test.skip(!!existing?.length, 'між тестовими акаунтами вже є співпраця')

    const mkFarm = async (name: string) => {
      const { data: farm } = await farmer.client.from('farms').insert({ user_id: farmer.userId, name, hectares: 2 }).select('id').single()
      farmIds.push(farm!.id)
      const { data: crop } = await farmer.client.from('farm_crops').insert({ farm_id: farm!.id, crop_type: 'Лохина', area_ha: 2 }).select('id').single()
      return { farmId: farm!.id, cropId: crop!.id }
    }
    const a = await mkFarm(`${TAG} А`)
    const b = await mkFarm(`${TAG} Б`)
    const { data: prog } = await farmer.client.from('protection_programs').insert({ farm_crop_id: a.cropId, name: TAG, active_phases: ['Цвітіння'] }).select('id').single()
    await farmer.client.from('program_treatments').insert([
      { program_id: prog!.id, phase: 'Цвітіння', phase_order: 5, type: 'захист', product_name: `${TAG} Світч`, dosage: '1 кг/га', waiting_days: 7, status: 'done', done_at: '2026-05-01' },
      { program_id: prog!.id, phase: 'Цвітіння', phase_order: 5, type: 'підживлення', product_name: `${TAG} Бор`, dosage: '1 л/га' },
    ])
    const { data: ag } = await admin.from('agreements').insert({
      farmer_id: farmer.userId, agronomist_id: agronomist.userId, status: 'active', started_at: new Date().toISOString(), message: TAG,
    }).select('id').single()
    agreementId = ag!.id

    const errors = collectErrors(page)
    await login(page, 'agronomist')

    // Зберегти як шаблон
    await page.goto(`/dashboard/protection/${a.farmId}`)
    await expect(page.getByText(`${TAG} Світч`)).toBeVisible({ timeout: 15000 })
    await page.locator('[data-test="tpl-save-open"]').click()
    await page.locator('[data-test="tpl-name"]').fill(`${TAG} лохина`)
    await page.locator('[data-test="tpl-save"]').click()
    await expect(page.locator('[data-test="tpl-modal"]')).toHaveCount(0)
    const { data: tpls } = await agronomist.client.from('techcard_templates').select('owner_id, crop_type, phases, items').eq('name', `${TAG} лохина`)
    expect(tpls).toHaveLength(1)
    expect(tpls![0]).toMatchObject({ owner_id: agronomist.userId, crop_type: 'Лохина', phases: ['Цвітіння'] })
    expect(tpls![0].items).toHaveLength(2)
    expect(JSON.stringify(tpls![0].items)).not.toContain('done')

    // Фермер шаблону агронома не бачить і не може записати шаблон від його імені
    const { data: foreign } = await farmer.client.from('techcard_templates').select('id').eq('name', `${TAG} лохина`)
    expect(foreign ?? []).toEqual([])
    const { data: forged } = await farmer.client.from('techcard_templates').insert({ owner_id: agronomist.userId, name: `${TAG} підробка` }).select('owner_id').single()
    expect(forged?.owner_id ?? farmer.userId, 'шаблон записано від імені агронома').toBe(farmer.userId)

    // Застосувати до культури без програми — програма створюється, обробки заплановані
    await page.goto(`/dashboard/protection/${b.farmId}`)
    await page.locator('[data-test="tpl-apply-open"]').click()
    await page.locator('[data-test="tpl-item"]').filter({ hasText: `${TAG} лохина` }).click()
    await expect(page.getByText(`${TAG} Світч`)).toBeVisible()
    await expect(page.getByText(`${TAG} Бор`)).toBeVisible()
    await expect(page.locator('[data-test="tpl-modal"]')).toHaveCount(0)
    const progB = async () => {
      const { data } = await admin.from('protection_programs').select('active_phases, program_treatments(product_name, status, waiting_days)').eq('farm_crop_id', b.cropId).single()
      return data as any
    }
    let pb = await progB()
    expect(pb.active_phases).toContain('Цвітіння')
    expect(pb.program_treatments).toHaveLength(2)
    expect(pb.program_treatments.find((t: any) => t.product_name === `${TAG} Світч`)).toMatchObject({ waiting_days: 7 })
    expect(pb.program_treatments.every((t: any) => t.status !== 'done')).toBe(true)

    // Повторне застосування не дублює
    await page.locator('[data-test="tpl-apply-open"]').click()
    await page.locator('[data-test="tpl-item"]').filter({ hasText: `${TAG} лохина` }).click()
    await expect(page.locator('[data-test="tpl-modal"]')).toHaveCount(0)
    pb = await progB()
    expect(pb.program_treatments).toHaveLength(2)

    // Мої шаблони: перейменувати й видалити
    await page.goto('/dashboard/techcard-templates')
    const card = page.locator('[data-test="tpl-card"]').filter({ hasText: `${TAG} лохина` })
    await card.locator('[data-test="tpl-rename"]').click()
    // Під час перейменування назва — у полі вводу, тож картку шукаємо за ним (редагується одна)
    await page.locator('[data-test="tpl-rename-input"]').fill(`${TAG} лохина v2`)
    await page.locator('[data-test="tpl-rename-save"]').click()
    const card2 = page.locator('[data-test="tpl-card"]').filter({ hasText: `${TAG} лохина v2` })
    await expect(card2).toBeVisible()
    await card2.locator('[data-test="tpl-delete"]').click()
    await page.getByRole('button', { name: 'Видалити', exact: true }).last().click()
    await expect(page.locator('[data-test="tpl-card"]').filter({ hasText: `${TAG} лохина` })).toHaveCount(0)
    await expectNoErrors(errors, 'шаблонах техкарт')
  })
})
