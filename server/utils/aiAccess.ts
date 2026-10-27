import type { H3Event } from 'h3'
import { createClient } from '@supabase/supabase-js'
import type { AiAction, AiRoute, AiUsage } from './aiConfig'

const service = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface AiCredits { allowance: number; used: number; remaining: number }

/** Гаманець кредитів: тариф на календарний місяць або AI-пакет зі своїм терміном */
export interface AiWallet {
  kind: 'plan' | 'pack'
  topupId: string | null
  label: string
  credits: number
  used: number
  /** Межа собівартості досягнута — гаманець більше не списується, хоч кредити ще є */
  capReached: boolean
  expiresAt: string | null
}

export interface AiAccess {
  userId: string
  ownerId: string
  profile: SubscriptionProfile
  plan: PlanId
  credits: AiCredits
  wallets: AiWallet[]
  /** Для дії: маршрут моделі, скільки кредитів списано, з якого пакета (null — з тарифу), чи це запасна модель */
  action?: AiAction
  route?: AiRoute
  charged: number
  topupId: string | null
  fallback: boolean
}

// ── Глобальний місячний бюджет ($), AI_MONTHLY_BUDGET_USD; кешується на хвилину ─────────
let budgetCache: { at: number; spent: number } | null = null
async function monthBudgetExceeded(): Promise<boolean> {
  const budget = Number(process.env.AI_MONTHLY_BUDGET_USD || 0)
  if (!budget) return false
  if (!budgetCache || Date.now() - budgetCache.at > 60_000) {
    const { data } = await service().rpc('ai_month_cost')
    budgetCache = { at: Date.now(), spent: Number(data || 0) }
  }
  return budgetCache.spent >= budget
}

// ── Курс $ → грн для меж собівартості (ai_settings, адмінка); кешується на хвилину ──────
let rateCache: { at: number; rate: number } | null = null
export async function usdUahRate(): Promise<number> {
  if (!rateCache || Date.now() - rateCache.at > 60_000) {
    const { data } = await service().from('ai_settings').select('usd_uah').maybeSingle()
    rateCache = { at: Date.now(), rate: Number(data?.usd_uah) || 45.5 }
  }
  return rateCache.rate
}

const PLAN_WALLET_LABEL = 'Кредити тарифу'

/**
 * Гаманці власника: тариф (база + гектари господарства до межі, або індивідуальний ліміт) і активні AI-пакети.
 * Межа собівартості тарифу — кредити тарифу × cost_cap_uah_per_credit грн; пакета — записана при покупці.
 */
