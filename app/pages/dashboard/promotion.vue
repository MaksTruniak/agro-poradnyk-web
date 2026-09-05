<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2.5l2.4 6.3 6.7.5-5.1 4.4 1.6 6.5L12 16.8 6.4 20.2 8 13.7 2.9 9.3l6.7-.5L12 2.5z"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Просування</h1>
        <p class="dash-subtitle">Рекламні можливості</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="card animate-pulse h-20"></div>
      <div class="card animate-pulse h-48"></div>
      <div class="card animate-pulse h-48"></div>
    </div>

    <template v-else>
      <!-- Поточний план -->
      <div class="card mb-6 flex items-center justify-between">
        <div>
          <p class="text-xs text-agro-light uppercase tracking-wide mb-1">Ваш поточний план</p>
          <p class="font-bold text-agro-dark text-lg">{{ isPro ? 'PRO' : 'Базовий' }}</p>
        </div>
        <span class="px-4 py-1.5 rounded-full text-sm font-bold" :class="isPro ? 'bg-agro text-white' : 'bg-agro-hover text-agro'">Активний</span>
      </div>

      <!-- Статус бусту (тільки для PRO агронома) -->
      <div v-if="isPro && !isSeller" class="card mb-6">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :class="boostStatus === 'available' ? 'bg-agro-hover' : 'bg-gray-100'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="boostStatus === 'available' ? 'rgb(47,82,51)' : 'rgb(150,150,150)'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-agro-dark text-sm">Автопідняття профілю</p>
            <p v-if="boostStatus === 'available'" class="text-xs text-agro mt-0.5">Готово до підняття — натисніть кнопку</p>
            <p v-else-if="nextBoostAt" class="text-xs text-agro-light mt-0.5">Наступне підняття: {{ formatDate(nextBoostAt) }}</p>
            <p v-else class="text-xs text-agro-light mt-0.5">Перевіряємо статус...</p>
          </div>
          <button
            v-if="boostStatus === 'available'"
            @click="doBoost"
            :disabled="boosting"
            class="btn-primary text-sm px-4 py-2 shrink-0"
          >{{ boosting ? '...' : 'Підняти' }}</button>
          <span v-else class="text-xs text-agro-light shrink-0 pt-1">{{ daysUntilBoost }} дн.</span>
        </div>
        <div v-if="boostDone" class="mt-3 bg-agro-hover rounded-xl px-4 py-2.5 text-sm text-agro font-medium flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Профіль піднято вгору списку!
        </div>
      </div>

      <!-- Плани для агронома -->
      <template v-if="!isSeller">
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Базовий -->
          <div class="card border-2" :class="!isPro ? 'border-agro' : 'border-agro-border'">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="font-bold text-agro-dark text-xl">Базовий</h2>
                <p class="text-agro-light text-sm mt-0.5">Безкоштовно</p>
              </div>
              <span v-if="!isPro" class="text-xs bg-agro-hover text-agro px-3 py-1 rounded-full font-semibold">Ваш план</span>
            </div>
            <ul class="space-y-2.5">
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Профіль у каталозі агрономів</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> До 2 клієнтів</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> AI агроном (10 запитів/міс, до 2 фото/міс)</li>
              <li class="flex items-center gap-2 text-sm text-gray-400"><span>✗</span> Без автопідняття</li>
              <li class="flex items-center gap-2 text-sm text-gray-400"><span>✗</span> Без виділення профілю</li>
            </ul>
          </div>

          <!-- PRO -->
          <div class="card border-2 relative overflow-hidden" :class="isPro ? 'border-agro' : 'border-agro-border'">
            <div class="absolute top-4 right-4 bg-agro text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              PRO
            </div>
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="font-bold text-agro-dark text-xl">PRO</h2>
                <p class="text-agro font-semibold text-sm mt-0.5">500 грн / рік</p>
              </div>
              <span v-if="isPro" class="text-xs bg-agro text-white px-3 py-1 rounded-full font-semibold">Активний</span>
            </div>
            <ul class="space-y-2.5 mb-5">
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Необмежена кількість клієнтів</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> AI агроном (500 запитів/міс + 60 фото/міс)</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Автопідняття вгору кожні 5 днів</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Виділена картка профілю</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Пріоритетна підтримка</li>
            </ul>
            <NuxtLink v-if="!isPro" to="/dashboard/subscription" class="btn-primary w-full py-3 justify-center">Перейти на PRO →</NuxtLink>
            <button v-else disabled class="w-full py-3 rounded-xl border-2 border-agro text-agro font-semibold text-sm cursor-default">Активний</button>
          </div>
        </div>
      </template>

      <!-- Плани для продавця -->
      <template v-else>
        <div class="space-y-4">
          <div class="card border-2" :class="currentPlan === 'basic' ? 'border-agro' : 'border-agro-border'">
            <div class="flex items-center gap-4 mb-4">
              <span class="text-4xl">🌱</span>
              <div class="flex-1">
                <p class="font-bold text-agro-dark text-lg">Базовий</p>
                <p class="text-agro-light text-sm">Безкоштовно</p>
              </div>
              <span v-if="currentPlan === 'basic'" class="text-xs bg-agro-hover text-agro px-3 py-1 rounded-full font-semibold">Активний</span>
            </div>
            <ul class="space-y-2">
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Магазин у каталозі</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> До 20 товарів</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Чати з покупцями</li>
              <li class="flex items-center gap-2 text-sm text-gray-400"><span>✗</span> В кінці каталогу</li>
              <li class="flex items-center gap-2 text-sm text-gray-400"><span>✗</span> Без бейджу "Перевірений"</li>
              <li class="flex items-center gap-2 text-sm text-gray-400"><span>✗</span> Без пріоритетної підтримки</li>
            </ul>
          </div>

          <div class="card border-2 relative overflow-hidden" :class="currentPlan === 'top' ? 'border-agro' : 'border-agro-border'">
            <div class="absolute top-4 right-4 bg-agro text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Найпопулярніший</div>
            <div class="flex items-center gap-4 mb-4">
              <span class="text-4xl">🚀</span>
              <div class="flex-1">
                <p class="font-bold text-agro-dark text-lg">Топ продавець</p>
                <p class="text-agro font-semibold text-sm">499 грн / міс</p>
              </div>
              <span v-if="currentPlan === 'top'" class="text-xs bg-agro text-white px-3 py-1 rounded-full font-semibold">Активний</span>
            </div>
            <ul class="space-y-2 mb-5">
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Необмежена кількість товарів</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Завжди вгорі каталогу</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Бейдж "Перевірений продавець"</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Виділена картка магазину</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Пріоритетна підтримка</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Аналітика переглядів товарів</li>
            </ul>
            <button v-if="currentPlan !== 'top'" @click="showPayment = true" class="btn-primary w-full py-3">Підключити Топ →</button>
            <button v-else disabled class="w-full py-3 rounded-xl border-2 border-agro text-agro font-semibold text-sm cursor-default">Активний</button>
          </div>
        </div>
      </template>
    </template>

    <!-- Модалка оплати -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showPayment" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showPayment = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-8 text-center">
            <p class="mb-4 flex justify-center"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></p>
            <h2 class="font-bold text-agro-dark text-xl mb-2">{{ isSeller ? 'Підключити Топ продавця' : 'Підключити Топ' }}</h2>
            <p class="text-agro-light text-sm mb-4">{{ isSeller ? '499 грн / місяць' : '299 грн / місяць' }} — ваш профіль завжди вгорі</p>
            <p class="text-xs text-agro-light mb-6">Безпечна оплата через <strong class="text-agro-dark">WayForPay</strong></p>
            <div class="flex gap-3">
              <button @click="showPayment = false" class="btn-outline flex-1" :disabled="paying">Закрити</button>
              <button @click="submitTopPayment" :disabled="paying" class="btn-primary flex-1 justify-center disabled:opacity-60">
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
useHead({ title: 'Просування' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)
const currentPlan = ref('basic')
const isPro = ref(false)
const showPayment = ref(false)
const paying = ref(false)
const payError = ref('')

const boosting = ref(false)
const boostDone = ref(false)
const boostStatus = ref<'available' | 'too_soon' | null>(null)
const nextBoostAt = ref<string | null>(null)

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const [userRes, subRes] = await Promise.all([
  supabase.from('users').select('role').eq('id', uid).single(),
  supabase.from('subscriptions').select('plan, expires_at').eq('user_id', uid).maybeSingle(),
])

const isSeller = userRes.data?.role === 'seller'

if (subRes.data?.plan === 'pro') {
  const exp = subRes.data.expires_at
  isPro.value = !exp || new Date(exp) > new Date()
}

if (isSeller) {
  const { data } = await supabase.from('seller_profiles').select('promotion_plan').eq('user_id', uid).maybeSingle()
  if (data) currentPlan.value = data.promotion_plan || 'basic'
} else {
  const { data } = await supabase.from('agronomist_profiles').select('promotion_plan, boosted_at').eq('user_id', uid).maybeSingle()
  if (data) {
    currentPlan.value = data.promotion_plan || 'basic'
    if (isPro.value) {
      const lastBoost = data.boosted_at ? new Date(data.boosted_at) : null
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      if (!lastBoost || lastBoost < fiveDaysAgo) {
        boostStatus.value = 'available'
      } else {
        boostStatus.value = 'too_soon'
        nextBoostAt.value = new Date(lastBoost.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  }
}

loading.value = false

const daysUntilBoost = computed(() => {
  if (!nextBoostAt.value) return ''
  const diff = new Date(nextBoostAt.value).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const doBoost = async () => {
  boosting.value = true
  try {
    const now = new Date().toISOString()
    await supabase
      .from('agronomist_profiles')
      .update({ boosted_at: now, is_highlighted: true })
      .eq('user_id', uid)
    boostStatus.value = 'too_soon'
    nextBoostAt.value = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    boostDone.value = true
    setTimeout(() => boostDone.value = false, 4000)
  } finally {
    boosting.value = false
  }
}

async function submitTopPayment() {
  paying.value = true
  payError.value = ''
  try {
    const { data: { session: s } } = await supabase.auth.getSession()
    const token = s?.access_token
    if (!token) throw new Error('Не авторизовано')

    const plan = isSeller ? 'top_seller' : 'top_agronomist'
    const res = await $fetch<{ ok: boolean; formData: Record<string, any>; endpoint: string }>('/api/payment/create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { plan },
    })

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
    payError.value = e?.data?.message || 'Помилка. Спробуйте ще раз.'
    paying.value = false
  }
}

const formatDate = (d: string) => d
  ? new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
  : ''
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.bitter { font-family: 'Bitter', Georgia, serif; }
</style>
