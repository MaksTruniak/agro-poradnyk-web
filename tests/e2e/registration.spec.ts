import { test, expect, type Page } from '@playwright/test'

const uid = () => Date.now()
const STRONG_PASSWORD = 'TestPass1!'

// Очищаємо cookies і localStorage перед кожним тестом без навігації
test.beforeEach(async ({ context }) => {
  await context.clearCookies()
  await context.addInitScript(() => localStorage.clear())
})

// Хелпер: перейти на реєстрацію і вибрати роль
async function selectRole(page: Page, roleTestId: string) {
  await page.goto('/auth?mode=register')
  await page.getByTestId(roleTestId).waitFor({ state: 'visible', timeout: 10000 })
  await page.getByTestId(roleTestId).click()
  await page.getByTestId('step1-next').click()
}

// Хелпер: заповнити email, телефон, паролі
async function fillCredentials(page: Page, email: string) {
  await page.getByTestId('reg-phone').fill('0671234567')
  await page.getByTestId('reg-email').fill(email)
  await page.getByTestId('reg-password').fill(STRONG_PASSWORD)
  await page.getByTestId('reg-confirm-password').fill(STRONG_PASSWORD)
}

// --- ВАЛІДАЦІЯ ---

test.describe('Валідація форми реєстрації', () => {
  test('некоректний email показує тост', async ({ page }) => {
    await selectRole(page, 'role-farmer')
    await page.getByTestId('reg-first-name').fill('Іван')
    await page.getByTestId('reg-last-name').fill('Тест')
    await page.getByTestId('reg-company').fill('ФГ Тест')
    await page.getByTestId('reg-phone').fill('0671234567')
    await page.getByTestId('reg-email').fill('notanemail')
    await page.getByTestId('reg-password').fill(STRONG_PASSWORD)
    await page.getByTestId('reg-confirm-password').fill(STRONG_PASSWORD)
    await page.getByTestId('reg-submit').click()
    await expect(page.getByText('Введіть коректний email')).toBeVisible({ timeout: 8000 })
  })

  test('паролі не співпадають показує тост', async ({ page }) => {
    await selectRole(page, 'role-farmer')
    await page.getByTestId('reg-first-name').fill('Іван')
    await page.getByTestId('reg-last-name').fill('Тест')
    await page.getByTestId('reg-company').fill('ФГ Тест')
    await page.getByTestId('reg-phone').fill('0671234567')
    await page.getByTestId('reg-email').fill(`test${uid()}@test.com`)
    await page.getByTestId('reg-password').fill(STRONG_PASSWORD)
    await page.getByTestId('reg-confirm-password').fill('WrongPass1!')
    await page.getByTestId('reg-submit').click()
    await expect(page.getByText('Паролі не співпадають')).toBeVisible({ timeout: 8000 })
  })

  test('слабкий пароль показує тост', async ({ page }) => {
    await selectRole(page, 'role-farmer')
    await page.getByTestId('reg-first-name').fill('Іван')
    await page.getByTestId('reg-last-name').fill('Тест')
    await page.getByTestId('reg-company').fill('ФГ Тест')
    await page.getByTestId('reg-phone').fill('0671234567')
    await page.getByTestId('reg-email').fill(`test${uid()}@test.com`)
    await page.getByTestId('reg-password').fill('weak')
    await page.getByTestId('reg-confirm-password').fill('weak')
    await page.getByTestId('reg-submit').click()
    await expect(page.getByText(/Пароль має бути/)).toBeVisible({ timeout: 8000 })
  })

  test('маска телефону форматує введення', async ({ page }) => {
    await selectRole(page, 'role-agronomist')
    const phoneInput = page.getByTestId('reg-phone')
    await phoneInput.fill('0671234567')
    await expect(phoneInput).toHaveValue('+38 (067) 123-45-67')
  })

  test('email автоматично lowercase', async ({ page }) => {
    await selectRole(page, 'role-agronomist')
    const emailInput = page.getByTestId('reg-email')
    await emailInput.fill('USER@EXAMPLE.COM')
    await expect(emailInput).toHaveValue('user@example.com')
  })
})

// --- ФЕРМЕР ---

test.describe('Реєстрація: Фермер', () => {
  test('відображає поле "Назва фермерського господарства", не відображає регіон', async ({ page }) => {
    await selectRole(page, 'role-farmer')
    await expect(page.getByTestId('reg-company')).toBeVisible()
    await expect(page.getByTestId('reg-region')).not.toBeVisible()
  })

  test('успішна реєстрація і редірект на дашборд', async ({ page }) => {
    await selectRole(page, 'role-farmer')
    await page.getByTestId('reg-first-name').fill('Іван')
    await page.getByTestId('reg-last-name').fill('Фермеренко')
    await page.getByTestId('reg-company').fill('ФГ "Зоря"')
    await fillCredentials(page, `farmer_${uid()}@test.com`)
    await page.getByTestId('reg-submit').click()
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
  })
})

// --- АГРОНОМ ---

test.describe('Реєстрація: Агроном', () => {
  test('відображає "Регіон роботи", не відображає назву компанії', async ({ page }) => {
    await selectRole(page, 'role-agronomist')
    await expect(page.getByTestId('reg-region')).toBeVisible()
    await expect(page.getByTestId('reg-company')).not.toBeVisible()
  })

  test('успішна реєстрація і редірект на дашборд', async ({ page }) => {
    await selectRole(page, 'role-agronomist')
    await page.getByTestId('reg-first-name').fill('Олег')
    await page.getByTestId('reg-last-name').fill('Агрономенко')
    await page.getByTestId('reg-region').selectOption('Київська')
    await fillCredentials(page, `agro_${uid()}@test.com`)
    await page.getByTestId('reg-submit').click()
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
  })
})

// --- ЗАГОТІВЕЛЬНИК ---

test.describe('Реєстрація: Заготівельник', () => {
  test('відображає "Назва підприємства або ФОП", не відображає регіон', async ({ page }) => {
    await selectRole(page, 'role-buyer')
    await expect(page.getByTestId('reg-company')).toBeVisible()
    await expect(page.getByTestId('reg-region')).not.toBeVisible()
  })

  test('успішна реєстрація і редірект на дашборд', async ({ page }) => {
    await selectRole(page, 'role-buyer')
    await page.getByTestId('reg-first-name').fill('Петро')
    await page.getByTestId('reg-last-name').fill('Заготівельниченко')
    await page.getByTestId('reg-company').fill('ТОВ "АгроТрейд"')
    await fillCredentials(page, `buyer_${uid()}@test.com`)
    await page.getByTestId('reg-submit').click()
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
  })
})

// --- ВХІД ---

test.describe('Вхід', () => {
  test('некоректний email при вході показує тост', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('login-email').waitFor({ state: 'visible' })
    await page.getByTestId('login-email').fill('bademail')
    await page.getByTestId('login-password').fill('somepassword')
    await page.getByTestId('login-submit').click()
    await expect(page.getByText('Введіть коректний email')).toBeVisible({ timeout: 8000 })
  })

  test('невірний пароль показує тост', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('login-email').waitFor({ state: 'visible' })
    await page.getByTestId('login-email').fill('test@test.com')
    await page.getByTestId('login-password').fill('WrongPass1!')
    await page.getByTestId('login-submit').click()
    await expect(page.getByText('Невірний email або пароль')).toBeVisible({ timeout: 8000 })
  })
})