async function loadWallets(ownerId: string, profile: SubscriptionProfile, sub: any, month: string) {
  const db = service()
  const plan = getActivePlan(sub)
  const key = aiLimitKey(plan, profile)
  const now = new Date().toISOString()
  const [{ data: limits }, { data: farms }, { data: topups }, { data: usage }, rate] = await Promise.all([
    db.from('ai_plan_limits').select('credits_base, credits_per_ha, credits_ha_cap, cost_cap_uah_per_credit').eq('plan', key).maybeSingle(),
    profile === 'farmer' ? db.from('farms').select('hectares').eq('user_id', ownerId) : Promise.resolve({ data: [] as any[] }),
    db.from('ai_credit_topups').select('id, credits, credits_used, cost_cap_usd, expires_at, pack_id, ai_packs(label)')
      .eq('owner_id', ownerId).eq('profile', profile).lte('starts_at', now).gt('expires_at', now).order('expires_at'),
    db.from('ai_usage').select('credits_used').eq('user_id', ownerId).eq('profile', profile).eq('month', month).maybeSingle(),
    usdUahRate(),
  ])
  const hectares = (farms || []).reduce((s: number, f: any) => s + (Number(f.hectares) || 0), 0)
  // AI у тарифі — лише платні тарифи (фермер Бізнес / Бізнес Про, Агроном Про) або індивідуальний ліміт; інакше — лише пакети
  const planCredits = sub?.ai_text_limit != null
    ? Number(sub.ai_text_limit)  // індивідуальний ліміт (кастомний тариф) — у кредитах
    : plan === 'basic' ? 0
    : Math.floor((limits?.credits_base || 0) + (Number(limits?.credits_per_ha) || 0) * Math.min(hectares, limits?.credits_ha_cap || 0))
  const capPerCredit = limits?.cost_cap_uah_per_credit != null ? Number(limits.cost_cap_uah_per_credit) : 2
  const planCapUsd = (planCredits * capPerCredit) / rate

  const [planSpent, ...topupSpent] = await Promise.all([
    planCredits > 0 ? db.rpc('ai_plan_spent', { p_owner: ownerId, p_profile: profile, p_month: month }).then(r => Number(r.data || 0)) : Promise.resolve(0),
    ...(topups || []).map((t: any) => t.cost_cap_usd == null ? Promise.resolve(0)
      : db.rpc('ai_topup_spent', { p_topup: t.id }).then(r => Number(r.data || 0))),
  ])

  const wallets: AiWallet[] = []
  if (planCredits > 0) {
    wallets.push({ kind: 'plan', topupId: null, label: PLAN_WALLET_LABEL, credits: planCredits, used: usage?.credits_used || 0,
      capReached: planSpent >= planCapUsd, expiresAt: null })
  }
  ;(topups || []).forEach((t: any, i: number) => {
    wallets.push({ kind: 'pack', topupId: t.id, label: t.ai_packs?.label || 'Пакет кредитів', credits: t.credits, used: t.credits_used || 0,
      capReached: t.cost_cap_usd != null && topupSpent[i]! >= Number(t.cost_cap_usd), expiresAt: t.expires_at })
  })
  return { plan, wallets, planCredits, planCapUsd }
}

/** Підсумок для лічильника: доступні кредити — лише з гаманців, де ще є запас собівартості */
const summarize = (wallets: AiWallet[]): AiCredits => {
  const allowance = wallets.reduce((s, w) => s + w.credits, 0)
  const used = wallets.reduce((s, w) => s + Math.min(w.used, w.credits), 0)
  const remaining = wallets.reduce((s, w) => s + (w.capReached ? 0 : Math.max(0, w.credits - w.used)), 0)
  return { allowance, used, remaining }
}

/**
 * Перевіряє вхід і кредити активного профілю (або фермерського профілю власника команди).
 * З action — атомарно списує кредити дії з одного гаманця (спершу тариф, потім пакет, що закінчується
 * найраніше; гаманець з вичерпаною межею собівартості пропускається). Якщо списати нема з чого, просте
 * питання (chat) отримує запасну дешеву модель (обмежено на день), інше — 403. Без action — лише перевірка доступу.
 * Активний профіль клієнт передає в заголовку X-Agro-Profile ('farmer' | 'agronomist').
 */
