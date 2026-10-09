// Звернення в підтримку / запит на інтеграцію з кабінету: запис у support_tickets і лист у скриньку підтримки.
// Раніше сторінки писали в support_tickets напряму, і звернення ніхто не бачив — їх ніде не читали.
export default defineEventHandler(async (event) => {
  const { user, supabase } = await requireUser(event)
  const body = await readBody(event)

  const kind: 'support' | 'integration' = body?.kind === 'integration' ? 'integration' : 'support'
  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const subject = text(body?.subject, 200)
  const details = text(body?.body, 5000)
  if (!subject) throw createError({ statusCode: 400, message: 'Опишіть коротко звернення' })

  const [{ data: sub }, { data: profile }] = await Promise.all([
    supabase.from('subscriptions').select('plan, expires_at').eq('user_id', user.id).eq('profile', 'farmer').maybeSingle(),
    supabase.from('users').select('name').eq('id', user.id).maybeSingle(),
  ])
  const plan = getActivePlan(sub)
  const priority = plan === 'business_pro' ? 'high' : 'normal'

  const { data: ticket, error } = await supabase.from('support_tickets').insert({
    user_id: user.id,
    subject: kind === 'integration' ? `Запит на інтеграцію: ${subject}` : subject,
    body: details || null,
    priority,
  }).select('id').single()
  if (error) throw createError({ statusCode: 500, message: 'Не вдалося надіслати звернення' })

  // Звернення вже збережене; якщо лист не пішов — пишемо в лог (Resend повертає помилку, а не кидає)
  try {
    const { error: sendErr } = await sendSupportTicketEmail({
      ticketId: ticket.id, kind, priority, subject, body: details,
      userEmail: user.email || '', userName: profile?.name || '', plan,
    })
    if (sendErr) console.error('[support-ticket] email failed', ticket.id, sendErr)
  } catch (e) {
    console.error('[support-ticket] email failed', ticket.id, e)
  }

  return { ok: true, id: ticket.id }
})
