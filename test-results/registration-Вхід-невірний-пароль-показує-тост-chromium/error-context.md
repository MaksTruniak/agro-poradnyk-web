# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: registration.spec.ts >> Вхід >> невірний пароль показує тост
- Location: tests/e2e/registration.spec.ts:157:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Невірний email або пароль')
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for getByText('Невірний email або пароль')

```

```yaml
- link "🌾":
  - /url: /
- heading "АгроПорадник" [level=1]
- paragraph: Увійдіть у свій акаунт
- button "Вхід"
- button "Реєстрація"
- text: Email
- textbox "email@example.com"
- text: Пароль
- textbox "••••••••"
- button "👁"
- button "Увійти"
- img
- button "Toggle Nuxt DevTools":
  - img
- text: 18 ms
- button "Toggle Component Inspector":
  - img
```

# Test source

```ts
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
  90  |     await expect(page.getByTestId('reg-company')).toBeVisible()
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
> 163 |     await expect(page.getByText('Невірний email або пароль')).toBeVisible({ timeout: 8000 })
      |                                                               ^ Error: expect(locator).toBeVisible() failed
  164 |   })
  165 | })
  166 | 
```