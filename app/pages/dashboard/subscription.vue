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
      <div class="grid md:grid-cols-3 gap-4">
        <div class="card animate-pulse h-80"></div>
        <div class="card animate-pulse h-80"></div>
        <div class="card animate-pulse h-80"></div>
      </div>
    </div>

    <template v-else>

      <!-- Поточний план -->
      <div class="card mb-8 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center" :style="planIconBg">
          <svg v-if="currentPlan === 'basic'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/><path d="M12 14c0 0-3-1-4-4M12 14c0 0 3-1 4-4"/></svg>
          <svg v-else-if="currentPlan === 'business_pro'" width="22" height="22" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.4" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <div class="flex-1">
          <p class="text-xs text-agro-light uppercase tracking-wide">Поточний план</p>
          <p class="font-bold text-agro-dark text-lg">{{ PLAN_LABELS[currentPlan] || 'Basic' }}</p>
          <p v-if="expiresAt && currentPlan !== 'basic'" class="text-xs text-agro-light mt-0.5">Діє до {{ formatDate(expiresAt) }}</p>
        </div>
        <span v-if="currentPlan !== 'basic'" class="px-3 py-1 bg-agro text-white rounded-full text-xs font-bold">Активний</span>
      </div>

      <!-- Плани — сітка 3 колонки -->
      <div class="grid md:grid-cols-3 gap-4 mb-8">

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
          <ul class="space-y-2 mb-5">
            <li v-for="f in BASIC_DISABLED" :key="f" class="flex items-start gap-2 text-sm text-agro-light line-through">
              <span class="shrink-0 mt-0.5">✕</span> {{ f }}
            </li>
          </ul>
          <button disabled class="w-full py-2.5 rounded-xl border-2 border-agro-border text-agro-light font-semibold text-sm cursor-default">
            {{ currentPlan === 'basic' ? 'Поточний план' : 'Basic' }}
          </button>
        </div>

        <!-- Бізнес -->
        <div class="card border-2 relative overflow-hidden" :class="currentPlan === 'business' ? 'border-agro' : 'border-agro-border'">
          <div class="flex justify-end mb-2">
            <span class="bg-agro text-white text-xs font-bold px-2.5 py-1 rounded-full">ПОПУЛЯРНИЙ</span>
          </div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-agro-dark text-lg flex items-center gap-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Бізнес
            </h2>
            <span v-if="currentPlan === 'business'" class="text-xs bg-agro text-white px-2.5 py-1 rounded-full font-semibold">Ваш план</span>
          </div>
          <p class="text-2xl font-extrabold text-agro-dark mb-0.5">299 <span class="text-base font-semibold">грн</span></p>
          <p class="text-agro-light text-xs mb-4">+ 10 грн/га · 2–50 га · / місяць</p>
          <ul class="space-y-2 mb-5">
            <li v-for="f in BUSINESS_FEATURES" :key="f" class="flex items-start gap-2 text-sm text-agro-dark">
              <span class="text-agro shrink-0 mt-0.5">✓</span> {{ f }}
            </li>
          </ul>
          <button v-if="currentPlan !== 'business'" @click="openPayment('business')" class="btn-primary w-full py-2.5 justify-center">
            Перейти на Бізнес →
          </button>
          <button v-else disabled class="w-full py-2.5 rounded-xl border-2 border-agro text-agro font-semibold text-sm cursor-default">Активний</button>
        </div>

        <!-- Бізнес Про -->
        <div class="card border-2" :class="currentPlan === 'business_pro' ? 'border-amber-400' : 'border-agro-border'" style="background: linear-gradient(135deg, #fffbf0 0%, #fff 100%);">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-agro-dark text-lg flex items-center gap-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.4" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Бізнес Про
            </h2>
            <span v-if="currentPlan === 'business_pro'" class="text-xs bg-amber-400 text-white px-2.5 py-1 rounded-full font-semibold">Ваш план</span>
          </div>
          <p class="text-2xl font-extrabold text-amber-600 mb-0.5">599 <span class="text-base font-semibold">грн</span></p>
          <p class="text-agro-light text-xs mb-4">+ 15 грн/га · 50+ га · / місяць</p>
          <ul class="space-y-2 mb-5">
            <li v-for="f in BUSINESS_PRO_FEATURES" :key="f" class="flex items-start gap-2 text-sm text-agro-dark">
              <span class="text-amber-500 shrink-0 mt-0.5">✓</span> {{ f }}
            </li>
          </ul>
          <button v-if="currentPlan !== 'business_pro'" @click="openPayment('business_pro')" class="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors">
            Перейти на Бізнес Про →
          </button>
          <button v-else disabled class="w-full py-2.5 rounded-xl border-2 border-amber-400 text-amber-600 font-semibold text-sm cursor-default">Активний</button>
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
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 p-8 text-center">
            <div class="w-14 h-14 rounded-2xl bg-agro-hover flex items-center justify-center mx-auto mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
            </div>
            <h2 class="font-bold text-agro-dark text-xl mb-4">Оплата {{ PLAN_LABELS[selectedPlan] }}</h2>

            <!-- Кількість га -->
            <div class="mb-5 text-left">
              <label class="block text-sm font-medium text-agro-dark mb-1">Скільки у вас га?</label>
              <input v-model.number="hectares" type="number" min="1" step="1" class="input text-center font-semibold text-lg" placeholder="10" />
              <p v-if="hectaresError" class="text-xs text-red-500 mt-1">{{ hectaresError }}</p>
            </div>

            <!-- Розрахунок ціни -->
            <div v-if="hectares > 0" class="bg-agro-hover rounded-xl p-4 mb-5 text-left">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-agro-light">Базова ставка</span>
                <span class="font-medium text-agro-dark">{{ selectedPlan === 'business' ? '299' : '599' }} грн</span>
              </div>
              <div class="flex justify-between text-sm mb-2">
                <span class="text-agro-light">{{ hectares }} га × {{ selectedPlan === 'business' ? '10' : '15' }} грн</span>
                <span class="font-medium text-agro-dark">{{ (hectares * (selectedPlan === 'business' ? 10 : 15)).toLocaleString('uk-UA') }} грн</span>
              </div>
              <div class="border-t border-agro-border pt-2 flex justify-between">
                <span class="font-bold text-agro-dark">До сплати / місяць</span>
                <span class="font-extrabold text-agro text-lg">{{ calculatedPrice.toLocaleString('uk-UA') }} грн</span>
              </div>
            </div>

            <!-- Купон -->
            <div class="mb-4">
              <div class="flex gap-2">
                <input v-model="couponCode" type="text" class="input text-sm flex-1 font-mono uppercase" placeholder="Є купон на знижку?"
                  @input="couponCode = couponCode.toUpperCase(); couponResult = null" :disabled="couponChecking" />
                <button @click="checkCoupon" :disabled="!couponCode.trim() || couponChecking"
                  class="shrink-0 text-xs font-semibold text-agro border border-agro-border rounded-xl px-3 hover:bg-agro-bg transition-colors disabled:opacity-40">
                  {{ couponChecking ? '...' : 'Застосувати' }}
                </button>
              </div>
              <p v-if="couponResult === 'ok'" class="text-xs text-green-600 font-semibold mt-1.5">✓ Купон застосовано — знижка {{ couponDiscount }}%</p>
              <p v-else-if="couponResult === 'invalid'" class="text-xs text-red-500 mt-1.5">Купон недійсний або вже використаний</p>
            </div>

            <!-- Знижка за лояльністю -->
            <div v-if="loyaltyDiscount > 0 && couponResult !== 'ok'" class="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(22,163,74)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <div>
                <p class="text-sm font-semibold text-green-700">Знижка за лояльність {{ loyaltyDiscount }}%</p>
                <p class="text-xs text-green-600">Дякуємо що з нами! Ваша ціна зменшена автоматично.</p>
              </div>
            </div>

            <!-- Фінальна ціна зі знижкою -->
            <div v-if="effectiveDiscount > 0 && hectares > 0" class="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-center">
              <p class="text-xs text-agro-light mb-0.5">До сплати зі знижкою {{ effectiveDiscount }}%</p>
              <p class="text-xl font-bold text-agro-dark">{{ Math.round(calculatedPrice * (1 - effectiveDiscount / 100)).toLocaleString('uk-UA') }} грн</p>
              <p class="text-xs text-agro-light line-through">{{ calculatedPrice.toLocaleString('uk-UA') }} грн</p>
            </div>

            <p class="text-xs text-agro-light mb-4">Безпечна оплата через <strong class="text-agro-dark">WayForPay</strong> — картки Visa / Mastercard</p>
            <div class="flex gap-3">
              <button @click="showPayment = false" class="btn-outline flex-1" :disabled="paying">Закрити</button>
              <button @click="submitPayment" :disabled="paying || hectares < 1" class="btn-primary flex-1 justify-center disabled:opacity-60">
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
const selectedPlan = ref('business')
const loading = ref(true)
const currentPlan = ref('basic')
const expiresAt = ref<string | null>(null)
const loyaltyDiscount = ref(0)
const hectares = ref(0)
const hectaresError = ref('')

