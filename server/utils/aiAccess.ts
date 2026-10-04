import type { H3Event } from 'h3'
import { createClient } from '@supabase/supabase-js'
import type { AiAction, AiRoute, AiUsage } from './aiConfig'

const service = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface AiCredits { allowance: number; used: number; remaining: number }

export interface AiAccess {
  userId: string
  ownerId: string
  profile: SubscriptionProfile
  plan: PlanId
  credits: AiCredits
  /** Для дії: маршрут моделі, скільки кредитів списано, чи це запасна дешева модель */
  action?: AiAction
  route?: AiRoute
  charged: number
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

/** Кредитів на місяць: тариф (база + гектари господарства до межі) або індивідуальний ліміт, плюс пакети */
async function creditAllowance(ownerId: string, profile: SubscriptionProfile, sub: any, month: string): Promise<{ plan: PlanId; allowance: number }> {
  const db = service()
  const plan = getActivePlan(sub)
  const key = aiLimitKey(plan, profile)
  const [{ data: limits }, { data: farms }, { data: topups }] = await Promise.all([
    db.from('ai_plan_limits').select('credits_base, credits_per_ha, credits_ha_cap').eq('plan', key).maybeSingle(),
    profile === 'farmer' ? db.from('farms').select('hectares').eq('user_id', ownerId) : Promise.resolve({ data: [] as any[] }),
    db.from('ai_credit_topups').select('credits').eq('owner_id', ownerId).eq('profile', profile).eq('month', month),
  ])
  const hectares = (farms || []).reduce((s: number, f: any) => s + (Number(f.hectares) || 0), 0)
  const fromPlan = sub?.ai_text_limit != null
    ? Number(sub.ai_text_limit)  // індивідуальний ліміт (кастомний тариф) — у кредитах
    : Math.floor((limits?.credits_base || 0) + (Number(limits?.credits_per_ha) || 0) * Math.min(hectares, limits?.credits_ha_cap || 0))
  const extra = (topups || []).reduce((s: number, t: any) => s + (t.credits || 0), 0)
  return { plan, allowance: fromPlan + extra }
}

/**
 * Перевіряє вхід і тариф активного профілю (або фермерський тариф власника команди).
 * З action — списує кредити дії атомарно; якщо кредитів немає, просте питання (chat) отримує
 * запасну дешеву модель (обмежено на день), інше — 403. Без action — лише перевірка доступу.
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
  const [{ data: sub }, { data: usage }] = await Promise.all([
    db.from('subscriptions').select('plan, expires_at, ai_text_limit').eq('user_id', ownerId).eq('profile', profile).maybeSingle(),
    db.from('ai_usage').select('credits_used').eq('user_id', ownerId).eq('profile', profile).eq('month', month).maybeSingle(),
  ])
  const { plan, allowance } = await creditAllowance(ownerId, profile, sub, month)
  const used = usage?.credits_used || 0
  const base: AiAccess = { userId: user.id, ownerId, profile, plan, credits: { allowance, used, remaining: Math.max(0, allowance - used) }, charged: 0, fallback: false }

  if (!action) {
    if (allowance <= 0) throw createError({ statusCode: 403, message: 'AI агроном доступний у платних тарифах' })
    return base
  }

  const cfg = AI_ACTIONS[action]
  const overBudget = await monthBudgetExceeded()

  // Основна модель — якщо вистачає кредитів і не вичерпано загальний бюджет платформи
  if (!overBudget && cfg.credits > 0) {
    const { data: ok } = await db.rpc('ai_charge_credits', { p_owner: ownerId, p_profile: profile, p_month: month, p_credits: cfg.credits, p_allowance: allowance })
    if (ok) {
      return { ...base, action, route: cfg, charged: cfg.credits, credits: { allowance, used: used + cfg.credits, remaining: Math.max(0, allowance - used - cfg.credits) } }
    }
  } else if (!overBudget && cfg.credits === 0 && allowance > 0) {
    return { ...base, action, route: cfg }  // службова дія без кредитів (пам'ять розмови)
  }

  // Кредитів немає: прості питання — дешевою моделлю, обмежено на день
  if (action === 'chat' && allowance > 0) {
    const since = new Date(); since.setHours(0, 0, 0, 0)
    const { count } = await db.from('ai_requests').select('id', { count: 'exact', head: true })
      .eq('owner_id', ownerId).eq('fallback', true).gte('created_at', since.toISOString())
    if ((count || 0) < AI_FALLBACK.dailyLimit) return { ...base, action, route: AI_FALLBACK, fallback: true }
  }

  if (allowance <= 0) throw createError({ statusCode: 403, message: 'AI агроном доступний у платних тарифах' })
  throw createError({ statusCode: 403, message: `Кредити AI на цей місяць вичерпано (${allowance}). Нові кредити — з початку місяця.` })
}

/** Повернути кредити, якщо AI не відповів (помилка моделі чи мережі) */
export async function releaseAiUsage(access: AiAccess) {
  if (!access.charged) return
  try {
    await service().rpc('ai_release_credits', { p_owner: access.ownerId, p_profile: access.profile, p_month: currentUsageMonth(), p_credits: access.charged })
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
      status,
    })
  } catch (e) {
    console.error('[ai-requests] record failed:', e)
  }
}
