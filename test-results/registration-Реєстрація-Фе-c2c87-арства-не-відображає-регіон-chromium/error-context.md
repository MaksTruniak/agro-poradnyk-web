# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: registration.spec.ts >> Реєстрація: Фермер >> відображає поле "Назва фермерського господарства", не відображає регіон
- Location: tests/e2e/registration.spec.ts:88:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('reg-company')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('reg-company')

```

```yaml
- link "🌾":
  - /url: /
- heading "АгроПорадник" [level=1]
- paragraph: Хто ви?
- button "Вхід"
- button "Реєстрація"
- button "🌾 Фермер Веду поля, слідкую за культурами і програмами захисту ✓":
  - text: 🌾
  - paragraph: Фермер
  - paragraph: Веду поля, слідкую за культурами і програмами захисту
  - text: ✓
- button "🔬 Агроном Консультую фермерів і веду власні поля та культури":
  - text: 🔬
  - paragraph: Агроном
  - paragraph: Консультую фермерів і веду власні поля та культури
- button "🏭 Заготівельник Купую зерно та продукцію безпосередньо у фермерів":
  - text: 🏭
  - paragraph: Заготівельник
  - paragraph: Купую зерно та продукцію безпосередньо у фермерів
- button "Далі →"
- img
- button "Toggle Nuxt DevTools":
  - img
