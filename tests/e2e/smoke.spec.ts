import { test } from '@playwright/test'
import { collectErrors, expectNoErrors, hasAccount, login, type Role } from './helpers'

// Кожна роль входить через форму і відкриває свої сторінки.
// Тест падає на JS-помилках (неіснуючі змінні тощо) і порушеннях CSP. Дані не змінює.

const PAGES: Record<Role, string[]> = {
  farmer: [
    '/dashboard', '/dashboard/fields', '/dashboard/ai-chat', '/dashboard/chats', '/dashboard/deals',
    '/dashboard/settings', '/dashboard/subscription', '/dashboard/reminders', '/dashboard/analytics',
    '/dashboard/expenses', '/dashboard/team', '/dashboard/harvest', '/dashboard/treatments',
    '/dashboard/protection', '/dashboard/invoices', '/dashboard/agreements',
  ],
  agronomist: [
    '/dashboard', '/dashboard/agronomist-fields', '/dashboard/agreements', '/dashboard/agronomist-subscription',
    '/dashboard/agronomist-profile', '/dashboard/promotion', '/dashboard/ai-chat', '/dashboard/chats',
  ],
  admin: ['/admin', '/admin/users', '/admin/stats', '/admin/plans', '/admin/ai-limits', '/admin/brands', '/admin/products'],
}

for (const role of Object.keys(PAGES) as Role[]) {
  test.describe(`Сторінки: ${role}`, () => {
    test.skip(!hasAccount(role), `немає E2E_${role.toUpperCase()}_* у .env`)

    test('відкриваються без помилок', async ({ page }) => {
      test.setTimeout(30_000 + PAGES[role].length * 15_000)
      await login(page, role)
      for (const path of PAGES[role]) {
        const errors = collectErrors(page)
        await page.goto(path)
        await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
        await page.waitForTimeout(800)
        await expectNoErrors(errors, `${role} ${path}`)
        page.removeAllListeners('pageerror')
        page.removeAllListeners('console')
      }
    })
  })
}
