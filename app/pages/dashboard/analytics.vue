<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-extrabold text-agro-dark">📊 Аналітика</h1>
      <p class="text-agro-light mt-1">{{ isSeller ? 'Статистика продажів і товарів' : 'Зведена статистика по полях і культурах' }}</p>
    </div>

    <div v-if="loading" class="grid md:grid-cols-3 gap-5 mb-8">
      <div v-for="i in 4" :key="i" class="card animate-pulse h-24"></div>
    </div>

    <!-- Аналітика продавця -->
    <template v-else-if="isSeller">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="card text-center">
          <p class="text-3xl font-extrabold text-agro">{{ sellerStats.totalOrders }}</p>
          <p class="text-sm text-agro-light mt-1">Замовлень всього</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-extrabold text-agro">{{ sellerStats.completedOrders }}</p>
          <p class="text-sm text-agro-light mt-1">Виконано</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-extrabold text-agro">{{ sellerStats.revenue }} грн</p>
          <p class="text-sm text-agro-light mt-1">Загальна виручка</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-extrabold text-agro">{{ sellerStats.products }}</p>
          <p class="text-sm text-agro-light mt-1">Активних товарів</p>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <!-- Топ товари -->
        <div class="card">
          <h2 class="font-bold text-agro-dark mb-5 text-lg">📦 Топ товари по продажах</h2>
          <div v-if="topProducts.length === 0" class="text-agro-light text-sm text-center py-8">
            Ще немає продажів
          </div>
          <div v-else class="space-y-3">
            <div v-for="(p, i) in topProducts" :key="p.name" class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-agro text-white text-xs font-bold flex items-center justify-center shrink-0">{{ i + 1 }}</span>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-agro-dark text-sm truncate">{{ p.name }}</p>
                <div class="h-1.5 bg-agro-bg rounded-full mt-1 overflow-hidden">
                  <div class="h-full bg-agro rounded-full" :style="{ width: p.pct + '%' }"></div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-sm font-bold text-agro">{{ p.qty }} шт</p>
                <p class="text-xs text-agro-light">{{ p.revenue }} грн</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Статуси замовлень -->
        <div class="card">
          <h2 class="font-bold text-agro-dark mb-5 text-lg">📋 Замовлення по статусах</h2>
          <div v-if="ordersByStatus.length === 0" class="text-agro-light text-sm text-center py-8">
            Ще немає замовлень
          </div>
          <div v-else class="space-y-3">
            <div v-for="s in ordersByStatus" :key="s.status" class="flex items-center justify-between p-3 rounded-xl bg-agro-bg">
              <div class="flex items-center gap-2">
                <span>{{ STATUS_ICON[s.status] || '📋' }}</span>
                <span class="text-sm font-medium text-agro-dark">{{ STATUS_LABEL[s.status] || s.status }}</span>
              </div>
              <div class="text-right">
                <span class="font-bold text-agro">{{ s.count }}</span>
                <span class="text-xs text-agro-light ml-1">замовл.</span>
              </div>
            </div>
          </div>
          <NuxtLink to="/dashboard/orders" class="btn-outline text-sm mt-4 inline-block">Всі замовлення →</NuxtLink>
        </div>
      </div>

      <!-- Останні замовлення -->
      <div class="card">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-bold text-agro-dark text-lg">🕐 Останні замовлення</h2>
          <NuxtLink to="/dashboard/orders" class="text-sm text-agro font-medium hover:underline">Всі →</NuxtLink>
        </div>
        <div v-if="recentOrders.length === 0" class="text-agro-light text-sm text-center py-6">Немає замовлень</div>
        <div v-else class="space-y-3">
          <div v-for="o in recentOrders" :key="o.id" class="flex items-center justify-between p-3 rounded-xl bg-agro-bg">
            <div>
              <p class="font-medium text-agro-dark text-sm">#{{ o.id.slice(0,8).toUpperCase() }}</p>
              <p class="text-xs text-agro-light">{{ formatDate(o.created_at) }}</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-agro">{{ o.total }} грн</p>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="STATUS_BG[o.status]">{{ STATUS_LABEL[o.status] }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Аналітика фермера -->
    <template v-else>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="card text-center">
          <p class="text-3xl font-extrabold text-agro">{{ totalHa }}</p>
          <p class="text-sm text-agro-light mt-1">га загальна площа</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-extrabold text-agro">{{ farms.length }}</p>
          <p class="text-sm text-agro-light mt-1">{{ pluralFarm(farms.length) }}</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-extrabold text-agro">{{ totalCropsCount }}</p>
          <p class="text-sm text-agro-light mt-1">культур вирощується</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-extrabold text-agro">{{ upcomingCount }}</p>
          <p class="text-sm text-agro-light mt-1">нагадувань заплановано</p>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <div class="card">
          <h2 class="font-bold text-agro-dark mb-5 text-lg">🌱 Культури по площі</h2>
          <div v-if="cropStats.length === 0" class="text-agro-light text-sm text-center py-8">
            Немає даних — додайте культури до полів
          </div>
          <div v-else class="space-y-3">
            <div v-for="c in cropStats" :key="c.crop_type">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-agro-dark">{{ CROP_EMOJI[c.crop_type] || '🌱' }} {{ c.crop_type }}</span>
                <span class="text-sm text-agro font-semibold">{{ c.ha }} га</span>
              </div>
              <div class="h-2 bg-agro-bg rounded-full overflow-hidden">
                <div class="h-full bg-agro rounded-full transition-all" :style="{ width: c.pct + '%' }"></div>
              </div>
              <p class="text-xs text-agro-light mt-0.5">{{ c.pct }}% від загальної площі · {{ c.count }} {{ pluralField(c.count) }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <h2 class="font-bold text-agro-dark mb-5 text-lg">🗺️ Поля</h2>
          <div v-if="farms.length === 0" class="text-agro-light text-sm text-center py-8">Немає полів</div>
          <div v-else class="space-y-3">
            <div v-for="farm in farms" :key="farm.id"
              class="flex items-center gap-3 p-3 rounded-xl bg-agro-bg hover:bg-agro-hover transition-colors cursor-pointer"
              @click="navigateTo(`/dashboard/farm/${farm.id}`)">
              <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shrink-0 border border-agro-border">🌾</div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-agro-dark text-sm truncate">{{ farm.name }}</p>
                <p class="text-xs text-agro-light">{{ farm.farm_crops?.length || 0 }} культур<span v-if="farm.region"> · 📍 {{ farm.region }}</span></p>
              </div>
              <span class="font-bold text-agro text-sm shrink-0">{{ farm.hectares }} га</span>
            </div>
          </div>
          <NuxtLink to="/dashboard/fields" class="btn-outline text-sm mt-4 inline-block">Управляти полями →</NuxtLink>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-bold text-agro-dark text-lg">🔔 Найближчі нагадування</h2>
          <NuxtLink to="/dashboard/reminders" class="text-sm text-agro font-medium hover:underline">Всі →</NuxtLink>
        </div>
        <div v-if="upcoming.length === 0" class="text-agro-light text-sm text-center py-6">Немає запланованих нагадувань</div>
        <div v-else class="space-y-3">
          <div v-for="r in upcoming.slice(0, 5)" :key="r.id" class="flex items-center gap-3 p-3 rounded-xl bg-agro-bg">
            <div class="w-9 h-9 rounded-xl bg-agro-hover flex items-center justify-center text-lg shrink-0">{{ TYPE_EMOJI[r.type] || '🔔' }}</div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-agro-dark text-sm truncate">{{ r.description }}</p>
            </div>
            <span class="text-xs text-agro font-medium shrink-0">{{ formatDate(r.scheduled_date) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useSeoMeta({ title: 'Аналітика' })

const supabase = useSupabaseClient()
const loading = ref(true)

// Фермер
const farms = ref<any[]>([])
const reminders = ref<any[]>([])

// Продавець
const sellerStats = ref({ totalOrders: 0, completedOrders: 0, revenue: 0, products: 0 })
const topProducts = ref<any[]>([])
const ordersByStatus = ref<any[]>([])
const recentOrders = ref<any[]>([])

const CROP_EMOJI: Record<string, string> = {
  'Смородина': '🫐', 'Полуниця': '🍓', 'Томати': '🍅', 'Огірки': '🥒',
  'Картопля': '🥔', 'Яблука': '🍎', 'Груші': '🍐', 'Виноград': '🍇',
  'Пшениця': '🌾', 'Соняшник': '🌻', 'Ріпак': '🌿', 'Соя': '🫘',
  'Ячмінь': '🌾', 'Жито': '🌾', 'Буряк': '🫚',
}
const STATUS_LABEL: Record<string, string> = { pending: 'Очікує', processing: 'Обробляється', shipped: 'Відправлено', completed: 'Виконано', cancelled: 'Скасовано' }
const STATUS_ICON: Record<string, string> = { pending: '⏳', processing: '⚙️', shipped: '🚚', completed: '✅', cancelled: '❌' }
const STATUS_BG: Record<string, string> = { pending: 'text-yellow-700 bg-yellow-50', processing: 'text-blue-700 bg-blue-50', shipped: 'text-agro bg-agro-hover', completed: 'text-green-700 bg-green-50', cancelled: 'text-red-600 bg-red-50' }
const TYPE_EMOJI: Record<string, string> = { 'обробка': '🛡', 'підживлення': '🌿', 'полив': '💧', 'посів': '🌱', 'збір': '🌾', 'інше': '🔔' }
const pluralFarm = (n: number) => n === 1 ? 'поле' : n >= 2 && n <= 4 ? 'поля' : 'полів'
const pluralField = (n: number) => n === 1 ? 'поле' : n >= 2 && n <= 4 ? 'поля' : 'полів'
const formatDate = (dt: string) => new Date(dt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const { data: userData } = await supabase.from('users').select('role').eq('id', uid).single()
const isSeller = userData?.role === 'seller'

onMounted(async () => {
  if (!uid) return

  if (isSeller) {
    const { data: sp } = await supabase.from('seller_profiles').select('id').eq('user_id', uid).single()
    const sellerId = sp?.id
    if (!sellerId) { loading.value = false; return }

    const [offersRes, ordersRes] = await Promise.all([
      supabase.from('seller_offers').select('id, product_name, in_stock').eq('seller_id', sellerId),
      supabase.from('orders').select('id, status, total, created_at, order_items(quantity, price, offer_id, seller_offers(product_name))').eq('seller_id', sellerId).order('created_at', { ascending: false }),
    ])

    const orders = ordersRes.data || []
    const offers = offersRes.data || []

    sellerStats.value = {
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      revenue: orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0),
      products: offers.filter(o => o.in_stock).length,
    }

    // Топ товари
    const productMap: Record<string, { qty: number; revenue: number }> = {}
    for (const o of orders) {
      if (o.status === 'cancelled') continue
      for (const item of (o.order_items || [])) {
        const name = item.seller_offers?.product_name || 'Невідомо'
        if (!productMap[name]) productMap[name] = { qty: 0, revenue: 0 }
        productMap[name].qty += item.quantity || 0
        productMap[name].revenue += (item.price || 0) * (item.quantity || 0)
      }
    }
    const maxQty = Math.max(...Object.values(productMap).map(p => p.qty), 1)
    topProducts.value = Object.entries(productMap)
      .map(([name, v]) => ({ name, ...v, pct: Math.round((v.qty / maxQty) * 100) }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    // По статусах
    const statusMap: Record<string, number> = {}
    for (const o of orders) statusMap[o.status] = (statusMap[o.status] || 0) + 1
    ordersByStatus.value = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

    recentOrders.value = orders.slice(0, 5)
  } else {
    const [farmsRes, remRes] = await Promise.all([
      supabase.from('farms').select('id, name, region, hectares, farm_crops(crop_type, area_ha)').eq('user_id', uid).order('created_at'),
      supabase.from('reminders').select('id, description, type, scheduled_date').eq('user_id', uid).gte('scheduled_date', new Date().toISOString()).order('scheduled_date').limit(10),
    ])
    farms.value = farmsRes.data || []
    reminders.value = remRes.data || []
  }

  loading.value = false
})

// Фермер computed
const totalHa = computed(() => farms.value.reduce((s, f) => s + (f.hectares || 0), 0).toFixed(1).replace(/\.0$/, ''))
const allCrops = computed(() => farms.value.flatMap((f: any) => f.farm_crops || []))
const totalCropsCount = computed(() => new Set(allCrops.value.map((c: any) => c.crop_type)).size)
const cropStats = computed(() => {
  const total = parseFloat(totalHa.value) || 0
  const map: Record<string, { ha: number; count: number }> = {}
  for (const f of farms.value) {
    for (const c of f.farm_crops || []) {
      if (!map[c.crop_type]) map[c.crop_type] = { ha: 0, count: 0 }
      map[c.crop_type].ha += c.area_ha || 0
      map[c.crop_type].count++
    }
  }
  return Object.entries(map)
    .map(([crop_type, v]) => ({ crop_type, ha: +v.ha.toFixed(2), count: v.count, pct: total > 0 ? Math.round((v.ha / total) * 100) : 0 }))
    .sort((a, b) => b.ha - a.ha)
})
const upcoming = computed(() => reminders.value)
const upcomingCount = computed(() => reminders.value.length)
</script>
