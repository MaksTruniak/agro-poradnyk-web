import { test, expect } from '@playwright/test'
import { anonClient, asUser, hasAccount, ROLES } from './helpers'

// Перевірки прав доступу на реальній базі (міграції supabase/migrations/20261001_*.sql).
// Нічого не змінюють: усі спроби запису мають бути відхилені або проігноровані.

test.describe('Анонім (без входу)', () => {
  const db = anonClient()

  test('не бачить приватних таблиць', async () => {
    for (const table of ['users', 'subscriptions', 'ai_usage', 'messages', 'coupons', 'payments', 'farms']) {
      const { data } = await db.from(table).select('*').limit(5)
      expect(data ?? [], `анонім читає ${table}`).toEqual([])
    }
  })

  test('публічні представлення без контактів і кадастру', async () => {
    const { error: phoneErr } = await db.from('public_profiles').select('phone').limit(1)
    expect(phoneErr, 'public_profiles віддає телефон').not.toBeNull()
    const { error: cadErr } = await db.from('public_farms').select('cadastral_number').limit(1)
    expect(cadErr, 'public_farms віддає кадастровий номер').not.toBeNull()
  })

  test('адмінські функції й лічильник недоступні', async () => {
    for (const fn of ['admin_search_users_with_sub', 'admin_users_with_custom_ai_limits', 'admin_user_stats', 'expire_promotions']) {
      const { error } = await db.rpc(fn, fn === 'admin_search_users_with_sub' ? { q: '' } : {})
      expect(error, `анонім викликає ${fn}`).not.toBeNull()
    }
    const { error } = await db.rpc('hit_rate_limit', { p_key: 'x', p_max: 1, p_window_seconds: 1 })
    expect(error).not.toBeNull()
  })

  test('серверні API вимагають входу', async ({ request }) => {
    for (const [method, path] of [
      ['GET', '/api/admin/users'], ['GET', '/api/admin/user-stats'],
      ['POST', '/api/harvest/create-worker'], ['POST', '/api/team/invite'], ['POST', '/api/email/welcome'],
      ['POST', '/api/deals/send-invoice'], ['POST', '/api/upload-image'], ['POST', '/api/ai-chat'],
    ] as const) {
      const res = method === 'GET' ? await request.get(path) : await request.post(path, { data: {} })
      expect(res.status(), `${method} ${path}`).toBe(401)
    }
  })
})

