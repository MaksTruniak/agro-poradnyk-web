import { sendWelcomeEmail } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  const { email, name } = await readBody(event)
  if (!email || !name) throw createError({ statusCode: 400, message: 'Missing email or name' })

  try {
    await sendWelcomeEmail(email, name)
    return { ok: true }
  } catch (e) {
    console.error('[welcome email]', e)
    return { ok: false }
  }
})
