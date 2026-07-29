<template>
  <div class="min-h-screen bg-agro-bg flex">
    <!-- Сайдбар (тільки десктоп) -->
    <aside class="hidden lg:flex w-64 bg-white border-r border-agro-border flex-col fixed h-full z-40">
      <div class="p-5 border-b border-agro-border">
        <NuxtLink to="/" class="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0">
            <clipPath id="logo-clip-dash"><rect width="32" height="32" rx="8"/></clipPath>
            <g clip-path="url(#logo-clip-dash)">
              <rect width="32" height="32" fill="#B5D4F4"/>
              <ellipse cx="8" cy="8" rx="5" ry="2.5" fill="white" opacity="0.8"/>
              <ellipse cx="22" cy="6" rx="4" ry="2" fill="white" opacity="0.7"/>
              <rect x="0" y="16" width="32" height="3" fill="#3B6D11"/>
              <rect x="0" y="19" width="32" height="13" fill="#A0622A"/>
              <rect x="0" y="25" width="32" height="7" fill="#7A4620"/>
              <line x1="0" y1="19" x2="32" y2="19" stroke="#5C3310" stroke-width="0.5"/>
            </g>
          </svg>
          <span class="font-bold text-agro-dark">АгроПростір</span>
        </NuxtLink>
      </div>

      <div class="p-4 border-b border-agro-border">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-agro-hover flex items-center justify-center text-agro font-bold shrink-0">
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <template v-if="profileReady">
              <p class="font-semibold text-sm text-agro-dark truncate">{{ userName }}</p>
              <p class="text-xs text-agro-light">{{ roleLabel }}</p>
            </template>
            <template v-else>
              <div class="h-4 w-24 bg-agro-bg rounded animate-pulse mb-1.5" />
              <div class="h-3 w-16 bg-agro-bg rounded animate-pulse" />
            </template>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
        <template v-if="!role">
          <div v-for="i in 5" :key="i" class="h-10 rounded-xl bg-agro-bg animate-pulse mb-1" />
        </template>
        <NuxtLink
          v-else
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="(item.to === '/dashboard' ? $route.path === '/dashboard' : $route.path === item.to || $route.path.startsWith(item.to + '/')) ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'"
        >
          <span class="text-base">{{ item.icon }}</span>
          <span class="flex-1">{{ item.label }}</span>
          <span v-if="item.to === '/dashboard/chats' && unreadChats > 0" class="w-5 h-5 bg-agro rounded-full text-white text-xs font-bold flex items-center justify-center">{{ unreadChats }}</span>
          <span v-if="item.to === '/cart' && cartCount > 0" class="w-5 h-5 bg-agro rounded-full text-white text-xs font-bold flex items-center justify-center">{{ cartCount }}</span>
        </NuxtLink>
      </nav>

      <div class="p-3 border-t border-agro-border">
        <button @click="logout" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
          <span>🚪</span> Вийти
        </button>
      </div>
    </aside>

    <!-- Мобільний хедер -->
    <div class="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-agro-border h-14 flex items-center justify-between px-4">
      <NuxtLink to="/" class="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0">
            <clipPath id="logo-clip-mob"><rect width="32" height="32" rx="8"/></clipPath>
            <g clip-path="url(#logo-clip-mob)">
              <rect width="32" height="32" fill="#B5D4F4"/>
              <ellipse cx="8" cy="8" rx="5" ry="2.5" fill="white" opacity="0.8"/>
              <ellipse cx="22" cy="6" rx="4" ry="2" fill="white" opacity="0.7"/>
              <rect x="0" y="16" width="32" height="3" fill="#3B6D11"/>
              <rect x="0" y="19" width="32" height="13" fill="#A0622A"/>
              <rect x="0" y="25" width="32" height="7" fill="#7A4620"/>
              <line x1="0" y1="19" x2="32" y2="19" stroke="#5C3310" stroke-width="0.5"/>
            </g>
          </svg>
        <span class="font-bold text-agro-dark">АгроПростір</span>
      </NuxtLink>
      <div class="flex items-center gap-2">
        <NuxtLink v-if="MARKETPLACE" to="/cart" class="relative p-2">
          <span class="text-xl">🛒</span>
          <span v-if="cartCount > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-agro text-white text-xs font-bold rounded-full flex items-center justify-center">{{ cartCount }}</span>
        </NuxtLink>
        <div class="w-8 h-8 rounded-full bg-agro-hover flex items-center justify-center text-agro font-bold text-sm">
          {{ userInitial }}
        </div>
      </div>
    </div>

    <!-- Контент -->
    <div class="lg:ml-64 flex-1 flex flex-col h-dvh overflow-hidden">
      <div class="flex-1 pt-14 lg:pt-0 pb-20 lg:pb-0 overflow-y-auto">
        <slot />
      </div>
    </div>

    <!-- Мобільний bottom nav -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-agro-border">
      <div class="grid grid-cols-5 h-16">
        <template v-if="!role">
          <div v-for="i in 5" :key="i" class="flex flex-col items-center justify-center gap-1.5">
            <div class="w-6 h-6 rounded-lg bg-agro-bg animate-pulse" />
            <div class="w-10 h-2 rounded bg-agro-bg animate-pulse" />
          </div>
        </template>
        <template v-else>
          <NuxtLink
            v-for="item in bottomNavItems"
            :key="item.to"
            :to="item.to"
            class="flex flex-col items-center justify-center gap-0.5 transition-colors relative"
            :class="(item.to === '/dashboard' ? $route.path === '/dashboard' : $route.path === item.to || $route.path.startsWith(item.to + '/')) ? 'text-agro' : 'text-agro-light'"
          >
            <span class="text-xl leading-none">{{ item.icon }}</span>
            <span class="text-[10px] leading-none font-medium">{{ item.label }}</span>
            <span v-if="item.to === '/dashboard/chats' && unreadChats > 0" class="absolute top-1 right-3 w-4 h-4 bg-agro rounded-full text-white text-[9px] font-bold flex items-center justify-center">{{ unreadChats }}</span>
            <span v-if="item.to === '/cart' && cartCount > 0" class="absolute top-1 right-3 w-4 h-4 bg-agro rounded-full text-white text-[9px] font-bold flex items-center justify-center">{{ cartCount }}</span>
          </NuxtLink>
        </template>
      </div>
    </nav>
  </div>
  <ConfirmModal />
