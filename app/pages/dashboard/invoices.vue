<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Інвойси</h1>
        <p class="dash-subtitle">Історія платежів</p>
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
      <p class="text-sm text-agro-light">Тут з'являться інвойси після першої оплати</p>
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

    <!-- Активна підписка -->
    <div v-if="subscription" class="card mt-4">
      <p class="text-xs text-agro-light uppercase tracking-wide mb-2 font-semibold">Активна підписка</p>
      <div class="flex items-center justify-between">
        <div>
          <p class="font-bold text-agro-dark">{{ planLabel(subscription.plan) }}</p>
          <p class="text-sm text-agro-light mt-0.5">Діє до {{ formatDate(subscription.expires_at) }}</p>
        </div>
        <NuxtLink to="/dashboard/subscription" class="btn-outline text-sm py-2 px-4">Продовжити →</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Інвойси' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)
const payments = ref<any[]>([])
const subscription = ref<any>(null)

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const [paymentsRes, subRes] = await Promise.all([
  supabase.from('payments').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
  supabase.from('subscriptions').select('plan, expires_at').eq('user_id', uid).maybeSingle(),
])

payments.value = paymentsRes.data || []
subscription.value = subRes.data
loading.value = false

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })

const PLAN_LABELS: Record<string, string> = {
  pro:             'PRO (місяць)',
  pro_month:       'PRO (місяць)',
  pro_year:        'PRO (рік)',
  business:        'Business (місяць)',
  business_month:  'Business (місяць)',
  business_year:   'Business (рік)',
  top_agronomist:  'Топ агронома',
  top_seller:      'Топ продавця',
}
const planLabel = (p: string) => PLAN_LABELS[p] || p

const downloadInvoice = (p: any) => {
  const lines = [
    `ІНВОЙС № ${p.id.slice(0, 8).toUpperCase()}`,
    `Дата: ${formatDate(p.created_at)}`,
    ``,
    `Постачальник: АгроПростір (agroprostir.com.ua)`,
    ``,
    `Послуга: ${planLabel(p.plan)}`,
    `Сума: ${p.amount.toLocaleString('uk-UA')} ${p.currency}`,
    `Статус: Оплачено`,
    ``,
    `Номер замовлення: ${p.order_reference || '—'}`,
  ].join('\n')

  const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `invoice-${p.id.slice(0, 8)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
