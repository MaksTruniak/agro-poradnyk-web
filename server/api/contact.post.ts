import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
  const { name, email, message } = await readBody(event)
  if (!name || !email || !message) {
    throw createError({ statusCode: 400, message: 'Missing fields' })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'АгроПростір <info@agroprostir.com.ua>',
    to: 'info@agroprostir.com.ua',
    replyTo: email,
    subject: `Нове повідомлення з сайту від ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1B2E1B">
        <div style="background:#2F5233;padding:24px 32px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0;font-size:20px">Нове звернення з сайту</h2>
        </div>
        <div style="background:#FAF6EC;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2ddd0;border-top:none">
          <p style="margin:0 0 8px"><strong>Ім'я:</strong> ${name}</p>
          <p style="margin:0 0 8px"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p style="margin:16px 0 8px"><strong>Повідомлення:</strong></p>
          <p style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2ddd0;white-space:pre-wrap;margin:0">${message}</p>
        </div>
      </div>
    `,
  })

  return { ok: true }
})
