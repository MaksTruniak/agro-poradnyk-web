import { test, expect } from '@playwright/test'
import { asUser, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Звірка @препаратів відповіді AI агронома з каталогом. Модель не викликається:
// API звірки — справжній, а відповідь чату в браузері підмінено (SSE з тим самим форматом, що й сервер).
// Чат пише розмову фермера в ai_chats — лише з E2E_WRITE=1, після тесту створені розмови видаляються.

test.describe('@препарати в чаті AI агронома', () => {
  test.skip(!hasAccount('farmer'), 'потрібні E2E_FARMER_*')

  test('API звіряє назви з каталогом з урахуванням відмінків', async ({ request }) => {
    const farmer = await asUser('farmer')
    const res = await request.post('/api/ai-products', {
      headers: { Authorization: `Bearer ${farmer.token}` },
      data: { texts: ['Обробіть @Амістар Екстра 280 SC, потім @Хорусом. @Фітохвіст Супер — новинка.', 'без препаратів'] },
    })
    expect(res.status()).toBe(200)
    const { products } = await res.json()
    expect(products[0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ mention: 'Амістар Екстра 280 SC', found: true, slug: 'amistar-ekstra' }),
      expect.objectContaining({ mention: 'Хорусом', name: 'Хорус', found: true }),
      expect.objectContaining({ mention: 'Фітохвіст Супер', found: false }),
    ]))
    expect(products[1]).toEqual([])
    expect((await request.post('/api/ai-products', { data: { texts: ['@Хорус'] } })).status()).toBe(401)
  })

  test('відповідь: знайдений препарат — посилання на сторінку, вигаданий — «немає в каталозі»', async ({ page }) => {
    test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (чат зберігає розмову)')
    const farmer = await asUser('farmer')
    const started = new Date().toISOString()
    const errors = collectErrors(page)
    const text = 'Обробіть @Хорусом через 7 днів. Новинка @Фітохвіст Супер ще не перевірена.'
    await page.route('**/api/ai-chat', route => route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body: [
        { meta: { credits: { allowance: 100, used: 1, remaining: 99 }, charged: 1 } },
        { text },
        { products: [
          { mention: 'Хорусом', name: 'Хорус', found: true, slug: 'khorus', kind: 'product' },
          { mention: 'Фітохвіст Супер', name: 'Фітохвіст Супер', found: false },
        ] },
      ].map(d => `data: ${JSON.stringify(d)}\n\n`).join('') + 'data: [DONE]\n\n',
    }))
    try {
      await login(page, 'farmer')
      await page.goto('/dashboard/ai-chat')
      // Залежно від історії відкривається список розмов або сам чат
      const fresh = page.getByRole('button', { name: 'Нова розмова' }).first()
      const input = page.getByPlaceholder('Запитайте про агрономію...')
      await expect(fresh.or(input).first()).toBeVisible({ timeout: 15000 })
      if (await fresh.isVisible()) await fresh.click()
      await input.fill('Чим обробити лохину від антракнозу?')
      await input.press('Enter')

      const answer = page.locator('a[href="/pesticides/khorus"]').first()
      await expect(answer).toBeVisible({ timeout: 15000 })
      await expect(answer).toHaveText('Хорусом')
      await expect(page.locator('[data-test="ai-product-unknown-inline"]')).toContainText('Фітохвіст Супер')
      await expect(page.locator('[data-test="ai-product-found"]')).toHaveText('Хорус')
      await expect(page.locator('[data-test="ai-product-unknown"]')).toContainText('немає в каталозі')
      await expectNoErrors(errors, 'чаті AI')
    } finally {
      await serviceClient().from('ai_chats').delete().eq('user_id', farmer.userId).gte('created_at', started)
    }
  })

  test('фото стискається в браузері до 1500 px JPEG перед відправленням', async ({ page }) => {
    const errors = collectErrors(page)
    await login(page, 'farmer')
    await page.goto('/dashboard/ai-chat')
    const fresh = page.getByRole('button', { name: 'Нова розмова' }).first()
    const input = page.getByPlaceholder('Запитайте про агрономію...')
    await expect(fresh.or(input).first()).toBeVisible({ timeout: 15000 })
    if (await fresh.isVisible()) await fresh.click()
    // Велике «фото з телефона»: PNG 4000×3000 з шумом (кілька МБ)
    const b64 = await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 4000; c.height = 3000
      const ctx = c.getContext('2d')!
      const img = ctx.createImageData(4000, 3000)
      for (let i = 0; i < img.data.length; i++) img.data[i] = (i % 4 === 3) ? 255 : (Math.random() * 255) | 0
      ctx.putImageData(img, 0, 0)
      return c.toDataURL('image/png').split(',')[1]!
    })
    const original = Buffer.from(b64, 'base64')
    expect(original.length).toBeGreaterThan(3 * 1024 * 1024)
    await page.locator('input[type="file"][accept="image/*"]').first().setInputFiles({ name: 'field.png', mimeType: 'image/png', buffer: original })
    const preview = page.locator('img.h-20').first()
    await expect(preview).toHaveAttribute('src', /^data:image\/jpeg;base64,/, { timeout: 15000 })
    const size = await preview.evaluate((el: HTMLImageElement) => ({ len: el.src.length, w: el.naturalWidth, h: el.naturalHeight }))
    expect(Math.max(size.w, size.h)).toBe(1500)
    expect(size.w / size.h).toBeCloseTo(4 / 3, 2)
    // Шум стискається найгірше; справжнє фото виходить у кілька разів менше
    expect(size.len * 0.75, 'стиснене фото завелике').toBeLessThan(original.length / 3)
    await expectNoErrors(errors, 'чаті AI')
  })
})
