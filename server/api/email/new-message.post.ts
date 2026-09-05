import { createClient } from '@supabase/supabase-js'
import { sendNewMessageEmail } from '../../utils/email'

export default defineEventHandler(async (event) => {
  const { recipientId, senderName, preview } = await readBody(event)
  if (!recipientId || !senderName || !preview) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data: userData } = await supabase.auth.admin.getUserById(recipientId)
    if (!userData?.user?.email) return { ok: false }

    const recipientName = userData.user.user_metadata?.full_name || userData.user.email.split('@')[0]
    await sendNewMessageEmail(userData.user.email, recipientName, senderName, preview)
    return { ok: true }
  } catch (e) {
    console.error('[new-message email]', e)
    return { ok: false }
  }
})
