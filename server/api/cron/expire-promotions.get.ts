import { createClient } from '@supabase/supabase-js'

// Щодня знімає прострочений «Топ» і виділення агронома без активного PRO / «Топ» (функція expire_promotions у БД)
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.rpc('expire_promotions')
  if (error) {
    console.error('[cron] expire-promotions error', error)
    throw createError({ statusCode: 500, message: error.message })
  }

  return { ok: true, ...(data as Record<string, number>) }
})
