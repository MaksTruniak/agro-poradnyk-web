import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const PLAN_PRICES: Record<string, number> = {
  pro_month:        1000,
  pro_year:        10000,
  business_month:   2000,
  business_year:   20000,
  top_agronomist:    299,
  top_seller:        499,
}

const PLAN_LABELS: Record<string, string> = {
  pro_month:       'АгроПростір PRO (1 місяць)',
  pro_year:        'АгроПростір PRO (1 рік)',
  business_month:  'АгроПростір Business (1 місяць)',
  business_year:   'АгроПростір Business (1 рік)',
  top_agronomist:  'Топ агронома (1 місяць)',
  top_seller:      'Топ продавця (1 місяць)',
}

function wfpSign(fields: string[], secretKey: string): string {
  return crypto
    .createHmac('md5', secretKey)
    .update(fields.join(';'))
    .digest('hex')
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { plan } = body

  if (!plan || !PLAN_PRICES[plan]) {
    throw createError({ statusCode: 400, message: 'Invalid plan' })
  }

  const merchantAccount = process.env.WFP_MERCHANT_ACCOUNT!
  const merchantDomain  = process.env.WFP_MERCHANT_DOMAIN!
  const secretKey       = process.env.WFP_SECRET_KEY!
  const siteUrl         = process.env.NUXT_PUBLIC_SITE_URL || 'https://agroprostir.com.ua'

  // Отримуємо user з Supabase (через Authorization header)
  const authHeader = getHeader(event, 'Authorization') || ''
  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const orderReference = `agro-${plan}-${user.id.slice(0, 8)}-${Date.now()}`
  const orderDate      = Math.floor(Date.now() / 1000)
  const amount         = PLAN_PRICES[plan]  // WFP приймає в гривнях
  const currency       = 'UAH'
  const productName    = [PLAN_LABELS[plan]]
  const productCount   = [1]
  const productPrice   = [amount]

  const signFields = [
    merchantAccount,
    merchantDomain,
    orderReference,
    String(orderDate),
    String(amount),
    currency,
    ...productName,
    ...productCount.map(String),
    ...productPrice.map(String),
  ]

  const merchantSignature = wfpSign(signFields, secretKey)

  const formData = {
    merchantAccount,
    merchantDomain,
    merchantTransactionSecureType: 'AUTO',
    merchantSignature,
    orderReference,
    orderDate: String(orderDate),
    amount: String(amount),
    currency,
    orderTimeout: '49000',
    productName,
    productCount,
    productPrice,
    clientEmail: user.email,
    language: 'UA',
    returnUrl: `${siteUrl}/payment/success?plan=${plan}`,
    serviceUrl: `${siteUrl}/api/payment/callback`,
    // Зберігаємо userId для callback
    merchantOptions: { userId: user.id, plan },
  }

  return { ok: true, formData, endpoint: 'https://secure.wayforpay.com/pay' }
})
