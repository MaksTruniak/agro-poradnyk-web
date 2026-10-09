import crypto from 'node:crypto'
import { test, expect } from '@playwright/test'
import { asUser, hasAccount, serviceClient } from './helpers'

// Оплата WayForPay без справжніх грошей: /api/payment/create рахує суму, а callback отримує відповідь,
// підписану тим самим секретом, що й від WayForPay. Пише в базу (платіж, підписка тестового агронома) —
// лише з E2E_WRITE=1; підписка й платежі відновлюються. Потрібна міграція 20261009_payments_unique_order.sql.

const sign = (fields: (string | number)[]) =>
  crypto.createHmac('md5', process.env.WFP_SECRET_KEY || '').update(fields.join(';')).digest('hex')

test.describe('Оплата WayForPay', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест пише платіж і змінює підписку)')
  test.skip(!hasAccount('agronomist') || !process.env.WFP_SECRET_KEY, 'потрібні E2E_AGRONOMIST_* і WFP_SECRET_KEY')
  test.describe.configure({ mode: 'serial' })

  const refs: string[] = []
  let original: Record<string, any> | null = null

  test.beforeAll(async () => {
    const { userId } = await asUser('agronomist')
    const { data } = await serviceClient().from('subscriptions').select('id, plan, expires_at, renewal_count, first_paid_at')
      .eq('user_id', userId).eq('profile', 'agronomist').maybeSingle()
    original = data
  })

  test.afterAll(async () => {
    const admin = serviceClient()
    if (refs.length) await admin.from('payments').delete().in('order_reference', refs)
    if (original) {
      const { id, ...rest } = original
      await admin.from('subscriptions').update(rest).eq('id', id)
    }
  })

  test('сума: PRO агронома за ціною з тарифу, кастомні тарифи не продаються', async ({ request }) => {
    const { token } = await asUser('agronomist')
    const headers = { Authorization: `Bearer ${token}` }
    const { data: plan } = await serviceClient().from('plans').select('price_uah').eq('id', 'agronomist_pro_month').single()

    const res = await request.post('/api/payment/create', { headers, data: { plan: 'agronomist_pro_month' } })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.basePrice, 'PRO агронома оплачувався за 0 грн').toBe(plan!.price_uah)
    expect(body.amount).toBeGreaterThan(0)

    for (const p of ['custom_month', 'custom_year', 'unknown']) {
      const bad = await request.post('/api/payment/create', { headers, data: { plan: p } })
      expect(bad.status(), `тариф ${p}`).toBe(400)
    }
  })

  test('callback: продовження від дати закінчення, повтор не зараховується', async ({ request }) => {
    const { userId } = await asUser('agronomist')
    const admin = serviceClient()
    // Активний PRO до певної дати — продовження має додати місяць саме до неї
    const end = new Date(Date.now() + 20 * 864e5)
    await admin.from('subscriptions').update({ plan: 'pro', expires_at: end.toISOString() }).eq('id', original!.id)

    const orderReference = `agro-agronomist_pro_month-${userId.slice(0, 8)}-${Date.now()}`
    refs.push(orderReference)
    const fields = { merchantAccount: process.env.WFP_MERCHANT_ACCOUNT || 'test', orderReference, amount: 350, currency: 'UAH', authCode: 'E2E', cardPan: '41****1111', transactionStatus: 'Approved', reasonCode: 1100 }
    const payload = {
      ...fields,
      merchantSignature: sign([fields.merchantAccount, orderReference, fields.amount, fields.currency, fields.authCode, fields.cardPan, fields.transactionStatus, fields.reasonCode]),
      merchantOptions: { userId },
    }

    const first = await request.post('/api/payment/callback', { data: payload })
    expect(first.status()).toBe(200)
    expect((await first.json()).status).toBe('accept')
    const { data: sub } = await admin.from('subscriptions').select('expires_at, first_paid_at').eq('id', original!.id).single()
    const expected = new Date(end); expected.setUTCMonth(expected.getUTCMonth() + 1)
    expect(Math.abs(new Date(sub!.expires_at).getTime() - expected.getTime()), 'оплачені дні згоріли').toBeLessThan(5000)
    expect(sub!.first_paid_at).toBeTruthy()

    // Повтор і паралельні повтори того самого замовлення — без другого продовження
    const again = await Promise.all([1, 2, 3].map(() => request.post('/api/payment/callback', { data: payload })))
    for (const r of again) expect(r.status()).toBe(200)
    const { data: after } = await admin.from('subscriptions').select('expires_at').eq('id', original!.id).single()
    expect(after!.expires_at).toBe(sub!.expires_at)
    const { count } = await admin.from('payments').select('id', { count: 'exact', head: true }).eq('order_reference', orderReference)
    expect(count).toBe(1)

    // Підроблений підпис — відмова, нічого не змінюється
    const forged = await request.post('/api/payment/callback', { data: { ...payload, orderReference: `${orderReference}-x`, merchantSignature: 'bad' } })
    expect(forged.status()).toBe(400)
  })
})
