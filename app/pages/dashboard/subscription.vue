<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-extrabold text-agro-dark">💎 Підписка</h1>
      <p class="text-agro-light mt-1">Оберіть план що підходить вам</p>
    </div>

    <!-- Скелетон -->
    <div v-if="loading" class="space-y-4 mb-8">
      <div class="card animate-pulse h-20"></div>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="card animate-pulse h-64"></div>
        <div class="card animate-pulse h-64"></div>
      </div>
    </div>

    <template v-else>
    <!-- Поточний план -->
    <div class="card mb-8 flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl bg-agro-hover flex items-center justify-center text-2xl">
        {{ currentPlan === 'pro' ? '⭐' : '🌱' }}
      </div>
      <div class="flex-1">
        <p class="text-xs text-agro-light uppercase tracking-wide">Поточний план</p>
        <p class="font-bold text-agro-dark text-lg">{{ currentPlan === 'pro' ? 'PRO' : 'Базовий' }}</p>
        <p v-if="expiresAt" class="text-xs text-agro-light mt-0.5">Діє до {{ formatDate(expiresAt) }}</p>
      </div>
      <span v-if="currentPlan === 'pro'" class="px-3 py-1 bg-agro text-white rounded-full text-xs font-bold">Активний</span>
    </div>

    <!-- Плани -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- Базовий -->
      <div class="card border-2" :class="currentPlan === 'basic' ? 'border-agro' : 'border-agro-border'">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-agro-dark text-xl">🌱 Базовий</h2>
          <span v-if="currentPlan === 'basic'" class="text-xs bg-agro text-white px-2.5 py-1 rounded-full font-semibold">Ваш план</span>
        </div>
        <p class="text-3xl font-extrabold text-agro-dark mb-1">Безкоштовно</p>
        <p class="text-agro-light text-sm mb-6">Назавжди</p>
        <ul class="space-y-2.5 mb-6">
          <li v-for="f in BASIC_FEATURES" :key="f" class="flex items-center gap-2 text-sm text-agro-dark">
            <span class="text-agro">✓</span> {{ f }}
          </li>
        </ul>
        <button disabled class="w-full py-3 rounded-xl border-2 border-agro-border text-agro-light font-semibold text-sm cursor-default">
          {{ currentPlan === 'basic' ? 'Поточний план' : 'Базовий' }}
        </button>
      </div>

      <!-- PRO -->
      <div class="card border-2 relative overflow-hidden" :class="currentPlan === 'pro' ? 'border-agro' : 'border-agro-border'">
        <div class="absolute top-4 right-4 bg-agro text-white text-xs font-bold px-2.5 py-1 rounded-full">ПОПУЛЯРНИЙ</div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-agro-dark text-xl">⭐ PRO</h2>
          <span v-if="currentPlan === 'pro'" class="text-xs bg-agro text-white px-2.5 py-1 rounded-full font-semibold">Ваш план</span>
        </div>
        <p class="text-3xl font-extrabold text-agro-dark mb-1">500 <span class="text-lg font-semibold">грн</span></p>
        <p class="text-agro-light text-sm mb-6">/ рік</p>
        <ul class="space-y-2.5 mb-6">
          <li v-for="f in PRO_FEATURES" :key="f" class="flex items-center gap-2 text-sm text-agro-dark">
            <span class="text-agro">✓</span> {{ f }}
          </li>
        </ul>
        <button
          v-if="currentPlan !== 'pro'"
          @click="showPayment = true"
          class="btn-primary w-full py-3"
        >Перейти на PRO →</button>
        <button v-else disabled class="w-full py-3 rounded-xl border-2 border-agro text-agro font-semibold text-sm cursor-default">
          Активний
        </button>
      </div>
    </div>

    <!-- FAQ -->
    <div class="card">
      <h2 class="font-bold text-agro-dark mb-4">❓ Питання та відповіді</h2>
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
            <p class="text-5xl mb-4">💳</p>
            <h2 class="font-bold text-agro-dark text-xl mb-2">Оплата PRO плану</h2>
            <p class="text-agro-light text-sm mb-6">500 грн / рік — доступ до всіх PRO функцій</p>
            <div class="bg-agro-bg rounded-xl p-4 mb-6 text-left space-y-2">
              <p class="text-sm text-agro-dark font-medium">Що входить:</p>
              <p v-for="f in PRO_FEATURES" :key="f" class="text-xs text-agro-light">✓ {{ f }}</p>
            </div>
            <p class="text-xs text-agro-light mb-4">Онлайн оплата через WayForPay — буде доступна найближчим часом</p>
            <div class="flex gap-3">
              <button @click="showPayment = false" class="btn-outline flex-1">Закрити</button>
              <button disabled class="btn-primary flex-1 opacity-50 cursor-not-allowed">Оплатити</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const showPayment = ref(false)
const loading = ref(true)
const currentPlan = ref('basic')
const expiresAt = ref<string | null>(null)

const BASIC_FEATURES = [
  '1 поле',
  '1 культура на поле',
  'AI агроном (5 запитів/день)',
  'Каталог препаратів',
  'Замовлення товарів',
]

const PRO_FEATURES = [
  'Необмежена кількість полів',
  'Необмежена кількість культур',
  'AI агроном (необмежено)',
  'Програма захисту рослин',
  'Нагадування про обробки',
  'Пріоритетна підтримка',
]

const FAQ = [
  { q: 'Чи можна скасувати підписку?', a: 'Так, підписка не продовжується автоматично. Ви платите раз на рік.' },
  { q: 'Що буде після закінчення PRO?', a: 'Ваші дані збережуться, але доступ до PRO функцій буде обмежено до базового плану.' },
  { q: 'Як відбувається оплата?', a: 'Оплата через WayForPay — безпечний українських платіжний сервіс.' },
]

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
</style>
