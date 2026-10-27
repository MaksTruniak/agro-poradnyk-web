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

  // План і користувача беремо з orderReference — він входить у підпис WFP.
  // merchantOptions НЕ підписані, тому лише підказка для повного userId (має збігатися з префіксом).
  // Формат: agro-{plan}-{userId8}-{timestamp}
  const opts = merchantOptions || {}
  let userId: string | null = null
  let plan: string | null = null
  let couponId: string | null = null
  let hectares: number | null = null

  const parts = String(orderReference || '').split('-')
  if (parts.length >= 4 && parts[0] === 'agro') {
    const userId8 = parts[parts.length - 2]
    ;({ plan, hectares } = splitPlanHectares(parts.slice(1, parts.length - 2).join('-')))
    if (typeof opts.userId === 'string' && opts.userId.startsWith(userId8)) {
      userId = opts.userId
    } else if (/^[0-9a-f]{8}$/i.test(userId8)) {
      // UUID з префіксом userId8 лежать у діапазоні [prefix-0000…, prefix-ffff…] — пошук за первинним ключем
      const supabaseTmp = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { data: found } = await supabaseTmp.from('users').select('id')
        .gte('id', `${userId8}-0000-0000-0000-000000000000`)
        .lte('id', `${userId8}-ffff-ffff-ffff-ffffffffffff`)
        .limit(2)
      userId = found?.length === 1 ? found[0]!.id : null  // два збіги префікса — неоднозначно, не вгадуємо
    }
    if (typeof opts.couponId === 'string') couponId = opts.couponId
  }

  if (!userId || !plan) {
    console.error('[WFP callback] Missing userId or plan', { opts, orderReference })
    return wfpResponse(orderReference, secretKey, 'accept')
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Платіж записуємо ПЕРШИМ: order_reference унікальний (20261009_payments_unique_order), тож повторний
  // або паралельний callback того самого замовлення не продовжить підписку вдруге
  const { error: payErr } = await supabase.from('payments').insert({
    user_id:         userId,
    plan,
    amount:          Number(amount),
    currency:        currency || 'UAH',
    status:          'paid',
    order_reference: orderReference,
  })
  if (payErr) {
    if (payErr.code !== '23505') console.error('[WFP callback] payment insert error:', payErr)
    return wfpResponse(orderReference, secretKey, 'accept')
  }

  const subPlan = SUBSCRIPTION_PLANS[plan]
  const aiPack = subPlan || PROMO_PLANS.includes(plan) ? null : await findAiPack(supabase, plan)
  if (aiPack) {
    // AI-пакет: кредити на місяць від оплати; межа собівартості — у $ за курсом на момент покупки.
    // Одночасно діє один пакет: якщо інший ще діє (дві оплати навздогін) — новий починається після нього.
    // payment_reference унікальний — повторний callback пакет не задвоїть (і платіж вище теж)
    const current = await latestAiPack(supabase, userId, aiPack.profile)
    const startsAt = current ? new Date(current.expires_at) : new Date()
    const expiresAt = new Date(startsAt)
    expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 1)
    const { error } = await supabase.from('ai_credit_topups').insert({
      owner_id:          userId,
      profile:           aiPack.profile,
      credits:           aiPack.credits,
      month:             startsAt.toISOString().slice(0, 7),
      source:            'pack',
      pack_id:           aiPack.id,
      payment_reference: orderReference,
      starts_at:         startsAt.toISOString(),
      expires_at:        expiresAt.toISOString(),
      cost_cap_usd:      Number(aiPack.cost_cap_uah) / await usdUahRate(),
    })
    if (error && error.code !== '23505') console.error('[WFP callback] AI pack insert error:', error)
  } else if (plan === 'top_agronomist') {
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
  } else if (subPlan) {
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('plan, expires_at, renewal_count, first_paid_at')
      .eq('user_id', userId)
      .eq('profile', subPlan.profile)
      .maybeSingle()

    // Продовження до кінця терміну — від дати закінчення, інакше від сьогодні
    const expiresAt = nextExpiry(existingSub, subPlan.plan, subPlan.months)
    const upsertSub = (row: Record<string, any>) => supabase.from('subscriptions').upsert(row, { onConflict: 'user_id,profile' })
    const row: Record<string, any> = {
      user_id:       userId,
      profile:       subPlan.profile,
      plan:          subPlan.plan,
      expires_at:    expiresAt.toISOString(),
      renewal_count: (existingSub?.renewal_count ?? 0) + 1,
      first_paid_at: existingSub?.first_paid_at ?? new Date().toISOString(),  // від неї рахується знижка лояльності
      trial_started_at: null,  // оплачено — більше не пробний період (AI тарифу без обмеження в днях)
      // Оплачені гектари — ліміт площі полів для «Бізнесу» (hectareLimitFor)
      ...(subPlan.profile === 'farmer' && hectares ? { custom_hectares: hectares } : {}),
    }
    let { error } = await upsertSub(row)
    // До міграції 20261101 колонки trial_started_at немає — підписку все одно продовжуємо
    if (error?.code === 'PGRST204') {
      const { trial_started_at: _, ...rest } = row
      ;({ error } = await upsertSub(rest))
    }
    if (error) console.error('[WFP callback] Supabase error:', error)
  } else {
    // Такий тариф не продається (create.post.ts його не пропустить) — гроші отримано, але нічого не видаємо автоматично
    console.error('[WFP callback] Unknown plan, payment saved without subscription', { plan, orderReference, userId })
  }

  // Позначити купон як використаний
  if (couponId) {
    await supabase.from('coupons').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', couponId).eq('user_id', userId)
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

    // E2E-тест оплати підписує цей заголовок тим самим секретом — чек тоді не надсилаємо
    const silent = getHeader(event, 'x-e2e-silent') === wfpSign(['e2e-silent'], secretKey)
    if (emailTo && !silent) {
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
