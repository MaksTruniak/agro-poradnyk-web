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
  const { plan, couponCode, hectares } = body

  if (!plan) throw createError({ statusCode: 400, message: 'Invalid plan' })

  const merchantAccount = process.env.WFP_MERCHANT_ACCOUNT!
  const merchantDomain  = process.env.WFP_MERCHANT_DOMAIN!
  const secretKey       = process.env.WFP_SECRET_KEY!
  const siteUrl         = process.env.NUXT_PUBLIC_SITE_URL || 'https://agroprostir.com.ua'

  const authHeader = getHeader(event, 'Authorization') || ''
  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  // Динамічна ціна: business = 299 + 10*га, business_pro = 599 + 15*га
  const DYNAMIC_PLANS: Record<string, { base: number; haRate: number; label: string }> = {
    business:     { base: 299, haRate: 10, label: 'Бізнес' },
    business_pro: { base: 599, haRate: 15, label: 'Бізнес Про' },
  }

  let planLabel = ''
  let basePrice = 0
  let planData: { price_uah: number; label: string; is_active: boolean } | null = null

  if (DYNAMIC_PLANS[plan]) {
    const dp = DYNAMIC_PLANS[plan]
    const ha = Number(hectares) || 0
    if (ha < 1) throw createError({ statusCode: 400, message: 'Hectares required' })
    basePrice = dp.base + ha * dp.haRate
    planLabel = `${dp.label} (${ha} га)`
    planData = { price_uah: basePrice, label: planLabel, is_active: true }
  } else {
    const { data } = await supabase.from('plans').select('price_uah, label, is_active').eq('id', plan).single()
    if (!data || !data.is_active) throw createError({ statusCode: 400, message: 'Plan not found or inactive' })
    planData = data
    basePrice = data.price_uah
    planLabel = data.label
  }

  // Знижка за лояльністю з БД
  const isSubscription = ['business','business_pro','agronomist_pro_month','agronomist_pro_year'].includes(plan)
  let discountPercent = 0
  let renewalCount = 0

  if (isSubscription) {
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('renewal_count')
      .eq('user_id', user.id)
      .maybeSingle()
    renewalCount = existingSub?.renewal_count ?? 0

    // Визначаємо роль для знижки
    const discountRole = plan.startsWith('agronomist') ? 'agronomist' : 'farmer'
    const discountYear = renewalCount >= 3 ? 3 : renewalCount + 1

    const { data: discountData } = await supabase
      .from('loyalty_discounts')
      .select('discount_percent')
      .eq('role', discountRole)
      .eq('renewal_year', discountYear)
      .single()

    discountPercent = discountData?.discount_percent ?? 0
  }

  // Купон
  let couponId: string | null = null
  if (couponCode) {
    const { data: coupon } = await supabase.from('coupons')
      .select('id, discount_percent, is_used, expires_at')
      .eq('code', String(couponCode).toUpperCase())
      .eq('user_id', user.id)
      .maybeSingle()
    if (coupon && !coupon.is_used && (!coupon.expires_at || new Date(coupon.expires_at) > new Date())) {
      discountPercent = Math.max(discountPercent, coupon.discount_percent)
      couponId = coupon.id
    }
  }

  const amount      = discountPercent > 0 ? Math.round(basePrice * (1 - discountPercent / 100)) : basePrice
  const labelSuffix = discountPercent > 0 ? ` (знижка ${discountPercent}%)` : ''

  const orderReference = `agro-${plan}-${user.id.slice(0, 8)}-${Date.now()}`
  const orderDate      = Math.floor(Date.now() / 1000)
  const currency       = 'UAH'
  const productName    = [`${planLabel}${labelSuffix}`]
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
    merchantOptions: { userId: user.id, plan, couponId, hectares: Number(hectares) || 0 },
  }

  return {
    ok: true,
    formData,
    endpoint: 'https://secure.wayforpay.com/pay',
    amount,
    basePrice,
    discountPercent,
  }
})