const PLAN_LABELS: Record<string, string> = {
  basic:        'Basic',
  business:     'Бізнес',
  business_pro: 'Бізнес Про',
}

const planIconBg = computed(() => {
  if (currentPlan.value === 'business_pro') return 'background: #fff8e6'
  return 'background: rgb(238,241,227)'
})

const BASIC_FEATURES = [
  'До 2 га полів',
  '1 культура',
  '1 технологічна карта',
  'Склад',
  'Нагадування',
  'Чати',
  'Угоди з агрономом',
  'Угоди із заготівельником',
]

const BASIC_DISABLED = [
  'AI агроном',
  'Аналітика',
  'Співробітники',
  'Інтеграції',
]

const BUSINESS_FEATURES = [
  'Все що в Basic',
  'Поля — необмежено (2–50 га)',
  'Культури — необмежено',
  '1 технологічна карта на культуру',
  'AI агроном — повний доступ',
  'Аналітика',
  'Співробітники — до 5 осіб',
]

const BUSINESS_PRO_FEATURES = [
  'Все що в Бізнес',
  'Поля — необмежено (50+ га)',
  'Все необмежено',
  'Інтеграції',
  'Пріоритетна підтримка',
]

const FAQ = [
  { q: 'Як розраховується ціна?', a: 'Базова ставка + кількість га × ставка за га. Бізнес: 299 + 10 грн/га. Бізнес Про: 599 + 15 грн/га.' },
  { q: 'Чи можна скасувати підписку?', a: 'Так, підписка не продовжується автоматично. Ви платите раз на місяць або рік.' },
  { q: 'Що буде після закінчення плану?', a: 'Ваші дані збережуться, але доступ до платних функцій буде обмежено до Basic.' },
  { q: 'Як відбувається оплата?', a: 'Оплата через WayForPay — безпечний український платіжний сервіс.' },
  { q: 'Що таке Бізнес Про?', a: 'Для господарств 50+ га — всі функції без обмежень, інтеграції та пріоритетна підтримка.' },
]

