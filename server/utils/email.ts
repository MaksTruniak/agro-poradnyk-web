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
          <h2 style="margin:0 0 16px">Вітаємо, ${escapeHtml(name)}!</h2>
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

export async function sendPaymentConfirmEmail(
  to: string,
  name: string,
  plan: string,
  opts?: { amount?: number; currency?: string; orderReference?: string; paidAt?: string }
) {
  const PLAN_LABELS: Record<string, string> = {
    business: 'Бізнес', business_pro: 'Бізнес Про', pro: 'PRO',
    top_seller: 'Топ продавець', top_agronomist: 'Топ агроном',
    agronomist_pro_month: 'Агроном Про (місяць)', agronomist_pro_year: 'Агроном Про (рік)',
  }
  const planLabel = PLAN_LABELS[plan] || plan
  const amount = opts?.amount ? `${opts.amount} ${opts?.currency || 'UAH'}` : ''
  const paidAt = opts?.paidAt
    ? new Date(opts.paidAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
  const orderRef = opts?.orderReference || ''

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Чек оплати — ${planLabel} ✅`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1B2E1B">
        <div style="background:#2F5233;padding:32px 40px;border-radius:16px 16px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:26px">АгроПростір</h1>
          <p style="color:#a8c5a0;margin:8px 0 0;font-size:14px">agroprostir.com.ua</p>
        </div>
        <div style="background:#FAF6EC;padding:40px;border-radius:0 0 16px 16px;border:1px solid #e2ddd0;border-top:none">
          <h2 style="margin:0 0 8px">Дякуємо, ${escapeHtml(name)}!</h2>
          <p style="color:#5B6B53;margin:0 0 28px">Оплата успішно прийнята. Підписку активовано.</p>

          <div style="background:#fff;border:1px solid #e2ddd0;border-radius:12px;overflow:hidden;margin:0 0 28px">
            <div style="background:#f0f4e8;padding:12px 20px;font-size:12px;font-weight:700;color:#4c5a46;text-transform:uppercase;letter-spacing:.5px">
              Чек оплати
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr>
                <td style="padding:14px 20px;color:#7a8a72;border-bottom:1px solid #f0ede5">Послуга</td>
                <td style="padding:14px 20px;font-weight:600;color:#1B2E1B;border-bottom:1px solid #f0ede5;text-align:right">Підписка ${planLabel}</td>
              </tr>
              ${amount ? `<tr>
                <td style="padding:14px 20px;color:#7a8a72;border-bottom:1px solid #f0ede5">Сума</td>
                <td style="padding:14px 20px;font-weight:700;color:#2F5233;border-bottom:1px solid #f0ede5;text-align:right;font-size:18px">${amount}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:14px 20px;color:#7a8a72;border-bottom:1px solid #f0ede5">Дата</td>
                <td style="padding:14px 20px;font-weight:600;color:#1B2E1B;border-bottom:1px solid #f0ede5;text-align:right">${paidAt}</td>
              </tr>
              ${orderRef ? `<tr>
                <td style="padding:14px 20px;color:#7a8a72">Номер платежу</td>
                <td style="padding:14px 20px;font-size:12px;color:#9aaa8e;text-align:right;word-break:break-all">${orderRef}</td>
              </tr>` : ''}
            </table>
          </div>

          <div style="text-align:center;margin:0 0 28px">
            <a href="https://agroprostir.com.ua/dashboard/invoices"
              style="display:inline-block;background:#2F5233;color:#fff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px">
              Переглянути рахунки →
            </a>
          </div>

          <p style="color:#9aaa8e;font-size:13px;margin:0">
            Питання? Пишіть на <a href="mailto:info@agroprostir.com.ua" style="color:#2F5233">info@agroprostir.com.ua</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendSubscriptionReminderEmail(to: string, name: string, plan: string, expiresAt: string) {
  const planLabel = plan === 'pro' ? 'PRO' : plan === 'business' ? 'Business' : plan
  const expDate = new Date(expiresAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Ваша підписка ${planLabel} закінчується через 7 днів`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1B2E1B">
        <div style="background:#2F5233;padding:32px 40px;border-radius:16px 16px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:26px">АгроПростір</h1>
        </div>
        <div style="background:#FAF6EC;padding:40px;border-radius:0 0 16px 16px;border:1px solid #e2ddd0;border-top:none">
          <h2 style="margin:0 0 16px">Привіт, ${escapeHtml(name)}!</h2>
          <p style="color:#5B6B53;line-height:1.6;margin:0 0 8px">
            Ваша підписка <strong>${planLabel}</strong> закінчується <strong>${expDate}</strong>.
          </p>
          <p style="color:#5B6B53;line-height:1.6;margin:0 0 24px">
            Продовжте підписку щоб не втратити доступ до всіх функцій.
          </p>
          <a href="https://agroprostir.com.ua/dashboard/subscription"
            style="display:inline-block;background:#2F5233;color:#fff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px">
            Продовжити підписку →
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
    subject: `Нове повідомлення від ${senderName.replace(/[\r\n]/g, ' ')}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1B2E1B">
        <div style="background:#2F5233;padding:32px 40px;border-radius:16px 16px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:26px">АгроПростір</h1>
        </div>
        <div style="background:#FAF6EC;padding:40px;border-radius:0 0 16px 16px;border:1px solid #e2ddd0;border-top:none">
          <p style="color:#5B6B53;margin:0 0 8px">Привіт, <strong>${escapeHtml(recipientName)}</strong>!</p>
          <p style="color:#5B6B53;line-height:1.6;margin:0 0 20px">
            У вас нове повідомлення від <strong>${escapeHtml(senderName)}</strong>:
          </p>
          <div style="background:#fff;border:1px solid #e2ddd0;border-radius:12px;padding:20px;color:#3d4f3c;font-style:italic;margin:0 0 24px">
            "${escapeHtml(preview)}"
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

export async function sendLowStockEmail(
  to: string,
  name: string,
  items: { name: string; quantity: number; unit: string; min_quantity: number }[]
) {
  const resend = getResend()
  const rows = items.map(i =>
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#1b2e1b;font-weight:600">${escapeHtml(i.name)}</td>
     <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#b3452f;font-weight:700">${escapeHtml(i.quantity)} ${escapeHtml(i.unit)}</td>
     <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#9aaa8e">мін: ${escapeHtml(i.min_quantity)} ${escapeHtml(i.unit)}</td></tr>`
  ).join('')

  await resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ Закінчується запас на складі — ${items.length} позицій`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#faf6ec;padding:32px 24px;border-radius:16px">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:28px;font-weight:900;color:#1b2e1b">🌿 АгроПростір</span>
        </div>
        <div style="background:#fff;border-radius:12px;padding:28px">
          <p style="color:#1b2e1b;font-size:16px;margin:0 0 8px">Привіт, <strong>${escapeHtml(name)}</strong>!</p>
          <p style="color:#6b7a64;font-size:14px;margin:0 0 20px">На складі закінчуються запаси препаратів. Будь ласка, поповніть вчасно.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:#f0f4e8">
                <th style="padding:8px 12px;text-align:left;color:#4c5a46;font-size:12px;text-transform:uppercase">Препарат</th>
                <th style="padding:8px 12px;text-align:left;color:#4c5a46;font-size:12px;text-transform:uppercase">Залишок</th>
                <th style="padding:8px 12px;text-align:left;color:#4c5a46;font-size:12px;text-transform:uppercase">Норма</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="margin-top:24px;text-align:center">
            <a href="https://agroprostir.com.ua/dashboard/inventory/chemicals"
              style="display:inline-block;background:#2f5233;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">
              Відкрити склад →
            </a>
          </div>
        </div>
      </div>
    `,
  })
}

export async function sendReminderEmail(to: string, name: string, reminders: { description: string; scheduled_date: string; type: string }[]) {
  const UK_TYPES: Record<string, string> = {
    'обробка': '🌿', 'підживлення': '🌱', 'полив': '💧', 'посів': '🌾', 'збір': '🍎', 'інше': '🔔',
  }
  const rows = reminders.map(r => {
    const date = new Date(r.scheduled_date)
    const timeStr = date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', hour12: false })
    const icon = UK_TYPES[r.type] || '🔔'
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:20px;width:36px">${icon}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #eee">
          <div style="font-weight:600;color:#1B2E1B;font-size:15px">${escapeHtml(r.description)}</div>
          <div style="color:#7a8a72;font-size:13px;margin-top:2px">${escapeHtml(r.type)} · ${timeStr}</div>
        </td>
      </tr>`
  }).join('')

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `🔔 Нагадування на сьогодні — АгроПростір`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1B2E1B">
        <div style="background:#2F5233;padding:28px 40px;border-radius:16px 16px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">АгроПростір</h1>
        </div>
        <div style="background:#FAF6EC;padding:32px 40px;border-radius:0 0 16px 16px;border:1px solid #e2ddd0;border-top:none">
          <h2 style="margin:0 0 8px;font-size:20px">Привіт, ${escapeHtml(name)}!</h2>
          <p style="color:#5B6B53;margin:0 0 24px;font-size:14px">
            Сьогодні у вас заплановані наступні події:
          </p>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
            ${rows}
          </table>
          <div style="margin-top:24px;text-align:center">
            <a href="https://agroprostir.com.ua/dashboard/reminders"
              style="display:inline-block;background:#2f5233;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">
              Відкрити нагадування →
            </a>
          </div>
          <p style="color:#aaa;font-size:12px;text-align:center;margin-top:20px">
            АгроПростір · <a href="https://agroprostir.com.ua/dashboard/reminders" style="color:#aaa">Керувати нагадуваннями</a>
          </p>
        </div>
      </div>
    `,
  })
}
