<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 12l4-8h8l4 8-4 8H8l-4-8z"/><path d="M9 12l2 2 4-4"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Угоди</h1>
        <p class="dash-subtitle">Продаж та купівля врожаю</p>
      </div>
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
        <p class="text-agro-light text-sm mb-6">
          {{ isFarmer ? "Угоди з'являться коли заготівельник зробить запит і ви погодитесь" : 'Знайдіть фермера і запропонуйте ціну' }}
        </p>
        <NuxtLink v-if="!isFarmer" to="/farmers" class="dash-btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          Знайти фермера
        </NuxtLink>
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
            <p class="font-semibold text-agro-dark text-sm flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Угоди через платформу</p>
          </div>
          <div class="divide-y divide-agro-border">
            <div v-for="deal in deals" :key="deal.id" class="flex items-center gap-4 px-5 py-4">
              <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center shrink-0">
                <img :src="`/crops/${cropToSlug(deal.crop_type)}.svg`" :alt="deal.crop_type" class="w-6 h-6 object-contain" @error="($event.target as HTMLImageElement).style.display='none'" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-agro-dark">{{ deal.crop_type }}</p>
                <NuxtLink
                  :to="isFarmer ? `/buyers/${deal.buyer_id}` : `/farmer/${deal.farmer_id}`"
                  class="text-sm font-medium text-agro hover:underline transition-colors block mt-0.5">
                  <template v-if="isFarmer"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:3px"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/><path d="M6 20v-4h3v4M11 20v-4h3v4M16 20v-4h3v4"/></svg>{{ deal.buyer_name }}</template><template v-else><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:3px"><circle cx="12" cy="7" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/><path d="M9 4c1.5-1.5 5.5-1.5 6 1"/></svg>{{ deal.farmer_name }}</template>
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
              <button @click="generateInvoice(deal)"
                class="shrink-0 inline-flex items-center gap-1.5 text-xs bg-agro-hover border border-agro-border text-agro rounded-xl px-3 py-1.5 hover:bg-agro hover:text-white transition-colors font-medium">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Накладна
              </button>
              <button v-if="!isFarmer && deal.status === 'confirmed'" @click="confirmReceived(deal)"
                class="shrink-0 inline-flex items-center gap-1.5 text-xs bg-agro text-white rounded-xl px-3 py-1.5 hover:bg-agro-dark transition-colors font-medium">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Підтвердити отримання
              </button>
              <button v-if="!myReviews.has(deal.id) && deal.status === 'completed'" @click="openReview(deal)"
                class="shrink-0 inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-600 rounded-xl px-3 py-1.5 hover:bg-amber-100 transition-colors font-medium">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(180,130,40)" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Оцінити
              </button>
              <span v-else-if="myReviews.has(deal.id)" class="shrink-0 inline-flex items-center gap-1.5 text-xs text-agro-light px-3 py-1.5 border border-transparent rounded-xl">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Оцінено
              </span>
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
              <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center shrink-0">
                <img :src="`/crops/${cropToSlug(s.crop_type)}.svg`" :alt="s.crop_type" class="w-6 h-6 object-contain" @error="($event.target as HTMLImageElement).style.display='none'" />
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
          <p class="text-sm text-agro-light mb-4 text-center">
            Оцініть <span class="font-semibold text-agro-dark">{{ reviewModal.name }}</span> як {{ isFarmer ? 'заготівельника' : 'фермера' }}
          </p>
          <div class="flex justify-center gap-2 mb-5">
            <button v-for="s in 5" :key="s" @click="reviewModal.rating = s"
              class="text-3xl transition-transform hover:scale-110"
              :class="s <= reviewModal.rating ? 'opacity-100' : 'opacity-30'"><svg width="24" height="24" viewBox="0 0 24 24" :fill="s <= reviewModal.rating ? 'rgb(180,130,40)' : 'none'" stroke="rgb(180,130,40)" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></button>
          </div>
          <button @click="submitReview" :disabled="!reviewModal.rating || reviewModal.saving"
            class="btn-primary w-full inline-flex items-center justify-center gap-1.5" :class="(!reviewModal.rating || reviewModal.saving) ? 'opacity-50 cursor-not-allowed' : ''">
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
const { cropToSlug } = await import('~/utils/cropSlugs')

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

const confirmReceived = async (deal: any) => {
  const { error } = await supabase.from('deals').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', deal.id)
  if (!error) deal.status = 'completed'
}

