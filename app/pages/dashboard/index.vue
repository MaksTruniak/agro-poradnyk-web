<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 11l8-7 8 7M6 10v10h12V10"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Привіт, {{ profile?.name || 'друже' }}</h1>
        <p class="dash-subtitle">{{ roleLabel }}</p>
      </div>
    </div>

    <!-- Завантаження профілю -->
    <template v-if="!profileLoaded">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div v-for="i in 4" :key="i" class="card animate-pulse h-20"></div>
      </div>
    </template>

    <!-- Фермер / Дачник -->
    <template v-else-if="isFarmer">
      <!-- Скелетон -->
      <template v-if="loading">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div v-for="i in 3" :key="i" class="card animate-pulse h-20"></div>
        </div>
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <div class="card animate-pulse h-40"></div>
          <div class="card animate-pulse h-40"></div>
        </div>
      </template>

      <template v-else>
        <!-- Зведення -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <NuxtLink to="/dashboard/fields" class="card text-center hover:shadow-md transition-shadow">
            <p class="dash-stat-num">{{ farmerStats.fields }}</p>
            <p class="dash-stat-label">{{ role === 'dacha' ? 'культур' : 'полів' }}</p>
          </NuxtLink>
          <NuxtLink v-if="role !== 'dacha'" to="/dashboard/fields" class="card text-center hover:shadow-md transition-shadow">
            <p class="dash-stat-num">{{ farmerStats.totalHa }}</p>
            <p class="dash-stat-label">га загальна площа</p>
          </NuxtLink>
          <NuxtLink v-if="role !== 'dacha'" to="/dashboard/analytics" class="card text-center hover:shadow-md transition-shadow">
            <p class="dash-stat-num">{{ farmerStats.crops }}</p>
            <p class="dash-stat-label">культур вирощується</p>
          </NuxtLink>
        </div>

        <div class="mb-6">
          <!-- Найближчі нагадування -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="dash-card-title bitter">Найближчі нагадування</h2>
              <NuxtLink to="/dashboard/reminders" class="text-sm text-agro hover:underline">Всі →</NuxtLink>
            </div>
            <div v-if="nextReminders.length === 0" class="text-agro-light text-sm text-center py-6">
              Немає запланованих нагадувань
              <div class="mt-3"><NuxtLink to="/dashboard/reminders" class="btn-primary text-sm inline-block">Додати</NuxtLink></div>
            </div>
            <div v-else class="space-y-3">
              <div v-for="r in nextReminders" :key="r.id" class="flex items-center gap-3 p-3 bg-agro-bg rounded-xl">
                <div class="w-9 h-9 rounded-xl bg-agro-hover flex items-center justify-center shrink-0" v-html="reminderIcon(r.type)"></div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-agro-dark text-sm truncate">{{ r.description }}</p>
                  <p class="text-xs text-agro mt-0.5">{{ formatDate(r.scheduled_date) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Продано -->
          <div v-if="farmerDeals.length" class="card mt-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="dash-card-title bitter">Продано</h2>
              <NuxtLink to="/dashboard/deals" class="text-sm text-agro hover:underline">Всі →</NuxtLink>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div v-for="d in farmerDeals" :key="d.crop" class="bg-agro-bg rounded-xl p-3 text-center">
                <p class="text-lg font-extrabold text-agro">{{ d.qty }}</p>
                <p class="text-xs font-semibold text-agro-dark mt-0.5">{{ d.crop }}</p>
                <p class="text-xs text-agro-light">{{ d.total.toLocaleString('uk-UA') }} грн</p>
              </div>
            </div>
          </div>

          <!-- Активні замовлення (маркетплейс) -->
          <div v-if="MARKETPLACE" class="card mt-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="dash-card-title bitter">Активні замовлення</h2>
              <NuxtLink to="/dashboard/orders" class="text-sm text-agro hover:underline">Всі →</NuxtLink>
            </div>
            <div v-if="activeOrders.length === 0" class="text-agro-light text-sm text-center py-6">
              Немає активних замовлень
              <div class="mt-3"><NuxtLink to="/pesticides" class="btn-primary text-sm inline-block">До каталогу</NuxtLink></div>
            </div>
            <div v-else class="space-y-3">
              <div v-for="o in activeOrders" :key="o.id" class="flex items-center gap-3 p-3 bg-agro-bg rounded-xl">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  :class="STATUS_BG[o.status]" v-html="STATUS_ICON[o.status]"></div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-agro-dark text-sm">#{{ o.id.slice(0,8).toUpperCase() }}</p>
                  <p class="text-xs text-agro-light mt-0.5">{{ STATUS_LABEL[o.status] }} · {{ o.total }} грн</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

    </template>

    <!-- Продавець (маркетплейс) -->
    <template v-else-if="MARKETPLACE && isSeller">
      <template v-if="loading">
        <div class="grid md:grid-cols-3 gap-5 mb-8">
          <div v-for="i in 3" :key="i" class="card animate-pulse h-24"></div>
        </div>
      </template>
      <template v-else>
        <div class="grid md:grid-cols-3 gap-5 mb-8">
          <div class="card">
            <p class="dash-stat-num">{{ stats.products }}</p>
            <p class="dash-stat-label">Товарів</p>
          </div>
          <div class="card">
            <p class="dash-stat-num">{{ stats.orders }}</p>
            <p class="dash-stat-label">Замовлень</p>
          </div>
          <div class="card">
            <p class="dash-stat-num">{{ stats.revenue }} грн</p>
            <p class="dash-stat-label">Виручки</p>
          </div>
        </div>
        <NuxtLink to="/dashboard/products" class="btn-primary inline-block">Мої товари →</NuxtLink>
      </template>
    </template>

    <!-- Заготівельник -->
    <template v-else-if="isBuyer">
      <template v-if="loading">
        <div class="grid md:grid-cols-3 gap-5 mb-8">
          <div v-for="i in 3" :key="i" class="card animate-pulse h-24"></div>
        </div>
      </template>
      <template v-else>
        <!-- Підтверджені угоди по культурах -->
        <div v-if="buyerCrops.length" class="mb-6">
          <h2 class="dash-card-title bitter mb-3">Куплено</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="c in buyerCrops" :key="c.crop" class="card text-center">
              <p class="dash-stat-num">{{ c.quantity }} т</p>
              <p class="font-semibold text-agro-dark text-sm mt-0.5">{{ c.crop }}</p>
              <p class="text-xs text-agro-light mt-0.5">{{ c.total.toLocaleString('uk-UA') }} грн</p>
            </div>
          </div>
        </div>

        <!-- Переговори -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="dash-card-title bitter">Переговори з фермерами</h2>
            <NuxtLink to="/dashboard/chats" class="text-sm text-agro hover:underline">Всі →</NuxtLink>
          </div>
          <div v-if="buyerChats.length === 0" class="text-agro-light text-sm text-center py-6">
            Ще немає переговорів
            <div class="mt-3"><NuxtLink to="/farmers" class="btn-primary text-sm inline-block">Знайти фермера</NuxtLink></div>
          </div>
          <div v-else class="space-y-3">
            <NuxtLink v-for="c in buyerChats" :key="c.id" :to="`/dashboard/chats/${c.id}`"
              class="flex items-center gap-3 p-3 bg-agro-bg rounded-xl hover:bg-agro-hover transition-colors">
              <div class="w-9 h-9 rounded-xl bg-white border border-agro-border flex items-center justify-center font-bold text-agro shrink-0">
                {{ c.farmer_name?.[0]?.toUpperCase() || '?' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-agro-dark text-sm truncate">{{ c.title || c.farmer_name }}</p>
                <p class="text-xs text-agro-light truncate">{{ c.last_message || 'Немає повідомлень' }}</p>
              </div>
              <div v-if="c.unread > 0" class="w-5 h-5 bg-agro rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{{ c.unread }}</div>
            </NuxtLink>
          </div>
        </div>
      </template>
    </template>

    <!-- Агроном -->
    <template v-else-if="isAgronomist">
      <template v-if="loading">
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div v-for="i in 3" :key="i" class="card animate-pulse h-20"></div>
        </div>
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <div class="card animate-pulse h-40"></div>
          <div class="card animate-pulse h-40"></div>
        </div>
      </template>

      <template v-else>
        <!-- Зведення -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <NuxtLink to="/dashboard/agreements" class="card text-center hover:shadow-md transition-shadow">
            <p class="dash-stat-num">{{ agroStats.clients }}</p>
            <p class="dash-stat-label">Клієнтів</p>
          </NuxtLink>
          <NuxtLink to="/dashboard/agreements" class="card text-center hover:shadow-md transition-shadow">
            <p class="dash-stat-num">{{ agroStats.active }}</p>
            <p class="dash-stat-label">Активних угод</p>
          </NuxtLink>
          <NuxtLink to="/dashboard/agreements" class="card text-center hover:shadow-md transition-shadow">
            <p class="dash-stat-num">{{ agroStats.completed }}</p>
            <p class="dash-stat-label">Завершених</p>
          </NuxtLink>
        </div>

        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <!-- Найближчі нагадування -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="dash-card-title bitter">Найближчі нагадування</h2>
              <NuxtLink to="/dashboard/reminders" class="text-sm text-agro hover:underline">Всі →</NuxtLink>
            </div>
            <div v-if="nextReminders.length === 0" class="text-agro-light text-sm text-center py-6">
              Немає запланованих нагадувань
              <div class="mt-3"><NuxtLink to="/dashboard/reminders" class="btn-primary text-sm inline-block">Додати</NuxtLink></div>
            </div>
            <div v-else class="space-y-3">
              <div v-for="r in nextReminders" :key="r.id" class="flex items-center gap-3 p-3 bg-agro-bg rounded-xl">
                <div class="w-9 h-9 rounded-xl bg-agro-hover flex items-center justify-center shrink-0" v-html="reminderIcon(r.type)"></div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-agro-dark text-sm truncate">{{ r.description }}</p>
                  <p class="text-xs text-agro mt-0.5">{{ formatDate(r.scheduled_date) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Останні чати -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="dash-card-title bitter">Консультації</h2>
              <NuxtLink to="/dashboard/chats" class="text-sm text-agro hover:underline">Всі →</NuxtLink>
            </div>
            <div v-if="recentChats.length === 0" class="text-agro-light text-sm text-center py-6">
              Немає активних чатів
            </div>
            <div v-else class="space-y-3">
              <NuxtLink v-for="c in recentChats" :key="c.id" :to="`/dashboard/chats/${c.id}`"
                class="flex items-center gap-3 p-3 bg-agro-bg rounded-xl hover:bg-agro-hover transition-colors">
                <div class="w-9 h-9 rounded-full bg-agro-hover flex items-center justify-center font-bold text-agro shrink-0">
                  {{ c.farmer_name?.[0]?.toUpperCase() || '?' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-agro-dark text-sm truncate">{{ c.farmer_name || 'Фермер' }}</p>
                  <p class="text-xs text-agro-light mt-0.5 truncate">{{ c.last_message || 'Немає повідомлень' }}</p>
                </div>
                <div v-if="c.unread" class="w-5 h-5 bg-agro rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0">{{ c.unread }}</div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Головна' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const MARKETPLACE = false

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const profile = ref<any>(null)
const uid = ref<string | undefined>(undefined)
const profileLoaded = ref(false)

const activeProfile = import.meta.client
  ? (localStorage.getItem('agro_active_profile') || localStorage.getItem('agro_user_role') || '')
  : ''
const role = computed(() => activeProfile || profile.value?.role || 'farmer')
const isFarmer = computed(() => role.value === 'farmer' || role.value === 'dacha')
const isAgronomist = computed(() => role.value === 'agronomist')
const isSeller = computed(() => role.value === 'seller')
const isBuyer = computed(() => role.value === 'buyer')

const ROLE_LABELS: Record<string, string> = { farmer: 'Фермер', dacha: 'Дачник', agronomist: 'Агроном', seller: 'Продавець', buyer: 'Заготівельник' }
const roleLabel = computed(() => ROLE_LABELS[role.value] || '')

const loading = ref(true)
const stats = ref({ products: 0, orders: 0, revenue: 0 })
const farmerStats = ref({ fields: 0, totalHa: 0, crops: 0, reminders: 0 })
const agroStats = ref({ clients: 0, active: 0, completed: 0, chats: 0 })
const buyerStats = ref({ farmers: 0, requests: 0, unread: 0 })
const buyerChats = ref<any[]>([])
const buyerCrops = ref<{ crop: string; quantity: number; total: number }[]>([])
const farmerDeals = ref<{ crop: string; qty: string; total: number }[]>([])
const nextReminders = ref<any[]>([])
const recentChats = ref<any[]>([])
const pendingAgreements = ref<any[]>([])
const activeOrders = ref<any[]>([])

const reminderIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'обробка': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    'підживлення': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 7 9 5 5c4 0 6 2 7 7z"/><path d="M12 12c0 0 5-3 7-7-4 0-6 2-7 7z"/></svg>',
    'полив': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z"/></svg>',
    'посів': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 8 10 6 7c3 0 5 1 6 5z"/><path d="M12 12c0 0 4-2 6-5-3 0-5 1-6 5z"/></svg>',
    'збір': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/><path d="M12 14c0 0-3-1-4-4M12 14c0 0 3-1 4-4"/></svg>',
  }
  return icons[type] || '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>'
}
const STATUS_LABEL: Record<string, string> = { pending: 'Очікує', processing: 'Обробляється', shipped: 'Відправлено', completed: 'Виконано', cancelled: 'Скасовано' }
const STATUS_ICON: Record<string, string> = {
  pending: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  processing: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  shipped: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  completed: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  cancelled: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgb(179,69,47)" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
}
const STATUS_BG: Record<string, string> = { pending: 'bg-yellow-50', processing: 'bg-blue-50', shipped: 'bg-agro-hover', completed: 'bg-green-50', cancelled: 'bg-red-50' }

const formatDate = (dt: string) => new Date(dt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  uid.value = session?.user?.id
  if (!uid.value) { loading.value = false; return }

  const { data: profileData } = await supabase.from('users').select('name, role').eq('id', uid.value).single()
  profile.value = profileData
  profileLoaded.value = true

  if (isFarmer.value) {
    const isDacha = role.value === 'dacha'
    const [farmsRes, dachaCropsRes, remRes, ordersRes] = await Promise.all([
      isDacha ? Promise.resolve({ data: [] }) : supabase.from('farms').select('hectares, farm_crops(crop_type)').eq('user_id', uid.value),
      isDacha ? supabase.from('dacha_crops').select('crop_type').eq('user_id', uid.value) : Promise.resolve({ data: [] }),
      supabase.from('reminders').select('id, description, type, scheduled_date').eq('user_id', uid.value).gte('scheduled_date', new Date().toISOString()).order('scheduled_date').limit(3),
      MARKETPLACE ? supabase.from('orders').select('id, status, total').eq('user_id', uid.value).in('status', ['pending', 'processing', 'shipped']).order('created_at', { ascending: false }).limit(3) : Promise.resolve({ data: [] }),
    ])
    const farms = farmsRes.data || []
    const allCrops = isDacha
      ? (dachaCropsRes.data || []).map((c: any) => c.crop_type)
      : [...new Set(farms.flatMap((f: any) => (f.farm_crops || []).map((c: any) => c.crop_type)))]
    farmerStats.value = {
      fields: isDacha ? allCrops.length : farms.length,
      totalHa: isDacha ? 0 : +farms.reduce((s: number, f: any) => s + (f.hectares || 0), 0).toFixed(1),
      crops: isDacha ? 0 : allCrops.length,
      reminders: remRes.data?.length || 0,
    }
    nextReminders.value = remRes.data || []
    activeOrders.value = ordersRes.data || []

    // Підтверджені угоди фермера
    const { data: dealsData } = await supabase
      .from('deals').select('crop_type, quantity_tons, total_price').eq('farmer_id', uid.value).eq('status', 'confirmed')
    const cropMap: Record<string, { qty: number; total: number }> = {}
    for (const d of (dealsData || [])) {
      if (!cropMap[d.crop_type]) cropMap[d.crop_type] = { qty: 0, total: 0 }
      cropMap[d.crop_type].qty += d.quantity_tons
      cropMap[d.crop_type].total += d.total_price || 0
    }
    farmerDeals.value = Object.entries(cropMap).map(([crop, v]) => ({
      crop, qty: `${v.qty} т`, total: v.total,
    }))
  }

  if (isAgronomist.value) {
    const [agreementsRes, chatsRes, remRes] = await Promise.all([
      supabase.from('agreements').select('id, farmer_id, status').eq('agronomist_id', uid.value).neq('status', 'cancelled'),
      supabase.from('chats').select('id, farmer_id').eq('agronomist_id', uid.value).eq('type', 'human').order('updated_at', { ascending: false }).limit(3),
      supabase.from('reminders').select('id').eq('user_id', uid.value).gte('scheduled_date', new Date().toISOString()),
    ])
    const agrData = agreementsRes.data || []
    const chatIds = (chatsRes.data || []).map((c: any) => c.id)
    const farmerIds = (chatsRes.data || []).map((c: any) => c.farmer_id).filter(Boolean)

    const [lastMsgsRes, farmersRes, unreadRes] = await Promise.all([
      chatIds.length ? supabase.from('messages').select('chat_id, content').in('chat_id', chatIds).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
      farmerIds.length ? supabase.from('users').select('id, name').in('id', farmerIds) : Promise.resolve({ data: [] }),
      chatIds.length ? supabase.from('messages').select('chat_id', { count: 'exact' }).in('chat_id', chatIds).eq('role', 'user').eq('is_read', false) : Promise.resolve({ data: [] }),
    ])

    const lastMsgByChat: Record<string, string> = {}
    for (const m of (lastMsgsRes.data || [])) {
      if (!lastMsgByChat[m.chat_id]) lastMsgByChat[m.chat_id] = m.content?.startsWith('[deal:') ? 'Пропозиція угоди' : m.content
    }
    const farmerMap: Record<string, string> = Object.fromEntries((farmersRes.data || []).map((u: any) => [u.id, u.name]))
    const unreadByChat: Record<string, number> = {}
    for (const m of (unreadRes.data || [])) {
      unreadByChat[m.chat_id] = (unreadByChat[m.chat_id] || 0) + 1
    }

    agroStats.value = {
      clients: new Set(agrData.map((a: any) => a.farmer_id)).size,
      active: agrData.filter((a: any) => a.status === 'active').length,
      completed: agrData.filter((a: any) => a.status === 'completed').length,
      chats: chatsRes.data?.length || 0,
    }
    recentChats.value = (chatsRes.data || []).map((c: any) => ({
      id: c.id,
      farmer_name: farmerMap[c.farmer_id] || 'Фермер',
      last_message: lastMsgByChat[c.id] || '',
      unread: unreadByChat[c.id] || 0,
    }))
    const remFull = await supabase.from('reminders').select('id, description, type, scheduled_date').eq('user_id', uid.value).gte('scheduled_date', new Date().toISOString()).order('scheduled_date').limit(3)
    nextReminders.value = remFull.data || []

    // Запити на угоди
    const { data: pendingAgrData } = await supabase.from('agreements')
      .select('id, farmer_id, message, price, price_period, created_at')
      .eq('agronomist_id', uid.value).eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (pendingAgrData?.length) {
      const fIds = [...new Set(pendingAgrData.map((a: any) => a.farmer_id))]
      const { data: fUsers } = await supabase.from('users').select('id, name').in('id', fIds)
      const fMap = Object.fromEntries((fUsers || []).map((u: any) => [u.id, u.name]))
      pendingAgreements.value = pendingAgrData.map((a: any) => ({ ...a, farmer_name: fMap[a.farmer_id] || 'Фермер' }))
    }
  }

  if (isBuyer.value) {
    const chatsRes = await supabase.from('chats').select('id, farmer_id, title')
      .eq('agronomist_id', uid.value).eq('type', 'human').order('created_at', { ascending: false }).limit(5)
    const chatsData = chatsRes.data || []
    const chatIds = chatsData.map((c: any) => c.id)
    const farmerIds = [...new Set(chatsData.map((c: any) => c.farmer_id).filter(Boolean))]

    const [lastMsgsRes, farmersRes, unreadRes, farmersCountRes] = await Promise.all([
      chatIds.length ? supabase.from('messages').select('chat_id, content').in('chat_id', chatIds).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
      farmerIds.length ? supabase.from('users').select('id, name').in('id', farmerIds as string[]) : Promise.resolve({ data: [] }),
      chatIds.length ? supabase.from('messages').select('chat_id', { count: 'exact' }).in('chat_id', chatIds).eq('role', 'user').eq('is_read', false) : Promise.resolve({ data: [], count: 0 }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'farmer'),
    ])

    const lastMsgByChat: Record<string, string> = {}
    for (const m of (lastMsgsRes.data || [])) {
      if (!lastMsgByChat[m.chat_id]) lastMsgByChat[m.chat_id] = m.content?.startsWith('[deal:') ? 'Пропозиція угоди' : m.content
    }
    const farmerMap: Record<string, string> = Object.fromEntries((farmersRes.data || []).map((u: any) => [u.id, u.name]))
    const unreadByChat: Record<string, number> = {}
    for (const m of (unreadRes.data || [])) {
      unreadByChat[m.chat_id] = (unreadByChat[m.chat_id] || 0) + 1
    }

    buyerStats.value = {
      farmers: farmersCountRes.count || 0,
      requests: chatsData.length,
      unread: Object.values(unreadByChat).reduce((s, n) => s + n, 0),
    }
    buyerChats.value = chatsData.map((c: any) => ({
      id: c.id,
      title: c.title,
      farmer_name: farmerMap[c.farmer_id] || 'Фермер',
      last_message: lastMsgByChat[c.id] || '',
      unread: unreadByChat[c.id] || 0,
    }))

    // Завантажуємо підтверджені угоди для статистики
    const { data: dealsData } = await supabase
      .from('deals')
      .select('crop_type, quantity_tons, total_price')
      .eq('buyer_id', uid.value)
      .eq('status', 'confirmed')
    const cropMap: Record<string, { quantity: number; total: number }> = {}
    for (const d of (dealsData || [])) {
      if (!cropMap[d.crop_type]) cropMap[d.crop_type] = { quantity: 0, total: 0 }
      cropMap[d.crop_type].quantity += d.quantity_tons
      cropMap[d.crop_type].total += d.total_price
    }
    buyerCrops.value = Object.entries(cropMap).map(([crop, v]) => ({ crop, ...v }))
  }

  if (MARKETPLACE && isSeller.value) {
    const { data: seller } = await supabase.from('seller_profiles').select('id').eq('user_id', uid.value).single()
    if (seller) {
      const [{ count: p }, { data: orders }] = await Promise.all([
        supabase.from('seller_offers').select('*', { count: 'exact', head: true }).eq('seller_id', seller.id),
        supabase.from('orders').select('total_amount').eq('seller_id', seller.id).eq('status', 'completed'),
      ])
      stats.value = {
        products: p || 0,
        orders: orders?.length || 0,
        revenue: (orders || []).reduce((s: number, o: any) => s + (o.total_amount || 0), 0),
      }
    }
  }

  loading.value = false
})

const acceptDashAgreement = async (ag: any) => {
  await supabase.from('agreements').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', ag.id)
  pendingAgreements.value = pendingAgreements.value.filter((a: any) => a.id !== ag.id)
}

const declineDashAgreement = async (ag: any) => {
  await supabase.from('agreements').update({ status: 'cancelled' }).eq('id', ag.id)
  pendingAgreements.value = pendingAgreements.value.filter((a: any) => a.id !== ag.id)
}
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-card-title { font-family: 'Bitter', Georgia, serif; font-size: 17px; font-weight: 800; color: rgb(27,46,27); margin: 0; }
.dash-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
.dash-stat-num { font-family: 'Bitter', Georgia, serif; font-size: 32px; font-weight: 800; color: rgb(47,82,51); margin: 0; }
.dash-stat-label { font-size: 13px; color: rgb(107,122,100); margin: 4px 0 0; }
</style>
