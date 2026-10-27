import crypto from 'node:crypto'
import { test, expect } from '@playwright/test'
import { asUser, hasAccount, login, serviceClient } from './helpers'

// Термін дії: тариф і AI-пакет діють рівно до expires_at. Місяць не чекаємо — ставимо кінець терміну
// за кілька секунд, чекаємо і перевіряємо, що доступ зник. Оплата дає рівно 1 (рік — 12) календарних місяців.
// ЗМІНЮЄ підписки тестових фермера й агронома і пише пакети — лише з E2E_WRITE=1; усе відновлюється.

const sign = (fields: (string | number)[]) =>
  crypto.createHmac('md5', process.env.WFP_SECRET_KEY || '').update(fields.join(';')).digest('hex')
const SILENT = { 'x-e2e-silent': sign(['e2e-silent']) }
const WAIT_MS = 6000
const soon = () => new Date(Date.now() + 3000).toISOString()
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const plusMonths = (iso: string, n: number) => { const d = new Date(iso); d.setUTCMonth(d.getUTCMonth() + n); return d.getTime() }

test.describe('Термін дії тарифу й AI-пакета', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест змінює підписки й пише пакети)')
  test.skip(!hasAccount('farmer') || !hasAccount('agronomist'), 'потрібні E2E_FARMER_* і E2E_AGRONOMIST_*')
  test.describe.configure({ mode: 'serial' })

  const originals: Record<string, any>[] = []
  const refs: string[] = []

  test.afterAll(async () => {
    const admin = serviceClient()
    for (const { id, ...rest } of originals) await admin.from('subscriptions').update(rest).eq('id', id)
    if (refs.length) {
      await admin.from('ai_credit_topups').delete().in('payment_reference', refs)
      await admin.from('payments').delete().in('order_reference', refs)
    }
  })

  const saveSub = async (userId: string, profile: 'farmer' | 'agronomist') => {
    const { data } = await serviceClient().from('subscriptions')
      .select('id, plan, expires_at, renewal_count, first_paid_at, custom_hectares, trial_started_at').eq('user_id', userId).eq('profile', profile).maybeSingle()
    test.skip(!data, `у тестового акаунта немає підписки ${profile}`)
    originals.push(data!)
    return data!
  }
  const credits = async (request: any, token: string, profile: 'farmer' | 'agronomist') =>
    (await request.get('/api/ai-credits', { headers: { Authorization: `Bearer ${token}`, 'X-Agro-Profile': profile } })).json()
  const paid = async (request: any, plan: string, userId: string, amount: number, hectares?: number) => {
    const orderReference = `agro-${plan}${hectares ? `-ha${hectares}` : ''}-${userId.slice(0, 8)}-${Date.now()}`
    refs.push(orderReference)
    const f = { merchantAccount: process.env.WFP_MERCHANT_ACCOUNT || 'test', orderReference, amount, currency: 'UAH', authCode: 'E2E', cardPan: '41****1111', transactionStatus: 'Approved', reasonCode: 1100 }
    const res = await request.post('/api/payment/callback', {
      data: { ...f, merchantSignature: sign([f.merchantAccount, orderReference, f.amount, f.currency, f.authCode, f.cardPan, f.transactionStatus, f.reasonCode]), merchantOptions: { userId } },
      headers: SILENT,
    })
    expect(res.status()).toBe(200)
    return orderReference
  }

  test('Агроном Про: діє до кінця терміну, потім AI і PRO вимикаються', async ({ request }) => {
    const ag = await asUser('agronomist')
    const admin = serviceClient()
    const sub = await saveSub(ag.userId, 'agronomist')

    await admin.from('subscriptions').update({ plan: 'pro', expires_at: soon(), trial_started_at: null }).eq('id', sub.id)
    const before = await credits(request, ag.token, 'agronomist')
    expect(before.wallets.some((w: any) => w.kind === 'plan'), 'PRO ще діє, а кредитів тарифу немає').toBe(true)

    await sleep(WAIT_MS)
    const after = await credits(request, ag.token, 'agronomist')
    expect(after.wallets.some((w: any) => w.kind === 'plan'), 'PRO закінчився, а кредити тарифу лишились').toBe(false)
    const chat = await request.post('/api/ai-chat', {
      headers: { Authorization: `Bearer ${ag.token}`, 'X-Agro-Profile': 'agronomist' },
      data: { messages: [{ role: 'user', content: 'тест' }] },
    })
    expect(chat.status(), 'AI після закінчення PRO').toBe(403)
    // Шаблони техкарт — теж лише з PRO
    expect((await ag.client.from('techcard_templates').insert({ name: 'E2E після PRO' })).error).not.toBeNull()
  })

  test('Фермер Бізнес: діє до кінця терміну, потім тариф «Звичайний» і без AI тарифу', async ({ request, page }) => {
    const farmer = await asUser('farmer')
    const admin = serviceClient()
    const sub = await saveSub(farmer.userId, 'farmer')

    await admin.from('subscriptions').update({ plan: 'business', expires_at: soon(), trial_started_at: null }).eq('id', sub.id)
    expect((await credits(request, farmer.token, 'farmer')).wallets.some((w: any) => w.kind === 'plan')).toBe(true)

    await sleep(WAIT_MS)
    const after = await credits(request, farmer.token, 'farmer')
    expect(after.wallets.some((w: any) => w.kind === 'plan'), 'Бізнес закінчився, а кредити тарифу лишились').toBe(false)
    await login(page, 'farmer')
    await page.goto('/dashboard/subscription')
    await expect(page.getByText('Поточний план', { exact: true }).first().locator('..')).toContainText('Звичайний', { timeout: 15000 })
  })

  test('пробний період: тариф діє, а AI тарифу — лише перші 7 днів; оплата знімає обмеження', async ({ request, page }) => {
    const ag = await asUser('agronomist')
    const admin = serviceClient()
    // Підписку агронома збережено в першому тесті (afterAll її відновить)
    const { data: sub } = await admin.from('subscriptions').select('id').eq('user_id', ag.userId).eq('profile', 'agronomist').single()
    const { data: settings } = await admin.from('ai_settings').select('trial_ai_days').single()
    const days = settings!.trial_ai_days
    const headers = { Authorization: `Bearer ${ag.token}`, 'X-Agro-Profile': 'agronomist' }
    const halfYear = new Date(Date.now() + 150 * 864e5).toISOString()

    // День 2 пробного періоду: кредити тарифу є, «пробні … до» дати кінця AI
    const started = new Date(Date.now() - 864e5).toISOString()
    await admin.from('subscriptions').update({ plan: 'pro', expires_at: halfYear, trial_started_at: started }).eq('id', sub!.id)
    const early = await credits(request, ag.token, 'agronomist')
    const planWallet = early.wallets.find((w: any) => w.kind === 'plan')
    expect(planWallet, 'на початку пробного періоду немає AI').toBeTruthy()
    expect(new Date(planWallet.expiresAt).getTime()).toBe(new Date(started).getTime() + days * 864e5)

    // Після 7 днів: тариф Про діє (шаблони техкарт працюють), а AI тарифу — ні
    await admin.from('subscriptions').update({ trial_started_at: new Date(Date.now() - (days + 1) * 864e5).toISOString() }).eq('id', sub!.id)
    const late = await credits(request, ag.token, 'agronomist')
    expect(late.wallets.some((w: any) => w.kind === 'plan'), 'пробні дні AI минули, а кредити тарифу лишились').toBe(false)
    expect(late.trialAiEnded).toBe(true)
    const chat = await request.post('/api/ai-chat', { headers, data: { messages: [{ role: 'user', content: 'тест' }] } })
    expect(chat.status()).toBe(403)
    expect((await chat.json()).message).toContain('Пробний доступ до AI')
    const { data: tpl, error: tplErr } = await ag.client.from('techcard_templates').insert({ name: 'E2E пробний Про' }).select('id').single()
    expect(tplErr, 'Про в пробному періоді не діє').toBeNull()
    await admin.from('techcard_templates').delete().eq('id', tpl!.id)

    await login(page, 'agronomist')
    await page.goto('/dashboard/agronomist-subscription')
    await expect(page.locator('[data-test="ai-trial-ended"]')).toBeVisible({ timeout: 15000 })

    // Оплата Про — пробний період знято, AI тарифу знову є
    await paid(request, 'agronomist_pro_month', ag.userId, 350)
    const { data: after } = await admin.from('subscriptions').select('trial_started_at').eq('id', sub!.id).single()
    expect(after!.trial_started_at).toBeNull()
    expect((await credits(request, ag.token, 'agronomist')).wallets.some((w: any) => w.kind === 'plan')).toBe(true)
  })

  test('оплата тарифу: місяць — рівно 1 календарний місяць, рік — 12', async ({ request }) => {
    const ag = await asUser('agronomist')
    const admin = serviceClient()
    // Тариф прострочений — нова оплата рахується від сьогодні
    await admin.from('subscriptions').update({ expires_at: '2000-01-01T00:00:00Z' }).eq('user_id', ag.userId).eq('profile', 'agronomist')

    let t0 = new Date().toISOString()
    await paid(request, 'agronomist_pro_month', ag.userId, 350)
    let { data: sub } = await admin.from('subscriptions').select('plan, expires_at').eq('user_id', ag.userId).eq('profile', 'agronomist').single()
    expect(sub!.plan).toBe('pro')
    expect(Math.abs(new Date(sub!.expires_at).getTime() - plusMonths(t0, 1)), 'місяць PRO — не календарний місяць').toBeLessThan(10_000)

    await admin.from('subscriptions').update({ expires_at: '2000-01-01T00:00:00Z' }).eq('user_id', ag.userId).eq('profile', 'agronomist')
    t0 = new Date().toISOString()
    await paid(request, 'agronomist_pro_year', ag.userId, 3500)
    ;({ data: sub } = await admin.from('subscriptions').select('expires_at').eq('user_id', ag.userId).eq('profile', 'agronomist').single())
    expect(Math.abs(new Date(sub!.expires_at).getTime() - plusMonths(t0, 12)), 'рік PRO — не 12 місяців').toBeLessThan(10_000)
  })

  test('AI-пакет: рівно місяць від оплати, після кінця терміну не списується і можна купити новий', async ({ request, page }) => {
    const farmer = await asUser('farmer')
    const admin = serviceClient()
    const { data: pack } = await admin.from('ai_packs').select('price_uah, credits').eq('id', 'ai_plus').single()

    const ref = await paid(request, 'ai_plus', farmer.userId, pack!.price_uah)
    const { data: t } = await admin.from('ai_credit_topups').select('id, starts_at, expires_at').eq('payment_reference', ref).single()
    expect(new Date(t!.expires_at).getTime(), 'пакет — не календарний місяць').toBe(plusMonths(t!.starts_at, 1))

    // Пакет діє: видно в кредитах, другий не купити
    const headers = { Authorization: `Bearer ${farmer.token}` }
    expect((await credits(request, farmer.token, 'farmer')).wallets.some((w: any) => w.kind === 'pack')).toBe(true)
    expect((await request.post('/api/payment/create', { headers, data: { plan: 'ai_max' } })).status()).toBe(400)

    // Термін закінчується за кілька секунд
    await admin.from('ai_credit_topups').update({ expires_at: soon() }).eq('id', t!.id)
    await sleep(WAIT_MS)

    const after = await credits(request, farmer.token, 'farmer')
    expect(after.wallets.some((w: any) => w.kind === 'pack'), 'пакет закінчився, а кредити лишились').toBe(false)
    const charge = await admin.rpc('ai_charge', { p_owner: farmer.userId, p_profile: 'farmer', p_month: '2099-01', p_credits: 1, p_plan_allowance: 0, p_plan_cap_usd: 0 })
    expect(charge.data, 'списано з простроченого пакета').toBeNull()
    expect((await request.post('/api/payment/create', { headers, data: { plan: 'ai_max' } })).status(), 'новий пакет після закінчення').toBe(200)

    await login(page, 'farmer')
    await page.goto('/dashboard/subscription')
    await expect(page.locator('[data-test="ai-pack-buy-ai_plus"]')).toBeEnabled({ timeout: 15000 })
    await expect(page.locator('[data-test="ai-pack-active"]')).toHaveCount(0)
  })
})
