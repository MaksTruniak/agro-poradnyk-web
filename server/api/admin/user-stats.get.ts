import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)

  // Fetch all users (up to 10000)
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 10000 })
  if (error) throw createError({ statusCode: 500, message: error.message })

  const users = data.users || []

  // Monthly stats for current year and previous year
  const now = new Date()
  const currentYear = now.getFullYear()

  const byMonth: Record<string, number> = {}
  const byYear: Record<string, number> = {}
  const byRole: Record<string, number> = {}

  for (const u of users) {
    const d = new Date(u.created_at)
    const year = d.getFullYear()
    const month = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`

    byMonth[month] = (byMonth[month] || 0) + 1
    byYear[String(year)] = (byYear[String(year)] || 0) + 1
    const role = u.user_metadata?.role || 'unknown'
    byRole[role] = (byRole[role] || 0) + 1
  }

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

  return { months, years, roles, total: users.length }
})
