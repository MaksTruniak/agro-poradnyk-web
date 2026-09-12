import { createClient } from '@supabase/supabase-js'
import { sendReminderEmail } from '../../utils/email'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Нагадування на сьогодні (весь день)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const { data: reminders } = await supabase
    .from('reminders')
    .select('id, user_id, description, scheduled_date, type')
    .eq('from_agronomist', false)
    .gte('scheduled_date', todayStart.toISOString())
    .lte('scheduled_date', todayEnd.toISOString())
    .order('scheduled_date', { ascending: true })

  if (!reminders?.length) return { ok: true, sent: 0 }

  // Групуємо по user_id
  const byUser: Record<string, typeof reminders> = {}
  for (const r of reminders) {
    if (!byUser[r.user_id]) byUser[r.user_id] = []
    byUser[r.user_id].push(r)
  }

  let sent = 0
  for (const [userId, userReminders] of Object.entries(byUser)) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId)
      if (!userData?.user?.email) continue
      const name = userData.user.user_metadata?.full_name || userData.user.email.split('@')[0]
      await sendReminderEmail(userData.user.email, name, userReminders)
      sent++
    } catch (e) {
      console.error('[cron] reminder-notification error', userId, e)
    }
  }

  return { ok: true, sent }
})
