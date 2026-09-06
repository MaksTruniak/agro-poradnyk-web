<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 3h12l3 6-9 12L3 9l3-6z"/><path d="M3 9h18M9 3l3 18M15 3l-3 18"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Підписка</h1>
        <p class="dash-subtitle">Управління планом агронома</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-4 mb-8">
      <div class="card animate-pulse h-20"></div>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="card animate-pulse h-64"></div>
        <div class="card animate-pulse h-64"></div>
      </div>
    </div>

    <template v-else>
      <!-- Поточний план -->
      <div class="card mb-8 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="isPro ? 'bg-agro/10' : 'bg-agro-hover'">
          <svg v-if="isPro" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>
        </div>
        <div class="flex-1">
          <p class="text-xs text-agro-light uppercase tracking-wide">Поточний план</p>
          <p class="font-bold text-agro-dark text-lg">{{ isPro ? 'PRO' : 'Базовий' }}</p>
          <p v-if="expiresAt" class="text-xs text-agro-light mt-0.5">Діє до {{ formatDate(expiresAt) }}</p>
        </div>
        <span v-if="isPro" class="px-3 py-1 bg-agro text-white rounded-full text-xs font-bold">Активний</span>
      </div>

      <!-- Плани -->
      <div class="grid md:grid-cols-2 gap-4 mb-8">

        <!-- Базовий -->
        <div class="card border-2" :class="!isPro ? 'border-agro' : 'border-agro-border'">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-agro-dark text-lg">Базовий</h2>
            <span v-if="!isPro" class="text-xs bg-agro text-white px-2.5 py-1 rounded-full font-semibold">Ваш план</span>
          </div>
          <p class="text-2xl font-extrabold text-agro-dark mb-0.5">Безкоштовно</p>
          <p class="text-agro-light text-xs mb-4">назавжди</p>
          <ul class="space-y-2 mb-5">
            <li v-for="f in BASIC_FEATURES" :key="f" class="flex items-start gap-2 text-sm text-agro-dark">
              <span class="text-agro shrink-0 mt-0.5">✓</span> {{ f }}
            </li>
            <li v-for="f in BASIC_NEGATIVE" :key="f" class="flex items-start gap-2 text-sm text-agro-light">
              <span class="shrink-0 mt-0.5">✕</span> {{ f }}
            </li>
          </ul>
          <button disabled class="w-full py-2.5 rounded-xl border-2 border-agro-border text-agro-light font-semibold text-sm cursor-default">
            {{ !isPro ? 'Поточний план' : 'Базовий' }}
          </button>
        </div>

        <!-- PRO -->
        <div class="card border-2 relative overflow-hidden" :class="isPro ? 'border-agro' : 'border-agro-border'">
          <div class="absolute top-4 right-4 bg-agro text-white text-xs font-bold px-2.5 py-1 rounded-full">ПОПУЛЯРНИЙ</div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-agro-dark text-lg">PRO</h2>
            <span v-if="isPro" class="text-xs bg-agro text-white px-2.5 py-1 rounded-full font-semibold">Ваш план</span>
          </div>
          <p class="text-2xl font-extrabold text-agro-dark mb-0.5">350 <span class="text-base font-semibold">грн/міс</span></p>
          <p class="text-agro-light text-xs mb-4">або <strong class="text-agro-dark">3 500 грн/рік</strong> — економія 700 грн</p>
          <ul class="space-y-2 mb-5">
            <li v-for="f in PRO_FEATURES" :key="f" class="flex items-start gap-2 text-sm text-agro-dark">
              <span class="text-amber-500 shrink-0 mt-0.5">★</span> {{ f }}
            </li>
          </ul>
          <button v-if="!isPro" @click="openPayment" class="btn-primary w-full py-2.5 justify-center">
            Перейти на PRO →
          </button>
          <button v-else disabled class="w-full py-2.5 rounded-xl border-2 border-agro text-agro font-semibold text-sm cursor-default">Активний</button>
        </div>
      </div>

      <!-- FAQ -->
      <div class="card">
        <p class="font-bold text-agro-dark mb-4">Часті питання</p>
        <div class="space-y-4">
          <div v-for="faq in FAQ" :key="faq.q">
            <p class="font-semibold text-agro-dark text-sm mb-1">{{ faq.q }}</p>
            <p class="text-sm text-agro-light">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Модалка оплати -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showPayment" class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background:rgba(0,0,0,0.45);" @click.self="showPayment = false">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
            </div>
            <h2 class="font-bold text-agro-dark text-xl mb-4 text-center">Оплата PRO агронома</h2>

            <!-- Вибір місяць/рік -->
            <div class="flex gap-2 mb-5">
              <button @click="period = 'month'"
                class="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors"
                :class="period === 'month' ? 'border-agro bg-agro text-white' : 'border-agro-border text-agro-dark'">
                1 місяць<br>
                <span class="text-xs font-normal opacity-80">350 грн</span>
              </button>
              <button @click="period = 'year'"
                class="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors relative"
                :class="period === 'year' ? 'border-agro bg-agro text-white' : 'border-agro-border text-agro-dark'">
                <span class="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-17%</span>
                1 рік<br>
                <span class="text-xs font-normal opacity-80">3 500 грн</span>
              </button>
            </div>

            <!-- Знижка за лояльність -->
            <div v-if="loyaltyDiscount > 0" class="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(22,163,74)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <div>
                <p class="text-sm font-semibold text-green-700">Знижка за лояльність {{ loyaltyDiscount }}%</p>
                <p class="text-xs text-green-600">Дякуємо що з нами! Ваша ціна зменшена автоматично.</p>
              </div>
            </div>

            <p class="text-xs text-agro-light mb-4 text-center">Безпечна оплата через <strong class="text-agro-dark">WayForPay</strong> — картки Visa / Mastercard</p>
            <div class="flex gap-3">
              <button @click="showPayment = false" class="btn-outline flex-1" :disabled="paying">Закрити</button>
              <button @click="submitPayment" :disabled="paying" class="btn-primary flex-1 justify-center disabled:opacity-60">
                <span v-if="paying" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {{ paying ? 'Перенаправляємо...' : 'Оплатити →' }}
              </button>
            </div>
            <p v-if="payError" class="text-xs text-red-500 mt-3 text-center">{{ payError }}</p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Підписка агронома' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)