</template>

<script setup lang="ts">
const MARKETPLACE = false

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const profile = ref<any>(null)
const profileReady = ref(false)

// Одразу беремо роль і ім'я з кешу щоб не було мигання меню
if (import.meta.client) {
  const cachedRole = localStorage.getItem('agro_user_role')
  const cachedName = localStorage.getItem('agro_user_name')
  if (cachedRole && cachedName) {
    profile.value = { role: cachedRole, name: cachedName }
    profileReady.value = true
  }
}

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { data } = await supabase.from('users').select('name, role').eq('id', session.user.id).single()
  if (data) {
    profile.value = data
    profileReady.value = true
    localStorage.setItem('agro_user_role', data.role)
    localStorage.setItem('agro_user_name', data.name || '')
  }
  loadUnread()
})

const cartCount = ref(0)
const unreadChats = useState('unread-chats', () => 0)

const loadUnread = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const uid = session.user.id
  const isAgro = profile.value?.role === 'agronomist'
  const field = isAgro ? 'agronomist_id' : 'farmer_id'
  const { data: chatsData } = await supabase.from('chats').select('id').eq(field, uid).eq('type', 'human')
  if (!chatsData?.length) return
  const chatIds = chatsData.map(c => c.id)
  const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true })
    .in('chat_id', chatIds)
    .eq('role', isAgro ? 'user' : 'assistant')
    .eq('is_read', false)
  unreadChats.value = count || 0
}

const loadCartCount = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { count } = await supabase
    .from('cart_items').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id)
  cartCount.value = count || 0
}

onMounted(() => { loadCartCount() })

const route = useRoute()
watch(() => route.path, () => { if (route.path === '/cart' || route.path.includes('catalog')) loadCartCount() })

const userName = computed(() => profile.value?.name || '')
const userInitial = computed(() => userName.value.trim()[0]?.toUpperCase() || '?')
const role = computed(() => profile.value?.role || '')

const ROLE_LABELS: Record<string, string> = {
  farmer: '🌾 Фермер',
  dacha: '🏡 Дачник',
  agronomist: '🔬 Агроном',
  seller: '🏪 Продавець',
  buyer: '🏭 Заготівельник',
  admin: '🛡 Адміністратор',
}
const roleLabel = computed(() => ROLE_LABELS[role.value] || role.value)

