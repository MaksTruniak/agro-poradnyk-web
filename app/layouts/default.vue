<template>
  <div class="min-h-screen bg-agro-bg">
    <!-- Тестовий режим -->
    <div class="bg-amber-400 text-amber-900 text-center text-xs font-semibold py-1.5 px-4 tracking-wide">
      ⚠️ Сайт працює в тестовому режимі — платежі не є реальними
    </div>
    <header
      class="sticky top-0 z-50 bg-[#FAF6EC] border-b border-[#e2ddd0] shadow-sm"
    >
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        <NuxtLink to="/" class="flex items-center gap-2.5 shrink-0">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C7 6 4 10 4 14a8 8 0 0016 0c0-4-3-8-8-12z" fill="#2F5233"/>
            <path d="M12 22V10" :stroke="scrolled || !isHome ? '#FAF6EC' : '#FAF6EC'" stroke-width="1.4"/>
          </svg>
          <span class="logo-text font-bold text-xl tracking-tight text-[rgb(27,46,27)]">АгроПростір</span>
        </NuxtLink>

        <!-- Ліва: Агрономи, Фермери -->
        <nav class="hidden md:flex items-center gap-5">
          <NuxtLink to="/agronomists"
            class="font-medium transition-colors text-sm text-[rgb(27,46,27)]/70 hover:text-[rgb(27,46,27)] relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-[rgb(47,82,51)] after:scale-x-0 after:transition-transform [&.router-link-active]:text-[rgb(27,46,27)] [&.router-link-active]:after:scale-x-100">
            Агрономи
          </NuxtLink>
          <NuxtLink to="/farmers"
            class="font-medium transition-colors text-sm text-[rgb(27,46,27)]/70 hover:text-[rgb(27,46,27)] relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-[rgb(47,82,51)] after:scale-x-0 after:transition-transform [&.router-link-active]:text-[rgb(27,46,27)] [&.router-link-active]:after:scale-x-100">
            Фермери
          </NuxtLink>
          <NuxtLink to="/buyers"
            class="font-medium transition-colors text-sm text-[rgb(27,46,27)]/70 hover:text-[rgb(27,46,27)] relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-[rgb(47,82,51)] after:scale-x-0 after:transition-transform [&.router-link-active]:text-[rgb(27,46,27)] [&.router-link-active]:after:scale-x-100">
            Заготівельники
          </NuxtLink>
        </nav>

        <!-- Права: Каталог, Інформація + кнопки -->
        <nav class="hidden md:flex items-center gap-5 flex-1 justify-end">
          <!-- Каталог з dropdown -->
          <div class="relative" @mouseenter="catalogOpen = true" @mouseleave="catalogOpen = false">
            <button class="flex items-center gap-1 font-medium transition-colors text-sm py-1 text-[rgb(27,46,27)]/70 hover:text-[rgb(27,46,27)]">
              Каталог
              <svg class="w-3.5 h-3.5 transition-transform" :class="catalogOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <Transition name="dropdown">
              <div v-if="catalogOpen" class="absolute left-0 top-full pt-2 z-50">
                <div class="bg-[#FAF6EC] rounded-2xl shadow-xl border border-[#e2ddd0] py-2 w-52">
                  <NuxtLink v-for="item in CATALOG_MENU" :key="item.to" :to="item.to"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[rgb(27,46,27)] hover:bg-[#f0ebe0] transition-colors">
                    <span v-html="item.icon"></span>
                    <span>{{ item.label }}</span>
                  </NuxtLink>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Інформація з dropdown -->
          <div class="relative" @mouseenter="infoOpen = true" @mouseleave="infoOpen = false">
            <button class="flex items-center gap-1 font-medium transition-colors text-sm py-1 text-[rgb(27,46,27)]/70 hover:text-[rgb(27,46,27)]">
              Інформація
              <svg class="w-3.5 h-3.5 transition-transform" :class="infoOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <Transition name="dropdown">
              <div v-if="infoOpen" class="absolute right-0 top-full pt-2 z-50">
                <div class="bg-[#FAF6EC] rounded-2xl shadow-xl border border-[#e2ddd0] py-2 w-52">
                  <NuxtLink to="/ingredients" class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[rgb(27,46,27)] hover:bg-[#f0ebe0] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-3"/><rect x="9" y="1" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg><span>Діючі речовини</span>
                  </NuxtLink>
                  <NuxtLink to="/weeds" class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[rgb(27,46,27)] hover:bg-[#f0ebe0] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 7 9 5 5c4 0 6 2 7 7z"/><path d="M12 12c0 0 5-3 7-7-4 0-6 2-7 7z"/></svg><span>Бур'яни</span>
                  </NuxtLink>
                  <NuxtLink to="/diseases" class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[rgb(27,46,27)] hover:bg-[#f0ebe0] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg><span>Хвороби рослин</span>
                  </NuxtLink>
                  <NuxtLink to="/pests" class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[rgb(27,46,27)] hover:bg-[#f0ebe0] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="13" rx="5" ry="6"/><path d="M12 7V3"/><path d="M7 14H4M20 14h-3"/><path d="M8.5 20L6 22M15.5 20L18 22"/></svg><span>Шкідники</span>
                  </NuxtLink>
                  <NuxtLink to="/brands" class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[rgb(27,46,27)] hover:bg-[#f0ebe0] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg><span>Виробники</span>
                  </NuxtLink>
                </div>
              </div>
            </Transition>
          </div>

          <div class="flex items-center gap-2 ml-2">
            <NuxtLink v-if="!user" to="/auth"
              class="text-sm font-semibold px-5 py-2 rounded-full border border-[rgb(27,46,27)] text-[rgb(27,46,27)] hover:bg-[rgb(27,46,27)] hover:text-[#FAF6EC] transition-colors">
              Увійти
            </NuxtLink>
            <NuxtLink v-if="!user" to="/auth?mode=register"
              class="text-sm font-semibold px-5 py-2 rounded-full bg-[#2F5233] text-[#FAF6EC] hover:bg-[#3d6b42] transition-colors">
              Реєстрація
            </NuxtLink>
            <NuxtLink v-if="MARKETPLACE && user" to="/cart" class="relative p-2 hover:bg-[#f0ebe0] rounded-xl transition-colors">
              <span class="text-xl">🛒</span>
              <span v-if="cartCount > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-[#2F5233] text-white text-xs font-bold rounded-full flex items-center justify-center">{{ cartCount }}</span>
            </NuxtLink>
            <NuxtLink v-if="user" to="/dashboard"
              class="text-sm font-semibold px-5 py-2 rounded-full bg-[#2F5233] text-[#FAF6EC] hover:bg-[#3d6b42] transition-colors">
              Кабінет
            </NuxtLink>
          </div>
        </nav>

        <!-- Бургер для мобільного -->
        <button @click="mobileMenu = !mobileMenu" class="md:hidden ml-auto p-2 rounded-xl hover:bg-[#f0ebe0] transition-colors">
          <span class="text-xl text-[rgb(27,46,27)]">{{ mobileMenu ? '✕' : '☰' }}</span>
        </button>
      </div>

      <!-- Мобільне меню -->
      <Transition name="slide">
        <div v-if="mobileMenu" class="md:hidden bg-[#FAF6EC] border-t border-[#e2ddd0] px-4 py-4 space-y-1">
          <p class="text-xs font-semibold text-agro-light uppercase tracking-wide px-3 pt-1 pb-2">Каталог</p>
          <NuxtLink v-for="item in CATALOG_MENU" :key="item.to" @click="mobileMenu = false" :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors">
            <span v-html="item.icon"></span> {{ item.label }}
          </NuxtLink>
          <div class="border-t border-agro-border my-2"></div>
          <p class="text-xs font-semibold text-agro-light uppercase tracking-wide px-3 pt-1 pb-2">Інформація</p>
          <NuxtLink @click="mobileMenu = false" to="/ingredients" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-3"/><rect x="9" y="1" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg> Діючі речовини</NuxtLink>
          <NuxtLink @click="mobileMenu = false" to="/weeds" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 7 9 5 5c4 0 6 2 7 7z"/><path d="M12 12c0 0 5-3 7-7-4 0-6 2-7 7z"/></svg> Бур'яни</NuxtLink>
          <NuxtLink @click="mobileMenu = false" to="/diseases" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg> Хвороби рослин</NuxtLink>
          <NuxtLink @click="mobileMenu = false" to="/pests" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="13" rx="5" ry="6"/><path d="M12 7V3"/><path d="M7 14H4M20 14h-3"/><path d="M8.5 20L6 22M15.5 20L18 22"/></svg> Шкідники</NuxtLink>
          <NuxtLink @click="mobileMenu = false" to="/brands" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg> Виробники</NuxtLink>
          <NuxtLink @click="mobileMenu = false" to="/agronomists" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/><path d="M16 3.5c1.5.5 3 2 3 4.5"/></svg> Агрономи</NuxtLink>
          <NuxtLink @click="mobileMenu = false" to="/farmers" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg> Фермери</NuxtLink>
          <NuxtLink @click="mobileMenu = false" to="/buyers" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-agro-dark font-medium hover:bg-agro-bg transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg> Заготівельники</NuxtLink>
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
    <footer class="bg-[rgb(27,46,27)] py-14">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div class="col-span-2 md:col-span-1">
            <div class="flex items-center gap-2.5 mb-3">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C7 6 4 10 4 14a8 8 0 0016 0c0-4-3-8-8-12z" fill="#C98A3C"/>
                <path d="M12 22V10" stroke="#FAF6EC" stroke-width="1.4"/>
              </svg>
              <span class="logo-text font-bold text-white">АгроПростір</span>
            </div>
            <p class="text-sm text-white/50 leading-relaxed">Цифровий помічник для фермерів, заготівельників, агрономів і продавців агрохімії.</p>
          </div>
          <div>
            <p class="font-semibold text-white/90 text-sm mb-4 uppercase tracking-wider">Каталог</p>
            <ul class="space-y-2.5 text-sm text-white/50">
              <li v-for="item in CATALOG_MENU" :key="item.to">
                <NuxtLink :to="item.to" class="hover:text-white transition-colors">{{ item.label }}</NuxtLink>
              </li>
              <li><NuxtLink to="/ingredients" class="hover:text-white transition-colors">Діючі речовини</NuxtLink></li>
            </ul>
          </div>
          <div>
            <p class="font-semibold text-white/90 text-sm mb-4 uppercase tracking-wider">Кабінет</p>
            <ul class="space-y-2.5 text-sm text-white/50">
              <li><NuxtLink to="/dashboard" class="hover:text-white transition-colors">Мій кабінет</NuxtLink></li>
              <li><NuxtLink to="/dashboard/fields" class="hover:text-white transition-colors">Мої поля</NuxtLink></li>
              <li><NuxtLink to="/dashboard/orders" class="hover:text-white transition-colors">Замовлення</NuxtLink></li>
              <li><NuxtLink to="/dashboard/reminders" class="hover:text-white transition-colors">Нагадування</NuxtLink></li>
            </ul>
          </div>
          <div>
            <p class="font-semibold text-white/90 text-sm mb-4 uppercase tracking-wider">Для кого</p>
            <ul class="space-y-2.5 text-sm text-white/50">
              <li><NuxtLink to="/for-farmers" class="hover:text-white transition-colors">Фермерам</NuxtLink></li>
              <li><NuxtLink to="/for-agronomists" class="hover:text-white transition-colors">Агрономам</NuxtLink></li>
              <li><NuxtLink to="/for-buyers" class="hover:text-white transition-colors">Заготівельникам</NuxtLink></li>
              <li><NuxtLink to="/about" class="hover:text-white transition-colors">Про нас</NuxtLink></li>
              <li><NuxtLink to="/privacy" class="hover:text-white transition-colors">Політика конфіденційності</NuxtLink></li>
              <li><NuxtLink to="/terms" class="hover:text-white transition-colors">Умови використання</NuxtLink></li>
            </ul>
          </div>
        </div>
        <div class="border-t border-white/10 pt-6 text-center text-sm text-white/30">
          © {{ new Date().getFullYear() }} АгроПростір. Всі права захищені.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const MARKETPLACE = false

const CATALOG_MENU = [
  { to: '/pesticides', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', label: 'Пестициди' },
  { to: '/fertilizers', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 8 10 6 7c3 0 5 1 6 5z"/><path d="M12 12c0 0 4-2 6-5-3 0-5 1-6 5z"/></svg>', label: 'Добрива' },
  { to: '/bio', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C8 12 5 9 5 5c0 0 4 0 7 7z"/><path d="M12 12c4 0 7-3 7-7 0 0-4 0-7 7z"/></svg>', label: 'Біопрепарати' },
  { to: '/seeds', icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/><path d="M12 14c0 0-3-1-4-4M12 14c0 0 3-1 4-4"/></svg>', label: 'Насіння' },
]

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const mobileMenu = ref(false)
const catalogOpen = ref(false)
const infoOpen = ref(false)
const route = useRoute()
const scrolled = ref(false)
const isHome = computed(() => route.path === '/')

onMounted(() => {
  const onScroll = () => { scrolled.value = window.scrollY > 20 }
  window.addEventListener('scroll', onScroll, { passive: true })
  onUnmounted(() => window.removeEventListener('scroll', onScroll))
})

const cartCount = ref(0)

const loadCartCount = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { count } = await supabase
    .from('cart_items').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id)
  cartCount.value = count || 0
}

onMounted(loadCartCount)
watch(() => route.path, () => { mobileMenu.value = false; catalogOpen.value = false; infoOpen.value = false; loadCartCount() })
useNuxtApp().hooks.hook('cart:updated' as any, loadCartCount)
</script>

<style scoped>
.logo-text { font-family: 'Bitter', Georgia, serif; }
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
