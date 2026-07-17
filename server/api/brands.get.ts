import { serverSupabaseClient } from '#supabase/server'

export default defineCachedEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { data, error } = await supabase.from('agro_manufacturers')
    .select('*').eq('is_active', true).order('name')
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { items: data || [] }
}, {
  maxAge: 60 * 60,
  name: 'brands',
  getKey: () => 'all',
})
