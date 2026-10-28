import crypto from 'node:crypto'
import { test, expect } from '@playwright/test'
import { asUser, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// AI-пакети й межа собівартості AI. Кредити — у «гаманцях»: тариф на місяць і пакети зі своїм терміном.
// Списання ai_charge перевіряється на окремому місяці 2099-01 (лічильник тарифу тестового фермера не чіпаємо),
// модель не викликається. ПИШЕ в базу (пакети, журнал, платіж) — лише з E2E_WRITE=1; усе прибирається.

const sign = (fields: (string | number)[]) =>
  crypto.createHmac('md5', process.env.WFP_SECRET_KEY || '').update(fields.join(';')).digest('hex')
const SILENT = { 'x-e2e-silent': sign(['e2e-silent']) }
const MONTH = '2099-01'

test.describe('AI-пакети', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест пише пакети й журнал AI)')
  test.skip(!hasAccount('farmer'), 'потрібні E2E_FARMER_*')
  test.describe.configure({ mode: 'serial' })

  const topupIds: string[] = []
  const requestIds: string[] = []
  const refs: string[] = []

  test.afterAll(async () => {
    const admin = serviceClient()
    if (requestIds.length) await admin.from('ai_requests').delete().in('id', requestIds)
    if (refs.length) {
      await admin.from('ai_credit_topups').delete().in('payment_reference', refs)
      await admin.from('payments').delete().in('order_reference', refs)
    }
    if (topupIds.length) await admin.from('ai_credit_topups').delete().in('id', topupIds)
  })

  test('гаманці: спершу тариф, потім пакет, що закінчується раніше; межа собівартості; клієнт кредитів не дасть собі', async ({ request }) => {
    const farmer = await asUser('farmer')
    const admin = serviceClient()
    const day = 864e5
    const mk = async (days: number, cap: number) => {
      const { data, error } = await admin.from('ai_credit_topups').insert({
        owner_id: farmer.userId, profile: 'farmer', credits: 3, month: MONTH, source: 'e2e',
        starts_at: new Date(Date.now() - day).toISOString(), expires_at: new Date(Date.now() + days * day).toISOString(), cost_cap_usd: cap,
      }).select('id').single()
      expect(error).toBeNull()
      topupIds.push(data!.id)
      return data!.id as string
    }
    const later = await mk(20, 1)
    const sooner = await mk(5, 0.5)
    const charge = (credits: number, planAllowance = 0, planCap = 0) => admin.rpc('ai_charge', {
      p_owner: farmer.userId, p_profile: 'farmer', p_month: MONTH, p_credits: credits, p_plan_allowance: planAllowance, p_plan_cap_usd: planCap,
    }).then(r => r.data as any)

    // Тариф з вичерпаною межею собівартості не списується; пакет, що закінчується раніше, — першим
    expect(await charge(1, 50, 0)).toMatchObject({ source: 'topup', topup_id: sooner })

    // Собівартість пакета дійшла до межі — далі списується наступний, хоча кредити ще є
    const { data: req } = await admin.from('ai_requests').insert({
      user_id: farmer.userId, owner_id: farmer.userId, profile: 'farmer', action: 'chat', provider: 'anthropic', model: 'e2e', cost_usd: 0.6, topup_id: sooner,
    }).select('id').single()
    requestIds.push(req!.id)
    expect(await charge(1)).toMatchObject({ source: 'topup', topup_id: later })
    expect(await charge(5), 'списано більше, ніж є в гаманці').toBeNull()

    // Повернення — у той самий гаманець
    await admin.rpc('ai_release', { p_owner: farmer.userId, p_profile: 'farmer', p_month: MONTH, p_credits: 1, p_topup: later })
    const { data: rows } = await admin.from('ai_credit_topups').select('id, credits_used').in('id', [later, sooner])
    expect(rows!.find(r => r.id === later)!.credits_used).toBe(0)
    expect(rows!.find(r => r.id === sooner)!.credits_used).toBe(1)

    // Лічильник на сайті: пакети видно, у пакета з вичерпаною межею кредити не рахуються доступними
    const credits = await (await request.get('/api/ai-credits', { headers: { Authorization: `Bearer ${farmer.token}`, 'X-Agro-Profile': 'farmer' } })).json()
    const packs = credits.wallets.filter((w: any) => w.kind === 'pack')
    expect(packs.length).toBeGreaterThanOrEqual(2)
    expect(packs.some((w: any) => w.capReached && w.credits - w.used === 2), 'межа собівартості не врахована').toBe(true)
    expect(credits.remaining).toBeLessThanOrEqual(credits.allowance - credits.used)

    // Клієнт: ні собі пакет, ні обнулити використання, ні змінити каталог, ні списати в обхід сервера
    const c = farmer.client
    expect((await c.from('ai_credit_topups').insert({ owner_id: farmer.userId, profile: 'farmer', credits: 999, month: MONTH, expires_at: '2100-01-01' })).error).not.toBeNull()
    expect((await c.from('ai_credit_topups').update({ credits_used: 0 }).eq('id', sooner).select('id')).data ?? []).toEqual([])
    expect((await c.from('ai_packs').update({ price_uah: 1 }).eq('id', 'ai_plus').select('id')).data ?? []).toEqual([])
    expect((await c.from('ai_settings').update({ usd_uah: 1 }).eq('id', true).select('id')).data ?? []).toEqual([])
    expect((await c.rpc('ai_charge', { p_owner: farmer.userId, p_profile: 'farmer', p_month: MONTH, p_credits: -100, p_plan_allowance: 0, p_plan_cap_usd: 0 })).error).not.toBeNull()
  })

  test('оплата пакета: ціна з каталогу без купонів, callback видає пакет один раз, одночасно — один пакет', async ({ request }) => {
    test.skip(!process.env.WFP_SECRET_KEY, 'потрібен WFP_SECRET_KEY')
    const farmer = await asUser('farmer')
    const admin = serviceClient()
    const headers = { Authorization: `Bearer ${farmer.token}` }
    const [{ data: pack }, { data: settings }] = await Promise.all([
      admin.from('ai_packs').select('price_uah, credits, cost_cap_uah').eq('id', 'ai_plus').single(),
      admin.from('ai_settings').select('usd_uah').single(),
    ])

    const res = await request.post('/api/payment/create', { headers, data: { plan: 'ai_plus', couponCode: 'ANY' } })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.basePrice).toBe(pack!.price_uah)
    expect(body.amount).toBe(pack!.price_uah)
    expect(body.formData.orderReference).toMatch(/^agro-ai_plus-/)
    expect((await request.post('/api/payment/create', { headers, data: { plan: 'ai_nope' } })).status()).toBe(400)

    const paid = async (orderReference: string) => {
      refs.push(orderReference)
      const f = { merchantAccount: process.env.WFP_MERCHANT_ACCOUNT || 'test', orderReference, amount: pack!.price_uah, currency: 'UAH', authCode: 'E2E', cardPan: '41****1111', transactionStatus: 'Approved', reasonCode: 1100 }
      const payload = { ...f, merchantSignature: sign([f.merchantAccount, orderReference, f.amount, f.currency, f.authCode, f.cardPan, f.transactionStatus, f.reasonCode]), merchantOptions: { userId: farmer.userId } }
      return Promise.all([1, 2, 3].map(() => request.post('/api/payment/callback', { data: payload, headers: SILENT })))
    }
    const orderReference = `agro-ai_plus-${farmer.userId.slice(0, 8)}-${Date.now()}`
    for (const r of await paid(orderReference)) expect(r.status()).toBe(200)

    const { data: topups } = await admin.from('ai_credit_topups').select('owner_id, profile, credits, pack_id, source, starts_at, expires_at, cost_cap_usd')
      .eq('payment_reference', orderReference)
    expect(topups, 'пакет видано не один раз').toHaveLength(1)
    const t = topups![0]!
    expect(t).toMatchObject({ owner_id: farmer.userId, profile: 'farmer', credits: pack!.credits, pack_id: 'ai_plus', source: 'pack' })
    // Пакет — на календарний місяць від оплати
    const month = new Date(t.starts_at); month.setUTCMonth(month.getUTCMonth() + 1)
    expect(new Date(t.expires_at).getTime()).toBe(month.getTime())
    expect(Number(t.cost_cap_usd)).toBeCloseTo(Number(pack!.cost_cap_uah) / Number(settings!.usd_uah), 4)

    // Поки пакет діє, новий не купити
    const again = await request.post('/api/payment/create', { headers, data: { plan: 'ai_max' } })
    expect(again.status(), 'другий пакет при активному').toBe(400)
    expect((await again.json()).message).toContain('уже діє AI-пакет')

    // Кредити пакета закінчились — новий можна купити одразу, і він діє з дня оплати
    await admin.from('ai_credit_topups').update({ credits_used: pack!.credits }).eq('payment_reference', orderReference)
    expect((await request.post('/api/payment/create', { headers, data: { plan: 'ai_max' } })).status(), 'новий пакет після вичерпаного').toBe(200)
    const second = `agro-ai_plus-${farmer.userId.slice(0, 8)}-${Date.now() + 1}`
    for (const r of await paid(second)) expect(r.status()).toBe(200)
    const { data: fresh } = await admin.from('ai_credit_topups').select('starts_at, expires_at').eq('payment_reference', second).single()
    expect(Math.abs(new Date(fresh!.starts_at).getTime() - Date.now()), 'новий пакет не діє одразу').toBeLessThan(5 * 60_000)

    // Оплата навздогін (друга вкладка) — гроші не пропадають: наступний пакет починається після чинного
    const third = `agro-ai_plus-${farmer.userId.slice(0, 8)}-${Date.now() + 2}`
    for (const r of await paid(third)) expect(r.status()).toBe(200)
    const { data: queued } = await admin.from('ai_credit_topups').select('starts_at').eq('payment_reference', third).single()
    expect(new Date(queued!.starts_at).getTime()).toBe(new Date(fresh!.expires_at).getTime())
  })

  test('сторінка підписки: пакети на продаж і гаманці кредитів', async ({ page }) => {
    const errors = collectErrors(page)
    await login(page, 'farmer')
    await page.goto('/dashboard/subscription')
    await expect(page.locator('[data-test="ai-packs"] [data-test="ai-pack"]')).toHaveCount(2, { timeout: 15000 })
    // Пакет з попереднього тесту діє — купити ще один не можна
    await expect(page.locator('[data-test="ai-pack-active"]')).toContainText('AI Плюс')
    await expect(page.locator('[data-test="ai-pack-buy-ai_plus"]')).toBeDisabled()
    // Пакети з попередніх тестів активні — у лічильнику кредитів вони окремими рядками з терміном
    await expect(page.locator('[data-test="ai-wallet"]').filter({ hasText: 'до ' }).first()).toBeVisible()
    await expect(page.locator('[data-test="ai-wallet"]').filter({ hasText: 'ліміт вичерпано' }).first()).toBeVisible()
    await expectNoErrors(errors, 'підписка з AI-пакетами')
  })
})
