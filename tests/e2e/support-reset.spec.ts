import { test, expect } from '@playwright/test'
import { asUser, collectErrors, expectNoErrors, hasAccount, login } from './helpers'

// Підтримка, інтеграції, відновлення пароля. Успішне звернення тут не надсилається — воно шле справжній
// лист у скриньку підтримки; перевіряються вхід, перевірка даних і сторінки.

test.describe('Підтримка й відновлення пароля', () => {
  test('звернення: лише з входом, тема обов\'язкова', async ({ request }) => {
    const anon = await request.post('/api/support-ticket', { data: { subject: 'тест' } })
    expect(anon.status()).toBe(401)

    test.skip(!hasAccount('farmer'), 'потрібні E2E_FARMER_*')
    const farmer = await asUser('farmer')
    const empty = await request.post('/api/support-ticket', {
      headers: { Authorization: `Bearer ${farmer.token}` }, data: { subject: '   ', body: 'деталі' },
    })
    expect(empty.status()).toBe(400)
  })

  test('сторінки підтримки й інтеграцій відкриваються без помилок', async ({ page }) => {
    test.skip(!hasAccount('farmer'), 'потрібні E2E_FARMER_*')
    await login(page, 'farmer')
    const errors = collectErrors(page)
    for (const path of ['/dashboard/support', '/dashboard/integrations']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expect(page.locator('h1')).toBeVisible()
    }
    await expectNoErrors(errors, 'підтримці / інтеграціях')
  })

  test('відновлення пароля: зламане посилання з листа — зрозуміле повідомлення', async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto('/reset-password?code=e2e-invalid-code')
    await expect(page.getByText(/Посилання не спрацювало/)).toBeVisible({ timeout: 15000 })
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible()
    await expect(page).toHaveURL(/\/reset-password$/)
    await expectNoErrors(errors, 'відновленні пароля')
  })
})
