import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

function wfpSign(fields: string[], secretKey: string): string {
  return crypto
    .createHmac('md5', secretKey)
    .update(fields.join(';'))
    .digest('hex')
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

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
    console.error('[WFP callback] Invalid signature')
    throw createError({ statusCode: 400, message: 'Invalid signature' })
  }

  if (transactionStatus !== 'Approved') {
    // Відповідаємо WFP що отримали, але нічого не міняємо
    return wfpResponse(orderReference, secretKey, 'accept')
  }

  // Витягуємо userId та план з orderReference або merchantOptions
  const opts = merchantOptions || {}
  const userId = opts.userId
  const plan   = opts.plan

  if (!userId || !plan) {
    console.error('[WFP callback] Missing userId or plan in merchantOptions', opts)
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
  } else {
    const expiresAt = new Date()
    const isMonth = plan.endsWith('_month')
    if (isMonth) {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    }
    const basePlan = plan.startsWith('pro') ? 'pro' : 'business'
    const { error } = await supabase.from('subscriptions').upsert({
      user_id:    userId,
      plan:       basePlan,
      expires_at: expiresAt.toISOString(),
    }, { onConflict: 'user_id' })
    if (error) console.error('[WFP callback] Supabase error:', error)
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
