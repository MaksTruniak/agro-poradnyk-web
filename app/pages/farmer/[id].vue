<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-agro-light mb-8">
      <NuxtLink to="/farmers" class="hover:text-agro transition-colors">Фермери</NuxtLink>
      <span>/</span>
      <span class="text-agro-dark">{{ farmer?.name || '...' }}</span>
    </div>

    <div v-if="loading" class="space-y-5">
      <div class="card animate-pulse h-40"></div>
      <div class="card animate-pulse h-60"></div>
    </div>

    <div v-else-if="!farmer" class="text-center py-20">
      <p class="text-5xl mb-4">🌾</p>
      <p class="font-bold text-agro-dark text-lg">Фермера не знайдено</p>
      <NuxtLink to="/farmers" class="text-agro text-sm mt-2 inline-block hover:underline">← До списку фермерів</NuxtLink>
    </div>

    <div v-else class="space-y-6">
      <!-- Шапка профілю -->
      <div class="card">
        <div class="flex items-start gap-5">
          <div class="w-20 h-20 rounded-2xl bg-agro-hover flex items-center justify-center font-bold text-agro text-3xl shrink-0">
            {{ farmer.name?.[0]?.toUpperCase() || '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-2xl font-extrabold text-agro-dark">{{ farmer.name }}</h1>
              <span v-if="farmer.is_verified_farmer" class="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full font-semibold">✅ Перевірений фермер</span>
            </div>
            <p v-if="farmer.city || farmer.region" class="text-agro-light mt-1">
              📍 {{ [farmer.city, farmer.region].filter(Boolean).join(', ') }}
            </p>
            <p v-if="farmer.created_at" class="text-xs text-agro-light mt-2">
              На платформі з {{ formatDate(farmer.created_at) }}
            </p>
            <div class="flex items-center gap-1.5 mt-2">
              <span class="text-amber-400">⭐</span>
              <template v-if="farmer.farmer_rating > 0">
                <span class="font-bold text-agro-dark">{{ farmer.farmer_rating }}</span>
                <span class="text-xs text-agro-light">({{ farmer.farmer_reviews_count }} {{ farmer.farmer_reviews_count === 1 ? 'оцінка' : farmer.farmer_reviews_count < 5 ? 'оцінки' : 'оцінок' }})</span>
              </template>
              <span v-else class="text-xs text-agro-light">Поки немає оцінок</span>
            </div>
          </div>
          <button v-if="uid !== farmerId" @click="startChat" :disabled="starting"
            class="btn-primary shrink-0 text-sm py-2.5 px-5">
            {{ starting ? '...' : '💬 Написати' }}
          </button>
        </div>

        <!-- Статистика -->
        <div class="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-agro-border">
          <div class="text-center">
            <p class="text-2xl font-extrabold text-agro-dark">{{ totalHa }}</p>
            <p class="text-xs text-agro-light mt-0.5">га загалом</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-extrabold text-agro-dark">{{ allCrops.length }}</p>
            <p class="text-xs text-agro-light mt-0.5">{{ pluralCrop(allCrops.length) }}</p>
          </div>
        </div>
      </div>

      <!-- Культури -->
      <div class="card" v-if="allCrops.length">
        <h2 class="font-bold text-agro-dark text-lg mb-5">🌱 Що вирощує</h2>
        <div class="divide-y divide-agro-border">
          <div v-for="crop in allCrops" :key="crop.id"
            class="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
            <span class="text-2xl shrink-0">{{ cropEmoji(crop.crop_type) }}</span>
            <div class="flex-1 min-w-0">
              <NuxtLink :to="`/farmers/${cropToSlug(crop.crop_type)}`"
                class="font-semibold text-agro-dark hover:text-agro transition-colors">
                {{ crop.crop_type }}
              </NuxtLink>
              <p v-if="crop.variety" class="text-xs text-agro-light">Сорт: {{ crop.variety }}</p>
              <p v-if="crop.farm_city || crop.farm_region" class="text-xs text-agro-light">
                📍 {{ [crop.farm_city, crop.farm_region].filter(Boolean).join(', ') }}
              </p>
            </div>
            <div class="text-right shrink-0 space-y-1">
              <p v-if="crop.area_ha" class="text-sm font-medium text-agro-dark">{{ crop.area_ha }} га</p>
              <p v-if="crop.planned_yield_t" class="text-xs text-agro-light">план {{ crop.planned_yield_t }} т/га</p>
            </div>
            <button v-if="uid !== farmerId" @click="openRequestModal(crop)"
              class="shrink-0 text-xs font-semibold border-2 border-agro text-agro rounded-xl px-3 py-1.5 hover:bg-agro hover:text-white transition-colors whitespace-nowrap">
              📩 Зробити запит
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Модалка запиту -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="requestModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="requestModal.show = false" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
          <h2 class="font-bold text-agro-dark text-lg mb-1">📩 Зробити запит</h2>
          <p class="text-sm text-agro-light mb-4">{{ requestModal.crop?.crop_type }}{{ requestModal.crop?.variety ? ` · ${requestModal.crop.variety}` : '' }}</p>
          <div class="space-y-3 mb-5">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Кількість</label>
              <div class="flex gap-2">
                <input v-model="requestModal.quantity" type="number" min="0.1" step="0.1" class="input flex-1" placeholder="50" />
                <div class="flex rounded-xl border border-agro-border overflow-hidden shrink-0">
                  <button @click="requestModal.unit = 'т'" type="button"
                    class="px-3 py-2 text-sm font-semibold transition-colors"
                    :class="requestModal.unit === 'т' ? 'bg-agro text-white' : 'bg-white text-agro-light hover:bg-agro-hover'">т</button>
                  <button @click="requestModal.unit = 'кг'" type="button"
                    class="px-3 py-2 text-sm font-semibold transition-colors"
                    :class="requestModal.unit === 'кг' ? 'bg-agro text-white' : 'bg-white text-agro-light hover:bg-agro-hover'">кг</button>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Ціна за {{ requestModal.unit }} (грн)</label>
              <input v-model="requestModal.price" type="number" min="1" class="input" :placeholder="requestModal.unit === 'т' ? '5000' : '5'" />
            </div>
            <div v-if="requestModal.quantity && requestModal.price" class="bg-agro-hover rounded-xl px-4 py-3">
              <p class="text-xs text-agro-light mb-0.5">Загальна сума</p>
              <p class="text-xl font-extrabold text-agro">{{ (requestModal.quantity * requestModal.price).toLocaleString('uk-UA') }} грн</p>
            </div>
          </div>
          <div class="flex gap-3">
            <button @click="requestModal.show = false" class="btn-outline flex-1">Скасувати</button>
            <button @click="submitRequest" :disabled="!requestModal.quantity || !requestModal.price || requestModal.saving" class="btn-primary flex-1">
              {{ requestModal.saving ? '...' : 'Надіслати' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const { cropEmoji, cropToSlug } = await import('~/utils/cropSlugs')

const farmerId = route.params.id as string

const starting = ref(false)
const requestModal = reactive({ show: false, crop: null as any, quantity: 0, unit: 'т', price: 0, saving: false })

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id
const canChat = computed(() => uid && uid !== farmerId)

const allCrops = computed(() => {
  const seen = new Set()
  const result: any[] = []
  for (const farm of farms.value) {
    for (const c of (farm.farm_crops || [])) {
      const key = `${c.crop_type}|${c.variety || ''}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push({ ...c, farm_city: farm.city, farm_region: farm.region })
      }
    }
  }
  return result.sort((a, b) => (b.area_ha || 0) - (a.area_ha || 0))
})

const totalHa = computed(() =>
  farms.value.reduce((s, f) => s + (parseFloat(f.hectares) || 0), 0).toFixed(1).replace(/\.0$/, '')
)

const { pluralFarm, pluralCrop } = await import('~/utils/plural')

const formatDate = (d: string) => new Date(d).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long' })

const openRequestModal = (crop: any) => {
  if (!uid) { navigateTo('/auth'); return }
  requestModal.crop = crop
  requestModal.quantity = 0
  requestModal.unit = 'т'
  requestModal.price = 0
  requestModal.show = true
}

const submitRequest = async () => {
  if (!requestModal.quantity || !requestModal.price) return
  requestModal.saving = true
  const crop = requestModal.crop
  const title = `Запит на купівлю: ${crop.crop_type}${crop.variety ? ` (${crop.variety})` : ''}`

  // Створюємо чат
  const { data: nc } = await supabase.from('chats')
    .insert({ farmer_id: farmerId, agronomist_id: uid, type: 'human', is_unlocked: true, title })
    .select().single()

  if (nc) {
    // Конвертуємо в тонни для БД
    const quantityTons = requestModal.unit === 'кг' ? requestModal.quantity / 1000 : requestModal.quantity
    const pricePerTon = requestModal.unit === 'кг' ? requestModal.price * 1000 : requestModal.price

    // Створюємо deal
    const { data: deal } = await supabase.from('deals').insert({
      chat_id: nc.id,
      buyer_id: uid,
      farmer_id: farmerId,
      crop_type: crop.crop_type,
      quantity_tons: quantityTons,
      price_per_ton: pricePerTon,
      proposed_by: uid,
    }).select().single()

    if (deal) {
      // Перше повідомлення — картка пропозиції
      await supabase.from('messages').insert({
        chat_id: nc.id,
        role: 'assistant',
        content: `[deal:${deal.id}:${requestModal.unit}:${requestModal.quantity}:${requestModal.price}]`,
        is_read: false,
      })
    }
    router.push(`/dashboard/chats/${nc.id}`)
  }
  requestModal.saving = false
  requestModal.show = false
}

const startChat = async () => {
  if (!uid) { navigateTo('/auth'); return }
  starting.value = true
  const { data: existing } = await supabase.from('chats').select('id')
    .eq('farmer_id', farmerId).eq('agronomist_id', uid).eq('type', 'human').single()
  if (existing) { router.push(`/dashboard/chats/${existing.id}`); return }
  const { data: existing2 } = await supabase.from('chats').select('id')
    .eq('farmer_id', uid).eq('agronomist_id', farmerId).eq('type', 'human').single()
  if (existing2) { router.push(`/dashboard/chats/${existing2.id}`); return }
  const { data: newChat } = await supabase.from('chats')
    .insert({ farmer_id: uid, agronomist_id: farmerId, type: 'human', is_unlocked: true })
    .select().single()
  starting.value = false
  if (newChat) router.push(`/dashboard/chats/${newChat.id}`)
}

const { data: pageData, pending } = useLazyAsyncData(`farmer-${farmerId}`, async () => {
  const [userRes, farmsRes] = await Promise.all([
    supabase.from('users').select('id, name, region, city, created_at, farmer_rating, farmer_reviews_count, is_verified_farmer').eq('id', farmerId).eq('role', 'farmer').single(),
    supabase.from('farms').select('id, name, region, city, hectares, farm_crops(id, crop_type, variety, area_ha, planned_yield_t)').eq('user_id', farmerId),
  ])
  return { farmer: userRes.data || null, farms: farmsRes.data || [] }
})

const farmer = computed(() => pageData.value?.farmer || null)
const farms = computed(() => pageData.value?.farms || [])
const loading = computed(() => pending.value)

useHead({ title: computed(() => farmer.value ? `${farmer.value.name} — фермер | АгроПростір` : 'Фермер | АгроПростір') })
</script>
