import { createClient } from '@supabase/supabase-js'

export default defineCachedEventHandler(async () => {
  // Публічний ключ без сесії: кеш спільний для всіх
  const config = useRuntimeConfig()
  const supabase = createClient(config.public.supabase.url, config.public.supabase.key, { auth: { persistSession: false } })
  const { data, error } = await supabase.from('agro_manufacturers')
    .select('*').eq('is_active', true).order('name')
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { items: data || [] }
}, {
  maxAge: 5 * 60,
  name: 'brands',
  getKey: () => 'all',
})
