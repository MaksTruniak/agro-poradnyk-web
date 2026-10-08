import { createClient } from '@supabase/supabase-js'
import { sendReminderEmail } from '../../utils/email'
import { KYIV_TZ, kyivDayBounds, notifyUser } from '../../utils/notify'

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
  // День — за Києвом: сервер працює в UTC, і нагадування на 00:00–03:00 потрапляли б у вчорашній лист
  const { start: todayStart, end: todayEnd } = kyivDayBounds()

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
  const kyivTime = (d: string) => new Date(d).toLocaleTimeString('uk-UA', { timeZone: KYIV_TZ, hour: '2-digit', minute: '2-digit', hour12: false })
  for (const [userId, userReminders] of Object.entries(byUser)) {
    try {
      await notifyUser(supabase, userId, {
        type: 'treatment_soon',
        title: userReminders.length === 1 ? 'Нагадування на сьогодні' : `Нагадування на сьогодні: ${userReminders.length}`,
        body: userReminders.map(r => `${kyivTime(r.scheduled_date)} — ${r.description}`).join(', '),
      })
    } catch (e) {
      console.error('[cron] reminder notification (cabinet) error', userId, e)
    }
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId)
      if (!userData?.user?.email) continue
      // При реєстрації ім'я зберігається в user_metadata.name
      const name = userData.user.user_metadata?.name || userData.user.user_metadata?.full_name || userData.user.email.split('@')[0]
      await sendReminderEmail(userData.user.email, name, userReminders)
      sent++
    } catch (e) {
      console.error('[cron] reminder-notification error', userId, e)
    }
  }

  return { ok: true, sent }
})
