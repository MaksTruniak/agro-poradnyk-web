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

          <!-- Активні замовлення -->
          <div class="card">
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

    <!-- Продавець -->
    <template v-else-if="isSeller">
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
      <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <NuxtLink to="/dashboard/fields" class="card hover:shadow-md transition-shadow">
          <div class="text-3xl mb-3">🌾</div>
          <p class="font-bold text-agro-dark">Мої поля</p>
          <p class="text-agro-light text-sm mt-1">Власні поля, культури та програми захисту</p>
        </NuxtLink>
        <NuxtLink to="/dashboard/agronomist-fields" class="card hover:shadow-md transition-shadow">
          <div class="text-3xl mb-3">🗺</div>
          <p class="font-bold text-agro-dark">Поля клієнтів</p>
          <p class="text-agro-light text-sm mt-1">Поля фермерів які поділились з вами</p>
        </NuxtLink>
        <NuxtLink to="/dashboard/chats" class="card hover:shadow-md transition-shadow">
          <div class="text-3xl mb-3">💬</div>
          <p class="font-bold text-agro-dark">Консультації</p>
          <p class="text-agro-light text-sm mt-1">Чати з клієнтами та відповіді на питання</p>
        </NuxtLink>
        <NuxtLink to="/dashboard/agronomist-profile" class="card hover:shadow-md transition-shadow">
          <div class="text-3xl mb-3">🔬</div>
          <p class="font-bold text-agro-dark">Кабінет агронома</p>
          <p class="text-agro-light text-sm mt-1">Профіль агронома, статистика та просування</p>
        </NuxtLink>
        <NuxtLink to="/dashboard/ai-chat" class="card hover:shadow-md transition-shadow">
          <div class="text-3xl mb-3">🤖</div>
          <p class="font-bold text-agro-dark">AI агроном</p>
          <p class="text-agro-light text-sm mt-1">Допомога з агрономічними питаннями від AI</p>
        </NuxtLink>
        <NuxtLink to="/catalog" class="card hover:shadow-md transition-shadow">
          <div class="text-3xl mb-3">📖</div>
          <p class="font-bold text-agro-dark">Каталог</p>
          <p class="text-agro-light text-sm mt-1">Препарати та добрива для рекомендацій</p>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

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
const nextReminders = ref<any[]>([])
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
      supabase.from('orders').select('id, status, total').eq('user_id', uid).in('status', ['pending', 'processing', 'shipped']).order('created_at', { ascending: false }).limit(3),
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

  if (isSeller.value) {
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
