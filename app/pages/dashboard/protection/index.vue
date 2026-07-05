<template>
  <div class="p-4 sm:p-8">
    <NuxtLink to="/dashboard/fields" class="inline-flex items-center gap-2 text-agro-light hover:text-agro mb-8 text-sm font-medium transition-colors">
      ← Назад до полів
    </NuxtLink>

    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-agro-dark">🛡 Програма захисту</h1>
      <p v-if="cropType" class="text-agro-light mt-1">{{ cropType }}</p>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="card animate-pulse h-20" v-for="i in 3" :key="i"></div>
    </div>

    <div v-else>
      <div v-if="!program" class="card text-center py-12">
        <p class="text-5xl mb-4">🛡</p>
        <p class="font-bold text-agro-dark text-lg">Програму ще не створено</p>
        <p class="text-agro-light mt-1 mb-6">Створіть програму захисту для цієї культури</p>
        <button @click="createProgram" :disabled="saving" class="btn-primary inline-block">
          {{ saving ? '...' : '➕ Створити програму' }}
        </button>
      </div>

      <template v-else>
        <!-- Блоки активних фаз -->
        <div class="space-y-4 mb-4">
          <div v-for="phase in activePhases" :key="phase.key" class="card p-0 overflow-hidden">
            <!-- Заголовок фази -->
            <div class="flex items-center gap-2 px-5 py-3 bg-agro-hover border-b border-agro-border">
              <span class="text-base">{{ phase.emoji }}</span>
              <span class="font-bold text-agro-dark">{{ phase.key }}</span>
              <span class="ml-auto text-xs text-agro-light mr-2">{{ treatmentsByPhase[phase.key]?.length || 0 }} обробок</span>
              <button @click="removePhase(phase)" class="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-agro-light hover:text-red-400">
                <X :size="13" />
              </button>
            </div>

            <!-- Список обробок -->
            <div class="divide-y divide-agro-border">
              <div v-if="!treatmentsByPhase[phase.key]?.length" class="px-5 py-5 text-center text-sm text-agro-light">
                Обробок ще немає — додайте першу нижче
              </div>
              <div v-for="t in treatmentsByPhase[phase.key] || []" :key="t.id" class="flex items-start gap-3 px-5 py-3.5">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" :class="TYPE_BG[t.type] || 'bg-agro-bg'">
                  <span class="text-sm">{{ TYPE_ICONS[t.type] || '🌿' }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-xs font-medium px-2 py-0.5 rounded-full border" :class="TYPE_BADGE[t.type] || 'bg-agro-bg border-agro-border text-agro-light'">
                    {{ t.type }}
                  </span>
                  <p class="font-semibold text-agro-dark mt-1 text-sm">{{ t.product_name }}</p>
                  <p v-if="t.dosage" class="text-xs text-agro-light mt-0.5">📏 {{ t.dosage }}</p>
                  <p v-if="t.notes" class="text-xs text-agro-light mt-0.5 italic">{{ t.notes }}</p>
                </div>
                <button @click="deleteTreatment(t)" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-red-400 shrink-0">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>

            <!-- Форма додавання в цю фазу -->
            <div class="px-5 py-4 border-t border-agro-border bg-[#FAFDF7] space-y-3">
              <select v-model="inlineT[phase.key].type" class="input text-sm py-2">
                <option value="підживлення">🌿 підживлення</option>
                <option value="захист">🛡 захист</option>
                <option value="гербіцид">🌾 гербіцид</option>
                <option value="фунгіцид">🍄 фунгіцид</option>
                <option value="інсектицид">🐛 інсектицид</option>
              </select>
              <div class="relative">
                <input
                  v-model="inlineT[phase.key].product_name"
                  @input="searchProducts(phase.key)"
                  @focus="showSuggestionsFor = phase.key"
                  @blur="hideSuggestions"
                  class="input text-sm py-2"
                  placeholder="Назва препарату або добрива..."
                  autocomplete="off"
                />
                <div v-if="showSuggestionsFor === phase.key && productSuggestions.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-30 max-h-44 overflow-y-auto">
                  <button
                    v-for="p in productSuggestions"
                    :key="p.id"
                    type="button"
                    @mousedown.prevent="selectProduct(phase.key, p)"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0"
                  >
                    <p class="font-medium text-agro-dark">{{ p.product_name }}</p>
                  </button>
                </div>
              </div>
              <input v-model="inlineT[phase.key].dosage" class="input text-sm py-2" placeholder="Доза (необов'язково)" />
              <input v-model="inlineT[phase.key].notes" class="input text-sm py-2" placeholder="Коментар (необов'язково)" />
              <button
                @click="saveTreatment(phase)"
                :disabled="!inlineT[phase.key].product_name || savingPhase === phase.key"
                class="btn-primary w-full py-2.5 text-sm"
              >
                {{ savingPhase === phase.key ? '...' : '✓ Додати обробку' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Кнопка / панель вибору фази -->
        <div class="relative" ref="phasePickerRef">
          <button
            @click="showPhasePicker = !showPhasePicker"
            class="btn-outline w-full text-sm py-3"
          >
            ➕ Додати фазу
          </button>

          <div v-if="showPhasePicker" class="card mt-2 p-0 overflow-hidden">
            <!-- Існуючі фази зі списку -->
            <div v-if="availablePhases.length" class="divide-y divide-agro-border">
              <button
                v-for="phase in availablePhases"
                :key="phase.key"
                @click="addActivePhase(phase)"
                class="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-agro-hover transition-colors text-left"
              >
                <span class="text-base">{{ phase.emoji }}</span>
                <span class="font-medium text-agro-dark">{{ phase.key }}</span>
              </button>
            </div>
            <p v-else class="px-4 py-3 text-sm text-agro-light">Всі фази вже додано</p>

            <!-- Роздільник + додати власну -->
            <div class="border-t border-agro-border">
              <div v-if="!showAddPhaseInline" class="px-4 py-3">
                <button @click="showAddPhaseInline = true" class="text-sm text-agro font-medium hover:underline">
                  + Додати свою фазу
                </button>
              </div>
              <div v-else class="px-4 py-3 space-y-2">
                <div class="flex gap-2">
                  <input v-model="newPhaseEmoji" class="input w-12 text-center text-base px-1 py-1.5 shrink-0" placeholder="🌱" maxlength="2" />
                  <input v-model="newPhaseName" @keyup.enter="addCustomPhase" class="input flex-1 text-sm py-1.5" placeholder="Назва фази..." />
                </div>
                <div class="flex gap-2">
                  <button @click="showAddPhaseInline = false; newPhaseName = ''" class="btn-outline flex-1 py-1.5 text-sm">Скасувати</button>
                  <button @click="addCustomPhase" :disabled="!newPhaseName.trim()" class="btn-primary flex-1 py-1.5 text-sm">Додати</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- Модал розумного підбору -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showSmartModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4" @click.self="showSmartModal = false">
        <div class="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col">
          <div class="flex items-center justify-between px-5 py-4 border-b border-agro-border shrink-0">
            <h2 class="font-bold text-agro-dark text-base">🛒 Розумний підбір</h2>
            <button @click="showSmartModal = false" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-agro-bg text-agro-light text-lg">×</button>
          </div>

          <div class="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            <!-- Завантаження -->
            <div v-if="smartBuyLoading" class="py-10 text-center">
              <div class="animate-spin text-3xl mb-3">⏳</div>
              <p class="text-agro-light text-sm">Шукаємо найкращі пропозиції...</p>
            </div>

            <template v-else-if="smartBuyResult">
              <!-- Не знайдено -->
              <div v-if="smartBuyResult.notFound.length" class="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p class="font-semibold text-amber-700 text-sm mb-1">⚠️ Не знайдено в каталозі продавців:</p>
                <p v-for="name in smartBuyResult.notFound" :key="name" class="text-sm text-amber-600">• {{ name }}</p>
              </div>

              <!-- Нічого не знайдено взагалі -->
              <div v-if="!smartBuyResult.cheapestItems.length" class="text-center py-6">
                <p class="text-4xl mb-2">🔍</p>
                <p class="text-agro-dark font-semibold">Пропозицій не знайдено</p>
                <p class="text-agro-light text-sm mt-1">Продавці не мають цих препаратів в наявності</p>
              </div>

              <!-- Найдешевший варіант -->
              <div v-if="smartBuyResult.cheapestItems.length" class="card p-4">
                <div class="flex items-center justify-between mb-2">
                  <p class="font-bold text-agro-dark text-sm">💰 Найдешевший варіант</p>
                  <span class="font-bold text-agro">{{ smartBuyResult.cheapestTotal }} грн</span>
                </div>
                <p class="text-xs text-agro-light mb-3">
                  Від {{ new Set(smartBuyResult.cheapestItems.map((i: any) => i.offer.seller_profiles?.company_name)).size }} продавців
                </p>
                <div class="space-y-2 mb-3">
                  <div v-for="item in smartBuyResult.cheapestItems" :key="item.treatment_name" class="flex items-center justify-between text-sm py-1.5 border-t border-agro-border first:border-0">
                    <div>
                      <p class="font-medium text-agro-dark">{{ item.treatment_name }}</p>
                      <p class="text-xs text-agro-light">{{ item.offer.seller_profiles?.company_name }}</p>
                    </div>
                    <span class="font-semibold text-agro shrink-0 ml-2">{{ item.offer.price }} грн</span>
                  </div>
                </div>
                <button @click="addToCart(smartBuyResult.cheapestItems)" :disabled="cartSaving" class="btn-primary w-full py-2.5 text-sm">
                  {{ cartSaving ? '...' : '🛒 Додати до кошика' }}
                </button>
              </div>

              <!-- Один продавець -->
              <template v-if="smartBuyResult.fullSellers.length">
                <p class="text-sm font-bold text-agro-dark">🏪 Один продавець ({{ smartBuyResult.fullSellers.length }})</p>
                <div v-for="(seller, i) in smartBuyResult.fullSellers" :key="seller.seller.id" class="card p-4" :class="i === 0 ? 'border-agro border-2' : ''">
                  <div v-if="i === 0" class="text-xs font-bold text-agro mb-1">✓ Найдешевший від одного продавця</div>
                  <div class="flex items-center justify-between mb-1">
                    <p class="font-bold text-agro-dark text-sm">{{ seller.seller.company_name }}</p>
                    <span class="font-bold text-agro">{{ seller.total }} грн</span>
                  </div>
                  <p v-if="seller.seller.region" class="text-xs text-agro-light mb-3">📍 {{ seller.seller.region }}</p>
                  <div class="space-y-1 mb-3">
                    <div v-for="item in seller.items" :key="item.treatment_name" class="flex items-center justify-between text-sm py-1 border-t border-agro-border first:border-0">
                      <p class="text-agro-dark">{{ item.treatment_name }}</p>
                      <span class="font-semibold text-agro ml-2">{{ item.offer.price }} грн</span>
                    </div>
                  </div>
                  <button @click="addToCart(seller.items)" :disabled="cartSaving" class="btn-primary w-full py-2.5 text-sm">
                    {{ cartSaving ? '...' : '🛒 Додати до кошика' }}
                  </button>
                </div>
              </template>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Trash2, X } from 'lucide-vue-next'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const farmCropId = route.query.farmCropId as string
const cropType = route.query.cropType as string
const supabase = useSupabaseClient()

const loading = ref(true)
const saving = ref(false)
const savingPhase = ref<string | null>(null)
const program = ref<any>(null)
const treatments = ref<any[]>([])
const phases = ref<any[]>([])
const activePhasesKeys = ref<string[]>([])

const showPhasePicker = ref(false)
const showAddPhaseInline = ref(false)
const newPhaseName = ref('')
const newPhaseEmoji = ref('🌱')
const productSuggestions = ref<any[]>([])
const showSuggestionsFor = ref<string | null>(null)
const inlineT = ref<Record<string, { product_name: string; type: string; dosage: string; notes: string }>>({})
let searchTimer: any = null

const TYPE_ICONS: Record<string, string> = {
  підживлення: '🌿', захист: '🛡', гербіцид: '🌾', фунгіцид: '🍄', інсектицид: '🐛',
}
const TYPE_BG: Record<string, string> = {
  підживлення: 'bg-amber-50', захист: 'bg-blue-50', гербіцид: 'bg-orange-50', фунгіцид: 'bg-purple-50', інсектицид: 'bg-red-50',
}
const TYPE_BADGE: Record<string, string> = {
  підживлення: 'bg-amber-50 border-amber-200 text-amber-700',
  захист: 'bg-blue-50 border-blue-200 text-blue-700',
  гербіцид: 'bg-orange-50 border-orange-200 text-orange-700',
  фунгіцид: 'bg-purple-50 border-purple-200 text-purple-700',
  інсектицид: 'bg-red-50 border-red-200 text-red-700',
}

const treatmentsByPhase = computed(() => {
  const map: Record<string, any[]> = {}
  for (const t of treatments.value) {
    const key = t.phase || '__none__'
    if (!map[key]) map[key] = []
    map[key].push(t)
  }
  return map
})

const activePhases = computed(() =>
  activePhasesKeys.value
    .map(key => phases.value.find(p => p.key === key))
    .filter(Boolean)
)

const availablePhases = computed(() =>
  phases.value.filter(p => !activePhasesKeys.value.includes(p.key))
)

const ensureInlineT = (key: string) => {
  if (!inlineT.value[key]) {
    inlineT.value[key] = { product_name: '', type: 'підживлення', dosage: '', notes: '' }
  }
}

const removePhase = async (phase: any) => {
  const count = treatmentsByPhase.value[phase.key]?.length || 0
  if (count > 0 && !confirm(`Видалити фазу "${phase.key}" і всі ${count} обробок у ній?`)) return
  if (count > 0 && program.value) {
    const ids = treatmentsByPhase.value[phase.key].map((t: any) => t.id)
    await supabase.from('program_treatments').delete().in('id', ids)
    treatments.value = treatments.value.filter(t => t.phase !== phase.key)
  }
  activePhasesKeys.value = activePhasesKeys.value.filter(k => k !== phase.key)
}

const addActivePhase = (phase: any) => {
  if (!activePhasesKeys.value.includes(phase.key)) {
    activePhasesKeys.value.push(phase.key)
    ensureInlineT(phase.key)
  }
  showPhasePicker.value = false
  showAddPhaseInline.value = false
}

const searchProducts = (phaseKey: string) => {
  clearTimeout(searchTimer)
  const q = inlineT.value[phaseKey]?.product_name.trim()
  if (!q || q.length < 2) { productSuggestions.value = []; return }
  searchTimer = setTimeout(async () => {
    const { data } = await supabase
      .from('seller_offers')
      .select('id, product_name, price, seller_profiles(company_name)')
      .ilike('product_name', `%${q}%`)
      .eq('in_stock', true)
      .limit(8)
    productSuggestions.value = data || []
  }, 300)
}

const selectProduct = (phaseKey: string, p: any) => {
  inlineT.value[phaseKey].product_name = p.product_name
  productSuggestions.value = []
  showSuggestionsFor.value = null
}

const hideSuggestions = () => {
  setTimeout(() => { showSuggestionsFor.value = null }, 200)
}

const load = async () => {
  loading.value = true
  const { data: phasesData } = await supabase.from('growth_phases').select('*').order('order_num', { ascending: true })
  phases.value = (phasesData || []).map((p: any) => ({ key: p.key, emoji: p.emoji, order: p.order_num }))

  if (farmCropId) {
    const { data: programData } = await supabase
      .from('protection_programs').select('*').eq('farm_crop_id', farmCropId).maybeSingle()
    program.value = programData
    if (programData) {
      const { data: treatmentsData } = await supabase
        .from('program_treatments').select('*').eq('program_id', programData.id).order('phase_order', { ascending: true })
      treatments.value = treatmentsData || []
      // Автоматично показуємо фази що вже мають обробки
      const usedPhaseKeys = [...new Set(treatmentsData?.map((t: any) => t.phase).filter(Boolean) || [])]
      const orderedKeys = phases.value.map(p => p.key).filter(k => usedPhaseKeys.includes(k))
      activePhasesKeys.value = orderedKeys
      orderedKeys.forEach(ensureInlineT)
    }
  }
  loading.value = false
}

onMounted(load)

const saveTreatment = async (phase: any) => {
  const t = inlineT.value[phase.key]
  if (!t?.product_name || !program.value) return
  savingPhase.value = phase.key
  const payload = {
    program_id: program.value.id,
    phase: phase.key,
    phase_order: phase.order ?? 99,
    type: t.type,
    product_name: t.product_name,
    dosage: t.dosage || null,
    notes: t.notes || null,
  }
  const { data: inserted, error } = await supabase.from('program_treatments').insert(payload).select().single()
  if (inserted) {
    treatments.value = [...treatments.value, inserted]
  } else {
    const { data } = await supabase.from('program_treatments').select('*').eq('program_id', program.value.id).order('phase_order', { ascending: true })
    treatments.value = data || []
  }
  t.product_name = ''
  t.dosage = ''
  t.notes = ''
  savingPhase.value = null
}

const addCustomPhase = async () => {
  if (!newPhaseName.value.trim()) return
  const { data: { session } } = await supabase.auth.getSession()
  const newOrderNum = phases.value.length + 1
  const { data: inserted } = await supabase.from('growth_phases').insert({
    key: newPhaseName.value.trim(),
    emoji: newPhaseEmoji.value || '🌱',
    order_num: newOrderNum,
    is_default: false,
    created_by: session?.user?.id,
  }).select().single()
  const newPhase = inserted || { key: newPhaseName.value.trim(), emoji: newPhaseEmoji.value || '🌱', order: newOrderNum }
  phases.value = [...phases.value, newPhase]
  newPhaseName.value = ''
  newPhaseEmoji.value = '🌱'
  showAddPhaseInline.value = false
  addActivePhase(newPhase)
}

const createProgram = async () => {
  saving.value = true
  const { data } = await supabase.from('protection_programs').upsert({
    farm_crop_id: farmCropId,
    name: `Програма для ${cropType}`,
    description: `Календар живлення та захисту для ${cropType}`,
  }, { onConflict: 'farm_crop_id' }).select().single()
  program.value = data
  saving.value = false
}

const deleteTreatment = async (t: any) => {
  if (!confirm(`Видалити "${t.product_name}"?`)) return
  await supabase.from('program_treatments').delete().eq('id', t.id)
  treatments.value = treatments.value.filter(tr => tr.id !== t.id)
}

// Розумний підбір
const showSmartModal = ref(false)
const smartBuyLoading = ref(false)
const smartBuyResult = ref<any>(null)
const cartSaving = ref(false)
const { success: showSuccess, error: showError } = useToast()

const openSmartBuy = async () => {
  showSmartModal.value = true
  smartBuyLoading.value = true
  smartBuyResult.value = null

  const productNames = [...new Set(treatments.value.map(t => t.product_name))]
  const { data: offers } = await supabase
    .from('seller_offers')
    .select('*, seller_profiles(id, company_name, region)')
    .in('product_name', productNames)
    .eq('in_stock', true)

  const foundProducts: any[] = []
  const notFound: string[] = []

  for (const name of productNames) {
    const productOffers = (offers || []).filter((o: any) => o.product_name === name)
    if (productOffers.length > 0) {
      foundProducts.push({ treatment_name: name, offers: productOffers })
    } else {
      notFound.push(name)
    }
  }

  // Найдешевший варіант (по одному від кожного)
  let cheapestTotal = 0
  const cheapestItems: any[] = []
  for (const fp of foundProducts) {
    const cheapest = fp.offers.reduce((min: any, o: any) => o.price < min.price ? o : min)
    cheapestItems.push({ treatment_name: fp.treatment_name, offer: cheapest })
    cheapestTotal += cheapest.price
  }

  // Продавці з усіма товарами
  const sellerMap: Record<string, any> = {}
  for (const fp of foundProducts) {
    for (const offer of fp.offers) {
      const sellerId = offer.seller_profiles?.id
      if (!sellerId) continue
      if (!sellerMap[sellerId]) sellerMap[sellerId] = { seller: offer.seller_profiles, items: [], total: 0, seen: new Set() }
      if (!sellerMap[sellerId].seen.has(fp.treatment_name)) {
        sellerMap[sellerId].seen.add(fp.treatment_name)
        sellerMap[sellerId].items.push({ treatment_name: fp.treatment_name, offer })
        sellerMap[sellerId].total += offer.price
      }
    }
  }

  const fullSellers = Object.values(sellerMap)
    .filter((s: any) => foundProducts.every(fp => s.seen.has(fp.treatment_name)))
    .sort((a: any, b: any) => a.total - b.total)

  smartBuyResult.value = { foundProducts, notFound, cheapestItems, cheapestTotal, fullSellers }
  smartBuyLoading.value = false
}

const addToCart = async (items: any[]) => {
  cartSaving.value = true
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { showError('Необхідна авторизація'); cartSaving.value = false; return }
  for (const item of items) {
    await supabase.from('cart_items').upsert({ user_id: session.user.id, offer_id: item.offer.id, quantity: 1 }, { onConflict: 'user_id,offer_id' })
  }
  cartSaving.value = false
  showSmartModal.value = false
  showSuccess(`${items.length} товарів додано до кошика 🛒`)
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
