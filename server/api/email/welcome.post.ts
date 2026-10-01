import { sendWelcomeEmail } from '../../utils/email'

export default defineEventHandler(async (event) => {
  // Лише собі: адреса — з акаунта, а не з тіла запиту
  const { user, supabase } = await requireUser(event)
  const email = user.email
  if (!email) throw createError({ statusCode: 400, message: 'Missing email' })
  const { data: profile } = await supabase.from('users').select('name').eq('id', user.id).maybeSingle()
  const name = profile?.name || (await readBody(event).catch(() => ({})))?.name || email.split('@')[0]

  try {
    await sendWelcomeEmail(email, name)
    return { ok: true }
  } catch (e) {
    console.error('[welcome email]', e)
    return { ok: false }
  }
})
