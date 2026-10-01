// Видаткова накладна: однаковий HTML для друку на сторінці угод і для листа з сервера.
// Усі значення від користувачів екрануються (назви компаній, імена, примітки).
import { escapeHtml } from './html'

export interface InvoiceParty {
  name?: string | null
  company_name?: string | null
  edrpou?: string | null
  city?: string | null
  region?: string | null
  legal_address?: string | null
  phone?: string | null
  iban?: string | null
  bank_name?: string | null
}

export interface InvoiceData {
  invoiceNum: string
  dateStr: string
  seller: InvoiceParty
  buyer: InvoiceParty
  itemName: string
  qty: string
  pricePerUnit: string
  total: string
  deliveryName?: string
  note?: string | null
}

const formatDateUk = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

// Кількість і ціну в одиницях, якими домовлялись (т / кг), беремо з повідомлення угоди в чаті: [deal:id:unit:qty:price]
export const parseDealMessage = (content?: string | null) => {
  const match = content?.match(/\[deal:[^:\]]+(?::([^:\]]+))?(?::([^:\]]+))?(?::([^:\]]+))?\]/)
  return {
    unit: match?.[1] || 'т',
    displayQty: match?.[2] ? parseFloat(match[2]) : null,
    displayPrice: match?.[3] ? parseFloat(match[3]) : null,
  }
}

export const cleanDealCrop = (crop?: string | null) =>
  (crop || '').replace('Пропозиція продажу: ', '').replace('Запит на купівлю: ', '').trim()

export const dealInvoiceData = (
  deal: { id: string; crop_type?: string | null; quantity_tons?: number | null; price_per_ton?: number | null;
    total_price?: number | null; confirmed_at?: string | null; delivery_type_id?: number | null },
  farmer: InvoiceParty,
  buyer: InvoiceParty,
  dealMessage?: string | null,
): InvoiceData => {
  const { unit, displayQty, displayPrice } = parseDealMessage(dealMessage)
  const qty = displayQty ?? deal.quantity_tons
  const price = displayPrice ?? deal.price_per_ton
  return {
    invoiceNum: deal.id.slice(0, 8).toUpperCase(),
    dateStr: formatDateUk(deal.confirmed_at),
    seller: farmer,
    buyer,
    itemName: cleanDealCrop(deal.crop_type),
    qty: qty ? `${qty} ${unit}` : '—',
    pricePerUnit: price ? `${price.toLocaleString('uk-UA')} грн/${unit}` : '—',
    total: deal.total_price ? `${deal.total_price.toLocaleString('uk-UA')} грн` : '—',
    deliveryName: deal.delivery_type_id === 1 ? 'Самовивіз' : 'Доставка',
  }
}

export const manualSaleInvoiceData = (
  sale: { id: string; crop_type?: string | null; quantity_tons?: number | null; price_per_ton?: number | null;
    total_price?: number | null; sold_at?: string | null; notes?: string | null; buyer_name?: string | null;
    buyer_phone?: string | null; buyer_edrpou?: string | null; buyer_iban?: string | null },
  farmer: InvoiceParty,
): InvoiceData => ({
  invoiceNum: sale.id.slice(0, 8).toUpperCase(),
  dateStr: formatDateUk(sale.sold_at),
  seller: farmer,
  buyer: {
    name: sale.buyer_name || '—',
    company_name: sale.buyer_name || '',
    phone: sale.buyer_phone || '',
    edrpou: sale.buyer_edrpou || '',
    iban: sale.buyer_iban || '',
  },
  itemName: sale.crop_type || '',
  qty: `${sale.quantity_tons} т`,
  pricePerUnit: sale.price_per_ton ? `${sale.price_per_ton.toLocaleString('uk-UA')} грн/т` : '—',
  total: sale.total_price ? `${sale.total_price.toLocaleString('uk-UA')} грн` : '—',
  note: sale.notes,
})

