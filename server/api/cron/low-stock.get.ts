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

  // Препарати з нестачею
  const { data: lowChemicals } = await supabase
    .from('farm_inventory')
    .select('user_id, name, quantity, unit, min_quantity')
    .not('min_quantity', 'is', null)
    .filter('quantity', 'lte', 'min_quantity')

  // Пальне з нестачею
  const { data: lowFuel } = await supabase
    .from('fuel_inventory')
    .select('user_id, fuel_type, quantity, unit, min_quantity')
    .not('min_quantity', 'is', null)
    .filter('quantity', 'lte', 'min_quantity')

  // Об'єднуємо по user_id
  const byUser: Record<string, { name: string; quantity: number; unit: string; min_quantity: number }[]> = {}

  for (const item of lowChemicals || []) {
    if (!byUser[item.user_id]) byUser[item.user_id] = []
    byUser[item.user_id].push({ name: item.name, quantity: item.quantity, unit: item.unit, min_quantity: item.min_quantity })
  }
  for (const item of lowFuel || []) {
    if (!byUser[item.user_id]) byUser[item.user_id] = []
    byUser[item.user_id].push({ name: `⛽ ${item.fuel_type}`, quantity: item.quantity, unit: item.unit, min_quantity: item.min_quantity })
  }

  if (!Object.keys(byUser).length) return { ok: true, sent: 0 }

  let sent = 0
  for (const [userId, items] of Object.entries(byUser)) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId)
      if (!userData?.user?.email) continue
      const name = userData.user.user_metadata?.full_name || userData.user.email.split('@')[0]
      await sendLowStockEmail(userData.user.email, name, items)
      sent++
    } catch (e) {
      console.error(`[low-stock cron] Error for user ${userId}:`, e)
    }
  }

  return { ok: true, sent }
})
