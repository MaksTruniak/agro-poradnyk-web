import { test, expect } from '@playwright/test'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Акт огляду: агроном з активною співпрацею складає акт з фото й рекомендацією → обробка в техкарті клієнта,
// сповіщення й повідомлення в чаті; фермер бачить акт і фото; сторонній — ні.
// ПИШЕ в базу і сховище — лише з E2E_WRITE=1; усе прибирається. Потрібна міграція 20261025_inspections.sql.

const TAG = `E2E ${Date.now()}`
// 1×1 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

test.describe('Акт огляду насадження', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('agronomist') || !hasAccount('buyer'), 'потрібні фермер, агроном і заготівельник')

  let farmId = '', cropId = '', agreementId = '', inspectionId = ''
  const newChats: string[] = []

  test.afterAll(async () => {
    const admin = serviceClient()
    if (cropId) {
      const { data: files } = await admin.storage.from('inspection-photos').list(`${cropId}/${inspectionId}`)
      if (files?.length) await admin.storage.from('inspection-photos').remove(files.map(f => `${cropId}/${inspectionId}/${f.name}`))
    }
    if (inspectionId) await admin.from('farm_notifications').delete().eq('type', 'inspection').contains('data', { inspectionId })
    for (const id of newChats) { await admin.from('messages').delete().eq('chat_id', id); await admin.from('chats').delete().eq('id', id) }
    if (agreementId) await admin.from('agreements').delete().eq('id', agreementId)
    if (farmId) {
      if (cropId) await admin.from('protection_programs').delete().eq('farm_crop_id', cropId)
      await admin.from('farm_crops').delete().eq('farm_id', farmId)
      await admin.from('farms').delete().eq('id', farmId)
    }
  })

  test('агроном складає й надсилає акт, фермер бачить', async ({ browser }) => {
    const farmer = await asUser('farmer')
    const agronomist = await asUser('agronomist')
    const stranger = await asUser('buyer')
    const admin = serviceClient()
    const { data: existing } = await admin.from('agreements').select('id')
      .eq('agronomist_id', agronomist.userId).eq('farmer_id', farmer.userId).in('status', ['pending', 'active'])
    test.skip(!!existing?.length, 'між тестовими акаунтами вже є співпраця')

    const { data: farm } = await farmer.client.from('farms').insert({ user_id: farmer.userId, name: TAG, region: 'Київська', hectares: 3 }).select('id').single()
    farmId = farm!.id
    const { data: crop } = await farmer.client.from('farm_crops').insert({ farm_id: farmId, crop_type: 'Лохина', area_ha: 2, planting_year: 2021 }).select('id').single()
    cropId = crop!.id
    // Фермер не може сам скласти акт
    const forged = await farmer.client.from('planting_inspections').insert({ farm_crop_id: cropId })
    expect(forged.error, 'фермер створив акт').not.toBeNull()

    const { data: ag } = await admin.from('agreements').insert({
      farmer_id: farmer.userId, agronomist_id: agronomist.userId, status: 'active', started_at: new Date().toISOString(), message: TAG,
    }).select('id').single()
    agreementId = ag!.id
    const { data: chatsBefore } = await admin.from('chats').select('id').eq('farmer_id', farmer.userId).eq('agronomist_id', agronomist.userId)

    // ── Агроном ──
    const aCtx = await browser.newContext()
    const page = await aCtx.newPage()
    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)
    await login(page, 'agronomist')
    await page.goto(`/dashboard/inspection/edit?cropId=${cropId}`)
    const form = page.locator('[data-test="inspection-form"]')
    await expect(form).toBeVisible({ timeout: 15000 })
    await form.getByRole('button', { name: 'Потребує уваги' }).click()
    await form.locator('[data-test="ins-add-finding"]').click()
    const finding = form.locator('[data-test="ins-finding"]').first()
    await finding.locator('[data-test="ins-finding-name"]').fill('Антракноз')
    await finding.getByRole('button', { name: 'помірно' }).click()
    await finding.locator('input[type="number"]').fill('15')
    await finding.locator('[data-test="ins-photo-input"]').setInputFiles({ name: 'leaf.png', mimeType: 'image/png', buffer: PNG })
    await expect(finding.locator('img')).toHaveCount(1)
    await form.locator('[data-test="ins-add-rec"]').click()
    const rec = form.locator('[data-test="ins-rec"]').first()
    await rec.locator('[data-test="ins-rec-product"]').fill(`${TAG} Світч`)
    await rec.locator('[data-test="ins-rec-dosage"]').fill('1 кг/га')
    await expect(rec.locator('[data-test="ins-rec-techcard"]')).toBeChecked()
    await form.locator('[data-test="ins-summary"]').fill('Плями антракнозу на листі нижнього ярусу, ряди 3–5.')
    await form.locator('[data-test="ins-send"]').click()
    await page.waitForURL(/\/dashboard\/inspection\/[0-9a-f-]{36}$/, { timeout: 20000 })
    inspectionId = page.url().split('/').pop()!
    await expect(page.getByText('Акт надіслано фермеру')).toBeVisible()
    await expect(page.locator('[data-test="ins-condition"]')).toHaveText('Потребує уваги')
    await expectNoErrors(errors, 'акті огляду (агроном)')
    expect(apiErrors, apiErrors.join('\n')).toEqual([])

    // Обробка в техкарті клієнта, сповіщення, повідомлення в чаті
    const { data: program } = await admin.from('protection_programs').select('id').eq('farm_crop_id', cropId).single()
    const { data: tr } = await admin.from('program_treatments').select('product_name, dosage, type, status').eq('program_id', program!.id)
    expect(tr).toEqual([{ product_name: `${TAG} Світч`, dosage: '1 кг/га', type: 'захист', status: 'planned' }])
    const { data: note } = await admin.from('farm_notifications').select('title, user_id').eq('type', 'inspection').contains('data', { inspectionId })
    expect(note?.[0]).toMatchObject({ user_id: farmer.userId, title: expect.stringContaining('Лохина') })
    const { data: chats } = await admin.from('chats').select('id').eq('farmer_id', farmer.userId).eq('agronomist_id', agronomist.userId)
    for (const c of chats || []) if (!(chatsBefore || []).some((b: any) => b.id === c.id)) newChats.push(c.id)
    const { data: msg } = await admin.from('messages').select('content').in('chat_id', (chats || []).map((c: any) => c.id)).like('content', `%/dashboard/inspection/${inspectionId}%`)
    expect(msg ?? [], 'немає повідомлення з актом у чаті').toHaveLength(1)
    await aCtx.close()

    // Сторонній не бачить ні акта, ні фото
    expect((await stranger.client.from('planting_inspections').select('id').eq('id', inspectionId)).data ?? []).toEqual([])
    const { data: strangerFiles } = await stranger.client.storage.from('inspection-photos').list(`${cropId}/${inspectionId}`)
    expect(strangerFiles ?? []).toEqual([])

    // ── Фермер ──
    const fCtx = await browser.newContext()
    const fp = await fCtx.newPage()
    const fErrors = collectErrors(fp)
    await login(fp, 'farmer')
    await fp.goto(`/dashboard/farm/${farmId}`)
    const chip = fp.locator('[data-test="inspection-chip"]')
    await expect(chip).toContainText('потребує уваги', { timeout: 15000 })
    await expect(fp.locator('[data-test="inspection-new"]')).toHaveCount(0)
    await chip.click()
    await expect(fp.locator('[data-test="ins-finding-view"]')).toContainText('Антракноз')
    await expect(fp.locator('[data-test="ins-finding-view"]')).toContainText('уражено 15%')
    const img = fp.locator('[data-test="ins-finding-view"] img')
    await expect(img).toHaveCount(1)
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0)
    await expect(fp.locator('[data-test="ins-rec-view"]')).toContainText(`${TAG} Світч`)
    await expect(fp.getByRole('link', { name: 'Редагувати' })).toHaveCount(0)
    await expectNoErrors(fErrors, 'акті огляду (фермер)')
    await fCtx.close()
  })
})
