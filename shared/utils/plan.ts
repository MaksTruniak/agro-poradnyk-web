// Єдині правила тарифів — використовуються і на сторінках, і на сервері.

export type PlanId = 'basic' | 'business' | 'business_pro' | 'pro'

// Профіль, до якого прив'язана підписка й AI-ліміти (subscriptions.profile, ai_usage.profile).
// Фермер і агроном в одному акаунті мають окремі підписки.
export type SubscriptionProfile = 'farmer' | 'agronomist'

export const subscriptionProfileFor = (role: string | null | undefined): SubscriptionProfile =>
  role === 'agronomist' ? 'agronomist' : 'farmer'

export interface SubscriptionRow {
  plan?: string | null
  expires_at?: string | null
}

// Активний план: немає підписки або термін минув → basic. Застарілий 'premium' = business.
export const getActivePlan = (sub: SubscriptionRow | null | undefined, now = new Date()): PlanId => {
  if (!sub?.plan) return 'basic'
  if (sub.expires_at && new Date(sub.expires_at) <= now) return 'basic'
  if (sub.plan === 'premium') return 'business'
  if (sub.plan === 'business' || sub.plan === 'business_pro' || sub.plan === 'pro') return sub.plan
  return 'basic'
}

export const isPaidFarmerPlan = (plan: PlanId) => plan === 'business' || plan === 'business_pro'
export const isAgronomistPro = (plan: PlanId) => plan === 'pro'

// Листування з агрономом без угоди на безкоштовному тарифі — символів на місяць (те саме число в messages_protect)
export const CHAT_FREE_CHARS = 2000
// Довжина як у Postgres char_length: емодзі — один символ
export const charCount = (s: string) => [...s].length

export const HECTARE_LIMITS: Record<PlanId, number> = {
  basic: 2,
  business: Infinity,
  business_pro: Infinity,
  pro: 2,
}

// Межі гектарів тарифів (як на сторінці підписки й при оплаті): Бізнес — 2–50 га, Бізнес Про — від 50 га
export const BUSINESS_MIN_HA = 2
export const BUSINESS_MAX_HA = 50

/**
 * Скільки гектарів полів дозволяє тариф. Бізнес — оплачені гектари (custom_hectares, записує оплата або адмін),
 * але не більше 50; без запису (старі оплати, призначено адміном без гектарів) — 50.
 */
export const hectareLimitFor = (plan: PlanId, customHectares?: number | null) => {
  if (plan === 'business') {
    const paid = Number(customHectares) || 0
    return paid > 0 ? Math.min(paid, BUSINESS_MAX_HA) : BUSINESS_MAX_HA
  }
  return HECTARE_LIMITS[plan]
}

/** Гектари з orderReference оплати: agro-{plan}-ha{N}-{userId8}-{timestamp} (орденреференс підписаний WFP) */
export const splitPlanHectares = (planPart: string): { plan: string; hectares: number | null } => {
  const m = planPart.match(/^(.*)-ha(\d{1,6})$/)
  return m ? { plan: m[1]!, hectares: Number(m[2]) } : { plan: planPart, hectares: null }
}

export const MEMBER_LIMITS: Record<PlanId, number> = {
  basic: 0,
  business: 5,
  business_pro: Infinity,
  pro: 0,
}

export interface AiLimits { text: number; photo: number }

// Ключ у таблиці ai_plan_limits. Агроном без PRO має окремий ліміт — 'agronomist_basic'.
export const aiLimitKey = (plan: PlanId, profile: SubscriptionProfile) =>
  plan === 'basic' && profile === 'agronomist' ? 'agronomist_basic' : plan

// Значення за замовчуванням, якщо в ai_plan_limits немає рядка
export const AI_LIMITS_FALLBACK: Record<string, AiLimits> = {
  basic:            { text: 0,     photo: 0    },
  agronomist_basic: { text: 10,    photo: 2    },
  pro:              { text: 500,   photo: 60   },
  business:         { text: 3000,  photo: 300  },
  business_pro:     { text: 99999, photo: 9999 },
}

// Підсумковий ліміт AI: індивідуальний з subscriptions → з ai_plan_limits → за замовчуванням
export const resolveAiLimits = (
  key: string,
  dbLimits: Record<string, AiLimits> | null | undefined,
  sub?: { ai_text_limit?: number | null; ai_photo_limit?: number | null } | null,
): AiLimits => {
  const base = dbLimits?.[key] ?? AI_LIMITS_FALLBACK[key] ?? AI_LIMITS_FALLBACK.basic
  return {
    text: sub?.ai_text_limit ?? base.text,
    photo: sub?.ai_photo_limit ?? base.photo,
  }
}

export const currentUsageMonth = (now = new Date()) => now.toISOString().slice(0, 7) // YYYY-MM
