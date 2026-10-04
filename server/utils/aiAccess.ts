import type { H3Event } from 'h3'
import { createClient } from '@supabase/supabase-js'

interface AiAccessOptions {
  // Скільки запитів зарахувати в ai_usage (0 / не вказано — лише перевірити доступ)
  text?: number
  photo?: number
}

/**
 * Перевіряє, що користувач авторизований і тариф його активного профілю (або фермерський тариф власника команди)
 * дає доступ до AI, перевіряє місячний ліміт профілю і зараховує використання. Кидає 401 / 403.
 * Активний профіль клієнт передає в заголовку X-Agro-Profile ('farmer' | 'agronomist').
 */
export async function requireAiAccess(event: H3Event, opts: AiAccessOptions = {}) {
  const token = (getHeader(event, 'Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) throw createError({ statusCode: 401, message: 'Потрібно увійти в акаунт' })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) throw createError({ statusCode: 401, message: 'Потрібно увійти в акаунт' })

  // Член команди працює за тарифом власника
  const { data: membership } = await supabase
    .from('team_members')
    .select('owner_id')
    .eq('member_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  const ownerId: string = membership?.owner_id || user.id

  // Профіль: член команди — завжди фермерський профіль власника; інакше — заявлений, якщо він є в акаунті
  let profile: SubscriptionProfile = 'farmer'
  if (!membership) {
    const requested = subscriptionProfileFor(getHeader(event, 'X-Agro-Profile'))
    if (requested === 'agronomist') {
      const { data: u } = await supabase.from('users').select('role, roles').eq('id', user.id).maybeSingle()
      const hasAgronomist = u?.role === 'agronomist' || (u?.roles || []).includes('agronomist')
      if (hasAgronomist) profile = 'agronomist'
    }
  }

  const month = currentUsageMonth()
  const [subRes, limitsRes, usageRes] = await Promise.all([
    supabase.from('subscriptions').select('plan, expires_at, ai_text_limit, ai_photo_limit').eq('user_id', ownerId).eq('profile', profile).maybeSingle(),
    supabase.from('ai_plan_limits').select('plan, text_limit, photo_limit'),
    supabase.from('ai_usage').select('text_count, photo_count').eq('user_id', ownerId).eq('profile', profile).eq('month', month).maybeSingle(),
  ])

  const plan = getActivePlan(subRes.data)
  const dbLimits = Object.fromEntries(
    (limitsRes.data || []).map((r: any) => [r.plan, { text: r.text_limit, photo: r.photo_limit }]),
  )
  const limits = resolveAiLimits(aiLimitKey(plan, profile), dbLimits, subRes.data)

  if (limits.text <= 0) {
    throw createError({ statusCode: 403, message: 'AI агроном доступний у плані Бізнес' })
  }

  const textCount = usageRes.data?.text_count || 0
  const photoCount = usageRes.data?.photo_count || 0
  const addText = opts.text || 0
  const addPhoto = opts.photo || 0

  if (addText && textCount + addText > limits.text) {
    throw createError({ statusCode: 403, message: `Ліміт запитів на цей місяць вичерпано (${limits.text})` })
  }
  if (addPhoto && photoCount + addPhoto > limits.photo) {
    throw createError({ statusCode: 403, message: `Ліміт фото на цей місяць вичерпано (${limits.photo})` })
  }

  if (addText || addPhoto) {
    await supabase.from('ai_usage').upsert({
      user_id: ownerId,
      profile,
      month,
      text_count: textCount + addText,
      photo_count: photoCount + addPhoto,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,profile,month' })
  }

  return { userId: user.id, ownerId, profile, plan, limits }
}

/** Повернути зараховане використання, якщо AI не відповів (помилка моделі чи мережі) */
export async function releaseAiUsage(access: { ownerId: string; profile: SubscriptionProfile }, opts: AiAccessOptions) {
  const addText = opts.text || 0
  const addPhoto = opts.photo || 0
  if (!addText && !addPhoto) return
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const month = currentUsageMonth()
    const { data } = await supabase.from('ai_usage').select('text_count, photo_count')
      .eq('user_id', access.ownerId).eq('profile', access.profile).eq('month', month).maybeSingle()
    if (!data) return
    await supabase.from('ai_usage').update({
      text_count: Math.max(0, (data.text_count || 0) - addText),
      photo_count: Math.max(0, (data.photo_count || 0) - addPhoto),
      updated_at: new Date().toISOString(),
    }).eq('user_id', access.ownerId).eq('profile', access.profile).eq('month', month)
  } catch (e) {
    console.error('[ai-usage] release failed:', e)
  }
}
