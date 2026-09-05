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
        <p class="dash-subtitle">Управління планом та платежами</p>
      </div>
    </div>

    <!-- Скелетон -->
    <div v-if="loading" class="space-y-4 mb-8">
      <div class="card animate-pulse h-20"></div>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="card animate-pulse h-72"></div>
        <div class="card animate-pulse h-72"></div>
        <div class="card animate-pulse h-72"></div>
        <div class="card animate-pulse h-72"></div>
      </div>
    </div>

    <template v-else>

      <!-- Поточний план -->
      <div class="card mb-8 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center" :style="planIconBg">
          <svg v-if="currentPlan === 'basic'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/><path d="M12 14c0 0-3-1-4-4M12 14c0 0 3-1 4-4"/></svg>
          <svg v-else-if="currentPlan === 'custom'" width="22" height="22" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.4" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <div class="flex-1">
          <p class="text-xs text-agro-light uppercase tracking-wide">Поточний план</p>
          <p class="font-bold text-agro-dark text-lg">{{ PLAN_LABELS[currentPlan] || 'Базовий' }}</p>
          <p v-if="expiresAt" class="text-xs text-agro-light mt-0.5">Діє до {{ formatDate(expiresAt) }}</p>
        </div>
        <span v-if="currentPlan !== 'basic'" class="px-3 py-1 bg-agro text-white rounded-full text-xs font-bold">Активний</span>
      </div>

      <!-- Плани — сітка 2x2 + custom -->
      <div class="grid md:grid-cols-2 gap-4 mb-8">

        <!-- Basic -->
        <div class="card border-2" :class="currentPlan === 'basic' ? 'border-agro' : 'border-agro-border'">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-agro-dark text-lg flex items-center gap-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/><path d="M12 14c0 0-3-1-4-4M12 14c0 0 3-1 4-4"/></svg>
              Basic
            </h2>
            <span v-if="currentPlan === 'basic'" class="text-xs bg-agro text-white px-2.5 py-1 rounded-full font-semibold">Ваш план</span>
          </div>
          <p class="text-2xl font-extrabold text-agro-dark mb-0.5">Безкоштовно</p>
          <p class="text-agro-light text-xs mb-4">до 2 га · назавжди</p>
          <ul class="space-y-2 mb-5">
            <li v-for="f in BASIC_FEATURES" :key="f" class="flex items-start gap-2 text-sm text-agro-dark">
              <span class="text-agro shrink-0 mt-0.5">✓</span> {{ f }}
            </li>
          </ul>
          <button disabled class="w-full py-2.5 rounded-xl border-2 border-agro-border text-agro-light font-semibold text-sm cursor-default">
            {{ currentPlan === 'basic' ? 'Поточний план' : 'Basic' }}
          </button>
        </div>

        <!-- PRO -->
        <div class="card border-2 relative overflow-hidden" :class="currentPlan === 'pro' ? 'border-agro' : 'border-agro-border'">
          <div class="absolute top-4 right-4 bg-agro text-white text-xs font-bold px-2.5 py-1 rounded-full">ПОПУЛЯРНИЙ</div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-agro-dark text-lg flex items-center gap-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              PRO
            </h2>
            <span v-if="currentPlan === 'pro'" class="text-xs bg-agro text-white px-2.5 py-1 rounded-full font-semibold">Ваш план</span>
          </div>
          <p class="text-2xl font-extrabold text-agro-dark mb-0.5">1 000 <span class="text-base font-semibold">грн</span></p>
          <p class="text-agro-light text-xs mb-1">до 50 га · / місяць</p>
          <p class="text-agro-light text-xs mb-4">або <strong class="text-agro-dark">10 000 грн / рік</strong></p>
          <ul class="space-y-2 mb-5">
            <li v-for="f in PRO_FEATURES" :key="f" class="flex items-start gap-2 text-sm text-agro-dark">
              <span class="text-agro shrink-0 mt-0.5">✓</span> {{ f }}
            </li>
          </ul>
          <button v-if="currentPlan !== 'pro'" @click="openPayment('pro')" class="btn-primary w-full py-2.5 justify-center">
            Перейти на PRO →
          </button>
          <button v-else disabled class="w-full py-2.5 rounded-xl border-2 border-agro text-agro font-semibold text-sm cursor-default">Активний</button>
        </div>

        <!-- Business -->
        <div class="card border-2" :class="currentPlan === 'business' ? 'border-agro' : 'border-agro-border'">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-agro-dark text-lg flex items-center gap-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Business
            </h2>
            <span v-if="currentPlan === 'business'" class="text-xs bg-agro text-white px-2.5 py-1 rounded-full font-semibold">Ваш план</span>
          </div>
          <p class="text-2xl font-extrabold text-agro-dark mb-0.5">2 000 <span class="text-base font-semibold">грн</span></p>
          <p class="text-agro-light text-xs mb-1">до 200 га · / місяць</p>
          <p class="text-agro-light text-xs mb-4">або <strong class="text-agro-dark">20 000 грн / рік</strong></p>
          <ul class="space-y-2 mb-5">
            <li v-for="f in BUSINESS_FEATURES" :key="f" class="flex items-start gap-2 text-sm text-agro-dark">
              <span class="text-agro shrink-0 mt-0.5">✓</span> {{ f }}
            </li>
          </ul>
          <button v-if="currentPlan !== 'business'" @click="openPayment('business')" class="btn-primary w-full py-2.5 justify-center">
            Перейти на Business →
          </button>
          <button v-else disabled class="w-full py-2.5 rounded-xl border-2 border-agro text-agro font-semibold text-sm cursor-default">Активний</button>
        </div>

        <!-- Custom -->
        <div class="card border-2" :class="currentPlan === 'custom' ? 'border-amber-400' : 'border-agro-border'" style="background: linear-gradient(135deg, #fffbf0 0%, #fff 100%);">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-agro-dark text-lg flex items-center gap-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.4" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Custom
            </h2>
            <span v-if="currentPlan === 'custom'" class="text-xs bg-amber-400 text-white px-2.5 py-1 rounded-full font-semibold">Ваш план</span>
          </div>
          <p class="text-2xl font-extrabold text-amber-600 mb-0.5">Індивідуально</p>
          <p class="text-agro-light text-xs mb-4">від 200 га · узгоджується</p>
          <ul class="space-y-2 mb-5">
            <li v-for="f in CUSTOM_FEATURES" :key="f" class="flex items-start gap-2 text-sm text-agro-dark">
              <span class="text-amber-500 shrink-0 mt-0.5">✓</span> {{ f }}
            </li>
          </ul>
          <a href="mailto:sales@agroporadnyk.ua" class="btn-outline w-full py-2.5 text-center block text-sm font-semibold">
            Зв'язатися з нами →
          </a>
        </div>

      </div>

      <!-- FAQ -->
      <div class="card">
        <h2 class="font-bold text-agro-dark mb-4 flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
          Питання та відповіді
        </h2>
        <div class="space-y-4">
          <div v-for="q in FAQ" :key="q.q">
            <p class="font-medium text-agro-dark text-sm">{{ q.q }}</p>
            <p class="text-agro-light text-sm mt-1">{{ q.a }}</p>
          </div>
        </div>
      </div>

    </template>

    <!-- Модалка оплати -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showPayment" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showPayment = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-8 text-center">
            <div class="w-14 h-14 rounded-2xl bg-agro-hover flex items-center justify-center mx-auto mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
            </div>
            <h2 class="font-bold text-agro-dark text-xl mb-4">Оплата {{ PLAN_LABELS[selectedPlan] }}</h2>

            <!-- Вибір місяць/рік для PRO або Business -->
            <div v-if="selectedPlan === 'pro' || selectedPlan === 'business'" class="flex gap-2 mb-5">
              <button @click="proPeriod = 'month'"
                class="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors"
                :class="proPeriod === 'month' ? 'border-agro bg-agro text-white' : 'border-agro-border text-agro-dark'">
                1 місяць<br>
                <span class="text-xs font-normal opacity-80">{{ selectedPlan === 'pro' ? '1 000' : '2 000' }} грн</span>
              </button>
              <button @click="proPeriod = 'year'"
                class="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors relative"
                :class="proPeriod === 'year' ? 'border-agro bg-agro text-white' : 'border-agro-border text-agro-dark'">
                <span class="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-17%</span>
                1 рік<br>
                <span class="text-xs font-normal opacity-80">{{ selectedPlan === 'pro' ? '10 000' : '20 000' }} грн</span>
              </button>
            </div>

            <div class="bg-agro-bg rounded-xl p-4 mb-6 text-left space-y-1.5">
              <p class="text-sm text-agro-dark font-medium mb-2">Що входить:</p>
              <p v-for="f in selectedFeatures" :key="f" class="text-xs text-agro-light">✓ {{ f }}</p>
            </div>
            <p class="text-xs text-agro-light mb-4">Безпечна оплата через <strong class="text-agro-dark">WayForPay</strong> — картки Visa / Mastercard</p>
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
useHead({ title: 'Підписка' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const showPayment = ref(false)
const selectedPlan = ref('pro')
const loading = ref(true)
const currentPlan = ref('basic')
const expiresAt = ref<string | null>(null)

const PLAN_LABELS: Record<string, string> = {
  basic:    'Basic',
  pro:      'PRO',
  business: 'Business',
  custom:   'Custom',
}

const PLAN_PRICES: Record<string, string> = {
  pro:              '1 000 грн / місяць або 10 000 грн / рік',
  pro_month:        '1 000 грн / місяць',
  pro_year:         '10 000 грн / рік',
  business:         '2 000 грн / місяць або 20 000 грн / рік',
  business_month:   '2 000 грн / місяць',
  business_year:    '20 000 грн / рік',
}

const planIconBg = computed(() => {
  if (currentPlan.value === 'custom') return 'background: #fff8e6'
  return 'background: rgb(238,241,227)'
})

const BASIC_FEATURES = [
  'До 2 га полів',
  '1 культура на поле',
  'Технічна карта',
  'AI агроном (10 запитів/міс, до 2 фото/міс)',
  'Нагадування, склад, аналітика',
  'Пошук агрономів і угоди',
  'Каталог препаратів та добрив',
]

const PRO_FEATURES = [
  'До 50 га полів',
  'Необмежена кількість культур на поле',
  'Технічна карта для всіх культур',
  'AI агроном (500 запитів/міс, 60 фото/міс)',
  'Співробітники — до 2 осіб',
  'PDF / Excel звіти',
  'Знижка 5% на товари (незабаром)',
  'Пріоритетна підтримка',
]

const BUSINESS_FEATURES = [
  'До 200 га полів',
  'Всі функції PRO',
  'AI агроном (3000 запитів/міс, 300 фото/міс)',
  'Співробітники — до 5 осіб',
  'Пріоритетна підтримка',
]

const CUSTOM_FEATURES = [
  'Від 200 га — необмежено',
  'Всі функції Business',
  'Особистий менеджер',
  'Співробітники — необмежено',
  'Інтеграція з 1С / ERP',
  'SLA — відповідь до 2 год',
]

const FEATURES_MAP: Record<string, string[]> = {
  pro:      PRO_FEATURES,
  business: BUSINESS_FEATURES,
}

const selectedFeatures = computed(() => FEATURES_MAP[selectedPlan.value] || [])

const FAQ = [
  { q: 'Чи можна скасувати підписку?', a: 'Так, підписка не продовжується автоматично. Ви платите раз на рік.' },
  { q: 'Що буде після закінчення плану?', a: 'Ваші дані збережуться, але доступ до платних функцій буде обмежено до Basic.' },
  { q: 'Як відбувається оплата?', a: 'Оплата через WayForPay — безпечний український платіжний сервіс.' },
  { q: 'Як перейти на Custom?', a: 'Напишіть нам на sales@agroporadnyk.ua — підберемо умови індивідуально.' },
]

const paying = ref(false)
const payError = ref('')
const proPeriod = ref<'month' | 'year'>('month')

function openPayment(plan: string) {
  selectedPlan.value = plan
  proPeriod.value = 'month'
  payError.value = ''
  showPayment.value = true
}

// Реальний план для WFP
const paymentPlan = computed(() => {
  if (selectedPlan.value === 'pro')       return proPeriod.value === 'year' ? 'pro_year'      : 'pro_month'
  if (selectedPlan.value === 'business')  return proPeriod.value === 'year' ? 'business_year' : 'business_month'
  return selectedPlan.value
})

async function submitPayment() {
  paying.value = true
  payError.value = ''
  try {
    const { data: { session: s } } = await supabase.auth.getSession()
    const token = s?.access_token
    if (!token) throw new Error('Не авторизовано')

    const res = await $fetch<{ ok: boolean; formData: Record<string, any>; endpoint: string }>('/api/payment/create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { plan: paymentPlan.value },
    })

    // Формуємо HTML форму і відправляємо на WFP
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = res.endpoint
    form.style.display = 'none'

    for (const [key, val] of Object.entries(res.formData)) {
      if (Array.isArray(val)) {
        val.forEach((v, i) => {
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
    payError.value = e?.data?.message || 'Помилка. Спробуйте ще раз.'
    paying.value = false
  }
}

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const { data: sub } = await supabase.from('subscriptions')
  .select('plan, expires_at').eq('user_id', uid).maybeSingle()

if (sub) {
  currentPlan.value = sub.plan || 'basic'
  expiresAt.value = sub.expires_at || null
}
loading.value = false

const formatDate = (d: string) => d
  ? new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
  : ''
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.bitter { font-family: 'Bitter', Georgia, serif; }
</style>
