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

  if (!plan || typeof plan !== 'string') throw createError({ statusCode: 400, message: 'Invalid plan' })

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

  // Лише тарифи, які продаються на сайті (кастомні плани з ціною 0 оформлює адмін, а не оплата), і активні AI-пакети
  const aiPack = plan in SUBSCRIPTION_PLANS || PROMO_PLANS.includes(plan) ? null : await findAiPack(supabase, plan)
  if (!(plan in SUBSCRIPTION_PLANS || PROMO_PLANS.includes(plan) || aiPack?.is_active)) throw createError({ statusCode: 400, message: 'Invalid plan' })

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { data: profile } = await supabase
    .from('users')
    .select('first_name, last_name, name, email')
    .eq('id', user.id)
    .maybeSingle()

  const clientFirstName = profile?.first_name || profile?.name?.split(' ')[0] || ''
  const clientLastName  = profile?.last_name  || profile?.name?.split(' ').slice(1).join(' ') || ''
  const clientEmail     = profile?.email || user.email || ''

  // Одночасно — лише один AI-пакет: новий можна купити, коли закінчиться поточний
  if (aiPack) {
    const active = await latestAiPack(supabase, user.id, aiPack.profile)
    if (active) {
      const till = new Date(active.expires_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', timeZone: 'Europe/Kyiv' })
      throw createError({ statusCode: 400, message: `У вас уже діє AI-пакет до ${till}. Новий можна купити після його закінчення.` })
    }
  }

  // Беремо план з БД (AI-пакет — з ai_packs: фіксована ціна, без гектарів)
  const { data: planData } = aiPack
    ? { data: { label: `${aiPack.label} — ${aiPack.credits} кредитів AI на місяць`, base_price: aiPack.price_uah, price_uah: aiPack.price_uah, ha_rate: 0, is_active: aiPack.is_active } }
    : await supabase
      .from('plans')
      .select('label, base_price, price_uah, ha_rate, is_active')
      .eq('id', plan)
      .single()

  if (!planData || !planData.is_active) throw createError({ statusCode: 400, message: 'Plan not found or inactive' })

  let basePrice = 0
  let planLabel = planData.label
  let paidHectares: number | null = null

  if (planData.ha_rate > 0) {
    // Ціна з гектарами
    const ha = Math.floor(Number(hectares) || 0)
    if (ha < 1) throw createError({ statusCode: 400, message: 'Hectares required' })
    // Межі тарифів (як на сторінці підписки): Бізнес — 2–50 га, Бізнес Про — від 50 га
    const isPro = plan === 'business_pro' || plan === 'business_pro_year'
    const isBusiness = plan === 'business' || plan === 'business_year'
    if (isBusiness && (ha < 2 || ha > 50)) throw createError({ statusCode: 400, message: 'Для плану Бізнес — від 2 до 50 га' })
    if (isPro && ha < 50) throw createError({ statusCode: 400, message: 'Для плану Бізнес Про — мінімум 50 га' })
    paidHectares = ha
    basePrice = (planData.base_price || 0) + ha * planData.ha_rate
    planLabel = `${planData.label} (${ha} га)`
  } else {
    // Тарифи без гектарів (Агроном PRO) мають ціну в price_uah, base_price у них 0
    basePrice = planData.base_price || planData.price_uah || 0
  }

  // Знижка за лояльністю — за роками з першої оплати (не за кількістю оплат), для місячних і річних тарифів
  const subPlan = SUBSCRIPTION_PLANS[plan]
  let discountPercent = subPlan ? await loyaltyDiscount(supabase, user.id, subPlan.profile) : 0

  // Купон
  let couponId: string | null = null
  // На AI-пакети купони не діють: межа собівартості пакета рахується від повної ціни
  if (couponCode && !aiPack) {
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
  if (!(amount > 0)) throw createError({ statusCode: 400, message: 'Plan not found or inactive' })
  const labelSuffix = discountPercent > 0 ? ` (знижка ${discountPercent}%)` : ''

  // Гектари — в orderReference: він підписаний WayForPay, а merchantOptions ні (callback бере ліміт гектарів звідси)
  const orderReference = `agro-${plan}${paidHectares ? `-ha${paidHectares}` : ''}-${user.id.slice(0, 8)}-${Date.now()}`
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
    merchantDomainName: merchantDomain,
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
    clientEmail,
    clientFirstName,
    clientLastName,
    clientPhone: user.phone || '',
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