test.describe('Фермер', () => {
  test.skip(!hasAccount('farmer'), 'немає E2E_FARMER_* у .env')

  test('у users бачить лише себе', async () => {
    const { client, userId } = await asUser('farmer')
    const { data } = await client.from('users').select('id')
    expect((data ?? []).map(r => r.id)).toEqual([userId])
  })

  test('не може підняти собі роль, верифікацію чи рейтинг', async () => {
    const { client, userId } = await asUser('farmer')
    const { data: before } = await client.from('users').select('role, is_admin, is_verified, farmer_rating').eq('id', userId).single()
    await client.from('users').update({ role: 'admin', is_admin: true, is_verified: true, farmer_rating: 5 }).eq('id', userId)
    const { data: after } = await client.from('users').select('role, is_admin, is_verified, farmer_rating').eq('id', userId).single()
    expect(after).toEqual(before)
  })

  test('не може записати собі підписку, купон, платіж, AI-лічильник', async () => {
    const { client, userId } = await asUser('farmer')
    const sub = await client.from('subscriptions').insert({ user_id: userId, profile: 'agronomist', plan: 'pro' })
    expect(sub.error, 'вставка підписки').not.toBeNull()
    const upd = await client.from('subscriptions').update({ plan: 'business_pro', expires_at: null }).eq('user_id', userId).select()
    expect(upd.data ?? [], 'зміна підписки').toEqual([])
    const coupon = await client.from('coupons').insert({ user_id: userId, code: 'E2EFREE', discount_percent: 100 })
    expect(coupon.error, 'вставка купона').not.toBeNull()
    const pay = await client.from('payments').insert({ user_id: userId, plan: 'business_pro', amount: 0, status: 'paid' })
    expect(pay.error, 'вставка платежу').not.toBeNull()
    const usage = await client.from('ai_usage').update({ text_count: 0 }).eq('user_id', userId).select()
    expect(usage.data ?? [], 'обнулення AI-лічильника').toEqual([])
  })

  test('не бачить чужих даних і функцій', async () => {
    test.skip(!hasAccount('agronomist'), 'немає E2E_AGRONOMIST_*')
    const { client } = await asUser('farmer')
    const { userId: otherId } = await asUser('agronomist')
    const { data } = await client.from('users').select('id, phone').eq('id', otherId)
    expect(data ?? []).toEqual([])
    const { data: pub } = await client.from('public_profiles').select('id, name').eq('id', otherId)
    expect(pub?.length).toBe(1)
    for (const fn of ['admin_search_users_with_sub', 'admin_user_stats']) {
      const { error } = await client.rpc(fn, fn === 'admin_search_users_with_sub' ? { q: '' } : {})
      expect(error, `фермер викликає ${fn}`).not.toBeNull()
    }
  })

  test('сховище: лише свій аватар-картинка', async () => {
    test.skip(!hasAccount('agronomist'), 'немає E2E_AGRONOMIST_*')
    const { client, userId } = await asUser('farmer')
    const { userId: otherId } = await asUser('agronomist')
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    const foreign = await client.storage.from('user-avatars').upload(`avatars/${otherId}.png`, png, { contentType: 'image/png', upsert: true })
    expect(foreign.error, 'чужий аватар').not.toBeNull()
    const html = await client.storage.from('user-avatars').upload(`avatars/${userId}.html`, new TextEncoder().encode('<b>x</b>'), { contentType: 'text/html', upsert: true })
    expect(html.error, 'html у сховищі').not.toBeNull()
    const chat = await client.storage.from('chat-images').upload(`x/e2e.png`, png, { contentType: 'image/png' })
    expect(chat.error, 'пряме завантаження в chat-images').not.toBeNull()
  })

  test('адмінський API відповідає 403', async ({ request }) => {
    const { token } = await asUser('farmer')
    const res = await request.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
    expect(res.status()).toBe(403)
  })
})

test.describe('Агроном', () => {
  test.skip(!hasAccount('agronomist'), 'немає E2E_AGRONOMIST_* у .env')

  test('не може верифікувати себе чи поставити «Топ»', async () => {
    const { client, userId } = await asUser('agronomist')
    const { data: before } = await client.from('agronomist_profiles').select('is_verified, promotion_plan, rating').eq('user_id', userId).maybeSingle()
    test.skip(!before, 'у тестового агронома немає профілю агронома')
    await client.from('agronomist_profiles').update({ is_verified: true, promotion_plan: 'top', rating: 5 }).eq('user_id', userId)
    const { data: after } = await client.from('agronomist_profiles').select('is_verified, promotion_plan, rating').eq('user_id', userId).maybeSingle()
    expect(after).toEqual(before)
  })
})

test.describe('Адмін', () => {
  test.skip(!hasAccount('admin'), 'немає E2E_ADMIN_* у .env')

  test('має доступ до адмінських функцій і API', async ({ request }) => {
    const { client, token } = await asUser('admin')
    const { error } = await client.rpc('admin_search_users_with_sub', { q: '@' })
    expect(error).toBeNull()
    const users = await request.get('/api/admin/users?limit=5', { headers: { Authorization: `Bearer ${token}` } })
    expect(users.status()).toBe(200)
    const stats = await request.get('/api/admin/user-stats', { headers: { Authorization: `Bearer ${token}` } })
    expect(stats.status()).toBe(200)
  })
})

test('усі тестові акаунти входять', async () => {
  for (const role of ROLES.filter(hasAccount)) {
    const { userId } = await asUser(role)
    expect(userId, role).toBeTruthy()
  }
})
