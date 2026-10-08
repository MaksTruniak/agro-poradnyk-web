<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Платежі</h1>
        <p class="dash-subtitle">Історія оплат</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="card animate-pulse h-16" />
    </div>

    <div v-else-if="!payments.length" class="card text-center py-12">
      <div class="w-14 h-14 rounded-2xl bg-agro-hover flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <p class="font-bold text-agro-dark mb-1">Платежів ще немає</p>
      <p class="text-sm text-agro-light">Тут з'являться платежі після першої оплати</p>
    </div>

    <div v-else class="card overflow-hidden p-0">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-agro-border">
              <th class="text-left px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide">Дата</th>
              <th class="text-left px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide">Тариф</th>
              <th class="text-left px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide">Сума</th>
              <th class="text-left px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide">Статус</th>
              <th class="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in payments" :key="p.id" class="border-b border-agro-border last:border-0 hover:bg-agro-hover/40 transition-colors">
              <td class="px-5 py-4 text-agro-dark">{{ formatDate(p.created_at) }}</td>
              <td class="px-5 py-4 font-semibold text-agro-dark">{{ planLabel(p.plan) }}</td>
              <td class="px-5 py-4 text-agro-dark font-mono">{{ p.amount.toLocaleString('uk-UA') }} {{ p.currency }}</td>
              <td class="px-5 py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="p.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'">
                  <span class="w-1.5 h-1.5 rounded-full" :class="p.status === 'paid' ? 'bg-green-500' : 'bg-amber-400'" />
                  {{ p.status === 'paid' ? 'Оплачено' : p.status }}
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <button @click="downloadInvoice(p)" class="text-xs text-agro font-semibold hover:underline flex items-center gap-1 ml-auto">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Завантажити
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Платежі' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)
const payments = ref<any[]>([])

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

// Назви тарифів — з таблиці plans (як у формі оплати); ім'я платника — з профілю
const [paymentsRes, plansRes, userRes] = await Promise.all([
  supabase.from('payments').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
  supabase.from('plans').select('id, label'),
  supabase.from('users').select('name').eq('id', uid).maybeSingle(),
])

payments.value = paymentsRes.data || []
const planNames: Record<string, string> = Object.fromEntries((plansRes.data || []).map((p: any) => [p.id, p.label]))
const payerName: string = (userRes.data as any)?.name || ''
loading.value = false

const formatDate = (d: string) =>
  new Date(d).toLocaleString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const PLAN_LABELS: Record<string, string> = {
  basic:           'Basic',
  business:        'Бізнес',
  business_pro:    'Бізнес Про',
  pro:             'Бізнес',
  pro_month:       'Бізнес',
  pro_year:        'Бізнес (рік)',
  top_agronomist:  'Топ агронома',
  top_seller:      'Топ продавця',
}
const planLabel = (p: string) => planNames[p] || PLAN_LABELS[p] || p

const downloadInvoice = (p: any) => {
  const invoiceNum = p.id.slice(0, 8).toUpperCase()
  const dateStr = formatDate(p.created_at)
  const amountStr = escapeHtml(`${p.amount.toLocaleString('uk-UA')} ${p.currency}`)
  const userEmail = escapeHtml(session?.user?.email || '')
  const userName = escapeHtml(payerName)

  const html = `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<title>Рахунок №${invoiceNum}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #1b2e1b; background: #fff; }
  .header { background: #2f5233; color: #fff; padding: 24px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header-brand { font-size: 22px; font-weight: 700; }
  .header-sub { font-size: 11px; opacity: .75; margin-top: 4px; }
  .header-right { text-align: right; }
  .header-right .invoice-title { font-size: 24px; font-weight: 700; letter-spacing: 1px; }
  .header-right .invoice-num { font-size: 11px; opacity: .75; margin-top: 4px; }
  .meta { padding: 16px 40px; display: flex; justify-content: space-between; border-bottom: 1px solid #e0e4d8; }
  .meta-date { color: #1b2e1b; }
  .meta-status { color: #2f5233; font-weight: 600; }
  .parties { padding: 20px 40px; display: flex; gap: 40px; border-bottom: 1px solid #e0e4d8; }
  .party { flex: 1; }
  .party-label { font-size: 10px; color: #6b7a64; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }
  .party-name { font-weight: 600; margin-bottom: 3px; }
  .party-info { color: #6b7a64; font-size: 12px; line-height: 1.6; }
  .table { margin: 20px 40px; }
  .table-head { background: #eef1e3; display: flex; padding: 8px 12px; font-size: 10px; color: #6b7a64; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; border-radius: 4px; }
  .table-row { display: flex; padding: 12px 12px; border-bottom: 1px solid #eef1e3; align-items: center; }
  .col-service { flex: 1; }
  .col-qty { width: 60px; text-align: center; }
  .col-sum { width: 120px; text-align: right; }
  .total { margin: 16px 40px 0; display: flex; justify-content: flex-end; }
  .total-box { border-top: 2px solid #2f5233; padding-top: 12px; min-width: 220px; }
  .total-label { font-size: 11px; color: #6b7a64; margin-bottom: 4px; }
  .total-amount { font-size: 18px; font-weight: 700; color: #1b2e1b; }
  .order-ref { margin: 16px 40px 0; font-size: 11px; color: #6b7a64; }
  .footer { margin-top: 40px; background: #eef1e3; padding: 16px 40px; text-align: center; font-size: 11px; color: #6b7a64; line-height: 1.8; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: A4; margin: 0; }
  }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="header-brand">AgroProstir</div>
    <div class="header-sub">agroprostir.com.ua<br>info@agroprostir.com.ua</div>
  </div>
  <div class="header-right">
    <div class="invoice-title">РАХУНОК</div>
    <div class="invoice-num"># ${invoiceNum}</div>
  </div>
</div>
<div class="meta">
  <span class="meta-date">Дата: ${dateStr}</span>
  <span class="meta-status">● Оплачено</span>
</div>
<div class="parties">
  <div class="party">
    <div class="party-label">Від</div>
    <div class="party-name">АгроПростір</div>
    <div class="party-info">agroprostir.com.ua<br>info@agroprostir.com.ua</div>
  </div>
  <div class="party">
    <div class="party-label">Платник</div>
    <div class="party-name">${userName || userEmail}</div>
    ${userName ? `<div class="party-info">${userEmail}</div>` : ''}
  </div>
</div>
<div class="table">
  <div class="table-head">
    <span class="col-service">Послуга</span>
    <span class="col-qty">К-ть</span>
    <span class="col-sum">Сума</span>
  </div>
  <div class="table-row">
    <span class="col-service">Передплата: ${escapeHtml(planLabel(p.plan))}</span>
    <span class="col-qty">1</span>
    <span class="col-sum">${amountStr}</span>
  </div>
</div>
<div class="total">
  <div class="total-box">
    <div class="total-label">Разом до сплати:</div>
    <div class="total-amount">${amountStr}</div>
  </div>
</div>
<div class="order-ref">Номер замовлення: ${escapeHtml(p.order_reference || '—')}</div>
<div class="footer">
  АгроПростір — платформа для агрономів і фермерів України<br>
  agroprostir.com.ua · info@agroprostir.com.ua
</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
</script>
