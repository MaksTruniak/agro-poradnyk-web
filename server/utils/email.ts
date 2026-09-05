import { Resend } from 'resend'

const FROM = 'АгроПростір <info@agroprostir.com.ua>'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export async function sendWelcomeEmail(to: string, name: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Ласкаво просимо до АгроПростору 🌱',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1B2E1B">
        <div style="background:#2F5233;padding:32px 40px;border-radius:16px 16px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:26px">АгроПростір</h1>
        </div>
        <div style="background:#FAF6EC;padding:40px;border-radius:0 0 16px 16px;border:1px solid #e2ddd0;border-top:none">
          <h2 style="margin:0 0 16px">Вітаємо, ${name}!</h2>
          <p style="color:#5B6B53;line-height:1.6;margin:0 0 24px">
            Ваш акаунт на платформі <strong>АгроПростір</strong> успішно створено.
            Тепер ви можете керувати полями, консультуватись з агрономами та продавати врожай напряму.
          </p>
          <a href="https://agroprostir.com.ua/dashboard"
            style="display:inline-block;background:#2F5233;color:#fff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px">
            Перейти до кабінету →
          </a>
          <p style="color:#9aaa8e;font-size:13px;margin:32px 0 0">
            Якщо ви не реєструвались на АгроПростір — просто проігноруйте цей лист.
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendPaymentConfirmEmail(to: string, name: string, plan: string) {
  const planLabel = plan === 'pro' ? 'PRO' : plan === 'top_seller' ? 'Топ продавець' : 'PRO'
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Підписка ${planLabel} активована ✅`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1B2E1B">
        <div style="background:#2F5233;padding:32px 40px;border-radius:16px 16px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:26px">АгроПростір</h1>
        </div>
        <div style="background:#FAF6EC;padding:40px;border-radius:0 0 16px 16px;border:1px solid #e2ddd0;border-top:none">
          <h2 style="margin:0 0 16px">Дякуємо, ${name}!</h2>
          <p style="color:#5B6B53;line-height:1.6;margin:0 0 8px">
            Вашу підписку <strong>${planLabel}</strong> успішно активовано.
          </p>
          <p style="color:#5B6B53;line-height:1.6;margin:0 0 24px">
            Усі можливості плану вже доступні у вашому кабінеті.
          </p>
          <a href="https://agroprostir.com.ua/dashboard"
            style="display:inline-block;background:#2F5233;color:#fff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px">
            Відкрити кабінет →
          </a>
          <p style="color:#9aaa8e;font-size:13px;margin:32px 0 0">
            Питання? Пишіть на info@agroprostir.com.ua
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendNewMessageEmail(to: string, recipientName: string, senderName: string, preview: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Нове повідомлення від ${senderName}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1B2E1B">
        <div style="background:#2F5233;padding:32px 40px;border-radius:16px 16px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:26px">АгроПростір</h1>
        </div>
        <div style="background:#FAF6EC;padding:40px;border-radius:0 0 16px 16px;border:1px solid #e2ddd0;border-top:none">
          <p style="color:#5B6B53;margin:0 0 8px">Привіт, <strong>${recipientName}</strong>!</p>
          <p style="color:#5B6B53;line-height:1.6;margin:0 0 20px">
            У вас нове повідомлення від <strong>${senderName}</strong>:
          </p>
          <div style="background:#fff;border:1px solid #e2ddd0;border-radius:12px;padding:20px;color:#3d4f3c;font-style:italic;margin:0 0 24px">
            "${preview}"
          </div>
          <a href="https://agroprostir.com.ua/dashboard"
            style="display:inline-block;background:#2F5233;color:#fff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px">
            Відповісти →
          </a>
          <p style="color:#9aaa8e;font-size:13px;margin:32px 0 0">
            Щоб не отримувати ці сповіщення — вимкніть їх у налаштуваннях профілю.
          </p>
        </div>
      </div>
    `,
  })
}
