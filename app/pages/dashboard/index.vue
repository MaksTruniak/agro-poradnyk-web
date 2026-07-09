<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-extrabold text-agro-dark">Привіт, {{ profile?.name || 'друже' }} 👋</h1>
      <p class="text-agro-light mt-1">{{ roleLabel }}</p>
    </div>

    <!-- Фермер / Дачник -->
    <template v-if="isFarmer">
      <!-- Скелетон -->
      <template v-if="loading">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div v-for="i in 4" :key="i" class="card animate-pulse h-20"></div>
        </div>
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <div class="card animate-pulse h-40"></div>
          <div class="card animate-pulse h-40"></div>
        </div>
      </template>

      <template v-else>
        <!-- Зведення -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <NuxtLink to="/dashboard/fields" class="card text-center hover:shadow-md transition-shadow">
            <p class="text-3xl font-extrabold text-agro">{{ farmerStats.fields }}</p>
            <p class="text-sm text-agro-light mt-1">{{ role === 'dacha' ? 'культур' : 'полів' }}</p>
          </NuxtLink>
          <NuxtLink v-if="role !== 'dacha'" to="/dashboard/fields" class="card text-center hover:shadow-md transition-shadow">
            <p class="text-3xl font-extrabold text-agro">{{ farmerStats.totalHa }}</p>
            <p class="text-sm text-agro-light mt-1">га загальна площа</p>
          </NuxtLink>
          <NuxtLink v-if="role !== 'dacha'" to="/dashboard/analytics" class="card text-center hover:shadow-md transition-shadow">
            <p class="text-3xl font-extrabold text-agro">{{ farmerStats.crops }}</p>
            <p class="text-sm text-agro-light mt-1">культур вирощується</p>
          </NuxtLink>
          <NuxtLink to="/dashboard/reminders" class="card text-center hover:shadow-md transition-shadow">
            <p class="text-3xl font-extrabold text-agro">{{ farmerStats.reminders }}</p>
            <p class="text-sm text-agro-light mt-1">нагадувань</p>
          </NuxtLink>
        </div>

        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <!-- Найближчі нагадування -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-bold text-agro-dark">🔔 Найближчі нагадування</h2>
              <NuxtLink to="/dashboard/reminders" class="text-sm text-agro hover:underline">Всі →</NuxtLink>
            </div>
            <div v-if="nextReminders.length === 0" class="text-agro-light text-sm text-center py-6">
              Немає запланованих нагадувань
              <div class="mt-3"><NuxtLink to="/dashboard/reminders" class="btn-primary text-sm inline-block">➕ Додати</NuxtLink></div>
            </div>
            <div v-else class="space-y-3">
              <div v-for="r in nextReminders" :key="r.id" class="flex items-center gap-3 p-3 bg-agro-bg rounded-xl">
                <div class="w-9 h-9 rounded-xl bg-agro-hover flex items-center justify-center text-lg shrink-0">{{ TYPE_EMOJI[r.type] || '🔔' }}</div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-agro-dark text-sm truncate">{{ r.description }}</p>
                  <p class="text-xs text-agro mt-0.5">{{ formatDate(r.scheduled_date) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Активні замовлення (маркетплейс) -->
          <div v-if="MARKETPLACE" class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-bold text-agro-dark">📋 Активні замовлення</h2>
              <NuxtLink to="/dashboard/orders" class="text-sm text-agro hover:underline">Всі →</NuxtLink>
            </div>
            <div v-if="activeOrders.length === 0" class="text-agro-light text-sm text-center py-6">
              Немає активних замовлень
              <div class="mt-3"><NuxtLink to="/catalog" class="btn-primary text-sm inline-block">📖 До каталогу</NuxtLink></div>
            </div>
            <div v-else class="space-y-3">
              <div v-for="o in activeOrders" :key="o.id" class="flex items-center gap-3 p-3 bg-agro-bg rounded-xl">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  :class="STATUS_BG[o.status]">{{ STATUS_ICON[o.status] }}</div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-agro-dark text-sm">#{{ o.id.slice(0,8).toUpperCase() }}</p>
                  <p class="text-xs text-agro-light mt-0.5">{{ STATUS_LABEL[o.status] }} · {{ o.total }} грн</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Швидкі дії -->
      <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <NuxtLink to="/dashboard/fields" class="card hover:shadow-md transition-shadow flex items-center gap-3">
          <span class="text-2xl">🌾</span>
          <div><p class="font-bold text-agro-dark text-sm">{{ role === 'dacha' ? 'Мої культури' : 'Мої поля' }}</p></div>
        </NuxtLink>
        <NuxtLink to="/dashboard/analytics" class="card hover:shadow-md transition-shadow flex items-center gap-3">
          <span class="text-2xl">📊</span>
          <div><p class="font-bold text-agro-dark text-sm">Аналітика</p></div>
        </NuxtLink>
        <NuxtLink to="/dashboard/chats" class="card hover:shadow-md transition-shadow flex items-center gap-3">
          <span class="text-2xl">💬</span>
          <div><p class="font-bold text-agro-dark text-sm">Чати з агрономами</p></div>
        </NuxtLink>
        <NuxtLink to="/catalog" class="card hover:shadow-md transition-shadow flex items-center gap-3">
          <span class="text-2xl">🛒</span>
          <div><p class="font-bold text-agro-dark text-sm">Каталог препаратів</p></div>
        </NuxtLink>
      </div>
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
            <p class="text-3xl font-bold text-agro">{{ stats.products }}</p>
            <p class="text-agro-light text-sm mt-1">Товарів</p>
          </div>
          <div class="card">
            <p class="text-3xl font-bold text-agro">{{ stats.orders }}</p>
            <p class="text-agro-light text-sm mt-1">Замовлень</p>
          </div>
          <div class="card">
            <p class="text-3xl font-bold text-agro">{{ stats.revenue }} грн</p>
            <p class="text-agro-light text-sm mt-1">Виручки</p>
          </div>
        </div>
        <NuxtLink to="/dashboard/products" class="btn-primary inline-block">Мої товари →</NuxtLink>
      </template>
    </template>

    <!-- Агроном -->
    <template v-else-if="isAgronomist">
      <template v-if="loading">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div v-for="i in 4" :key="i" class="card animate-pulse h-20"></div>
        </div>
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <div class="card animate-pulse h-40"></div>
          <div class="card animate-pulse h-40"></div>
        </div>
      </template>

      <template v-else>
        <!-- Зведення -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <NuxtLink to="/dashboard/fields" class="card text-center hover:shadow-md transition-shadow">
            <p class="text-3xl font-extrabold text-agro">{{ agroStats.myFields }}</p>
            <p class="text-sm text-agro-light mt-1">моїх полів</p>
          </NuxtLink>
          <NuxtLink to="/dashboard/agronomist-fields" class="card text-center hover:shadow-md transition-shadow">
            <p class="text-3xl font-extrabold text-agro">{{ agroStats.clientFields }}</p>
            <p class="text-sm text-agro-light mt-1">полів клієнтів</p>
          </NuxtLink>
          <NuxtLink to="/dashboard/chats" class="card text-center hover:shadow-md transition-shadow">
            <p class="text-3xl font-extrabold text-agro">{{ agroStats.chats }}</p>
            <p class="text-sm text-agro-light mt-1">консультацій</p>
          </NuxtLink>
          <NuxtLink to="/dashboard/reminders" class="card text-center hover:shadow-md transition-shadow">
            <p class="text-3xl font-extrabold text-agro">{{ agroStats.reminders }}</p>
            <p class="text-sm text-agro-light mt-1">нагадувань</p>
          </NuxtLink>
        </div>

        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <!-- Найближчі нагадування -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-bold text-agro-dark">🔔 Найближчі нагадування</h2>
              <NuxtLink to="/dashboard/reminders" class="text-sm text-agro hover:underline">Всі →</NuxtLink>
            </div>
            <div v-if="nextReminders.length === 0" class="text-agro-light text-sm text-center py-6">
              Немає запланованих нагадувань
              <div class="mt-3"><NuxtLink to="/dashboard/reminders" class="btn-primary text-sm inline-block">➕ Додати</NuxtLink></div>
            </div>
            <div v-else class="space-y-3">
              <div v-for="r in nextReminders" :key="r.id" class="flex items-center gap-3 p-3 bg-agro-bg rounded-xl">
                <div class="w-9 h-9 rounded-xl bg-agro-hover flex items-center justify-center text-lg shrink-0">{{ TYPE_EMOJI[r.type] || '🔔' }}</div>
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
              <h2 class="font-bold text-agro-dark">💬 Консультації</h2>
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

        <!-- Швидкі дії -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NuxtLink to="/dashboard/fields" class="card hover:shadow-md transition-shadow flex items-center gap-3">
            <span class="text-2xl">🌾</span>
            <p class="font-bold text-agro-dark text-sm">Мої поля</p>
          </NuxtLink>
          <NuxtLink to="/dashboard/agronomist-fields" class="card hover:shadow-md transition-shadow flex items-center gap-3">
            <span class="text-2xl">🗺️</span>
            <p class="font-bold text-agro-dark text-sm">Поля клієнтів</p>
          </NuxtLink>
          <NuxtLink to="/dashboard/ai-chat" class="card hover:shadow-md transition-shadow flex items-center gap-3">
            <span class="text-2xl">🤖</span>
            <p class="font-bold text-agro-dark text-sm">AI агроном</p>
          </NuxtLink>
          <NuxtLink to="/catalog" class="card hover:shadow-md transition-shadow flex items-center gap-3">
            <span class="text-2xl">📖</span>
            <p class="font-bold text-agro-dark text-sm">Каталог препаратів</p>
          </NuxtLink>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const MARKETPLACE = false

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const { data: profile } = await useAsyncData('profile', async () => {
  if (!uid) return null
  const { data } = await supabase.from('users').select('name, role').eq('id', uid).single()
  return data
})

const role = computed(() => profile.value?.role || 'farmer')
const isFarmer = computed(() => role.value === 'farmer' || role.value === 'dacha')
const isAgronomist = computed(() => role.value === 'agronomist')
const isSeller = computed(() => role.value === 'seller')

const ROLE_LABELS: Record<string, string> = { farmer: 'Фермер', dacha: 'Дачник', agronomist: 'Агроном', seller: 'Продавець' }
const roleLabel = computed(() => ROLE_LABELS[role.value] || '')

const loading = ref(true)
const stats = ref({ products: 0, orders: 0, revenue: 0 })
const farmerStats = ref({ fields: 0, totalHa: 0, crops: 0, reminders: 0 })
const agroStats = ref({ myFields: 0, clientFields: 0, chats: 0, reminders: 0 })
const nextReminders = ref<any[]>([])
const recentChats = ref<any[]>([])
const activeOrders = ref<any[]>([])

const TYPE_EMOJI: Record<string, string> = { 'обробка': '🛡', 'підживлення': '🌿', 'полив': '💧', 'посів': '🌱', 'збір': '🌾', 'інше': '🔔' }
const STATUS_LABEL: Record<string, string> = { pending: 'Очікує', processing: 'Обробляється', shipped: 'Відправлено', completed: 'Виконано', cancelled: 'Скасовано' }
const STATUS_ICON: Record<string, string> = { pending: '⏳', processing: '⚙️', shipped: '🚚', completed: '✅', cancelled: '❌' }
const STATUS_BG: Record<string, string> = { pending: 'bg-yellow-50', processing: 'bg-blue-50', shipped: 'bg-agro-hover', completed: 'bg-green-50', cancelled: 'bg-red-50' }

const formatDate = (dt: string) => new Date(dt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

onMounted(async () => {
  if (!uid) { loading.value = false; return }

  if (isFarmer.value) {
    const isDacha = role.value === 'dacha'
    const [farmsRes, dachaCropsRes, remRes, ordersRes] = await Promise.all([
      isDacha ? Promise.resolve({ data: [] }) : supabase.from('farms').select('hectares, farm_crops(crop_type)').eq('user_id', uid),
      isDacha ? supabase.from('dacha_crops').select('crop_type').eq('user_id', uid) : Promise.resolve({ data: [] }),
      supabase.from('reminders').select('id, description, type, scheduled_date').eq('user_id', uid).gte('scheduled_date', new Date().toISOString()).order('scheduled_date').limit(3),
      MARKETPLACE ? supabase.from('orders').select('id, status, total').eq('user_id', uid).in('status', ['pending', 'processing', 'shipped']).order('created_at', { ascending: false }).limit(3) : Promise.resolve({ data: [] }),
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
  }

  if (isAgronomist.value) {
    const [farmsRes, clientFieldsRes, chatsRes, remRes] = await Promise.all([
      supabase.from('farms').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('farms').select('id', { count: 'exact', head: true }).eq('agronomist_id', uid),
      supabase.from('chats').select('id, farmer_id').eq('agronomist_id', uid).eq('type', 'human').order('updated_at', { ascending: false }).limit(3),
      supabase.from('reminders').select('id').eq('user_id', uid).gte('scheduled_date', new Date().toISOString()),
    ])
    const chatIds = (chatsRes.data || []).map((c: any) => c.id)
    const farmerIds = (chatsRes.data || []).map((c: any) => c.farmer_id).filter(Boolean)

    const [lastMsgsRes, farmersRes, unreadRes] = await Promise.all([
      chatIds.length ? supabase.from('messages').select('chat_id, content').in('chat_id', chatIds).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
      farmerIds.length ? supabase.from('users').select('id, name').in('id', farmerIds) : Promise.resolve({ data: [] }),
      chatIds.length ? supabase.from('messages').select('chat_id', { count: 'exact' }).in('chat_id', chatIds).eq('role', 'user').eq('is_read', false) : Promise.resolve({ data: [] }),
    ])

    const lastMsgByChat: Record<string, string> = {}
    for (const m of (lastMsgsRes.data || [])) {
      if (!lastMsgByChat[m.chat_id]) lastMsgByChat[m.chat_id] = m.content
    }
    const farmerMap: Record<string, string> = Object.fromEntries((farmersRes.data || []).map((u: any) => [u.id, u.name]))
    const unreadByChat: Record<string, number> = {}
    for (const m of (unreadRes.data || [])) {
      unreadByChat[m.chat_id] = (unreadByChat[m.chat_id] || 0) + 1
    }

    agroStats.value = {
      myFields: farmsRes.count || 0,
      clientFields: clientFieldsRes.count || 0,
      chats: chatsRes.data?.length || 0,
      reminders: remRes.data?.length || 0,
    }
    recentChats.value = (chatsRes.data || []).map((c: any) => ({
      id: c.id,
      farmer_name: farmerMap[c.farmer_id] || 'Фермер',
      last_message: lastMsgByChat[c.id] || '',
      unread: unreadByChat[c.id] || 0,
    }))
    const remFull = await supabase.from('reminders').select('id, description, type, scheduled_date').eq('user_id', uid).gte('scheduled_date', new Date().toISOString()).order('scheduled_date').limit(3)
    nextReminders.value = remFull.data || []
  }

  if (MARKETPLACE && isSeller.value) {
    const { data: seller } = await supabase.from('seller_profiles').select('id').eq('user_id', uid).single()
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
</script>
