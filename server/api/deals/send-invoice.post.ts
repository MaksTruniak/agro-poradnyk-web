import { Resend } from 'resend'

// Надсилає видаткову накладну на email. Накладну складає сервер з даних угоди / ручного продажу;
// надіслати може лише учасник угоди (або власник продажу).
export default defineEventHandler(async (event) => {
  const { user, supabase } = await requireUser(event)
  const body = await readBody(event)
  const kind = body?.kind === 'manual' ? 'manual' : 'deal'
  const id = String(body?.id || '')
  const email = String(body?.email || '').trim().slice(0, 200)

  if (!id || !email) throw createError({ statusCode: 400, message: 'Missing id or email' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw createError({ statusCode: 400, message: 'Невірний email' })

  const PARTY_FIELDS = 'id, name, phone, city, region, company_name, edrpou, iban, bank_name, legal_address'
  let data: InvoiceData

  if (kind === 'deal') {
    const { data: deal } = await supabase.from('deals')
      .select('id, chat_id, farmer_id, buyer_id, crop_type, quantity_tons, price_per_ton, total_price, confirmed_at, delivery_type_id')
      .eq('id', id).maybeSingle()
    if (!deal || (deal.farmer_id !== user.id && deal.buyer_id !== user.id)) {
      throw createError({ statusCode: 403, message: 'Немає доступу до угоди' })
    }
    const [{ data: parties }, { data: msg }] = await Promise.all([
      supabase.from('users').select(PARTY_FIELDS).in('id', [deal.farmer_id, deal.buyer_id]),
      supabase.from('messages').select('content').eq('chat_id', deal.chat_id).like('content', `[deal:${deal.id}%`).limit(1).maybeSingle(),
    ])
    const farmer = (parties || []).find(p => p.id === deal.farmer_id) || {}
    const buyer = (parties || []).find(p => p.id === deal.buyer_id) || {}
    data = dealInvoiceData(deal, farmer, buyer, msg?.content)
  } else {
    const { data: sale } = await supabase.from('manual_sales').select('*').eq('id', id).maybeSingle()
    if (!sale || sale.user_id !== user.id) throw createError({ statusCode: 403, message: 'Немає доступу до продажу' })
    const { data: farmer } = await supabase.from('users').select(PARTY_FIELDS).eq('id', user.id).maybeSingle()
    data = manualSaleInvoiceData(sale, farmer || {})
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: sendErr } = await resend.emails.send({
    from: 'АгроПростір <info@agroprostir.com.ua>',
    to: email,
    subject: `Видаткова накладна №${data.invoiceNum} — АгроПростір`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#2F5233;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">АгроПростір</h1>
          <p style="color:#a8c5a0;margin:4px 0 0;font-size:13px">Накладна №${data.invoiceNum}</p>
        </div>
        <div style="background:#f9f9f9;padding:24px 32px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 12px 12px">
          <p style="color:#444;margin:0 0 16px">Доброго дня! Надсилаємо вам видаткову накладну.</p>
          <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:0;overflow:hidden">
            ${buildInvoiceHtml(data)}
          </div>
          <p style="color:#999;font-size:12px;margin:16px 0 0;text-align:center">
            АгроПростір — agroprostir.com.ua
          </p>
        </div>
      </div>
    `,
  })

  // Resend повертає помилку, а не кидає — інакше сайт казав би «надіслано»
  if (sendErr) {
    console.error('[send-invoice] email failed', sendErr)
    throw createError({ statusCode: 502, message: 'Не вдалося надіслати накладну. Спробуйте ще раз.' })
  }

  return { ok: true }
})
