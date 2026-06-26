<template>
  <div class="min-h-screen bg-agro-bg">
    <header class="bg-white border-b border-agro-border sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="text-2xl">🌾</span>
          <span class="font-bold text-agro-dark text-lg">АгроПорадник</span>
        </NuxtLink>
        <nav class="hidden md:flex items-center gap-6">
          <NuxtLink to="/catalog" class="text-agro-light hover:text-agro-dark font-medium transition-colors">Каталог</NuxtLink>
          <NuxtLink to="/agronomists" class="text-agro-light hover:text-agro-dark font-medium transition-colors">Агрономи</NuxtLink>
          <NuxtLink to="/farmers" class="text-agro-light hover:text-agro-dark font-medium transition-colors">Фермери</NuxtLink>
        </nav>
        <div class="flex items-center gap-2">
          <NuxtLink v-if="user" to="/cart" class="relative p-2 hover:bg-agro-bg rounded-xl transition-colors">
            <span class="text-xl">🛒</span>
            <span v-if="cartCount > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-agro text-white text-xs font-bold rounded-full flex items-center justify-center">{{ cartCount }}</span>
          </NuxtLink>
          <div class="hidden md:flex items-center gap-2">
            <NuxtLink v-if="!user" to="/auth" class="btn-outline text-sm py-2">Увійти</NuxtLink>
            <NuxtLink v-if="!user" to="/auth?mode=register" class="bg-agro-dark text-white font-semibold rounded-xl px-6 py-2 text-sm hover:bg-agro transition-colors">Реєстрація</NuxtLink>
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
        <div v-if="mobileMenu" class="md:hidden bg-white border-t border-agro-border px-4 py-4 space-y-2">
          <NuxtLink @click="mobileMenu = false" to="/catalog" class="flex items-center gap-3 px-3 py-3 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors">📖 Каталог</NuxtLink>
          <NuxtLink @click="mobileMenu = false" to="/agronomists" class="flex items-center gap-3 px-3 py-3 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors">🔬 Агрономи</NuxtLink>
          <NuxtLink @click="mobileMenu = false" to="/farmers" class="flex items-center gap-3 px-3 py-3 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors">🌾 Фермери</NuxtLink>
          <div class="border-t border-agro-border pt-3 mt-3 flex gap-2">
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
            <p class="font-semibold text-agro-dark text-sm mb-3">Платформа</p>
            <ul class="space-y-2 text-sm text-agro-light">
              <li><NuxtLink to="/catalog" class="hover:text-agro transition-colors">Каталог препаратів</NuxtLink></li>
              <li><NuxtLink to="/agronomists" class="hover:text-agro transition-colors">Агрономи</NuxtLink></li>
              <li><NuxtLink to="/farmers" class="hover:text-agro transition-colors">Фермери</NuxtLink></li>
              <li><NuxtLink to="/auth?mode=register" class="hover:text-agro transition-colors">Реєстрація</NuxtLink></li>
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
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const mobileMenu = ref(false)
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
watch(() => route.path, () => { mobileMenu.value = false; loadCartCount() })
useNuxtApp().hooks.hook('cart:updated' as any, loadCartCount)
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
