export const useRemindersNotify = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const checkAndNotify = async () => {
    if (typeof window === 'undefined' || !user.value?.id) return

    // Запитуємо дозвіл якщо ще не дано
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    if (Notification.permission !== 'granted') return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: due } = await supabase
      .from('reminders')
      .select('id, description, scheduled_date, notified_at')
      .eq('user_id', user.value.id)
      .lte('scheduled_date', tomorrow.toISOString())
      .gte('scheduled_date', today.toISOString())
      .is('notified_at', null)
      .limit(10)

    if (!due?.length) return

    for (const r of due) {
      new Notification('🌱 АгроПростір — Нагадування', {
        body: r.description,
        icon: '/icon-192.png',
        tag: `reminder-${r.id}`,
      })

      // Позначаємо як показане
      await supabase.from('reminders').update({ notified_at: new Date().toISOString() }).eq('id', r.id)
    }
  }

  return { checkAndNotify }
}
