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
        <div class="card">
          <h2 class="font-bold text-agro-dark mb-5 text-lg">📦 Топ товари по продажах</h2>
          <div v-if="topProducts.length === 0" class="text-agro-light text-sm text-center py-8">Ще немає продажів</div>
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

        <div class="card">
          <h2 class="font-bold text-agro-dark mb-5 text-lg">📋 Замовлення по статусах</h2>
          <div v-if="ordersByStatus.length === 0" class="text-agro-light text-sm text-center py-8">Ще немає замовлень</div>
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
                <span class="text-sm font-medium text-agro-dark">{{ emojiFor(c.crop_type) }} {{ c.crop_type }}</span>
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

      <!-- Продажі по роках -->
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h2 class="font-bold text-agro-dark text-lg">📈 Продажі по культурах</h2>
          <div class="flex gap-1">
            <button v-for="y in availableYears" :key="y"
              @click="selectedYear = y"
              class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              :class="selectedYear === y ? 'bg-agro text-white' : 'bg-agro-bg text-agro-light hover:bg-agro-hover hover:text-agro-dark'">
              {{ y }}
            </button>
          </div>
        </div>

        <div v-if="!salesChartData.length" class="text-center py-12 text-agro-light">
          <p class="text-4xl mb-3">📊</p>
          <p class="text-sm">Немає даних за {{ selectedYear }} рік</p>
          <NuxtLink to="/dashboard/deals" class="text-agro text-sm hover:underline mt-1 inline-block">Додати продаж →</NuxtLink>
        </div>

        <div v-else class="space-y-5">
          <!-- Легенда -->
          <div class="flex gap-4 text-xs">
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-sm bg-agro"></div>
              <span class="text-agro-light">Через платформу</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-sm bg-amber-400"></div>
              <span class="text-agro-light">Вручну</span>
            </div>
          </div>

          <!-- Горизонтальні бари -->
          <div class="space-y-4">
            <div v-for="row in salesChartData" :key="row.crop">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-agro-dark">{{ emojiFor(row.crop) }} {{ row.crop }}</span>
                <span class="text-xs text-agro-light">{{ (row.system + row.manual).toFixed(2) }} т всього</span>
              </div>
              <div class="relative h-7 bg-agro-bg rounded-lg overflow-hidden">
                <div class="absolute left-0 top-0 h-full bg-agro rounded-l-lg transition-all"
                  :style="{ width: ((row.system / row.maxTotal) * 100).toFixed(1) + '%' }">
                </div>
                <div class="absolute top-0 h-full bg-amber-400 transition-all"
                  :style="{ left: ((row.system / row.maxTotal) * 100).toFixed(1) + '%', width: ((row.manual / row.maxTotal) * 100).toFixed(1) + '%' }">
                </div>
                <div class="absolute inset-0 flex items-center px-2 gap-3">
                  <span v-if="row.system > 0" class="text-white text-xs font-semibold drop-shadow">{{ row.system.toFixed(2) }} т</span>
                  <span v-if="row.manual > 0" class="text-amber-900 text-xs font-semibold">{{ row.manual.toFixed(2) }} т</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Підсумок -->
          <div class="grid grid-cols-3 gap-3 pt-4 border-t border-agro-border">
            <div class="text-center">
              <p class="text-xl font-extrabold text-agro">{{ totalSystemTons.toFixed(2) }} т</p>
              <p class="text-xs text-agro-light mt-0.5">Через платформу</p>
            </div>
            <div class="text-center">
              <p class="text-xl font-extrabold text-amber-500">{{ totalManualTons.toFixed(2) }} т</p>
              <p class="text-xs text-agro-light mt-0.5">Вручну</p>
            </div>
            <div class="text-center">
              <p class="text-xl font-extrabold text-agro-dark">{{ (totalSystemTons + totalManualTons).toFixed(2) }} т</p>
              <p class="text-xs text-agro-light mt-0.5">Всього</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Аналітика' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useSeoMeta({ title: 'Аналітика' })

const supabase = useSupabaseClient()
const loading = ref(true)

const farms = ref<any[]>([])
const reminders = ref<any[]>([])
const systemDeals = ref<any[]>([])
const manualSalesList = ref<any[]>([])

