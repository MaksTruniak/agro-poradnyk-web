import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { sendPaymentConfirmEmail } from '../../utils/email'

function wfpSign(fields: string[], secretKey: string): string {
  return crypto
    .createHmac('md5', secretKey)
    .update(fields.join(';'))
    .digest('hex')
}

export default defineEventHandler(async (event) => {
  const contentType = getHeader(event, 'content-type') || ''
  const raw = await readRawBody(event) || ''
  let body: any

  // Спробуємо розпарсити як JSON (WFP надсилає JSON-рядок навіть з urlencoded content-type)
  try {
    const decoded = decodeURIComponent(raw).replace(/^\[?/, '').replace(/\]?$/, '')
    body = JSON.parse(decoded)
  } catch {
    // Fallback: URLSearchParams → беремо перше значення
    const params = new URLSearchParams(raw)
    const firstVal = [...params.values()][0]
    if (firstVal) {
      try { body = JSON.parse(decodeURIComponent(firstVal)) } catch { body = Object.fromEntries(params) }
    } else {
      body = Object.fromEntries(params)
    }
  }

  if (Array.isArray(body)) body = body[0]
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch {} }

  console.log('[WFP callback] merchantAccount:', body?.merchantAccount, 'status:', body?.transactionStatus)

  const secretKey = process.env.WFP_SECRET_KEY!

  // Перевірка підпису від WFP
  const {
    merchantAccount,
    orderReference,
    amount,
    currency,
    authCode,
    cardPan,
    transactionStatus,
    reasonCode,
    merchantSignature,
    merchantOptions,
  } = body

  const signFields = [
    merchantAccount,
    orderReference,
    String(amount),
    currency,
    authCode || '',
    cardPan || '',
    transactionStatus,
    String(reasonCode),
  ]

  const expectedSign = wfpSign(signFields, secretKey)
  if (expectedSign !== merchantSignature) {
    console.error('[WFP callback] Invalid signature', {
      merchantAccount,
      signFields,
      expected: expectedSign.slice(0, 8) + '...',
      received: merchantSignature?.slice(0, 8) + '...',
      secretKeyLen: secretKey?.length,
      secretKeyStart: secretKey?.slice(0, 4) + '...',
    })
    throw createError({ statusCode: 400, message: 'Invalid signature' })
  }

  if (transactionStatus !== 'Approved') {
    // Відповідаємо WFP що отримали, але нічого не міняємо
    return wfpResponse(orderReference, secretKey, 'accept')
  }

  // Витягуємо userId та план з merchantOptions або з orderReference
  const opts = merchantOptions || {}
  let userId   = opts.userId
  let plan     = opts.plan
  const couponId = opts.couponId || null

  // Fallback: парсимо orderReference = agro-{plan}-{userId8}-{timestamp}
  if ((!userId || !plan) && orderReference) {
    const parts = orderReference.split('-')
    // agro | plan | userId8 | timestamp  (plan може бути з '_' тому беремо частини)
    if (parts.length >= 4 && parts[0] === 'agro') {
      // userId8 — це передостання частина перед timestamp
      const timestamp = parts[parts.length - 1]
      const userId8   = parts[parts.length - 2]
      const planParts = parts.slice(1, parts.length - 2)
      if (!plan) plan = planParts.join('_')
      // userId8 — лише перші 8 символів, потрібно знайти юзера в БД
      if (!userId) {
        const supabaseTmp = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        // UUID треба шукати через auth.admin або через rpc
        const { data: { users: authUsers } } = await supabaseTmp.auth.admin.listUsers({ perPage: 1000 })
        const found = authUsers?.find(u => u.id.startsWith(userId8))
        userId = found?.id || null
        console.log('[WFP callback] userId lookup:', userId8, '→', userId)
      }
      console.log('[WFP callback] Parsed from orderReference:', { plan, userId8, timestamp })
    }
  }

  if (!userId || !plan) {
    console.error('[WFP callback] Missing userId or plan', { opts, orderReference })
    return wfpResponse(orderReference, secretKey, 'accept')
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (plan === 'top_agronomist') {
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)
    await supabase.from('agronomist_profiles').update({
      promotion_plan: 'top',
      promotion_expires_at: expiresAt.toISOString(),
    }).eq('user_id', userId)
  } else if (plan === 'top_seller') {
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)
    await supabase.from('seller_profiles').update({
      promotion_plan: 'top',
      promotion_expires_at: expiresAt.toISOString(),
    }).eq('user_id', userId)
  } else if (plan === 'agronomist_pro_month' || plan === 'agronomist_pro_year') {
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('renewal_count')
      .eq('user_id', userId)
      .maybeSingle()

    const renewalCount = existingSub?.renewal_count ?? 0
    const expiresAt = new Date()
    if (plan === 'agronomist_pro_month') {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 16) // 12 + 4 бонусних
    }
    await supabase.from('subscriptions').upsert({
      user_id:       userId,
      plan:          'pro',
      expires_at:    expiresAt.toISOString(),
      renewal_count: renewalCount + 1,
    }, { onConflict: 'user_id' })
  } else {
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('renewal_count, first_paid_at')
      .eq('user_id', userId)
      .maybeSingle()

    const renewalCount = existingSub?.renewal_count ?? 0
    const firstPaidAt = existingSub?.first_paid_at ?? new Date().toISOString()
    const expiresAt = new Date()
    const isMonth = plan.endsWith('_month')
    if (isMonth) {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else {
      // Рік (12 місяців) + 4 бонусних за річну оплату = 16
      expiresAt.setMonth(expiresAt.getMonth() + 16)
    }
    const basePlan = plan === 'business_pro' ? 'business_pro' : plan.startsWith('premium') ? 'premium' : plan.startsWith('pro') ? 'pro' : 'business'
    const { error } = await supabase.from('subscriptions').upsert({
      user_id:       userId,
      plan:          basePlan,
      expires_at:    expiresAt.toISOString(),
      renewal_count: renewalCount + 1,
      first_paid_at: firstPaidAt,
    }, { onConflict: 'user_id' })
    if (error) console.error('[WFP callback] Supabase error:', error)
  }

  // Зберігаємо платіж як інвойс
  await supabase.from('payments').insert({
    user_id:         userId,
    plan,
    amount:          Number(amount),
    currency:        currency || 'UAH',
    status:          'paid',
    order_reference: orderReference,
  })

  // Позначити купон як використаний
  if (couponId) {
    await supabase.from('coupons').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', couponId)
  }

  // Відправляємо email підтвердження з чеком
  try {
    const { data: profileData } = await supabase
      .from('users')
      .select('email, first_name, last_name, name')
      .eq('id', userId)
      .maybeSingle()

    const emailTo = profileData?.email || (await supabase.auth.admin.getUserById(userId)).data?.user?.email
    const firstName = profileData?.first_name || profileData?.name?.split(' ')[0] || ''
    const lastName  = profileData?.last_name  || profileData?.name?.split(' ').slice(1).join(' ') || ''
    const fullName  = [firstName, lastName].filter(Boolean).join(' ') || emailTo?.split('@')[0] || ''

    if (emailTo) {
      await sendPaymentConfirmEmail(emailTo, fullName, plan, {
        amount: Number(amount),
        currency: currency || 'UAH',
        orderReference,
        paidAt: new Date().toISOString(),
      })
    }
  } catch (e) {
    console.error('[WFP callback] Email error:', e)
  }

  return wfpResponse(orderReference, secretKey, 'accept')
})

function wfpResponse(orderReference: string, secretKey: string, status: 'accept' | 'decline') {
  const time = Math.floor(Date.now() / 1000)
  const signFields = [orderReference, status, String(time)]
  const signature  = crypto
    .createHmac('md5', secretKey)
    .update(signFields.join(';'))
    .digest('hex')

  return {
    orderReference,
    status,
    time,
    signature,
  }
}
