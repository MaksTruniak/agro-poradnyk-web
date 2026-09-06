import { createClient } from '@supabase/supabase-js'
import { sendSubscriptionReminderEmail } from '../../utils/email'

export default defineEventHandler(async (event) => {
  // Захист: тільки Vercel Cron може викликати
  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Підписки що закінчуються через 7 днів (±12 годин)
  const in7days = new Date()
  in7days.setDate(in7days.getDate() + 7)
  const from = new Date(in7days.getTime() - 12 * 60 * 60 * 1000).toISOString()
  const to   = new Date(in7days.getTime() + 12 * 60 * 60 * 1000).toISOString()

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('user_id, plan, expires_at')
    .gte('expires_at', from)
    .lte('expires_at', to)

  if (!subs?.length) return { ok: true, sent: 0 }

  let sent = 0
  for (const sub of subs) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id)
      if (!userData?.user?.email) continue
      const name = userData.user.user_metadata?.full_name || userData.user.email.split('@')[0]
      await sendSubscriptionReminderEmail(userData.user.email, name, sub.plan, sub.expires_at)
      sent++
    } catch (e) {
      console.error('[cron] reminder error', sub.user_id, e)
    }
  }

  return { ok: true, sent }
})