const generateInvoice = async (deal: any) => {
  const [farmerRes, buyerRes] = await Promise.all([
    supabase.from('users').select('name, phone, city, region, company_name, edrpou, iban, bank_name, legal_address').eq('id', deal.farmer_id).single(),
    supabase.from('users').select('name, phone, city, region, company_name, edrpou, iban, bank_name, legal_address').eq('id', deal.buyer_id).single(),
  ])
  const farmer = farmerRes.data || {}
  const buyer = buyerRes.data || {}

  const deliveryName = deal.delivery_type_id === 1 ? 'Самовивіз' : 'Доставка'
  const totalPrice = deal.total_price ? deal.total_price.toLocaleString('uk-UA') + ' грн' : '—'
  const pricePerUnit = deal.display_price ? deal.display_price.toLocaleString('uk-UA') + ' грн/' + deal.unit : '—'
  const qty = deal.display_quantity ? deal.display_quantity + ' ' + deal.unit : '—'
  const dateStr = deal.confirmed_at ? new Date(deal.confirmed_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
  const invoiceNum = deal.id.slice(0, 8).toUpperCase()

  const partyBlock = (label: string, u: any) => `
    <div class="party">
      <div class="party-label">${label}</div>
      <div class="party-name">${u.company_name || u.name || '—'}</div>
      ${u.edrpou ? `<div class="party-row">ЄДРПОУ / ІПН: <b>${u.edrpou}</b></div>` : ''}
      ${u.city ? `<div class="party-row">Адреса: ${u.legal_address || u.city + (u.region ? ', ' + u.region : '')}</div>` : ''}
      ${u.phone ? `<div class="party-row">Телефон: ${u.phone}</div>` : ''}
      ${u.iban ? `<div class="party-row">IBAN: <b>${u.iban}</b></div>` : ''}
      ${u.bank_name ? `<div class="party-row">Банк: ${u.bank_name}</div>` : ''}
    </div>`

  const html = `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><title>Накладна №${invoiceNum}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 40px; max-width: 800px; margin: auto; }
    h1 { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 4px; }
    .subtitle { text-align: center; color: #666; font-size: 12px; margin-bottom: 28px; }
    .parties { display: flex; gap: 24px; margin-bottom: 24px; }
    .party { flex: 1; border: 1px solid #ccc; border-radius: 6px; padding: 12px; }
    .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 4px; }
    .party-name { font-weight: 700; font-size: 14px; margin-bottom: 6px; }
    .party-row { font-size: 12px; color: #444; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f4f4f4; border: 1px solid #ccc; padding: 8px 10px; text-align: left; font-size: 12px; }
    td { border: 1px solid #ddd; padding: 8px 10px; font-size: 13px; }
    .total-row td { font-weight: 700; background: #f9f9f9; }
    .delivery { margin-bottom: 20px; font-size: 12px; color: #555; }
    .signatures { display: flex; gap: 40px; margin-top: 40px; }
    .sig { flex: 1; border-top: 1px solid #999; padding-top: 8px; font-size: 12px; color: #555; }
    .footer { margin-top: 20px; font-size: 11px; color: #aaa; text-align: center; }
    @media print { body { padding: 20px; } }
  </style></head><body>
  <h1>Видаткова накладна №${invoiceNum}</h1>
  <div class="subtitle">від ${dateStr}</div>
  <div class="parties">
    ${partyBlock('Постачальник (Продавець)', farmer)}
    ${partyBlock('Покупець', buyer)}
  </div>
  <table>
    <thead><tr><th>№</th><th>Найменування товару</th><th>Кількість</th><th>Ціна за од.</th><th>Сума</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>${deal.crop_type}</td><td>${qty}</td><td>${pricePerUnit}</td><td>${totalPrice}</td></tr>
      <tr class="total-row"><td colspan="4" style="text-align:right">Всього:</td><td>${totalPrice}</td></tr>
    </tbody>
  </table>
  <div class="delivery">Спосіб доставки: <b>${deliveryName}</b></div>
  <div class="signatures">
    <div class="sig">Здав (Продавець): _______________________<br><span style="font-size:11px;color:#888">${farmer.name || ''}</span></div>
    <div class="sig">Прийняв (Покупець): _______________________<br><span style="font-size:11px;color:#888">${buyer.name || ''}</span></div>
  </div>
  <div class="footer">Сформовано через АгроПростір</div>
  <script>window.onload = () => { window.print() }<\/script>
  </body></html>`

  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}

onMounted(async () => {
  const field = isFarmer ? 'farmer_id' : 'buyer_id'
  const [dealsRes, manualRes, farmsRes] = await Promise.all([
    supabase.from('deals').select('*').eq(field, uid).in('status', ['confirmed', 'completed']).order('confirmed_at', { ascending: false }),
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
    const cleanCrop = (d.crop_type || '')
      .replace('Пропозиція продажу: ', '')
      .replace('Запит на купівлю: ', '')
      .trim()
    return {
      ...d,
      crop_type: cleanCrop,
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
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-card-title { font-family: 'Bitter', Georgia, serif; font-size: 17px; font-weight: 800; color: rgb(27,46,27); margin: 0; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
</style>
