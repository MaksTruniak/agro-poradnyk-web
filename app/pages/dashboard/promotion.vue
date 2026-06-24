<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-extrabold text-agro-dark">🚀 Просування</h1>
      <p class="text-agro-light mt-1">{{ isSeller ? 'Більше покупців — більше продажів' : 'Більше клієнтів — більше замовлень' }}</p>
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
          <p class="font-bold text-agro-dark text-lg">{{ currentPlan === 'top' ? '⭐ Топ' : '🌱 Базовий' }}</p>
        </div>
        <span class="px-4 py-1.5 rounded-full text-sm font-bold" :class="currentPlan === 'top' ? 'bg-agro text-white' : 'bg-agro-hover text-agro'">Активний</span>
      </div>

      <!-- Плани для агронома -->
      <template v-if="!isSeller">
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
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Профіль у маркетплейсі</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> До 3 клієнтів безкоштовно</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Одноразове розблокування — 49 грн</li>
              <li class="flex items-center gap-2 text-sm text-gray-400"><span>✗</span> В кінці списку</li>
              <li class="flex items-center gap-2 text-sm text-gray-400"><span>✗</span> Без бейджу рекомендованого</li>
            </ul>
          </div>

          <div class="card border-2 relative overflow-hidden" :class="currentPlan === 'top' ? 'border-agro' : 'border-agro-border'">
            <div class="absolute top-4 right-4 bg-agro text-white text-xs font-bold px-2.5 py-1 rounded-full">⭐ Найпопулярніший</div>
            <div class="flex items-center gap-4 mb-4">
              <span class="text-4xl">🚀</span>
              <div class="flex-1">
                <p class="font-bold text-agro-dark text-lg">Топ</p>
                <p class="text-agro font-semibold text-sm">299 грн / міс</p>
              </div>
              <span v-if="currentPlan === 'top'" class="text-xs bg-agro text-white px-3 py-1 rounded-full font-semibold">Активний</span>
            </div>
            <ul class="space-y-2 mb-5">
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Профіль у маркетплейсі</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Необмежена кількість клієнтів</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Завжди вгорі списку</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Бейдж "⭐ Рекомендований"</li>
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Виділена картка</li>
            </ul>
            <button v-if="currentPlan !== 'top'" @click="showPayment = true" class="btn-primary w-full py-3">Підключити Топ →</button>
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
            <div class="absolute top-4 right-4 bg-agro text-white text-xs font-bold px-2.5 py-1 rounded-full">⭐ Найпопулярніший</div>
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
              <li class="flex items-center gap-2 text-sm text-agro-dark"><span class="text-agro font-bold">✓</span> Бейдж "✅ Перевірений продавець"</li>
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
            <p class="text-5xl mb-4">💳</p>
            <h2 class="font-bold text-agro-dark text-xl mb-2">{{ isSeller ? 'Підключити Топ продавця' : 'Підключити Топ' }}</h2>
            <p class="text-agro-light text-sm mb-4">{{ isSeller ? '499 грн / місяць' : '299 грн / місяць' }} — ваш профіль завжди вгорі</p>
            <p class="text-xs text-agro-light mb-6">Онлайн оплата через WayForPay — буде доступна найближчим часом</p>
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
const loading = ref(true)
const currentPlan = ref('basic')
const showPayment = ref(false)

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const { data: userData } = await supabase.from('users').select('role').eq('id', uid).single()
const isSeller = userData?.role === 'seller'

if (isSeller) {
  const { data } = await supabase.from('seller_profiles').select('promotion_plan').eq('user_id', uid).maybeSingle()
  if (data) currentPlan.value = data.promotion_plan || 'basic'
} else {
  const { data } = await supabase.from('agronomist_profiles').select('promotion_plan').eq('user_id', uid).maybeSingle()
  if (data) currentPlan.value = data.promotion_plan || 'basic'
}

loading.value = false
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
