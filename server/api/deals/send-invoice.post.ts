import { serverSupabaseServiceRole } from '#supabase/server'
import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const body = await readBody(event)
  const { html, email, invoiceNum } = body

  if (!html || !email) throw createError({ statusCode: 400, message: 'Missing html or email' })

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'АгроПростір <info@agroprostir.com.ua>',
    to: email,
    subject: `Видаткова накладна №${invoiceNum} — АгроПростір`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#2F5233;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">АгроПростір</h1>
          <p style="color:#a8c5a0;margin:4px 0 0;font-size:13px">Накладна №${invoiceNum}</p>
        </div>
        <div style="background:#f9f9f9;padding:24px 32px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 12px 12px">
          <p style="color:#444;margin:0 0 16px">Доброго дня! Надсилаємо вам видаткову накладну.</p>
          <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:0;overflow:hidden">
            ${html}
          </div>
          <p style="color:#999;font-size:12px;margin:16px 0 0;text-align:center">
            АгроПростір — agroprostir.com.ua
          </p>
        </div>
      </div>
    `,
  })

  return { ok: true }
})