const sellerStats = ref({ totalOrders: 0, completedOrders: 0, revenue: 0, products: 0 })
const topProducts = ref<any[]>([])
const ordersByStatus = ref<any[]>([])
const recentOrders = ref<any[]>([])

const selectedYear = ref(new Date().getFullYear())

const { load: loadCrops, emojiFor } = useCropCatalog()
loadCrops()
const STATUS_LABEL: Record<string, string> = { pending: 'Очікує', processing: 'Обробляється', shipped: 'Відправлено', completed: 'Виконано', cancelled: 'Скасовано' }
const STATUS_ICON: Record<string, string> = { pending: '⏳', processing: '⚙️', shipped: '🚚', completed: '✅', cancelled: '❌' }
const STATUS_BG: Record<string, string> = { pending: 'text-yellow-700 bg-yellow-50', processing: 'text-blue-700 bg-blue-50', shipped: 'text-agro bg-agro-hover', completed: 'text-green-700 bg-green-50', cancelled: 'text-red-600 bg-red-50' }
const { pluralFarm } = await import('~/utils/plural')
const pluralField = pluralFarm
const formatDate = (dt: string) => new Date(dt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const { data: userData } = await supabase.from('users').select('role').eq('id', uid).single()
const isSeller = userData?.role === 'seller'

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
const upcomingCount = computed(() => reminders.value.length)

// Роки з наявних даних
const availableYears = computed(() => {
  const years = new Set<number>()
  years.add(new Date().getFullYear())
  for (const d of systemDeals.value) {
    if (d.confirmed_at) years.add(new Date(d.confirmed_at).getFullYear())
  }
  for (const s of manualSalesList.value) {
    if (s.sold_at) years.add(new Date(s.sold_at).getFullYear())
  }
  return [...years].sort((a, b) => b - a)
})

// Дані для діаграми по вибраному року
const salesChartData = computed(() => {
  const map: Record<string, { system: number; manual: number }> = {}

  for (const d of systemDeals.value) {
    if (!d.confirmed_at) continue
    if (new Date(d.confirmed_at).getFullYear() !== selectedYear.value) continue
    const c = d.crop_type || 'Невідомо'
    if (!map[c]) map[c] = { system: 0, manual: 0 }
    map[c].system += d.quantity_tons || 0
  }

  for (const s of manualSalesList.value) {
    if (!s.sold_at) continue
    if (new Date(s.sold_at).getFullYear() !== selectedYear.value) continue
    const c = s.crop_type || 'Невідомо'
    if (!map[c]) map[c] = { system: 0, manual: 0 }
    map[c].manual += s.quantity_tons || 0
  }

  const maxTotal = Math.max(...Object.values(map).map(v => v.system + v.manual), 0.01)
  return Object.entries(map)
    .map(([crop, v]) => ({ crop, system: v.system, manual: v.manual, maxTotal }))
    .sort((a, b) => (b.system + b.manual) - (a.system + a.manual))
})

const totalSystemTons = computed(() => salesChartData.value.reduce((s, r) => s + r.system, 0))
const totalManualTons = computed(() => salesChartData.value.reduce((s, r) => s + r.manual, 0))

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
      .sort((a, b) => b.qty - a.qty).slice(0, 5)

    const statusMap: Record<string, number> = {}
    for (const o of orders) statusMap[o.status] = (statusMap[o.status] || 0) + 1
    ordersByStatus.value = Object.entries(statusMap).map(([status, count]) => ({ status, count }))
    recentOrders.value = orders.slice(0, 5)
  } else {
    const [farmsRes, remRes, dealsRes, manualRes] = await Promise.all([
      supabase.from('farms').select('id, name, region, hectares, farm_crops(crop_type, area_ha)').eq('user_id', uid).order('created_at'),
      supabase.from('reminders').select('id').eq('user_id', uid).gte('scheduled_date', new Date().toISOString()),
      supabase.from('deals').select('crop_type, quantity_tons, confirmed_at').eq('farmer_id', uid).eq('status', 'confirmed'),
      supabase.from('manual_sales').select('crop_type, quantity_tons, sold_at').eq('user_id', uid),
    ])
    farms.value = farmsRes.data || []
    reminders.value = remRes.data || []
    systemDeals.value = dealsRes.data || []
    manualSalesList.value = manualRes.data || []
  }

  loading.value = false
})
</script>
