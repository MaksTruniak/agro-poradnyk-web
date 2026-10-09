import type { SupabaseClient } from '@supabase/supabase-js'

// Тарифи, які можна оплатити на сайті: id з таблиці plans → профіль підписки, план у subscriptions, тривалість
export const SUBSCRIPTION_PLANS: Record<string, { profile: 'farmer' | 'agronomist'; plan: string; months: number }> = {
  business:             { profile: 'farmer',     plan: 'business',     months: 1 },
  business_year:        { profile: 'farmer',     plan: 'business',     months: 12 },
  business_pro:         { profile: 'farmer',     plan: 'business_pro', months: 1 },
  business_pro_year:    { profile: 'farmer',     plan: 'business_pro', months: 12 },
  agronomist_pro_month: { profile: 'agronomist', plan: 'pro',          months: 1 },
  agronomist_pro_year:  { profile: 'agronomist', plan: 'pro',          months: 12 },
}
// Просування («Топ») — окремо від підписок
export const PROMO_PLANS = ['top_agronomist', 'top_seller']

const YEAR_MS = 365.25 * 24 * 3600 * 1000

/** Рік клієнта з першої оплати: 1 — перший рік, 2 — другий… (знижка лояльності — «з другого року») */
export function loyaltyYear(firstPaidAt: string | null | undefined, now = new Date()) {
  if (!firstPaidAt) return 0
  return Math.floor((now.getTime() - new Date(firstPaidAt).getTime()) / YEAR_MS) + 1
}

/** Відсоток знижки лояльності для профілю (таблиця loyalty_discounts: 1-й, 2-й, 3-й і далі роки) */
export async function loyaltyDiscount(supabase: SupabaseClient, userId: string, profile: 'farmer' | 'agronomist', now = new Date()) {
  const { data: sub } = await supabase.from('subscriptions').select('first_paid_at')
    .eq('user_id', userId).eq('profile', profile).maybeSingle()
  const year = loyaltyYear(sub?.first_paid_at, now)
  if (year < 2) return 0
  const { data } = await supabase.from('loyalty_discounts').select('discount_percent')
    .eq('role', profile).eq('renewal_year', Math.min(year, 3)).maybeSingle()
  return data?.discount_percent ?? 0
}

/**
 * Новий термін підписки після оплати. Продовження того самого плану, поки він ще діє, — від дати
 * закінчення (оплачені дні не згорають); новий або інший план — від сьогодні.
 */
export function nextExpiry(current: { plan?: string | null; expires_at?: string | null } | null, plan: string, months: number, now = new Date()) {
  const currentEnd = current?.expires_at ? new Date(current.expires_at) : null
  const base = current?.plan === plan && currentEnd && currentEnd > now ? new Date(currentEnd) : new Date(now)
  base.setUTCMonth(base.getUTCMonth() + months)
  return base
}
