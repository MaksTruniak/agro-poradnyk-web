import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Playwright не читає .env сам — підвантажуємо змінні, яких ще немає в оточенні
const envPath = resolve(process.cwd(), '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]!] === undefined) process.env[m[1]!] = m[2]!.replace(/^['"]|['"]$/g, '')
  }
}

export type Role = 'farmer' | 'buyer' | 'agronomist' | 'admin'
export const ROLES: Role[] = ['farmer', 'buyer', 'agronomist', 'admin']

export const account = (role: Role) => ({
  email: process.env[`E2E_${role.toUpperCase()}_EMAIL`] || '',
  password: process.env[`E2E_${role.toUpperCase()}_PASSWORD`] || '',
})

export const hasAccount = (role: Role) => !!(account(role).email && account(role).password)

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_KEY || ''

/** Анонімний клієнт (публічний ключ, без входу) */
export const anonClient = () => createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

/** Клієнт сервісного ключа — лише для підготовки й прибирання тестових даних */
export const serviceClient = () =>
  createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || '', { auth: { persistSession: false } })

const sessions = new Map<Role, { client: SupabaseClient; userId: string; token: string }>()

/** Клієнт, що увійшов під тестовим акаунтом ролі (кешується на запуск) */
export async function asUser(role: Role) {
  const cached = sessions.get(role)
  if (cached) return cached
  const client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
  const { email, password } = account(role)
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`Не вдалося увійти як ${role}: ${error?.message}`)
  const s = { client, userId: data.user.id, token: data.session.access_token }
  sessions.set(role, s)
  return s
}

/** Вхід через форму сайту */
export async function login(page: Page, role: Role) {
  const { email, password } = account(role)
  await page.goto('/auth')
  await page.getByTestId('login-email').waitFor({ state: 'visible', timeout: 15000 })
  await page.getByTestId('login-email').fill(email)
  await page.getByTestId('login-password').fill(password)
  await page.getByTestId('login-submit').click()
  await page.waitForURL(/\/(dashboard|role-select|admin)/, { timeout: 20000 })
  // Кілька профілів — обираємо перший
  if (page.url().includes('/role-select')) {
    await page.locator('button, [role="button"]').first().click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
  }
}

/** Збирає JS-помилки й порушення CSP на сторінці */
export function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(`JS: ${String(e).slice(0, 300)}`))
  page.on('console', m => {
    const t = m.text()
    if (m.type() === 'error' && /Content Security Policy|Refused to|is not defined|Cannot read prop/i.test(t)) {
      errors.push(`console: ${t.slice(0, 300)}`)
    }
  })
  return errors
}

export async function expectNoErrors(errors: string[], where: string) {
  expect(errors, `Помилки на ${where}:\n${errors.join('\n')}`).toEqual([])
}