const navItems = computed(() => {
  const adminItem = role.value === 'admin' ? [{ to: '/admin', icon: '🛡', label: 'Адмін' }] : []
  if (role.value === 'admin') return [
    { to: '/admin', icon: '🛡', label: 'Адмін-панель' },
  ]
  if (role.value === 'seller') return [
    { to: '/dashboard', icon: '🏠', label: 'Головна' },
    { to: '/dashboard/products', icon: '📦', label: 'Товари' },
    { to: '/dashboard/orders', icon: '🛒', label: 'Замовлення' },
    { to: '/dashboard/analytics', icon: '📊', label: 'Аналітика' },
    { to: '/dashboard/chats', icon: '💬', label: 'Чати' },
    { to: '/dashboard/promotion', icon: '🚀', label: 'Просування' },
    { to: '/dashboard/settings', icon: '⚙️', label: 'Налаштування' },
    ...adminItem,
  ]
  if (role.value === 'buyer') return [
    { to: '/dashboard', icon: '🏠', label: 'Головна' },
    { to: '/farmers', icon: '🌾', label: 'Фермери' },
    { to: '/dashboard/buyer-crops', icon: '📋', label: 'Що закуповую' },
    { to: '/dashboard/chats', icon: '💬', label: 'Чати' },
    { to: '/dashboard/deals', icon: '🤝', label: 'Угоди' },
    { to: '/dashboard/settings', icon: '⚙️', label: 'Налаштування' },
    ...adminItem,
  ]
  if (role.value === 'agronomist') return [
    { to: '/dashboard', icon: '🏠', label: 'Головна' },
    { to: '/dashboard/fields', icon: '🌾', label: 'Мої поля' },
    { to: '/dashboard/agronomist-fields', icon: '🗺', label: 'Поля клієнтів' },
    { to: '/dashboard/ai-chat', icon: '🤖', label: 'AI агроном' },
    { to: '/dashboard/chats', icon: '💬', label: 'Консультації' },
    { to: '/dashboard/reminders', icon: '🔔', label: 'Нагадування' },
    { to: '/pesticides', icon: '📖', label: 'Каталог' },
    ...(MARKETPLACE ? [{ to: '/cart', icon: '🛒', label: 'Кошик' }, { to: '/dashboard/orders', icon: '📋', label: 'Замовлення' }] : []),
    { to: '/dashboard/agronomist-profile', icon: '🔬', label: 'Кабінет агронома' },
    { to: '/dashboard/promotion', icon: '🚀', label: 'Просування' },
    { to: '/dashboard/subscription', icon: '💎', label: 'Підписка' },
    { to: '/dashboard/settings', icon: '⚙️', label: 'Налаштування' },
    ...adminItem,
  ]
  const base = [
    { to: '/dashboard', icon: '🏠', label: 'Головна' },
    { to: '/dashboard/fields', icon: '🌾', label: role.value === 'dacha' ? 'Мої культури' : 'Мої поля' },
  ]
  if (role.value !== 'dacha') base.push({ to: '/dashboard/analytics', icon: '📊', label: 'Аналітика' })
  return [...base,
    { to: '/pesticides', icon: '📖', label: 'Каталог' },
    { to: '/dashboard/ai-chat', icon: '🤖', label: 'AI агроном' },
    ...(MARKETPLACE ? [{ to: '/cart', icon: '🛒', label: 'Кошик' }, { to: '/dashboard/orders', icon: '📋', label: 'Замовлення' }] : []),
    { to: '/dashboard/reminders', icon: '🔔', label: 'Нагадування' },
    { to: '/dashboard/chats', icon: '💬', label: 'Чати' },
    { to: '/dashboard/deals', icon: '🤝', label: 'Угоди' },
    { to: '/dashboard/subscription', icon: '💎', label: 'Підписка' },
    { to: '/dashboard/settings', icon: '⚙️', label: 'Налаштування' },
    ...adminItem,
  ]
})

const bottomNavItems = computed(() => {
  if (role.value === 'seller') return [
    { to: '/dashboard', icon: '🏠', label: 'Головна' },
    { to: '/dashboard/products', icon: '📦', label: 'Товари' },
    { to: '/dashboard/orders', icon: '🛒', label: 'Замовлення' },
    { to: '/dashboard/chats', icon: '💬', label: 'Чати' },
    { to: '/dashboard/analytics', icon: '📊', label: 'Аналітика' },
  ]
  if (role.value === 'buyer') return [
    { to: '/dashboard', icon: '🏠', label: 'Головна' },
    { to: '/farmers', icon: '🌾', label: 'Фермери' },
    { to: '/dashboard/chats', icon: '💬', label: 'Чати' },
    { to: '/dashboard/settings', icon: '⚙️', label: 'Більше' },
  ]
  if (role.value === 'agronomist') return [
    { to: '/dashboard', icon: '🏠', label: 'Головна' },
    { to: '/dashboard/fields', icon: '🌾', label: 'Поля' },
    { to: '/dashboard/ai-chat', icon: '🤖', label: 'AI' },
    { to: '/dashboard/chats', icon: '💬', label: 'Чати' },
    { to: '/pesticides', icon: '📖', label: 'Каталог' },
  ]
  return [
    { to: '/dashboard', icon: '🏠', label: 'Головна' },
    { to: '/dashboard/fields', icon: '🌾', label: role.value === 'dacha' ? 'Культури' : 'Поля' },
    { to: '/dashboard/ai-chat', icon: '🤖', label: 'AI' },
    { to: '/dashboard/chats', icon: '💬', label: 'Чати' },
    { to: '/dashboard/settings', icon: '⚙️', label: 'Більше' },
  ]
})

const logout = async () => {
  await supabase.auth.signOut()
  router.push('/auth')
}
</script>
