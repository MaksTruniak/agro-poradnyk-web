import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = String(body?.name || '').trim().slice(0, 200)
  const email = String(body?.email || '').trim().slice(0, 200)
  const message = String(body?.message || '').trim().slice(0, 5000)
  if (!name || !email || !message) {
    throw createError({ statusCode: 400, message: 'Missing fields' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email' })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: sendErr } = await resend.emails.send({
    from: 'АгроПростір <info@agroprostir.com.ua>',
    to: SUPPORT_INBOX,
    replyTo: email,
    subject: `Нове повідомлення з сайту від ${name.replace(/[\r\n]/g, ' ')}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1B2E1B">
        <div style="background:#2F5233;padding:24px 32px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0;font-size:20px">Нове звернення з сайту</h2>
        </div>
        <div style="background:#FAF6EC;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2ddd0;border-top:none">
          <p style="margin:0 0 8px"><strong>Ім'я:</strong> ${escapeHtml(name)}</p>
          <p style="margin:0 0 8px"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          <p style="margin:16px 0 8px"><strong>Повідомлення:</strong></p>
          <p style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2ddd0;white-space:pre-wrap;margin:0">${escapeHtml(message)}</p>
        </div>
      </div>
    `,
  })

  // Resend повертає помилку, а не кидає — інакше користувач бачив би «надіслано», а лист не дійшов
  if (sendErr) {
    console.error('[contact] email failed', sendErr)
    throw createError({ statusCode: 502, message: 'Не вдалося надіслати повідомлення. Напишіть нам на пошту.' })
  }
  return { ok: true }
})