const isPro = ref(false)
const expiresAt = ref<string | null>(null)
const showPayment = ref(false)
const period = ref<'month' | 'year'>('month')
const paying = ref(false)
const payError = ref('')
const loyaltyDiscount = ref(0)

const BASIC_FEATURES = [
  'Профіль у каталозі агрономів',
  'До 2 клієнтів',
  'Чати з фермерами',
  'AI агроном (10 запитів/міс, до 2 фото)',
]
const BASIC_NEGATIVE = [
  'Без автопідняття в пошуку',
  'Без виділення профілю',
]
const PRO_FEATURES = [
  'Необмежена кількість клієнтів',
  'AI агроном (500 запитів/міс + 60 фото)',
  'Автопідняття вгору кожні 5 днів',
  'Виділена картка профілю',
  'Пріоритетна підтримка',
]
const FAQ = [
  { q: 'Чи продовжується підписка автоматично?', a: 'Ні — ви платите вручну раз на місяць або рік.' },
  { q: 'Що буде після закінчення PRO?', a: 'Акаунт переходить на Базовий. Дані і клієнти залишаються.' },
  { q: 'Чи є знижки?', a: 'Так — з другого року -15%, з третього і далі -30% автоматично.' },
]

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const { data: sub } = await supabase.from('subscriptions').select('plan, expires_at, renewal_count').eq('user_id', uid).maybeSingle()
isPro.value = sub?.plan === 'pro' && new Date(sub?.expires_at) > new Date()
expiresAt.value = sub?.expires_at || null

const rc = sub?.renewal_count ?? 0
loyaltyDiscount.value = rc === 1 ? 15 : rc >= 2 ? 30 : 0

loading.value = false

function openPayment() {
  showPayment.value = true
}

const paymentPlan = computed(() => period.value === 'year' ? 'agronomist_pro_year' : 'agronomist_pro_month')

async function submitPayment() {
  paying.value = true
  payError.value = ''
  try {
    const token = session?.access_token
    if (!token) throw new Error('Не авторизовано')

    const res = await $fetch<{ ok: boolean; formData: Record<string, any>; endpoint: string; discountPercent: number }>('/api/payment/create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { plan: paymentPlan.value },
    })

    loyaltyDiscount.value = res.discountPercent || 0

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = res.endpoint
    form.style.display = 'none'

    for (const [key, val] of Object.entries(res.formData)) {
      if (Array.isArray(val)) {
        val.forEach(v => {
          const input = document.createElement('input')
          input.name = `${key}[]`
          input.value = String(v)
          form.appendChild(input)
        })
      } else if (typeof val === 'object' && val !== null) {
        const input = document.createElement('input')
        input.name = key
        input.value = JSON.stringify(val)
        form.appendChild(input)
      } else {
        const input = document.createElement('input')
        input.name = key
        input.value = String(val)
        form.appendChild(input)
      }
    }

    document.body.appendChild(form)
    form.submit()
  } catch (e: any) {
    payError.value = e?.data?.message || e?.message || 'Помилка оплати'
    paying.value = false
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
