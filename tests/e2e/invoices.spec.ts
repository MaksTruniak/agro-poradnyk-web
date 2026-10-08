import { test, expect } from '@playwright/test'
import { asUser, collectApiErrors, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Платежі: історія оплат і рахунок для друку. Платіж записує лише callback WayForPay (сервісний ключ),
// тому тестовий платіж додається сервісним ключем. ПИШЕ в базу, тому лише з E2E_WRITE=1.

const REF = `E2E-invoice-${Date.now()}`

test.describe('Платежі', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer'), 'потрібні E2E_FARMER_*')

  test.afterAll(async () => {
    await serviceClient().from('payments').delete().eq('order_reference', REF)
  })

  test('річний тариф з назвою, рахунок з іменем платника', async ({ page }) => {
    const farmer = await asUser('farmer')
    const admin = serviceClient()
    const { error } = await admin.from('payments').insert({
      user_id: farmer.userId, plan: 'business_year', amount: 12345, currency: 'UAH', status: 'paid', order_reference: REF,
    })
    expect(error).toBeNull()
    const { data: plan } = await admin.from('plans').select('label').eq('id', 'business_year').single()
    const { data: user } = await admin.from('users').select('name').eq('id', farmer.userId).single()

    // Клієнт не може сам записати собі оплату чи змінити суму
    const forged = await farmer.client.from('payments').insert({ user_id: farmer.userId, plan: 'business', amount: 1, currency: 'UAH', status: 'paid', order_reference: `${REF}-x` })
    expect(forged.error, 'клієнт записав собі оплату').not.toBeNull()
    const edited = await farmer.client.from('payments').update({ amount: 1 }).eq('order_reference', REF).select('id')
    expect(edited.data ?? []).toEqual([])

    await login(page, 'farmer')
    const errors = collectErrors(page)
    const apiErrors = collectApiErrors(page)
    await page.goto('/dashboard/invoices')
    const row = page.locator('tr', { hasText: '12' }).filter({ hasText: plan!.label })
    await expect(row).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('business_year')).toHaveCount(0)

    const [popup] = await Promise.all([page.waitForEvent('popup'), row.getByRole('button', { name: /Завантажити/ }).click()])
    await expect(popup.locator('body')).toContainText('РАХУНОК')
    await expect(popup.locator('body')).toContainText(`Передплата: ${plan!.label}`)
    await expect(popup.locator('body')).toContainText(REF)
    if (user?.name) await expect(popup.locator('.party-name').last()).toHaveText(user.name)
    await popup.close()

    await expectNoErrors(errors, 'платежах')
    expect(apiErrors, apiErrors.join('\n')).toEqual([])
  })
})
