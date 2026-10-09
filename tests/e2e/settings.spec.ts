import { test, expect } from '@playwright/test'
import { asUser, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Налаштування профілю: реквізити, email, аватар, довжина полів — на акаунті заготівельника.
// ПИШЕ в його профіль, тому лише з E2E_WRITE=1; після тесту профіль відновлюється сервісним ключем.
// Потрібна міграція 20261009_users_profile_checks.sql.

const COLS = 'name, first_name, last_name, company_name, phone, edrpou, iban, bank_name, legal_address, avatar_url, email'
const IBAN = 'UA213996220000026007233566001'

test.describe('Налаштування профілю', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест змінює профіль заготівельника)')
  test.skip(!hasAccount('buyer'), 'потрібні E2E_BUYER_*')
  test.describe.configure({ mode: 'serial' })

  let original: Record<string, any> | null = null

  test.beforeAll(async () => {
    const { userId } = await asUser('buyer')
    const { data } = await serviceClient().from('users').select(COLS).eq('id', userId).single()
    original = data
  })

  test.afterAll(async () => {
    const { userId } = await asUser('buyer')
    if (original) await serviceClient().from('users').update(original).eq('id', userId)
  })

  test('база перевіряє реквізити, email і аватар', async () => {
    const buyer = await asUser('buyer')
    const c = buyer.client
    const { data: { user } } = await c.auth.getUser()
    const upd = (v: Record<string, unknown>) => c.from('users').update(v).eq('id', buyer.userId).select(COLS).single()

    const email = await upd({ email: 'someone@evil.example' })
    expect(email.data?.email, 'email профілю не пошта входу').toBe(user!.email)

    expect((await upd({ edrpou: 'abc' })).error, 'ЄДРПОУ «abc»').not.toBeNull()
    expect((await upd({ iban: 'hello' })).error, 'IBAN «hello»').not.toBeNull()
    expect((await upd({ name: 'N'.repeat(500) })).error, 'ім\'я на 500 символів').not.toBeNull()
    expect((await upd({ avatar_url: 'https://evil.example/track.png' })).error, 'стороннє посилання на аватар').not.toBeNull()

    const ok = await upd({ edrpou: ' 12345678 ', iban: 'ua21 3996 2200 0002 6007 2335 6600 1' })
    expect(ok.error).toBeNull()
    expect(ok.data).toMatchObject({ edrpou: '12345678', iban: IBAN })

    if (hasAccount('farmer')) {
      const farmer = await asUser('farmer')
      const { data: other } = await farmer.client.from('users').update({ name: 'зламано' }).eq('id', buyer.userId).select('id')
      expect(other ?? [], 'інший користувач змінив профіль').toEqual([])
    }
  })

  test('форма: неправильний IBAN не зберігається, правильний — з пробілами нормалізується', async ({ page }) => {
    const buyer = await asUser('buyer')
    const admin = serviceClient()
    await admin.from('users').update({ iban: null, edrpou: null }).eq('id', buyer.userId)

    await login(page, 'buyer')
    const errors = collectErrors(page)
    await page.goto('/dashboard/settings')
    await page.waitForLoadState('networkidle')
    const iban = page.getByPlaceholder(IBAN)
    const save = page.locator('.card', { hasText: 'Реквізити' }).getByRole('button', { name: 'Зберегти' })

    await iban.fill('UA123')
    await save.click()
    await expect(page.getByText('IBAN — UA і 27 цифр')).toBeVisible()
    const { data: still } = await admin.from('users').select('iban').eq('id', buyer.userId).single()
    expect(still!.iban).toBeNull()

    await iban.fill('ua21 3996 2200 0002 6007 2335 6600 1')
    await page.getByPlaceholder('12345678').first().fill('12345678')
    await save.click()
    await expect(page.getByText('✅ Збережено!').last()).toBeVisible()
    const { data: saved } = await admin.from('users').select('iban, edrpou').eq('id', buyer.userId).single()
    expect(saved).toMatchObject({ iban: IBAN, edrpou: '12345678' })
    await expectNoErrors(errors, 'налаштуваннях')
  })
})
