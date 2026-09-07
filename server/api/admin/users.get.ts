import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)

  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 50

  const { data, error } = await supabase.auth.admin.listUsers({
    page,
    perPage: limit,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  const userIds = data.users.map((u: any) => u.id)
  const [{ data: subs }, { data: coupons }] = await Promise.all([
    supabase.from('subscriptions').select('user_id, plan, expires_at').in('user_id', userIds),
    supabase.from('coupons').select('user_id, code, discount_percent, is_used, expires_at').in('user_id', userIds).eq('is_used', false),
  ])

  const subMap: Record<string, any> = {}
  for (const s of subs || []) subMap[s.user_id] = s

  const couponMap: Record<string, any[]> = {}
  for (const c of coupons || []) {
    if (!couponMap[c.user_id]) couponMap[c.user_id] = []
    couponMap[c.user_id].push(c)
  }

  const users = data.users.map((u: any) => {
    const sub = subMap[u.id]
    const activePlan = sub && (!sub.expires_at || new Date(sub.expires_at) > new Date()) ? sub.plan : 'basic'
    return { ...u, plan: activePlan, coupons: couponMap[u.id] || [] }
  })

  return { users, total: data.total }
})
