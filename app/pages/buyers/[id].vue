<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <div class="flex items-center gap-2 text-sm text-agro-light mb-8">
      <NuxtLink to="/buyers" class="hover:text-agro transition-colors">Заготівельники</NuxtLink>

      <span>/</span>
      <span class="text-agro-dark">{{ buyer?.name || '...' }}</span>
    </div>

    <div v-if="loading" class="space-y-5">
      <div class="card animate-pulse h-40"></div>
    </div>

    <div v-else-if="!buyer" class="text-center py-20">
      <p class="text-5xl mb-4">🤝</p>
      <p class="font-bold text-agro-dark text-lg">Користувача не знайдено</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Шапка -->
      <div class="card">
        <div class="flex items-start gap-5">
          <div class="w-20 h-20 rounded-2xl bg-agro-hover flex items-center justify-center font-bold text-agro text-3xl shrink-0">
            {{ buyer.name?.[0]?.toUpperCase() || '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-extrabold text-agro-dark">{{ buyer.name }}</h1>
            <div class="flex items-center gap-2 mt-0.5">
              <p class="text-sm text-agro-light">🏭 Заготівельник</p>
              <span v-if="buyer.is_verified_buyer" class="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full font-semibold">✅ Перевірений</span>
            </div>
            <p v-if="buyer.city || buyer.region" class="text-agro-light mt-1 text-sm">
              📍 {{ [buyer.city, buyer.region].filter(Boolean).join(', ') }}
            </p>
            <p v-if="buyer.created_at" class="text-xs text-agro-light mt-2">
              На платформі з {{ formatDate(buyer.created_at) }}
            </p>
            <div class="flex items-center gap-1.5 mt-2">
              <span class="text-amber-400">⭐</span>
              <template v-if="buyer.buyer_rating > 0">
                <span class="font-bold text-agro-dark">{{ buyer.buyer_rating }}</span>
                <span class="text-xs text-agro-light">({{ buyer.buyer_reviews_count }} {{ buyer.buyer_reviews_count === 1 ? 'оцінка' : buyer.buyer_reviews_count < 5 ? 'оцінки' : 'оцінок' }})</span>
              </template>
              <span v-else class="text-xs text-agro-light">Поки немає оцінок</span>
            </div>
          </div>
          <button v-if="uid && uid !== buyerId" @click="startChat" :disabled="starting"
            class="btn-primary shrink-0 text-sm py-2.5 px-5">
            {{ starting ? '...' : '💬 Написати' }}
          </button>
        </div>

        <!-- Статистика угод -->
        <div v-if="dealsCount > 0" class="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-agro-border">
          <div class="text-center">
            <p class="text-2xl font-extrabold text-agro-dark">{{ dealsCount }}</p>
            <p class="text-xs text-agro-light mt-0.5">{{ dealsCount === 1 ? 'угода' : dealsCount < 5 ? 'угоди' : 'угод' }}</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-extrabold text-agro-dark">{{ totalTons }}</p>
            <p class="text-xs text-agro-light mt-0.5">тонн закуплено</p>
          </div>
        </div>
      </div>

      <!-- Культури які закуповує (з профілю) -->
      <div v-if="buyerCrops.length" class="card">
        <h2 class="font-bold text-agro-dark text-lg mb-4">🌾 Що закуповує</h2>
        <div class="divide-y divide-agro-border">
          <div v-for="c in buyerCrops" :key="c.id" class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span class="text-xl shrink-0">{{ cropEmoji(c.crop_type) }}</span>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-agro-dark">{{ c.crop_type }}</p>
              <p v-if="c.notes" class="text-xs text-agro-light italic mt-0.5">{{ c.notes }}</p>
            </div>
            <span v-if="c.min_qty || c.max_qty" class="text-sm text-agro-light shrink-0">
              {{ c.min_qty || '—' }} – {{ c.max_qty || '—' }} {{ c.unit }}
            </span>
            <button v-if="uid !== buyerId" @click="openOfferModal(c)"
              class="shrink-0 text-xs font-semibold border-2 border-agro text-agro rounded-xl px-3 py-1.5 hover:bg-agro hover:text-white transition-colors whitespace-nowrap">
              📩 Запропонувати
            </button>
          </div>
        </div>
      </div>
      <!-- Якщо немає профільних культур — показуємо з угод -->
      <div v-else-if="crops.length" class="card">
        <h2 class="font-bold text-agro-dark text-lg mb-4">🌾 Закуповував раніше</h2>
        <div class="flex flex-wrap gap-2">
          <span v-for="c in crops" :key="c"
            class="text-sm px-3 py-1.5 rounded-full bg-agro-bg border border-agro-border text-agro-dark font-medium">
            {{ cropEmoji(c) }} {{ c }}
          </span>
        </div>
      </div>
    </div>
  </div>
  <!-- Модалка пропозиції -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="offerModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="offerModal.show = false" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
          <h2 class="font-bold text-agro-dark text-lg mb-1">📩 Запропонувати продукцію</h2>
          <p class="text-sm text-agro-light mb-4">{{ offerModal.crop?.crop_type }}</p>
          <div class="space-y-3 mb-5">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Кількість</label>
              <div class="flex gap-2">
                <input v-model="offerModal.quantity" type="number" min="0.1" step="0.1" class="input flex-1" placeholder="50" />
                <div class="flex rounded-xl border border-agro-border overflow-hidden shrink-0">
                  <button @click="offerModal.unit = 'т'" type="button"
                    class="px-3 py-2 text-sm font-semibold transition-colors"
                    :class="offerModal.unit === 'т' ? 'bg-agro text-white' : 'bg-white text-agro-light hover:bg-agro-hover'">т</button>
                  <button @click="offerModal.unit = 'кг'" type="button"
                    class="px-3 py-2 text-sm font-semibold transition-colors"
                    :class="offerModal.unit === 'кг' ? 'bg-agro text-white' : 'bg-white text-agro-light hover:bg-agro-hover'">кг</button>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Ціна за {{ offerModal.unit }} (грн)</label>
              <input v-model="offerModal.price" type="number" min="1" class="input" :placeholder="offerModal.unit === 'т' ? '5000' : '5'" />
            </div>
            <div v-if="offerModal.quantity && offerModal.price" class="bg-agro-hover rounded-xl px-4 py-3">
              <p class="text-xs text-agro-light mb-0.5">Загальна сума</p>
              <p class="text-xl font-extrabold text-agro">{{ (offerModal.quantity * offerModal.price).toLocaleString('uk-UA') }} грн</p>
            </div>
          </div>
          <div class="flex gap-3">
            <button @click="offerModal.show = false" class="btn-outline flex-1">Скасувати</button>
            <button @click="submitOffer" :disabled="!offerModal.quantity || !offerModal.price || offerModal.saving" class="btn-primary flex-1">
              {{ offerModal.saving ? '...' : 'Надіслати' }}
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
const { cropEmoji } = await import('~/utils/cropSlugs')

const buyerId = route.params.id as string

const loading = ref(true)
const buyer = ref<any>(null)
const starting = ref(false)
const offerModal = reactive({ show: false, crop: null as any, quantity: 0, unit: 'т', price: 0, saving: false })
const dealsCount = ref(0)
const totalTons = ref(0)
const crops = ref<string[]>([])
const buyerCrops = ref<any[]>([])

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const formatDate = (d: string) => new Date(d).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long' })

const [userRes, dealsRes, buyerCropsRes] = await Promise.all([
  supabase.from('users').select('id, name, region, city, created_at, buyer_rating, buyer_reviews_count, is_verified_buyer').eq('id', buyerId).single(),
  supabase.from('deals').select('crop_type, quantity_tons').eq('buyer_id', buyerId).eq('status', 'confirmed'),
  supabase.from('buyer_crops').select('*').eq('user_id', buyerId).order('created_at'),
])

buyer.value = userRes.data
buyerCrops.value = buyerCropsRes.data || []
useHead({ title: buyer.value?.name || 'Заготівельник' })

if (dealsRes.data?.length) {
  dealsCount.value = dealsRes.data.length
  totalTons.value = parseFloat(dealsRes.data.reduce((s: number, d: any) => s + (d.quantity_tons || 0), 0).toFixed(1).replace(/\.0$/, ''))
  crops.value = [...new Set(dealsRes.data.map((d: any) => d.crop_type))].sort((a, b) => a.localeCompare(b, 'uk'))
}

loading.value = false

const openOfferModal = (crop: any) => {
  if (!uid) { navigateTo('/auth'); return }
  offerModal.crop = crop
  offerModal.quantity = 0
  offerModal.unit = 'т'
  offerModal.price = 0
  offerModal.show = true
}

const submitOffer = async () => {
  if (!offerModal.quantity || !offerModal.price) return
  offerModal.saving = true
  const crop = offerModal.crop
  const title = `Пропозиція продажу: ${crop.crop_type}`

  const { data: nc } = await supabase.from('chats')
    .insert({ farmer_id: uid, agronomist_id: buyerId, type: 'human', is_unlocked: true, title })
    .select().single()

  if (nc) {
    const quantityTons = offerModal.unit === 'кг' ? offerModal.quantity / 1000 : offerModal.quantity
    const pricePerTon = offerModal.unit === 'кг' ? offerModal.price * 1000 : offerModal.price

    const { data: deal } = await supabase.from('deals').insert({
      chat_id: nc.id,
      buyer_id: buyerId,
      farmer_id: uid,
      crop_type: crop.crop_type,
      quantity_tons: quantityTons,
      price_per_ton: pricePerTon,
      proposed_by: uid,
    }).select().single()

    if (deal) {
      await supabase.from('messages').insert({
        chat_id: nc.id,
        role: 'assistant',
        content: `[deal:${deal.id}:${offerModal.unit}:${offerModal.quantity}:${offerModal.price}]`,
        is_read: false,
      })
    }
    router.push(`/dashboard/chats/${nc.id}`)
  }
  offerModal.saving = false
  offerModal.show = false
}

const startChat = async () => {
  if (!uid) { navigateTo('/auth'); return }
  starting.value = true

  const { data: existing } = await supabase.from('chats').select('id')
    .eq('farmer_id', uid).eq('agronomist_id', buyerId).eq('type', 'human').maybeSingle()
  if (existing) { router.push(`/dashboard/chats/${existing.id}`); return }

  const { data: existing2 } = await supabase.from('chats').select('id')
    .eq('farmer_id', buyerId).eq('agronomist_id', uid).eq('type', 'human').maybeSingle()
  if (existing2) { router.push(`/dashboard/chats/${existing2.id}`); return }

  const { data: newChat } = await supabase.from('chats')
    .insert({ farmer_id: uid, agronomist_id: buyerId, type: 'human', is_unlocked: true })
    .select().single()

  starting.value = false
  if (newChat) router.push(`/dashboard/chats/${newChat.id}`)
}
</script>
