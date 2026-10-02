import { test, expect } from '@playwright/test'
import { asUser, hasAccount, serviceClient } from './helpers'

// Ліміти AI рахує сервер. Тест не звертається до моделі: лічильник фермера на поточний місяць
// ставиться на межу ліміту, і сервер має відмовити ДО виклику AI. Після тесту лічильник відновлюється.
// ПИШЕ в базу (ai_usage), тому лише з E2E_WRITE=1.

const month = new Date().toISOString().slice(0, 7)

test.describe('Ліміти AI', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест змінює лічильник ai_usage)')
  test.skip(!hasAccount('farmer'), 'потрібні E2E_FARMER_*')

  let original: { text_count: number; photo_count: number } | null = null
  let userId = ''

  test.afterAll(async () => {
    if (!userId) return
    const q = serviceClient().from('ai_usage')
    if (original) await q.update(original).eq('user_id', userId).eq('profile', 'farmer').eq('month', month)
    else await q.delete().eq('user_id', userId).eq('profile', 'farmer').eq('month', month)
  })

  test('вичерпаний ліміт: сервер відмовляє і не рахує запит', async ({ request }) => {
    const farmer = await asUser('farmer')
    userId = farmer.userId
    const admin = serviceClient()

    const { data: sub } = await admin.from('subscriptions').select('plan, expires_at, ai_text_limit, ai_photo_limit')
      .eq('user_id', userId).eq('profile', 'farmer').maybeSingle()
    const { data: limitsRows } = await admin.from('ai_plan_limits').select('plan, text_limit, photo_limit')
    const dbLimits = Object.fromEntries((limitsRows ?? []).map(r => [r.plan, { text: r.text_limit, photo: r.photo_limit }]))
    const plan = sub?.plan && (!sub.expires_at || new Date(sub.expires_at) > new Date()) ? sub.plan : 'basic'
    const textLimit: number = sub?.ai_text_limit ?? dbLimits[plan]?.text ?? 0
    test.skip(textLimit <= 0, 'у тестового фермера немає доступу до AI')

    const { data: usage } = await admin.from('ai_usage').select('text_count, photo_count')
      .eq('user_id', userId).eq('profile', 'farmer').eq('month', month).maybeSingle()
    original = usage ?? null
    await admin.from('ai_usage').upsert({ user_id: userId, profile: 'farmer', month, text_count: textLimit, photo_count: 0 },
      { onConflict: 'user_id,profile,month' })

    for (const [path, body] of [
      ['/api/ai-generate-card', { cropType: 'Пшениця озима' }],
      ['/api/ai-chat', { messages: [{ role: 'user', content: 'тест' }] }],
    ] as const) {
      const res = await request.post(path, {
        headers: { Authorization: `Bearer ${farmer.token}`, 'X-Agro-Profile': 'farmer' },
        data: body,
      })
      expect(res.status(), `${path} пропустив запит понад ліміт`).toBe(403)
    }

    const { data: after } = await admin.from('ai_usage').select('text_count')
      .eq('user_id', userId).eq('profile', 'farmer').eq('month', month).single()
    expect(after!.text_count, 'відхилений запит зарахувався').toBe(textLimit)
  })

  test('без входу AI недоступний', async ({ request }) => {
    for (const path of ['/api/ai-chat', '/api/ai-generate-card', '/api/ai-summary', '/api/ai-season-report', '/api/calendar-explain']) {
      const res = await request.post(path, { data: { cropType: 'Пшениця озима', messages: [{ role: 'user', content: 'тест' }] } })
      expect([401, 429], `${path} без входу: ${res.status()}`).toContain(res.status())
    }
  })
})
