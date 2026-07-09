<template>
  <div class="min-h-screen bg-agro-bg">
    <header class="bg-white border-b border-agro-border sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="text-2xl">🌾</span>
          <span class="font-bold text-agro-dark text-lg">АгроПорадник</span>
        </NuxtLink>
        <nav class="hidden md:flex items-center gap-6">
          <!-- Каталог з dropdown -->
          <div class="relative" @mouseenter="catalogOpen = true" @mouseleave="catalogOpen = false">
            <button class="flex items-center gap-1 text-agro-light hover:text-agro-dark font-medium transition-colors py-1">
              Каталог
              <svg class="w-4 h-4 transition-transform" :class="catalogOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <Transition name="dropdown">
              <div v-if="catalogOpen" class="absolute left-0 top-full pt-2 z-50">
                <div class="bg-white rounded-2xl shadow-xl border border-agro-border py-2 w-56">
                  <NuxtLink v-for="item in CATALOG_MENU" :key="item.to" :to="item.to"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-agro-dark hover:bg-agro-bg transition-colors">
                    <span class="text-lg">{{ item.emoji }}</span>
                    <span>{{ item.label }}</span>
                  </NuxtLink>
                </div>
              </div>
            </Transition>
          </div>

          <NuxtLink to="/ingredients" class="text-agro-light hover:text-agro-dark font-medium transition-colors">Діючі речовини</NuxtLink>
          <NuxtLink to="/agronomists" class="text-agro-light hover:text-agro-dark font-medium transition-colors">Агрономи</NuxtLink>
          <NuxtLink to="/farmers" class="text-agro-light hover:text-agro-dark font-medium transition-colors">Фермери</NuxtLink>
        </nav>
        <div class="flex items-center gap-2">
          <div class="hidden md:flex items-center gap-2">
            <NuxtLink v-if="!user" to="/auth" class="btn-outline text-sm py-2">Увійти</NuxtLink>
            <NuxtLink v-if="!user" to="/auth?mode=register" class="bg-agro-dark text-white font-semibold rounded-xl px-6 py-2 text-sm hover:bg-agro transition-colors">Реєстрація</NuxtLink>
            <NuxtLink v-if="MARKETPLACE && user" to="/cart" class="relative p-2 hover:bg-agro-bg rounded-xl transition-colors">
              <span class="text-xl">🛒</span>
              <span v-if="cartCount > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-agro text-white text-xs font-bold rounded-full flex items-center justify-center">{{ cartCount }}</span>
            </NuxtLink>
            <NuxtLink v-if="user" to="/dashboard" class="btn-primary text-sm py-2">Кабінет</NuxtLink>
          </div>
          <!-- Бургер для мобільного -->
          <button @click="mobileMenu = !mobileMenu" class="md:hidden p-2 rounded-xl hover:bg-agro-bg transition-colors">
            <span class="text-xl">{{ mobileMenu ? '✕' : '☰' }}</span>
          </button>
        </div>
      </div>

      <!-- Мобільне меню -->
      <Transition name="slide">
        <div v-if="mobileMenu" class="md:hidden bg-white border-t border-agro-border px-4 py-4 space-y-1">
          <p class="text-xs font-semibold text-agro-light uppercase tracking-wide px-3 pt-1 pb-2">Каталог</p>
          <NuxtLink v-for="item in CATALOG_MENU" :key="item.to" @click="mobileMenu = false" :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors">
            <span>{{ item.emoji }}</span> {{ item.label }}
          </NuxtLink>
          <div class="border-t border-agro-border my-2"></div>
          <NuxtLink @click="mobileMenu = false" to="/ingredients" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors">🧪 Діючі речовини</NuxtLink>
          <NuxtLink @click="mobileMenu = false" to="/agronomists" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors">🔬 Агрономи</NuxtLink>
          <NuxtLink @click="mobileMenu = false" to="/farmers" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors">👨‍🌾 Фермери</NuxtLink>
          <div class="border-t border-agro-border pt-3 mt-2 flex gap-2">
            <NuxtLink v-if="!user" @click="mobileMenu = false" to="/auth" class="btn-outline text-sm py-2 flex-1 text-center">Увійти</NuxtLink>
            <NuxtLink v-if="!user" @click="mobileMenu = false" to="/auth?mode=register" class="btn-primary text-sm py-2 flex-1 text-center">Реєстрація</NuxtLink>
            <NuxtLink v-if="user" @click="mobileMenu = false" to="/dashboard" class="btn-primary text-sm py-2 flex-1 text-center">Кабінет</NuxtLink>
          </div>
        </div>
      </Transition>
    </header>
    <main>
      <slot />
    </main>
    <footer class="bg-agro-hover border-t border-agro-border py-12">
      <div class="max-w-7xl mx-auto px-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div class="col-span-2 md:col-span-1">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-xl">🌾</span>
              <span class="font-bold text-agro-dark">АгроПорадник</span>
            </div>
            <p class="text-sm text-agro-light leading-relaxed">Цифровий помічник для фермерів, агрономів і продавців агрохімії.</p>
          </div>
          <div>
            <p class="font-semibold text-agro-dark text-sm mb-3">Каталог</p>
            <ul class="space-y-2 text-sm text-agro-light">
              <li v-for="item in CATALOG_MENU" :key="item.to">
                <NuxtLink :to="item.to" class="hover:text-agro transition-colors">{{ item.emoji }} {{ item.label }}</NuxtLink>
              </li>
              <li><NuxtLink to="/ingredients" class="hover:text-agro transition-colors">🧪 Діючі речовини</NuxtLink></li>
            </ul>
          </div>
          <div>
            <p class="font-semibold text-agro-dark text-sm mb-3">Кабінет</p>
            <ul class="space-y-2 text-sm text-agro-light">
              <li><NuxtLink to="/dashboard" class="hover:text-agro transition-colors">Мій кабінет</NuxtLink></li>
              <li><NuxtLink to="/dashboard/fields" class="hover:text-agro transition-colors">Мої поля</NuxtLink></li>
              <li><NuxtLink to="/dashboard/orders" class="hover:text-agro transition-colors">Замовлення</NuxtLink></li>
              <li><NuxtLink to="/dashboard/reminders" class="hover:text-agro transition-colors">Нагадування</NuxtLink></li>
            </ul>
          </div>
          <div>
            <p class="font-semibold text-agro-dark text-sm mb-3">Для кого</p>
            <ul class="space-y-2 text-sm text-agro-light">
              <li><NuxtLink to="/for-farmers" class="hover:text-agro transition-colors">🌾 Фермерам</NuxtLink></li>
              <li><NuxtLink to="/for-dacha" class="hover:text-agro transition-colors">🏡 Дачникам</NuxtLink></li>
              <li><NuxtLink to="/for-agronomists" class="hover:text-agro transition-colors">🔬 Агрономам</NuxtLink></li>
              <li><NuxtLink to="/for-sellers" class="hover:text-agro transition-colors">🏪 Продавцям</NuxtLink></li>
              <li><NuxtLink to="/about" class="hover:text-agro transition-colors">Про нас</NuxtLink></li>
              <li><NuxtLink to="/privacy" class="hover:text-agro transition-colors">Політика конфіденційності</NuxtLink></li>
              <li><NuxtLink to="/terms" class="hover:text-agro transition-colors">Умови використання</NuxtLink></li>
            </ul>
          </div>
        </div>
        <div class="border-t border-agro-border pt-6 text-center text-sm text-agro-light">
          © {{ new Date().getFullYear() }} АгроПорадник. Всі права захищені.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const MARKETPLACE = false

const CATALOG_MENU = [
  { to: '/catalog',     emoji: '🛡️', label: 'Пестициди' },
  { to: '/fertilizers', emoji: '🌱', label: 'Добрива' },
  { to: '/bio',         emoji: '🍃', label: 'Біопрепарати' },
  { to: '/seeds',       emoji: '🌾', label: 'Насіння' },
]

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const mobileMenu = ref(false)
const catalogOpen = ref(false)
const route = useRoute()

const cartCount = ref(0)

const loadCartCount = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { count } = await supabase
    .from('cart_items').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id)
  cartCount.value = count || 0
}

onMounted(loadCartCount)
watch(() => route.path, () => { mobileMenu.value = false; catalogOpen.value = false; loadCartCount() })
useNuxtApp().hooks.hook('cart:updated' as any, loadCartCount)
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
