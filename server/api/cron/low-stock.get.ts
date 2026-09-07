import { createClient } from '@supabase/supabase-js'
import { sendLowStockEmail } from '../../utils/email'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Беремо всі записи де кількість <= мінімального залишку
  const { data: lowItems } = await supabase
    .from('farm_inventory')
    .select('user_id, name, quantity, unit, min_quantity')
    .not('min_quantity', 'is', null)
    .filter('quantity', 'lte', 'min_quantity')

  if (!lowItems?.length) return { ok: true, sent: 0 }

  // Групуємо по user_id
  const byUser: Record<string, typeof lowItems> = {}
  for (const item of lowItems) {
    if (!byUser[item.user_id]) byUser[item.user_id] = []
    byUser[item.user_id].push(item)
  }

  let sent = 0
  for (const [userId, items] of Object.entries(byUser)) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId)
      if (!userData?.user?.email) continue
      const name = userData.user.user_metadata?.full_name || userData.user.email.split('@')[0]
      await sendLowStockEmail(userData.user.email, name, items as any)
      sent++
    } catch (e) {
      console.error(`[low-stock cron] Error for user ${userId}:`, e)
    }
  }

  return { ok: true, sent }
})