/** Чи заповнені в продавця реквізити, потрібні для накладної */
export const hasInvoiceRequisites = (p: InvoiceParty) => !!(p.edrpou && p.iban && (p.company_name || p.name))

const partyBlock = (label: string, u: InvoiceParty) => {
  const e = escapeHtml
  const address = u.legal_address || (u.city ? u.city + (u.region ? ', ' + u.region : '') : '')
  return `
    <div class="party">
      <div class="party-label">${e(label)}</div>
      <div class="party-name">${e(u.company_name || u.name || '—')}</div>
      ${u.edrpou ? `<div class="party-row">ЄДРПОУ / ІПН: <b>${e(u.edrpou)}</b></div>` : ''}
      ${u.city && address ? `<div class="party-row">Адреса: ${e(address)}</div>` : ''}
      ${u.phone ? `<div class="party-row">Телефон: ${e(u.phone)}</div>` : ''}
      ${u.iban ? `<div class="party-row">IBAN: <b>${e(u.iban)}</b></div>` : ''}
      ${u.bank_name ? `<div class="party-row">Банк: ${e(u.bank_name)}</div>` : ''}
    </div>`
}

export const buildInvoiceHtml = (d: InvoiceData) => {
  const e = escapeHtml
  return `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><title>Накладна №${e(d.invoiceNum)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 40px; max-width: 800px; margin: auto; }
    h1 { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 4px; }
    .subtitle { text-align: center; color: #666; font-size: 12px; margin-bottom: 28px; }
    .parties { display: flex; gap: 24px; margin-bottom: 24px; }
    .party { flex: 1; border: 1px solid #ccc; border-radius: 6px; padding: 12px; }
    .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 4px; }
    .party-name { font-weight: 700; font-size: 14px; margin-bottom: 6px; }
    .party-row { font-size: 12px; color: #444; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f4f4f4; border: 1px solid #ccc; padding: 8px 10px; text-align: left; font-size: 12px; }
    td { border: 1px solid #ddd; padding: 8px 10px; font-size: 13px; }
    .total-row td { font-weight: 700; background: #f9f9f9; }
    .delivery { margin-bottom: 20px; font-size: 12px; color: #555; }
    .signatures { display: flex; gap: 40px; margin-top: 40px; }
    .sig { flex: 1; border-top: 1px solid #999; padding-top: 8px; font-size: 12px; color: #555; }
    .footer { margin-top: 20px; font-size: 11px; color: #aaa; text-align: center; }
    @media print { body { padding: 20px; } }
  </style></head><body>
  <h1>Видаткова накладна №${e(d.invoiceNum)}</h1>
  <div class="subtitle">від ${e(d.dateStr)}</div>
  <div class="parties">
    ${partyBlock('Постачальник (Продавець)', d.seller)}
    ${partyBlock('Покупець', d.buyer)}
  </div>
  <table>
    <thead><tr><th>№</th><th>Найменування товару</th><th>Кількість</th><th>Ціна за од.</th><th>Сума</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>${e(d.itemName)}</td><td>${e(d.qty)}</td><td>${e(d.pricePerUnit)}</td><td>${e(d.total)}</td></tr>
      <tr class="total-row"><td colspan="4" style="text-align:right">Всього:</td><td>${e(d.total)}</td></tr>
    </tbody>
  </table>
  ${d.deliveryName ? `<div class="delivery">Спосіб доставки: <b>${e(d.deliveryName)}</b></div>` : ''}
  ${d.note ? `<div class="delivery">Примітка: <b>${e(d.note)}</b></div>` : ''}
  <div class="signatures">
    <div class="sig">Здав (Продавець): _______________________<br><span style="font-size:11px;color:#888">${e(d.seller.name || '')}</span></div>
    <div class="sig">Прийняв (Покупець): _______________________<br><span style="font-size:11px;color:#888">${e(d.buyer.name || '')}</span></div>
  </div>
  <div class="footer">Сформовано через АгроПростір</div>
  </body></html>`
}