- text: 12 ms
- button "Toggle Component Inspector":
  - img
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test'
  2   | 
  3   | const uid = () => Date.now()
  4   | const STRONG_PASSWORD = 'TestPass1!'
  5   | 
  6   | // Очищаємо cookies і localStorage перед кожним тестом без навігації
  7   | test.beforeEach(async ({ context }) => {
  8   |   await context.clearCookies()
  9   |   await context.addInitScript(() => localStorage.clear())
  10  | })
  11  | 
  12  | // Хелпер: перейти на реєстрацію і вибрати роль
  13  | async function selectRole(page: Page, roleTestId: string) {
  14  |   await page.goto('/auth?mode=register')
  15  |   await page.getByTestId(roleTestId).waitFor({ state: 'visible', timeout: 10000 })
  16  |   await page.getByTestId(roleTestId).click()
  17  |   await page.getByTestId('step1-next').click()
  18  | }
  19  | 
  20  | // Хелпер: заповнити email, телефон, паролі
  21  | async function fillCredentials(page: Page, email: string) {
  22  |   await page.getByTestId('reg-phone').fill('0671234567')
  23  |   await page.getByTestId('reg-email').fill(email)
  24  |   await page.getByTestId('reg-password').fill(STRONG_PASSWORD)
  25  |   await page.getByTestId('reg-confirm-password').fill(STRONG_PASSWORD)
  26  | }
  27  | 
  28  | // --- ВАЛІДАЦІЯ ---
  29  | 
  30  | test.describe('Валідація форми реєстрації', () => {
  31  |   test('некоректний email показує тост', async ({ page }) => {
  32  |     await selectRole(page, 'role-farmer')
  33  |     await page.getByTestId('reg-first-name').fill('Іван')
  34  |     await page.getByTestId('reg-last-name').fill('Тест')
  35  |     await page.getByTestId('reg-company').fill('ФГ Тест')
  36  |     await page.getByTestId('reg-phone').fill('0671234567')
  37  |     await page.getByTestId('reg-email').fill('notanemail')
  38  |     await page.getByTestId('reg-password').fill(STRONG_PASSWORD)
  39  |     await page.getByTestId('reg-confirm-password').fill(STRONG_PASSWORD)
  40  |     await page.getByTestId('reg-submit').click()
  41  |     await expect(page.getByText('Введіть коректний email')).toBeVisible({ timeout: 8000 })
  42  |   })
  43  | 
  44  |   test('паролі не співпадають показує тост', async ({ page }) => {
  45  |     await selectRole(page, 'role-farmer')
  46  |     await page.getByTestId('reg-first-name').fill('Іван')
  47  |     await page.getByTestId('reg-last-name').fill('Тест')
  48  |     await page.getByTestId('reg-company').fill('ФГ Тест')
  49  |     await page.getByTestId('reg-phone').fill('0671234567')
  50  |     await page.getByTestId('reg-email').fill(`test${uid()}@test.com`)
  51  |     await page.getByTestId('reg-password').fill(STRONG_PASSWORD)
  52  |     await page.getByTestId('reg-confirm-password').fill('WrongPass1!')
  53  |     await page.getByTestId('reg-submit').click()
  54  |     await expect(page.getByText('Паролі не співпадають')).toBeVisible({ timeout: 8000 })
  55  |   })
  56  | 
  57  |   test('слабкий пароль показує тост', async ({ page }) => {
  58  |     await selectRole(page, 'role-farmer')
  59  |     await page.getByTestId('reg-first-name').fill('Іван')
  60  |     await page.getByTestId('reg-last-name').fill('Тест')
  61  |     await page.getByTestId('reg-company').fill('ФГ Тест')
  62  |     await page.getByTestId('reg-phone').fill('0671234567')
  63  |     await page.getByTestId('reg-email').fill(`test${uid()}@test.com`)
  64  |     await page.getByTestId('reg-password').fill('weak')
  65  |     await page.getByTestId('reg-confirm-password').fill('weak')
  66  |     await page.getByTestId('reg-submit').click()
  67  |     await expect(page.getByText(/Пароль має бути/)).toBeVisible({ timeout: 8000 })
  68  |   })
  69  | 
  70  |   test('маска телефону форматує введення', async ({ page }) => {
  71  |     await selectRole(page, 'role-agronomist')
  72  |     const phoneInput = page.getByTestId('reg-phone')
  73  |     await phoneInput.fill('0671234567')
  74  |     await expect(phoneInput).toHaveValue('+38 (067) 123-45-67')
  75  |   })
  76  | 
  77  |   test('email автоматично lowercase', async ({ page }) => {
  78  |     await selectRole(page, 'role-agronomist')
  79  |     const emailInput = page.getByTestId('reg-email')
  80  |     await emailInput.fill('USER@EXAMPLE.COM')
  81  |     await expect(emailInput).toHaveValue('user@example.com')
  82  |   })
  83  | })
  84  | 
  85  | // --- ФЕРМЕР ---
  86  | 
  87  | test.describe('Реєстрація: Фермер', () => {
  88  |   test('відображає поле "Назва фермерського господарства", не відображає регіон', async ({ page }) => {
  89  |     await selectRole(page, 'role-farmer')
> 90  |     await expect(page.getByTestId('reg-company')).toBeVisible()
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  91  |     await expect(page.getByTestId('reg-region')).not.toBeVisible()
  92  |   })
  93  | 
  94  |   test('успішна реєстрація і редірект на дашборд', async ({ page }) => {
  95  |     await selectRole(page, 'role-farmer')
  96  |     await page.getByTestId('reg-first-name').fill('Іван')
  97  |     await page.getByTestId('reg-last-name').fill('Фермеренко')
  98  |     await page.getByTestId('reg-company').fill('ФГ "Зоря"')
  99  |     await fillCredentials(page, `farmer_${uid()}@test.com`)
  100 |     await page.getByTestId('reg-submit').click()
  101 |     await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
  102 |   })
  103 | })
  104 | 
  105 | // --- АГРОНОМ ---
  106 | 
  107 | test.describe('Реєстрація: Агроном', () => {
  108 |   test('відображає "Регіон роботи", не відображає назву компанії', async ({ page }) => {
  109 |     await selectRole(page, 'role-agronomist')
  110 |     await expect(page.getByTestId('reg-region')).toBeVisible()
  111 |     await expect(page.getByTestId('reg-company')).not.toBeVisible()
  112 |   })
  113 | 
  114 |   test('успішна реєстрація і редірект на дашборд', async ({ page }) => {
  115 |     await selectRole(page, 'role-agronomist')
  116 |     await page.getByTestId('reg-first-name').fill('Олег')
  117 |     await page.getByTestId('reg-last-name').fill('Агрономенко')
  118 |     await page.getByTestId('reg-region').selectOption('Київська')
  119 |     await fillCredentials(page, `agro_${uid()}@test.com`)
  120 |     await page.getByTestId('reg-submit').click()
  121 |     await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
  122 |   })
  123 | })
  124 | 
  125 | // --- ЗАГОТІВЕЛЬНИК ---
  126 | 
  127 | test.describe('Реєстрація: Заготівельник', () => {
  128 |   test('відображає "Назва підприємства або ФОП", не відображає регіон', async ({ page }) => {
  129 |     await selectRole(page, 'role-buyer')
  130 |     await expect(page.getByTestId('reg-company')).toBeVisible()
  131 |     await expect(page.getByTestId('reg-region')).not.toBeVisible()
  132 |   })
  133 | 
  134 |   test('успішна реєстрація і редірект на дашборд', async ({ page }) => {
  135 |     await selectRole(page, 'role-buyer')
  136 |     await page.getByTestId('reg-first-name').fill('Петро')
  137 |     await page.getByTestId('reg-last-name').fill('Заготівельниченко')
  138 |     await page.getByTestId('reg-company').fill('ТОВ "АгроТрейд"')
  139 |     await fillCredentials(page, `buyer_${uid()}@test.com`)
  140 |     await page.getByTestId('reg-submit').click()
  141 |     await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
  142 |   })
  143 | })
  144 | 
  145 | // --- ВХІД ---
  146 | 
  147 | test.describe('Вхід', () => {
  148 |   test('некоректний email при вході показує тост', async ({ page }) => {
  149 |     await page.goto('/auth')
  150 |     await page.getByTestId('login-email').waitFor({ state: 'visible' })
  151 |     await page.getByTestId('login-email').fill('bademail')
  152 |     await page.getByTestId('login-password').fill('somepassword')
  153 |     await page.getByTestId('login-submit').click()
  154 |     await expect(page.getByText('Введіть коректний email')).toBeVisible({ timeout: 8000 })
  155 |   })
  156 | 
  157 |   test('невірний пароль показує тост', async ({ page }) => {
  158 |     await page.goto('/auth')
  159 |     await page.getByTestId('login-email').waitFor({ state: 'visible' })
  160 |     await page.getByTestId('login-email').fill('test@test.com')
  161 |     await page.getByTestId('login-password').fill('WrongPass1!')
  162 |     await page.getByTestId('login-submit').click()
  163 |     await expect(page.getByText('Невірний email або пароль')).toBeVisible({ timeout: 8000 })
  164 |   })
  165 | })
  166 | 
```