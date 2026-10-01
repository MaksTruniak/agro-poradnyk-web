export default defineEventHandler(async (event) => {
  const { supabase } = await requireAdmin(event)

  // Підрахунок у базі (admin_user_stats) — без завантаження всіх акаунтів
  const { data: stats, error } = await supabase.rpc('admin_user_stats')
  if (error) throw createError({ statusCode: 500, message: error.message })

  const now = new Date()
  const byMonth: Record<string, number> = stats?.by_month || {}
  const byYear: Record<string, number> = stats?.by_year || {}
  const byRole: Record<string, number> = stats?.by_role || {}

  // Build last 12 months array
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' })
    months.push({ key, label, count: byMonth[key] || 0 })
  }

  // Build years array (all years present in data)
  const years = Object.entries(byYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, count]) => ({ year, count }))

  const roleOrder = ['farmer', 'agronomist', 'seller', 'admin', 'unknown']
  const roles = Object.entries(byRole)
    .sort(([a], [b]) => roleOrder.indexOf(a) - roleOrder.indexOf(b))
    .map(([role, count]) => ({ role, count }))

  return { months, years, roles, total: stats?.total ?? 0 }
})
