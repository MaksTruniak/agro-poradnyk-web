<template>
  <div class="dash-root min-h-screen flex" style="background: rgb(238,241,227); font-family: Manrope, sans-serif;">

    <!-- Сайдбар (тільки десктоп) -->
    <aside class="hidden lg:flex flex-col fixed h-full z-40" style="width: 280px; background: #fff; border-right: 1px solid rgb(231,224,206);">

      <!-- Лого -->
      <div style="padding: 26px 24px; border-bottom: 1px solid rgb(231,224,206);">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C7 6 4 10 4 14a8 8 0 0016 0c0-4-3-8-8-12z" fill="#2F5233"/>
            <path d="M12 22V10" stroke="#FAF6EC" stroke-width="1.4"/>
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

      <!-- Перемикач профілів (якщо є 2+) -->
      <div v-if="allRoles.length > 1" style="padding: 10px 14px; border-bottom: 1px solid rgb(231,224,206);">
        <p style="font-size:10px; font-weight:700; letter-spacing:0.06em; color:rgb(160,175,150); text-transform:uppercase; margin-bottom:6px; padding: 0 2px;">Профіль</p>
        <div class="flex gap-1.5">
          <button
            v-for="r in allRoles"
            :key="r"
            @click="switchProfile(r)"
            class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-bold transition-all"
            :style="role === r
              ? 'background:rgb(234,240,222); color:rgb(47,82,51);'
              : 'background:transparent; color:rgb(122,138,114); border: 1px solid rgb(231,224,206);'"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path :d="ROLE_ICONS[r] || ROLE_ICONS.farmer" :stroke="role === r ? '#2F5233' : '#7A8A72'" stroke-width="1.8" stroke-linejoin="round"/>
            </svg>
            {{ ROLE_SHORT[r] || r }}
          </button>
        </div>
      </div>

      <!-- Навігація -->
      <nav class="flex-1 overflow-y-auto" style="padding: 12px 14px;">
        <template v-if="!role">
          <div v-for="i in 7" :key="i" class="h-10 rounded-[10px] animate-pulse mb-0.5" style="background:rgb(238,241,227);"/>
        </template>
        <template v-else>
          <div v-for="group in navItems" :key="group.label" class="mb-3">
            <p v-if="group.label" style="font-size:10.5px; font-weight:700; letter-spacing:0.06em; color:rgb(160,175,150); text-transform:uppercase; padding: 0 14px; margin-bottom:3px;">{{ group.label }}</p>
            <div style="display:flex; flex-direction:column; gap:1px;">
              <NuxtLink
                v-for="item in group.items"
                :key="item.to"
                :to="item.to"
                class="flex items-center gap-3 transition-colors"
                style="padding: 10px 14px; border-radius: 10px; font-size: 14.5px;"
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
                <span v-if="item.to === '/dashboard/agronomist-fields' && pendingShares > 0" class="w-5 h-5 bg-yellow-500 rounded-full text-white text-xs font-bold flex items-center justify-center" style="font-size:11px;">{{ pendingShares }}</span>
                <span v-if="item.to === '/dashboard/agreements' && pendingAgreementsCount > 0" class="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center" style="background:#B3452F; font-size:11px;">{{ pendingAgreementsCount }}</span>
              </NuxtLink>
            </div>
          </div>
        </template>
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
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C7 6 4 10 4 14a8 8 0 0016 0c0-4-3-8-8-12z" fill="#2F5233"/>
          <path d="M12 22V10" stroke="#FAF6EC" stroke-width="1.4"/>
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
      <!-- Банер члена команди -->
      <div v-if="teamOwner" class="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgb(161,98,7)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
        <span class="text-amber-800">Ви переглядаєте дані <strong>{{ teamOwner.ownerName }}</strong> як {{ teamOwner.roleLabel }}</span>
        <button @click="exitTeamMode" class="ml-auto text-xs text-amber-700 hover:text-amber-900 font-semibold underline shrink-0">Вийти</button>
      </div>
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
  '/dashboard/agreements':        { paths: [{ d: 'M9 12l2 2 4-4', sw: 1.6, lc: 'round', lj: 'round' }, { d: 'M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z', sw: 1.6, lj: 'round' }] },
  '/dashboard/deals':             { paths: [{ d: 'M4 12l4-8h8l4 8-4 8H8l-4-8z', sw: 1.6, lj: 'round' }, { d: 'M9 12l2 2 4-4', sw: 1.6, lc: 'round', lj: 'round' }] },
  '/dashboard/subscription':      { paths: [{ d: 'M6 3h12l3 6-9 12L3 9l3-6z', sw: 1.6, lj: 'round' }, { d: 'M3 9h18M9 3l3 18M15 3l-3 18', sw: 1.3, lj: 'round' }] },
  '/dashboard/support':           { paths: [{ d: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z', sw: 1.7, lj: 'round' }] },
  '/dashboard/team':              { paths: [{ d: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', sw: 1.6, lc: 'round' }, { d: 'M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75', sw: 1.6, lc: 'round' }], circles: [{ cx: 9, cy: 7, r: 4, sw: 1.6 }] },
  '/dashboard/integrations':      { paths: [{ d: 'M4 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 14a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z', sw: 1.5, lj: 'round' }] },
  '/dashboard/settings':          { paths: [{ d: 'M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z', sw: 1.5, lj: 'round' }], circles: [{ cx: 12, cy: 12, r: 3, sw: 1.6 }] },
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

// Режим члена команди
const teamOwner = ref<{ ownerId: string; ownerName: string; roleLabel: string } | null>(null)

const exitTeamMode = () => {
  localStorage.removeItem('agro_team_owner_id')
  localStorage.removeItem('agro_team_owner_name')
  localStorage.removeItem('agro_team_role_label')
  teamOwner.value = null
  router.push('/dashboard')
}

// Одразу беремо роль і ім'я з кешу щоб не було мигання меню
const allRoles = ref<string[]>([])

if (import.meta.client) {
  const cachedRole = localStorage.getItem('agro_active_profile') || localStorage.getItem('agro_user_role')
  const cachedName = localStorage.getItem('agro_user_name')
  if (cachedRole && cachedName) {
    profile.value = { role: cachedRole, name: cachedName }
    profileReady.value = true
  }
}

onMounted(async () => {
  // Відновлюємо режим члена команди з localStorage
  if (import.meta.client) {
    const ownerId   = localStorage.getItem('agro_team_owner_id')
    const ownerName = localStorage.getItem('agro_team_owner_name')
    const roleLabel = localStorage.getItem('agro_team_role_label')
    if (ownerId && ownerName) {
      teamOwner.value = { ownerId, ownerName, roleLabel: roleLabel || 'Переглядач' }
    }
  }

  // Якщо щойно прийняли запрошення
  if (import.meta.client && useRoute().query.team_accepted) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: rec } = await supabase
        .from('team_members')
        .select('owner_id, role')
        .eq('member_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle()
      if (rec) {
        const { data: ownerUser } = await supabase
          .from('users').select('name').eq('id', rec.owner_id).maybeSingle()
        const ownerName = ownerUser?.name || 'Власник'
        const roleLabel = rec.role === 'editor' ? 'Редактор' : 'Переглядач'
        localStorage.setItem('agro_team_owner_id',    rec.owner_id)
        localStorage.setItem('agro_team_owner_name',  ownerName)
        localStorage.setItem('agro_team_role_label',  roleLabel)
        teamOwner.value = { ownerId: rec.owner_id, ownerName, roleLabel }
      }
    }
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { data } = await supabase.from('users').select('name, role, roles').eq('id', session.user.id).single()
  if (data) {
    allRoles.value = data.roles?.length ? data.roles : [data.role || 'farmer']
    const activeProfile = import.meta.client
      ? (localStorage.getItem('agro_active_profile') || data.role || 'farmer')
      : data.role
    profile.value = { ...data, role: activeProfile }
    profileReady.value = true
    localStorage.setItem('agro_user_name', data.name || '')
    if (!localStorage.getItem('agro_active_profile')) {
      localStorage.setItem('agro_active_profile', data.role)
    }
    localStorage.setItem('agro_user_role', activeProfile)
  }
  loadUnread()
  loadPendingShares()
  if (profile.value?.role === 'agronomist') autoBoost(session.user.id)
})

// Надаємо teamOwnerId всім дочірнім компонентам
provide('teamOwnerId', computed(() => teamOwner.value?.ownerId ?? null))
provide('teamRole', computed(() => teamOwner.value?.roleLabel ?? null))

const switchProfile = (r: string) => {
  localStorage.setItem('agro_active_profile', r)
  localStorage.setItem('agro_user_role', r)
  profile.value = { ...profile.value, role: r }
  router.push('/dashboard')
}

const autoBoost = async (uid: string) => {
  try {
    const { data: sub } = await supabase
      .from('subscriptions').select('plan, expires_at').eq('user_id', uid).maybeSingle()
    const isPro = sub?.plan === 'pro' && (!sub.expires_at || new Date(sub.expires_at) > new Date())
    if (!isPro) return

    const { data: profile } = await supabase
      .from('agronomist_profiles').select('boosted_at').eq('user_id', uid).single()
    const lastBoost = profile?.boosted_at ? new Date(profile.boosted_at) : null
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    if (lastBoost && lastBoost >= fiveDaysAgo) return

    await supabase
      .from('agronomist_profiles')
      .update({ boosted_at: new Date().toISOString(), is_highlighted: true })
      .eq('user_id', uid)
  } catch {}
}

const cartCount = ref(0)
const unreadChats = useState('unread-chats', () => 0)
const unreadNotifications = ref(0)
const pendingShares = ref(0)
const pendingAgreementsCount = ref(0)

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

const loadPendingShares = async () => {
  if (profile.value?.role !== 'agronomist') return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { count } = await supabase.from('field_shares')
    .select('*', { count: 'exact', head: true })
    .eq('agronomist_id', session.user.id)
    .eq('status', 'pending')
  pendingShares.value = count || 0
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

const loadPendingAgreements = async () => {
  if (profile.value?.role !== 'agronomist') return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { count } = await supabase.from('agreements')
    .select('*', { count: 'exact', head: true })
    .eq('agronomist_id', session.user.id)
    .eq('status', 'pending')
  pendingAgreementsCount.value = count || 0
}

const loadCartCount = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { count } = await supabase
    .from('cart_items').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id)
  cartCount.value = count || 0
}

const { checkAndNotify } = useRemindersNotify()
const supabaseUser = useSupabaseUser()
onMounted(() => { loadCartCount(); loadNotifications(); loadPendingAgreements() })
watch(supabaseUser, (u) => { if (u) checkAndNotify() }, { immediate: true })

const route = useRoute()
watch(() => route.path, () => {
  if (route.path === '/cart' || route.path.includes('catalog')) loadCartCount()
  if (route.path === '/dashboard/agronomist-fields') { pendingShares.value = 0 }
  if (route.path === '/dashboard/agreements') { pendingAgreementsCount.value = 0 }
  if (profile.value?.role === 'agronomist') loadPendingAgreements()
})

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
  const adminGroup = role.value === 'admin' ? [{ label: '', items: [{ to: '/admin', label: 'Адмін-панель' }] }] : []
  if (role.value === 'admin') return [
    { label: '', items: [{ to: '/admin', label: 'Адмін-панель' }] },
  ]
  if (role.value === 'seller') return [
    { label: '', items: [{ to: '/dashboard', label: 'Головна' }] },
    { label: 'Магазин', items: [
      { to: '/dashboard/products', label: 'Товари' },
      { to: '/dashboard/orders', label: 'Замовлення' },
      { to: '/dashboard/promotion', label: 'Просування' },
      { to: '/dashboard/analytics', label: 'Аналітика' },
    ]},
    { label: 'Комунікація', items: [
      { to: '/dashboard/chats', label: 'Чати' },
    ]},
    { label: 'Акаунт', items: [
      { to: '/dashboard/settings', label: 'Налаштування' },
    ]},
    ...adminGroup,
  ]
  if (role.value === 'buyer') return [
    { label: '', items: [{ to: '/dashboard', label: 'Головна' }] },
    { label: 'Закупівлі', items: [
      { to: '/farmers', label: 'Фермери' },
      { to: '/dashboard/buyer-crops', label: 'Що закуповую' },
      { to: '/dashboard/deals', label: 'Угоди' },
    ]},
    { label: 'Комунікація', items: [
      { to: '/dashboard/chats', label: 'Чати' },
    ]},
    { label: 'Акаунт', items: [
      { to: '/dashboard/settings', label: 'Налаштування' },
    ]},
    ...adminGroup,
  ]
  if (role.value === 'agronomist') return [
    { label: '', items: [{ to: '/dashboard', label: 'Головна' }] },
    { label: 'Агрономія', items: [
      { to: '/dashboard/agronomist-fields', label: 'Поля клієнтів' },
      { to: '/pesticides', label: 'Каталог' },
      { to: '/dashboard/ai-chat', label: 'AI агроном' },
      { to: '/dashboard/reminders', label: 'Надіслані фермерам' },
    ]},
    { label: 'Комунікація', items: [
      { to: '/dashboard/chats', label: 'Консультації' },
      { to: '/dashboard/agreements', label: 'Угоди з фермерами' },
    ]},
    { label: 'Кабінет', items: [
      { to: '/dashboard/agronomist-profile', label: 'Кабінет агронома' },
      { to: '/dashboard/agronomist-subscription', label: 'Підписка' },
      { to: '/dashboard/settings', label: 'Налаштування' },
    ]},
    ...adminGroup,
  ]
  // farmer / dacha
  const fieldLabel = role.value === 'dacha' ? 'Мої культури' : 'Мої поля'
  const mainItems: any[] = [
    { to: '/dashboard/fields', label: fieldLabel },
    { to: '/dashboard/inventory', label: 'Склад' },
    { to: '/dashboard/team', label: 'Співробітники' },
  ]
  if (role.value !== 'dacha') mainItems.splice(1, 0, { to: '/dashboard/analytics', label: 'Аналітика' })
  return [
    { label: '', items: [{ to: '/dashboard', label: 'Головна' }] },
    { label: 'Моє господарство', items: mainItems },
    { label: 'Агрономія', items: [
      { to: '/pesticides', label: 'Каталог' },
      { to: '/dashboard/ai-chat', label: 'AI агроном' },
      { to: '/dashboard/reminders', label: 'Нагадування' },
    ]},
    { label: 'Комунікація', items: [
      { to: '/dashboard/chats', label: 'Чати' },
      { to: '/dashboard/agreements', label: 'Угоди з агрономами' },
      { to: '/dashboard/deals', label: 'Угоди із закупівельником' },
    ]},
    { label: 'Акаунт', items: [
      { to: '/dashboard/subscription', label: 'Підписка' },
      { to: '/dashboard/invoices', label: 'Інвойси' },
      { to: '/dashboard/support', label: 'Підтримка' },
      { to: '/dashboard/integrations', label: 'Інтеграції' },
      { to: '/dashboard/settings', label: 'Налаштування' },
    ]},
    ...adminGroup,
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
    { to: '/dashboard/agronomist-fields', icon: '🌾', label: 'Клієнти' },
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
  localStorage.removeItem('agro_active_profile')
  localStorage.removeItem('agro_user_role')
  localStorage.removeItem('agro_user_name')
  localStorage.removeItem('agro_pending_roles')
  router.push('/auth')
}
</script>
