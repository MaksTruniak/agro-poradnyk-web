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

export const HECTARE_LIMITS: Record<PlanId, number> = {
  basic: 2,
  business: Infinity,
  business_pro: Infinity,
  pro: 2,
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