export async function requireAiAccess(event: H3Event, action?: AiAction): Promise<AiAccess> {
  const token = (getHeader(event, 'Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) throw createError({ statusCode: 401, message: 'Потрібно увійти в акаунт' })

  const db = service()
  const { data: { user }, error: authErr } = await db.auth.getUser(token)
  if (authErr || !user) throw createError({ statusCode: 401, message: 'Потрібно увійти в акаунт' })

  // Член команди працює за тарифом власника
  const { data: membership } = await db.from('team_members').select('owner_id')
    .eq('member_id', user.id).eq('status', 'active').maybeSingle()
  const ownerId: string = membership?.owner_id || user.id

  // Профіль: член команди — завжди фермерський профіль власника; інакше — заявлений, якщо він є в акаунті
  let profile: SubscriptionProfile = 'farmer'
  if (!membership && subscriptionProfileFor(getHeader(event, 'X-Agro-Profile')) === 'agronomist') {
    const { data: u } = await db.from('users').select('role, roles').eq('id', user.id).maybeSingle()
    if (u?.role === 'agronomist' || (u?.roles || []).includes('agronomist')) profile = 'agronomist'
  }

  const month = currentUsageMonth()
  const { data: sub } = await db.from('subscriptions').select('plan, expires_at, ai_text_limit').eq('user_id', ownerId).eq('profile', profile).maybeSingle()
  const { plan, wallets, planCredits, planCapUsd } = await loadWallets(ownerId, profile, sub, month)
  const credits = summarize(wallets)
  const base: AiAccess = { userId: user.id, ownerId, profile, plan, credits, wallets, charged: 0, topupId: null, fallback: false }
  const hasAi = credits.allowance > 0

  if (!action) {
    if (!hasAi) throw createError({ statusCode: 403, message: 'AI агроном доступний у платних тарифах і з AI-пакетом' })
    return base
  }

  const cfg = AI_ACTIONS[action]
  const overBudget = await monthBudgetExceeded()

  // Основна модель — якщо є гаманець з кредитами й запасом собівартості і не вичерпано бюджет платформи
  if (!overBudget && cfg.credits > 0) {
    const { data: charged } = await db.rpc('ai_charge', {
      p_owner: ownerId, p_profile: profile, p_month: month, p_credits: cfg.credits,
      p_plan_allowance: planCredits, p_plan_cap_usd: planCapUsd,
    })
    if (charged?.source) {
      const topupId: string | null = charged.source === 'topup' ? charged.topup_id : null
      const after = wallets.map(w => w.topupId === topupId ? { ...w, used: w.used + cfg.credits } : w)
      return { ...base, action, route: cfg, charged: cfg.credits, topupId, wallets: after, credits: summarize(after) }
    }
  } else if (!overBudget && cfg.credits === 0 && hasAi) {
    return { ...base, action, route: cfg }  // службова дія без кредитів (пам'ять розмови)
  }

  // Кредитів немає: прості питання — дешевою моделлю, обмежено на день
  if (action === 'chat' && hasAi) {
    const since = new Date(); since.setHours(0, 0, 0, 0)
    const { count } = await db.from('ai_requests').select('id', { count: 'exact', head: true })
      .eq('owner_id', ownerId).eq('fallback', true).gte('created_at', since.toISOString())
    if ((count || 0) < AI_FALLBACK.dailyLimit) return { ...base, action, route: AI_FALLBACK, fallback: true }
  }

  if (!hasAi) throw createError({ statusCode: 403, message: 'AI агроном доступний у платних тарифах і з AI-пакетом' })
  throw createError({ statusCode: 403, message: 'Кредити AI вичерпано. Нові кредити тарифу — з початку місяця, або докупіть AI-пакет на сторінці підписки.' })
}

/** Повернути кредити, якщо AI не відповів (помилка моделі чи мережі) */
export async function releaseAiUsage(access: AiAccess) {
  if (!access.charged) return
  try {
    await service().rpc('ai_release', { p_owner: access.ownerId, p_profile: access.profile, p_month: currentUsageMonth(), p_credits: access.charged, p_topup: access.topupId })
  } catch (e) {
    console.error('[ai-usage] release failed:', e)
  }
}

/** Записати запит у журнал: фактичні токени й вартість (маржа, бюджет, ліміт запасної моделі) */
export async function recordAiRequest(access: AiAccess, usage: AiUsage | null, status: 'ok' | 'error' | 'refused' = 'ok') {
  if (!access.route || !access.action) return
  const u = usage || { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
  try {
    await service().from('ai_requests').insert({
      user_id: access.userId,
      owner_id: access.ownerId,
      profile: access.profile,
      action: access.action,
      provider: access.route.provider,
      model: access.route.model,
      input_tokens: u.input,
      cache_read_tokens: u.cacheRead,
      cache_write_tokens: u.cacheWrite,
      output_tokens: u.output,
      cost_usd: aiCostUsd(access.route.model, u),
      credits: status === 'ok' ? access.charged : 0,
      fallback: access.fallback,
      topup_id: access.topupId,
      status,
    })
  } catch (e) {
    console.error('[ai-requests] record failed:', e)
  }
}
