<template>
  <div class="dash-root min-h-screen flex" style="background: rgb(238,241,227); font-family: Manrope, sans-serif;">

    <!-- Сайдбар (тільки десктоп) -->
    <aside class="hidden lg:flex flex-col fixed h-full z-40" style="width: 280px; background: #fff; border-right: 1px solid rgb(231,224,206);">

      <!-- Лого -->
      <div style="padding: 26px 24px; border-bottom: 1px solid rgb(231,224,206);">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C7 6 4 10 4 14a8 8 0 0016 0c0-4-3-8-8-12z" fill="#2F5233"/>
          </svg>
          <span class="dash-brand">АгроПростір</span>
        </NuxtLink>
      </div>

      <!-- Юзер -->
      <div style="padding: 20px 24px; border-bottom: 1px solid rgb(231,224,206);" class="flex items-center gap-3">
        <div class="dash-avatar shrink-0">{{ userInitial }}</div>
        <div>
          <template v-if="profileReady">
            <div style="font-weight:700; font-size:15px; color:rgb(27,46,27);">{{ userName }}</div>
            <div class="flex items-center gap-[5px]" style="font-size:13px; color:rgb(122,138,114); margin-top:2px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path :d="ROLE_ICONS[role] || ROLE_ICONS.farmer" stroke="#7A8A72" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
              {{ roleLabelShort }}
            </div>
          </template>
          <template v-else>
            <div class="h-4 w-24 rounded animate-pulse mb-1.5" style="background:rgb(238,241,227);"/>
            <div class="h-3 w-16 rounded animate-pulse" style="background:rgb(238,241,227);"/>
          </template>
        </div>
      </div>

      <!-- Навігація -->
      <nav class="flex-1 overflow-y-auto" style="padding: 16px 14px; display:flex; flex-direction:column; gap:2px;">
        <template v-if="!role">
          <div v-for="i in 7" :key="i" class="h-10 rounded-[10px] animate-pulse mb-0.5" style="background:rgb(238,241,227);"/>
        </template>
        <NuxtLink
          v-else
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 transition-colors"
          style="padding: 11px 14px; border-radius: 10px; font-size: 14.5px;"
          :style="isActive(item.to)
            ? 'background:rgb(234,240,222); color:rgb(27,46,27); font-weight:700;'
            : 'color:rgb(76,90,70); font-weight:600;'"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" class="shrink-0">
            <template v-for="(p, pi) in (NAV_ICONS[item.svgKey || item.to]?.paths || [])" :key="pi">
              <path :d="p.d" :stroke="isActive(item.to) ? '#2F5233' : '#4C5A46'" :stroke-width="p.sw || 1.7" :stroke-linejoin="p.lj" :stroke-linecap="p.lc"/>
            </template>
            <template v-for="(c, ci) in (NAV_ICONS[item.svgKey || item.to]?.circles || [])" :key="'c'+ci">
              <circle :cx="c.cx" :cy="c.cy" :r="c.r" :stroke="isActive(item.to) ? '#2F5233' : '#4C5A46'" :stroke-width="c.sw || 1.7"/>
            </template>
          </svg>
          <span class="flex-1">{{ item.label }}</span>
          <span v-if="item.to === '/dashboard/chats' && unreadChats > 0" class="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center" style="background:#2F5233; font-size:11px;">{{ unreadChats }}</span>
          <span v-if="item.to === '/cart' && cartCount > 0" class="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center" style="background:#2F5233; font-size:11px;">{{ cartCount }}</span>
          <span v-if="item.to === '/dashboard/inventory' && unreadNotifications > 0" class="w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center" style="font-size:11px;">{{ unreadNotifications }}</span>
        </NuxtLink>
      </nav>

      <!-- Вийти -->
      <div style="padding: 16px 14px; border-top: 1px solid rgb(231,224,206);">
        <button @click="logout" class="w-full flex items-center gap-3 transition-colors" style="padding: 11px 14px; border-radius: 10px; color: rgb(179,69,47); font-weight:700; font-size:14.5px;" onmouseenter="this.style.background='rgb(254,242,242)'" onmouseleave="this.style.background='transparent'">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#B3452F" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 17l5-5-5-5M21 12H9" stroke="#B3452F" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Вийти
        </button>
      </div>
    </aside>

    <!-- Мобільний хедер -->
    <div class="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white h-14 flex items-center justify-between px-4" style="border-bottom: 1px solid rgb(231,224,206);">
      <NuxtLink to="/" class="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C7 6 4 10 4 14a8 8 0 0016 0c0-4-3-8-8-12z" fill="#2F5233"/>
        </svg>
        <span class="dash-brand" style="font-size:16px;">АгроПростір</span>
      </NuxtLink>
      <div class="flex items-center gap-2">
        <NuxtLink to="/dashboard/notifications" class="relative p-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 20V13a6 6 0 0112 0v7" stroke="rgb(76,90,70)" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M4 20h16" stroke="rgb(76,90,70)" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <span v-if="unreadNotifications > 0" class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{{ unreadNotifications }}</span>
        </NuxtLink>
        <div class="dash-avatar" style="width:34px; height:34px; font-size:13px;">{{ userInitial }}</div>
      </div>
    </div>

    <!-- Контент -->
    <div class="lg:pl-[280px] flex-1 flex flex-col h-dvh overflow-hidden">
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
            :class="isActive(item.to) ? 'text-[#2F5233]' : 'text-agro-light'"
          >
            <span class="text-xl leading-none">{{ item.icon }}</span>
            <span class="text-[10px] leading-none font-medium">{{ item.label }}</span>
            <span v-if="item.to === '/dashboard/chats' && unreadChats > 0" class="absolute top-1 right-3 w-4 h-4 bg-[#2F5233] rounded-full text-white text-[9px] font-bold flex items-center justify-center">{{ unreadChats }}</span>
          </NuxtLink>
        </template>
      </div>
    </nav>
  </div>
  <ConfirmModal />