const paying = ref(false)
const payError = ref('')
const couponCode = ref('')
const couponResult = ref<'ok' | 'invalid' | null>(null)
const couponDiscount = ref(0)
const couponChecking = ref(false)

const BASE_RATE: Record<string, number> = {
  business:     299,
  business_pro: 599,
}
const HA_RATE: Record<string, number> = {
  business:     10,
  business_pro: 15,
}

const calculatedPrice = computed(() => {
  const base = BASE_RATE[selectedPlan.value] ?? 0
  const rate = HA_RATE[selectedPlan.value] ?? 0
  return base + (hectares.value > 0 ? hectares.value * rate : 0)
})

const effectiveDiscount = computed(() => couponResult.value === 'ok' ? couponDiscount.value : loyaltyDiscount.value)

async function loadLoyaltyDiscount() {
  try {
    const { data: sub } = await supabase.from('subscriptions').select('renewal_count').eq('user_id', (await supabase.auth.getSession()).data.session?.user.id || '').maybeSingle()
    const rc = sub?.renewal_count ?? 0
    loyaltyDiscount.value = rc === 1 ? 15 : rc >= 2 ? 30 : 0
  } catch { loyaltyDiscount.value = 0 }
}

function openPayment(plan: string) {
  selectedPlan.value = plan
  hectares.value = 0
  hectaresError.value = ''
  payError.value = ''
  couponCode.value = ''
  couponResult.value = null
  couponDiscount.value = 0
  showPayment.value = true
  loadLoyaltyDiscount()
}

async function checkCoupon() {
  if (!couponCode.value.trim()) return
  couponChecking.value = true
  couponResult.value = null
  const { data: { session: sess } } = await supabase.auth.getSession()
  const { data } = await supabase.from('coupons')
    .select('id, discount_percent, is_used, expires_at')
    .eq('code', couponCode.value.trim().toUpperCase())
    .eq('user_id', sess?.user?.id)
    .maybeSingle()
  if (data && !data.is_used && (!data.expires_at || new Date(data.expires_at) > new Date())) {
    couponResult.value = 'ok'
    couponDiscount.value = data.discount_percent
  } else {
    couponResult.value = 'invalid'
    couponDiscount.value = 0
  }
  couponChecking.value = false
}

async function submitPayment() {
  hectaresError.value = ''
  if (!hectares.value || hectares.value < 1) {
    hectaresError.value = 'Вкажіть кількість га'
    return
  }
  paying.value = true
  payError.value = ''
  try {
    const { data: { session: sess } } = await supabase.auth.getSession()
    const token = sess?.access_token
    if (!token) throw new Error('Не авторизовано')

    const res = await $fetch<{ ok: boolean; formData: Record<string, any>; endpoint: string; discountPercent: number }>('/api/payment/create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        plan: selectedPlan.value,
        hectares: hectares.value,
        couponCode: couponResult.value === 'ok' ? couponCode.value.trim().toUpperCase() : undefined,
      },
    })
    loyaltyDiscount.value = res.discountPercent || 0

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = res.endpoint
    form.style.display = 'none'

    for (const [key, val] of Object.entries(res.formData)) {
      if (Array.isArray(val)) {
        val.forEach((v) => {
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
  const isActive = !sub.expires_at || new Date(sub.expires_at) > new Date()
  currentPlan.value = isActive ? (sub.plan || 'basic') : 'basic'
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
