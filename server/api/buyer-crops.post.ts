import { serverSupabaseServiceRole } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const config = useRuntimeConfig()
  const authClient = createClient(config.public.supabase.url, config.public.supabase.key)
  const { data: { user }, error: userError } = await authClient.auth.getUser(token)
  if (userError || !user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const supabase = serverSupabaseServiceRole(event)
  const body = await readBody(event)

  const { data, error } = await supabase.from('buyer_crops').insert({
    user_id: user.id,
    crop_type: body.crop_type,
    min_qty: body.min_qty ?? null,
    max_qty: body.max_qty ?? null,
    unit: body.unit ?? 'т',
    notes: body.notes ?? null,
  }).select().single()

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return data
})