</template>

<style scoped>
.dash-brand { font-family: 'Bitter', Georgia, serif; font-weight: 700; font-size: 19px; color: rgb(27,46,27); }
.dash-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: rgb(238,241,227); color: rgb(47,82,51);
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 16px; font-family: 'Bitter', Georgia, serif;
}
</style>

<script setup lang="ts">
const MARKETPLACE = false

type SvgDef = { paths?: { d: string; sw?: number; lj?: string; lc?: string }[]; circles?: { cx: number; cy: number; r: number; sw?: number }[] }

const NAV_ICONS: Record<string, SvgDef> = {
  '/dashboard':                   { paths: [{ d: 'M4 11l8-7 8 7M6 10v10h12V10', sw: 1.7, lj: 'round' }] },
  '/dashboard/fields':            { paths: [{ d: 'M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z', sw: 1.6, lj: 'round' }] },
  '/dashboard/analytics':         { paths: [{ d: 'M6 20V10M12 20V4M18 20v-7', sw: 1.8, lc: 'round' }] },
  '/pesticides':                  { paths: [{ d: 'M4 6a2 2 0 012-2h5v16H6a2 2 0 01-2-2V6zM20 6a2 2 0 00-2-2h-5v16h5a2 2 0 002-2V6z', sw: 1.6, lj: 'round' }] },
  '/dashboard/ai-chat':           { paths: [{ d: 'M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z', sw: 1.4, lj: 'round' }] },
  '/dashboard/reminders':         { paths: [{ d: 'M6 20V13a6 6 0 0112 0v7', sw: 1.6, lj: 'round' }, { d: 'M4 20h16', sw: 1.6, lc: 'round' }] },
  '/dashboard/chats':             { paths: [{ d: 'M4 5h16v11H8l-4 4V5z', sw: 1.6, lj: 'round' }] },
  '/dashboard/deals':             { paths: [{ d: 'M4 12l4-8h8l4 8-4 8H8l-4-8z', sw: 1.6, lj: 'round' }, { d: 'M9 12l2 2 4-4', sw: 1.6, lc: 'round', lj: 'round' }] },
  '/dashboard/subscription':      { paths: [{ d: 'M6 3h12l3 6-9 12L3 9l3-6z', sw: 1.6, lj: 'round' }, { d: 'M3 9h18M9 3l3 18M15 3l-3 18', sw: 1.3, lj: 'round' }] },
  '/dashboard/settings':          { paths: [{ d: 'M19.4 13.5a1.7 1.7 0 000-3l1-1.7-1.7-1.7-1.7 1a1.7 1.7 0 00-3 0l-1-1.7-1.7 1.7 1 1.7a1.7 1.7 0 000 3l-1 1.7 1.7 1.7 1.7-1a1.7 1.7 0 003 0l1.7 1 1.7-1.7-1-1.7z', sw: 1.3, lj: 'round' }], circles: [{ cx: 12, cy: 12, r: 3, sw: 1.6 }] },
  '/dashboard/agronomist-fields': { paths: [{ d: 'M3 14l5-4 4 3 4-5 5 4', sw: 1.6, lc: 'round', lj: 'round' }], circles: [] },
  '/dashboard/agronomist-profile':{ paths: [{ d: 'M20 20c0-3.3-4-5-6-5M4 20c0-3.9 2.7-6 6-6', sw: 1.6, lc: 'round' }], circles: [{ cx: 10, cy: 9, r: 4.5, sw: 1.6 }] },
  '/dashboard/promotion':         { paths: [{ d: 'M5 12H3l9-9 9 9h-2M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7', sw: 1.6, lc: 'round', lj: 'round' }] },
  '/dashboard/products':          { paths: [{ d: 'M3 8l2-3h14l2 3M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8M3 8h18', sw: 1.6, lj: 'round' }] },
  '/dashboard/orders':            { paths: [{ d: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0', sw: 1.6, lj: 'round' }] },
  '/farmers':                     { paths: [{ d: 'M20 20c0-3.3-4-5-6-5H10c-2 0-6 1.7-6 5', sw: 1.6, lc: 'round' }], circles: [{ cx: 12, cy: 9, r: 4, sw: 1.6 }] },
  '/dashboard/buyer-crops':       { paths: [{ d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', sw: 1.6, lj: 'round' }] },
  '/dashboard/inventory':         { paths: [{ d: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18', sw: 1.6, lj: 'round' }] },
  '/admin':                       { paths: [{ d: 'M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z', sw: 1.5, lj: 'round' }] },
  '/cart':                        { paths: [{ d: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z', sw: 1.6, lj: 'round' }] },
}

const ROLE_ICONS: Record<string, string> = {
  farmer:    'M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z',
  agronomist:'M10 9m-4.5 0a4.5 4.5 0 109 0 4.5 4.5 0 00-9 0M20 20c0-3.3-4-5-6-5M4 20c0-3.9 2.7-6 6-6',
  buyer:     'M4 20h16M6 20V10l-2-4h16l-2 4v10M9 10V6M15 10V6',
  seller:    'M3 8l2-3h14l2 3M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8M3 8h18',
  admin:     'M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z',
}

const isActive = (to: string) => {
  const path = useRoute().path
  return to === '/dashboard' ? path === '/dashboard' : path === to || path.startsWith(to + '/')
}

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
const unreadNotifications = ref(0)

const loadNotifications = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { count } = await supabase
    .from('farm_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .eq('is_read', false)
  unreadNotifications.value = count || 0
}

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

onMounted(() => { loadCartCount(); loadNotifications() })

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
const ROLE_SHORT: Record<string, string> = {
  farmer: 'Фермер', dacha: 'Дачник', agronomist: 'Агроном',
  seller: 'Продавець', buyer: 'Заготівельник', admin: 'Адміністратор',
}
const roleLabel = computed(() => ROLE_LABELS[role.value] || role.value)
const roleLabelShort = computed(() => ROLE_SHORT[role.value] || role.value)

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
    { to: '/dashboard/inventory', icon: '🧪', label: 'Склад' },
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
