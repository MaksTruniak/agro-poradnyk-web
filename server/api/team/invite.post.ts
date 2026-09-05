import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, role, ownerName, memberId } = body

  if (!email || !role || !memberId) {
    throw createError({ statusCode: 400, message: 'email, role, memberId required' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Отримуємо токен з team_members (вже вставлено на фронті)
  const { data: member, error } = await supabase
    .from('team_members')
    .select('token')
    .eq('owner_id', memberId)
    .eq('email', email)
    .maybeSingle()

  if (error || !member?.token) {
    throw createError({ statusCode: 404, message: 'Team member record not found' })
  }

  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://agroprostir.com.ua'
  const inviteUrl = `${siteUrl}/invite?token=${member.token}`
  const roleLabel = role === 'editor' ? 'Редактор' : 'Переглядач'

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    // Якщо Resend не налаштований — повертаємо посилання для ручної відправки
    return { ok: true, inviteUrl, manual: true }
  }

  const resend = new Resend(resendKey)

  await resend.emails.send({
    from: 'АгроПростір <noreply@agroprostir.com.ua>',
    to: email,
    subject: `${ownerName || 'Господарство'} запрошує вас до АгроПростір`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a2e1a">
        <div style="background:#2f5233;padding:28px 32px;border-radius:16px 16px 0 0">
          <h1 style="color:white;margin:0;font-size:22px">🌿 АгроПростір</h1>
        </div>
        <div style="background:#fff;border:1px solid #e0edcc;border-top:0;padding:32px;border-radius:0 0 16px 16px">
          <h2 style="color:#1a2e1a;margin-top:0">Запрошення до команди</h2>
          <p style="color:#5a7a5a;line-height:1.6">
            <strong>${ownerName || 'Господарство'}</strong> запрошує вас як
            <strong>${roleLabel}</strong> для доступу до свого облікового запису на платформі АгроПростір.
          </p>
          <p style="color:#5a7a5a;line-height:1.6">
            Натисніть кнопку нижче, щоб прийняти запрошення та налаштувати свій обліковий запис.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${inviteUrl}"
              style="background:#2f5233;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">
              Прийняти запрошення →
            </a>
          </div>
          <p style="color:#aaa;font-size:12px;margin-bottom:0">
            Якщо ви не очікували цього запрошення — просто проігноруйте цей лист.
          </p>
        </div>
      </div>
    `,
  })

  return { ok: true, inviteUrl, manual: false }
})
