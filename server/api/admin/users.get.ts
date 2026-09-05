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

  return {
    users: data.users,
    total: data.total,
  }
})
