import { serverSupabaseServiceRole } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const config = useRuntimeConfig()
  const authClient = createClient(config.public.supabase.url, config.public.supabase.key)
  const { data: { user }, error: userError } = await authClient.auth.getUser(token)
  if (userError || !user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const id = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  const { error } = await supabase
    .from('buyer_crops')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { ok: true }
})
