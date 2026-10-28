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

// AI-пакети — окремо від тарифів (таблиця ai_packs): кредити на місяць з межею собівартості.
// Одночасно діє лише один пакет на профіль.
export async function findAiPack(supabase: SupabaseClient, id: string) {
  if (!/^[a-z0-9_]+$/.test(id)) return null
  const { data } = await supabase.from('ai_packs').select('id, profile, label, price_uah, credits, cost_cap_uah, is_active').eq('id', id).maybeSingle()
  return data
}

interface ActivePack { id: string; starts_at: string | null; expires_at: string; credits: number; credits_used: number; cost_cap_usd: number | null; ai_packs: { label: string } | null }

/** Пакет, що діє зараз або вже оплачений наперед (закінчується найпізніше) */
export async function latestAiPack(supabase: SupabaseClient, ownerId: string, profile: 'farmer' | 'agronomist') {
  const { data } = await supabase.from('ai_credit_topups').select('id, starts_at, expires_at, credits, credits_used, cost_cap_usd, ai_packs(label)')
    .eq('owner_id', ownerId).eq('profile', profile).not('pack_id', 'is', null)
    .gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: false }).limit(1).maybeSingle()
  return data as ActivePack | null
}

/**
 * Пакет уже діє, але з нього нічого не списати: кредити закінчились або досягнуто межі собівартості.
 * Тоді новий пакет можна купити одразу, і він починає діяти з дня оплати (а не після старого).
 */
export async function aiPackExhausted(supabase: SupabaseClient, pack: ActivePack) {
  if (pack.starts_at && new Date(pack.starts_at) > new Date()) return false
  if (pack.credits_used >= pack.credits) return true
  if (pack.cost_cap_usd == null) return false
  const { data } = await supabase.from('ai_requests').select('cost_usd').eq('topup_id', pack.id)
  const spent = (data || []).reduce((s: number, r: any) => s + (Number(r.cost_usd) || 0), 0)
  return spent >= Number(pack.cost_cap_usd)
}

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
