<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="flex items-center gap-2.5 mb-1.5">
        <div class="dash-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12l4-8h8l4 8-4 8H8l-4-8z"/><path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <h1 class="dash-title bitter">Угоди</h1>
        <button v-if="isFarmer" @click="openManualModal" class="dash-btn-primary ml-auto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Додати продаж
        </button>
      </div>
      <p class="dash-subtitle">Продаж та купівля врожаю</p>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="card animate-pulse h-24"></div>
    </div>

    <template v-else>
      <div v-if="!deals.length && !manualSales.length" class="card text-center py-16">
        <div class="dash-empty-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12l4-8h8l4 8-4 8H8l-4-8z"/><path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <p class="font-bold text-agro-dark text-lg mb-2">Поки немає підтверджених угод</p>
        <p class="text-agro-light text-sm">
          {{ isFarmer ? "Угоди з'являться коли заготівельник зробить запит і ви погодитесь" : 'Знайдіть фермера і запропонуйте ціну' }}
        </p>
        <NuxtLink v-if="!isFarmer" to="/farmers" class="btn-primary inline-block mt-6">Знайти фермера</NuxtLink>
      </div>

      <div v-else class="space-y-6">
        <!-- Підсумок -->
        <div v-if="summary.length" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="s in summary" :key="s.crop" class="card text-center">
            <p class="text-2xl font-extrabold text-agro">{{ s.qty }}</p>
            <p class="text-sm font-semibold text-agro-dark mt-0.5">{{ s.crop }}</p>
            <p class="text-xs text-agro-light">{{ s.total.toLocaleString('uk-UA') }} грн</p>
          </div>
        </div>

        <!-- Угоди через систему -->
        <div v-if="deals.length" class="card overflow-hidden p-0">
          <div class="px-5 py-3 border-b border-agro-border bg-agro-bg">
            <p class="font-semibold text-agro-dark text-sm">✅ Угоди через платформу</p>
          </div>
          <div class="divide-y divide-agro-border">
            <div v-for="deal in deals" :key="deal.id" class="flex items-center gap-4 px-5 py-4">
              <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center text-xl shrink-0">
                {{ cropEmoji(deal.crop_type) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-agro-dark">{{ deal.crop_type }}</p>
                <NuxtLink
                  :to="isFarmer ? `/buyers/${deal.buyer_id}` : `/farmer/${deal.farmer_id}`"
                  class="text-sm font-medium text-agro hover:underline transition-colors block mt-0.5">
                  {{ isFarmer ? '🏭 ' + deal.buyer_name : '👨‍🌾 ' + deal.farmer_name }}
                </NuxtLink>
                <p class="text-xs text-agro-light mt-0.5">{{ formatDate(deal.confirmed_at) }}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="font-bold text-agro-dark">{{ deal.display_quantity }} {{ deal.unit }}</p>
                <p class="text-xs text-agro-light">{{ deal.display_price?.toLocaleString('uk-UA') }} грн/{{ deal.unit }}</p>
              </div>
              <div class="text-right shrink-0 min-w-[100px]">
                <p class="font-extrabold text-agro">{{ deal.total_price?.toLocaleString('uk-UA') }} грн</p>
              </div>
              <button v-if="!myReviews.has(deal.id)" @click="openReview(deal)"
                class="shrink-0 text-xs bg-amber-50 border border-amber-200 text-amber-600 rounded-xl px-3 py-1.5 hover:bg-amber-100 transition-colors font-medium">
                ⭐ Оцінити
              </button>
              <span v-else class="shrink-0 text-xs text-agro-light">⭐ Оцінено</span>
              <NuxtLink :to="`/dashboard/chats/${deal.chat_id}`"
                class="shrink-0 text-xs border border-agro-border text-agro-light rounded-xl px-3 py-1.5 hover:border-agro hover:text-agro transition-colors">
                Чат →
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Ручні продажі -->
        <div v-if="isFarmer && manualSales.length" class="card overflow-hidden p-0">
          <div class="px-5 py-3 border-b border-agro-border bg-agro-bg">
            <p class="font-semibold text-agro-dark text-sm">📝 Додано вручну</p>
          </div>
          <div class="divide-y divide-agro-border">
            <div v-for="s in manualSales" :key="s.id" class="flex items-center gap-4 px-5 py-4">
              <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center text-xl shrink-0">
                {{ cropEmoji(s.crop_type) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-agro-dark">{{ s.crop_type }}</p>
                <p class="text-xs text-agro-light mt-0.5">{{ formatDate(s.sold_at) }}{{ s.notes ? ` · ${s.notes}` : '' }}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="font-bold text-agro-dark">{{ s.quantity_tons }} т</p>
                <p v-if="s.price_per_ton" class="text-xs text-agro-light">{{ s.price_per_ton?.toLocaleString('uk-UA') }} грн/т</p>
              </div>
              <div class="text-right shrink-0 min-w-[100px]">
                <p v-if="s.total_price" class="font-extrabold text-agro">{{ s.total_price?.toLocaleString('uk-UA') }} грн</p>
              </div>
              <button @click="deleteManual(s.id)" class="shrink-0 text-xs text-red-400 hover:text-red-600 transition-colors p-1">✕</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- Модалка оцінки -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="reviewModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="reviewModal.show = false">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="dash-card-title bitter">Оцінити угоду</h3>
            <button @click="reviewModal.show = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-agro-hover text-agro-light">✕</button>
          </div>
          <p class="text-sm text-agro-light mb-4">
            Оцініть <span class="font-semibold text-agro-dark">{{ reviewModal.name }}</span> як {{ isFarmer ? 'заготівельника' : 'фермера' }}
          </p>
          <div class="flex justify-center gap-2 mb-5">
            <button v-for="s in 5" :key="s" @click="reviewModal.rating = s"
              class="text-3xl transition-transform hover:scale-110"
              :class="s <= reviewModal.rating ? 'opacity-100' : 'opacity-30'">⭐</button>
          </div>
          <button @click="submitReview" :disabled="!reviewModal.rating || reviewModal.saving"
            class="btn-primary w-full" :class="(!reviewModal.rating || reviewModal.saving) ? 'opacity-50 cursor-not-allowed' : ''">
            {{ reviewModal.saving ? 'Збереження...' : 'Надіслати оцінку' }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Модалка ручного продажу -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="manualModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="manualModal.show = false" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
          <h2 class="dash-card-title bitter mb-4">Додати продаж вручну</h2>
          <div class="space-y-3 mb-5">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Культура</label>
              <template v-if="farmerCrops.length">
                <div class="relative">
                <select v-model="manualModal.crop_type" class="input appearance-none pr-9 w-full">
                  <option value="" disabled>Оберіть культуру</option>
                  <option v-for="c in farmerCrops" :key="c.value" :value="c.value">{{ c.label }}</option>
                  <option value="__other__">✏️ Інша культура...</option>
                </select>
                <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-agro-light">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </span>
                </div>
                <input v-if="manualModal.crop_type === '__other__'"
                  v-model="manualModal.crop_type_custom"
                  type="text" class="input mt-2" placeholder="Назва культури" autofocus />
              </template>
              <input v-else
                v-model="manualModal.crop_type_custom"
                type="text" class="input" placeholder="Назва культури (немає культур у полях)" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Кількість</label>
              <div class="flex gap-2">
                <input v-model="manualModal.quantity" type="number" min="0.01" step="0.01" class="input flex-1" placeholder="10" />
                <div class="flex rounded-xl border border-agro-border overflow-hidden shrink-0">
                  <button @click="manualModal.unit = 'т'" type="button"
                    class="px-3 py-2 text-sm font-semibold transition-colors"
                    :class="manualModal.unit === 'т' ? 'bg-agro text-white' : 'bg-white text-agro-light hover:bg-agro-hover'">т</button>
                  <button @click="manualModal.unit = 'кг'" type="button"
                    class="px-3 py-2 text-sm font-semibold transition-colors"
                    :class="manualModal.unit === 'кг' ? 'bg-agro text-white' : 'bg-white text-agro-light hover:bg-agro-hover'">кг</button>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Ціна за {{ manualModal.unit }} (грн, необов'язково)</label>
              <input v-model="manualModal.price_per_ton" type="number" min="0" class="input" :placeholder="manualModal.unit === 'т' ? '5000' : '5'" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Дата продажу</label>
              <input v-model="manualModal.sold_at" type="date" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Примітка (необов'язково)</label>
              <input v-model="manualModal.notes" type="text" class="input" placeholder="Покупець, умови тощо" />
            </div>
          </div>
          <div class="flex gap-3">
            <button @click="manualModal.show = false" class="btn-outline flex-1">Скасувати</button>
            <button @click="saveManual" :disabled="!(manualModal.crop_type === '__other__' ? manualModal.crop_type_custom : manualModal.crop_type) || !manualModal.quantity || manualModal.saving" class="btn-primary flex-1">
              {{ manualModal.saving ? '...' : 'Зберегти' }}
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
useHead({ title: 'Угоди' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const { cropEmoji } = await import('~/utils/cropSlugs')

const loading = ref(true)
const deals = ref<any[]>([])
const manualSales = ref<any[]>([])
const farmerCrops = ref<{ label: string; value: string }[]>([])
const myReviews = ref<Set<string>>(new Set())

const reviewModal = reactive({
  show: false,
  dealId: '',
  revieweeId: '',
  name: '',
  rating: 0,
  saving: false,
})

const openReview = (deal: any) => {
  reviewModal.dealId = deal.id
  reviewModal.revieweeId = isFarmer ? deal.buyer_id : deal.farmer_id
  reviewModal.name = isFarmer ? deal.buyer_name : deal.farmer_name
  reviewModal.rating = 0
  reviewModal.show = true
}

const submitReview = async () => {
  if (!reviewModal.rating || reviewModal.saving) return
  reviewModal.saving = true

  await supabase.from('deal_reviews').insert({
    deal_id: reviewModal.dealId,
    reviewer_id: uid,
    reviewee_id: reviewModal.revieweeId,
    rating: reviewModal.rating,
  })

  // Перерахувати рейтинг
  const { data: allReviews } = await supabase
    .from('deal_reviews')
    .select('rating')
    .eq('reviewee_id', reviewModal.revieweeId)

  if (allReviews?.length) {
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    const rounded = Math.round(avg * 10) / 10
    const count = allReviews.length
    // Оновлюємо відповідний рейтинг залежно від ролі того кого оцінюють
    const revieweeRole = isFarmer ? 'buyer' : 'farmer'
    await supabase.from('users').update({
      [`${revieweeRole}_rating`]: rounded,
      [`${revieweeRole}_reviews_count`]: count,
    }).eq('id', reviewModal.revieweeId)
  }

  myReviews.value.add(reviewModal.dealId)
  reviewModal.saving = false
  reviewModal.show = false
}

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const { data: profileData } = await supabase.from('users').select('role').eq('id', uid).single()
const role = profileData?.role || 'farmer'
const isFarmer = role === 'farmer' || role === 'dacha'

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

const parseDealMessage = (content: string) => {
  const match = content?.match(/\[deal:[^:\]]+(?::([^:\]]+))?(?::([^:\]]+))?(?::([^:\]]+))?\]/)
  return {
    unit: match?.[1] || 'т',
    displayQty: match?.[2] ? parseFloat(match[2]) : null,
    displayPrice: match?.[3] ? parseFloat(match[3]) : null,
  }
}

const summary = computed(() => {
  const map: Record<string, { tons: number; total: number }> = {}
  for (const d of deals.value) {
    if (!map[d.crop_type]) map[d.crop_type] = { tons: 0, total: 0 }
    // display_quantity може бути в кг — конвертуємо в тонни
    const tons = d.unit === 'кг' ? (d.display_quantity || 0) / 1000 : (d.display_quantity || d.quantity_tons || 0)
    map[d.crop_type].tons += tons
    map[d.crop_type].total += d.total_price || 0
  }
  for (const s of manualSales.value) {
    if (!map[s.crop_type]) map[s.crop_type] = { tons: 0, total: 0 }
    map[s.crop_type].tons += s.quantity_tons || 0
    map[s.crop_type].total += s.total_price || 0
  }
  return Object.entries(map).map(([crop, v]) => ({
    crop,
    qty: `${+v.tons.toFixed(2)} т`,
    total: v.total,
  }))
})

const manualModal = reactive({
  show: false,
  crop_type: '',
  crop_type_custom: '',
  quantity: 0,
  unit: 'т' as 'т' | 'кг',
  price_per_ton: 0,
  sold_at: new Date().toISOString().slice(0, 10),
  notes: '',
  saving: false,
})

const openManualModal = () => {
  manualModal.crop_type = ''
  manualModal.crop_type_custom = ''
  manualModal.quantity = 0
  manualModal.unit = 'т'
  manualModal.price_per_ton = 0
  manualModal.sold_at = new Date().toISOString().slice(0, 10)
  manualModal.notes = ''
  manualModal.show = true
}

const saveManual = async () => {
  const cropType = (manualModal.crop_type === '__other__' || !manualModal.crop_type)
    ? manualModal.crop_type_custom
    : manualModal.crop_type
  if (!cropType || !manualModal.quantity) return
  manualModal.saving = true
  const quantityTons = manualModal.unit === 'кг' ? manualModal.quantity / 1000 : manualModal.quantity
  const pricePerTon = manualModal.price_per_ton
    ? (manualModal.unit === 'кг' ? manualModal.price_per_ton * 1000 : manualModal.price_per_ton)
    : null

  const { data } = await supabase.from('manual_sales').insert({
    user_id: uid,
    crop_type: cropType,
    quantity_tons: quantityTons,
    price_per_ton: pricePerTon || null,
    sold_at: manualModal.sold_at,
    notes: manualModal.notes || null,
  }).select().single()

  if (data) manualSales.value.unshift(data)
  manualModal.saving = false
  manualModal.show = false
}

const { confirm: confirmDialog } = useConfirm()

const deleteManual = async (id: string) => {
  if (!await confirmDialog('Запис про продаж буде видалено. Дію не можна скасувати.', { title: 'Видалити запис?' })) return
  await supabase.from('manual_sales').delete().eq('id', id)
  manualSales.value = manualSales.value.filter((s: any) => s.id !== id)
}

onMounted(async () => {
  const field = isFarmer ? 'farmer_id' : 'buyer_id'
  const [dealsRes, manualRes, farmsRes] = await Promise.all([
    supabase.from('deals').select('*').eq(field, uid).eq('status', 'confirmed').order('confirmed_at', { ascending: false }),
    isFarmer ? supabase.from('manual_sales').select('*').eq('user_id', uid).order('sold_at', { ascending: false }) : Promise.resolve({ data: [] }),
    isFarmer ? supabase.from('farms').select('farm_crops(crop_type, variety)').eq('user_id', uid) : Promise.resolve({ data: [] }),
  ])

  if (isFarmer) {
    const seen = new Set<string>()
    for (const farm of (farmsRes as any).data || []) {
      for (const c of farm.farm_crops || []) {
        const label = c.variety ? `${c.crop_type} (${c.variety})` : c.crop_type
        if (!seen.has(label)) { seen.add(label); farmerCrops.value.push({ label, value: label }) }
      }
    }
    farmerCrops.value.sort((a, b) => a.label.localeCompare(b.label, 'uk'))
  }

  manualSales.value = (manualRes as any).data || []

  const dealsData = dealsRes.data || []
  if (!dealsData.length) { loading.value = false; return }

  const otherIds = [...new Set(dealsData.map((d: any) => isFarmer ? d.buyer_id : d.farmer_id))]
  const { data: usersData } = await supabase.from('users').select('id, name').in('id', otherIds)
  const nameMap = Object.fromEntries((usersData || []).map((u: any) => [u.id, u.name]))

  const chatIds = [...new Set(dealsData.map((d: any) => d.chat_id))]
  const { data: msgsData } = await supabase
    .from('messages').select('chat_id, content').in('chat_id', chatIds).like('content', '[deal:%')

  const dealMsgMap: Record<string, string> = {}
  for (const m of (msgsData || [])) {
    const match = m.content?.match(/\[deal:([^:\]]+)/)
    if (match) dealMsgMap[match[1]] = m.content
  }

  deals.value = dealsData.map((d: any) => {
    const { unit, displayQty, displayPrice } = parseDealMessage(dealMsgMap[d.id])
    return {
      ...d,
      unit,
      display_quantity: displayQty ?? d.quantity_tons,
      display_price: displayPrice ?? d.price_per_ton,
      farmer_name: nameMap[d.farmer_id] || 'Фермер',
      buyer_name: nameMap[d.buyer_id] || 'Заготівельник',
    }
  })

  // Завантажити мої вже залишені оцінки
  const dealIds = dealsData.map((d: any) => d.id)
  if (dealIds.length) {
    const { data: myReviewsData } = await supabase
      .from('deal_reviews')
      .select('deal_id')
      .eq('reviewer_id', uid)
      .in('deal_id', dealIds)
    myReviews.value = new Set((myReviewsData || []).map((r: any) => r.deal_id))
  }

  loading.value = false
})
</script>

<style scoped>
.dash-page { padding: 44px 56px; font-family: Manrope, sans-serif; max-width: 1196px; }
.dash-head { margin-bottom: 28px; }
.dash-title { font-family: 'Bitter', Georgia, serif; font-weight: 800; font-size: 28px; color: rgb(27,46,27); margin: 0; }
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-subtitle { font-size: 15.5px; color: rgb(107,122,100); margin: 4px 0 0; }
.dash-icon-box { width: 40px; height: 40px; border-radius: 10px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dash-card-title { font-family: 'Bitter', Georgia, serif; font-size: 17px; font-weight: 800; color: rgb(27,46,27); margin: 0; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
.dash-btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: 10px; background: rgb(47,82,51); color: rgb(250,246,236); font-weight: 700; font-size: 14px; border: none; cursor: pointer; }
@media (max-width: 640px) { .dash-page { padding: 24px 20px; } }
</style>
