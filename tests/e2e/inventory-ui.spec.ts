import { test, expect, type Page } from '@playwright/test'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Склад через інтерфейс: фермер додає, списує, редагує й видаляє записи кнопками сайту;
// результат перевіряється в базі. ПИШЕ в базу, тому лише з E2E_WRITE=1; прибирається сервісним ключем.

const TAG = `E2E ${Date.now()}`
const FUEL_PRICE = 77.7  // унікальна ціна — щоб знайти свою картку пального (тип обирається зі списку)

const modal = (page: Page) => page.locator('.fixed.inset-0').last()
const card = (page: Page, text: string) => page.locator('.card', { hasText: text })

test.describe('Склад через інтерфейс', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer'), 'потрібні E2E_FARMER_*')

  test.afterAll(async () => {
    const admin = serviceClient()
    const { userId } = await asUser('farmer')
    await admin.from('farm_inventory').delete().eq('user_id', userId).like('name', `${TAG}%`)
    await admin.from('fuel_inventory').delete().eq('user_id', userId).eq('price_per_unit', FUEL_PRICE)
    await admin.from('equipment').delete().eq('user_id', userId).like('name', `${TAG}%`)
  })

  test('хімія, пальне, техніка кнопками сайту', async ({ page }) => {
    test.setTimeout(180_000)
    const farmer = await asUser('farmer')
    const admin = serviceClient()
    await login(page, 'farmer')
    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)
    page.on('dialog', d => d.accept())  // пальне й техніка видаляють через confirm()

    // ── Хімія: додати → витратити нижче мінімуму → видалити ──
    await page.goto('/dashboard/inventory/chemicals')
    await page.getByRole('button', { name: 'Додати', exact: true }).first().click()
    await modal(page).getByPlaceholder('Почніть вводити назву...').fill(`${TAG} гербіцид`)
    await modal(page).getByPlaceholder('0').fill('20')
    await modal(page).getByPlaceholder('Не встановлено').fill('5')
    await modal(page).getByRole('button', { name: 'Додати', exact: true }).click()
    await expect(card(page, `${TAG} гербіцид`)).toContainText('20')

    await card(page, `${TAG} гербіцид`).getByRole('button', { name: /Витрачено/ }).click()
    await modal(page).getByPlaceholder('0').fill('18')
    await modal(page).getByRole('button', { name: 'Зберегти' }).click()
    await expect(card(page, `${TAG} гербіцид`)).toContainText('2')
    await expect(page.getByText('Закінчується запас')).toBeVisible()
    const { data: chem } = await admin.from('farm_inventory').select('id, quantity').eq('user_id', farmer.userId).eq('name', `${TAG} гербіцид`).single()
    expect(Number(chem!.quantity)).toBe(2)
    const { data: logs } = await admin.from('farm_inventory_log').select('type, quantity').eq('inventory_id', chem!.id)
    expect(logs?.map(l => `${l.type}:${Number(l.quantity)}`).sort()).toEqual(['in:20', 'out:18'])

    await card(page, `${TAG} гербіцид`).locator('button.border-red-200').click()
    await page.getByRole('button', { name: 'Видалити' }).last().click()
    await expect(card(page, `${TAG} гербіцид`)).toHaveCount(0)
    const { data: chemGone } = await admin.from('farm_inventory').select('id').eq('id', chem!.id)
    expect(chemGone ?? []).toEqual([])

    // ── Пальне: додати → заправка → видалити ──
    await page.goto('/dashboard/inventory/fuel')
    await page.getByRole('button', { name: /Додати/ }).first().click()
    await modal(page).getByPlaceholder('0').first().fill('500')
    await modal(page).getByPlaceholder('грн').fill(String(FUEL_PRICE))
    await modal(page).getByRole('button', { name: /^Додати$/ }).click()
    const fuelCard = card(page, `${FUEL_PRICE} грн`)
    await expect(fuelCard).toContainText('500')
    await fuelCard.getByRole('button', { name: /Витрачено|Заправка|Витрата/ }).click()
    await modal(page).getByPlaceholder('0').fill('120')
    await modal(page).getByRole('button', { name: 'Зберегти' }).click()
    await expect(fuelCard).toContainText('380')
    const { data: fuel } = await admin.from('fuel_inventory').select('id, quantity').eq('user_id', farmer.userId).eq('price_per_unit', FUEL_PRICE).single()
    expect(Number(fuel!.quantity)).toBe(380)
    await fuelCard.locator('button.border-red-200').click()
    await expect(fuelCard).toHaveCount(0)

    // ── Техніка: додати → змінити стан → видалити ──
    await page.goto('/dashboard/inventory/equipment')
    await page.getByRole('button', { name: /Додати/ }).first().click()
    await modal(page).getByPlaceholder('напр. Трактор МТЗ-82').fill(`${TAG} МТЗ`)
    await modal(page).getByPlaceholder('2010').fill('2015')
    await modal(page).getByRole('button', { name: /^(Додати|Зберегти)$/ }).click()
    await expect(card(page, `${TAG} МТЗ`)).toContainText('Працює')
    const { data: eq } = await admin.from('equipment').select('id, year, status').eq('user_id', farmer.userId).eq('name', `${TAG} МТЗ`).single()
    expect(eq).toMatchObject({ year: 2015, status: 'ok' })
    await card(page, `${TAG} МТЗ`).locator('button.border-red-200').click()
    await expect(card(page, `${TAG} МТЗ`)).toHaveCount(0)

    await expectNoErrors([...errors, ...apiErrors], 'склад через інтерфейс')
  })
})
