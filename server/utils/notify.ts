import type { SupabaseClient } from '@supabase/supabase-js'

export const KYIV_TZ = 'Europe/Kyiv'

/** Початок і кінець календарного дня за Києвом (сервер працює в UTC) */
export function kyivDayBounds(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: KYIV_TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
      .formatToParts(now).map(p => [p.type, p.value]),
  )
  // Зсув Києва від UTC у цей момент (літній / зимовий час)
  const asUtc = Date.UTC(+parts.year!, +parts.month! - 1, +parts.day!, +parts.hour!, +parts.minute!, +parts.second!)
  const offset = asUtc - Math.floor(now.getTime() / 1000) * 1000
  const start = new Date(Date.UTC(+parts.year!, +parts.month! - 1, +parts.day!) - offset)
  const end = new Date(start.getTime() + 24 * 3600 * 1000 - 1)
  return { start, end }
}

type Notification = { type: 'inventory_low' | 'treatment_soon'; title: string; body?: string; data?: Record<string, unknown> }

/**
 * Сповіщення в кабінет (farm_notifications). Поки попереднє такого ж типу не прочитане — оновлюємо його,
 * а не додаємо щодня нове (залишок, що закінчується, перевіряється щоранку).
 */
export async function notifyUser(supabase: SupabaseClient, userId: string, n: Notification) {
  const row = { title: n.title, body: n.body ?? null, data: n.data ?? {}, created_at: new Date().toISOString() }
  const { data: open } = await supabase.from('farm_notifications').select('id')
    .eq('user_id', userId).eq('type', n.type).eq('is_read', false)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  const { error } = open
    ? await supabase.from('farm_notifications').update(row).eq('id', open.id)
    : await supabase.from('farm_notifications').insert({ ...row, user_id: userId, type: n.type })
  if (error) throw error
}
