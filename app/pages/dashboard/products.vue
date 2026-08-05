<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="flex items-center gap-2.5 mb-1.5">
        <div class="dash-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/><path d="M3.27 6.96L12 12l8.73-5.04M12 22V12"/>
          </svg>
        </div>
        <h1 class="dash-title bitter">Товари</h1>
        <button @click="showAdd = true" class="dash-btn-primary ml-auto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Додати товар
        </button>
      </div>
      <p class="dash-subtitle">Управління каталогом товарів</p>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="card animate-pulse h-16"></div>
    </div>

    <div v-else-if="offers.length === 0" class="card text-center py-16">
      <div class="dash-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/><path d="M3.27 6.96L12 12l8.73-5.04M12 22V12"/>
        </svg>
      </div>
      <p class="font-bold text-agro-dark text-lg mb-2">Товарів поки немає</p>
      <p class="text-agro-light mb-6">Додайте свої пропозиції щоб клієнти могли замовити</p>
      <button @click="showAdd = true" class="dash-btn-primary"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg> Додати перший товар</button>
    </div>

    <div v-else class="card overflow-hidden p-0">
      <table class="w-full">
        <thead class="bg-agro-bg">
          <tr>
            <th class="text-left px-5 py-3 text-xs font-semibold text-agro-light uppercase">Товар</th>
            <th class="text-right px-5 py-3 text-xs font-semibold text-agro-light uppercase">Ціна</th>
            <th class="text-right px-5 py-3 text-xs font-semibold text-agro-light uppercase">Кількість</th>
            <th class="text-center px-5 py-3 text-xs font-semibold text-agro-light uppercase">Наявність</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="offer in offers" :key="offer.id" class="border-t border-agro-border hover:bg-agro-bg transition-colors">
            <td class="px-5 py-4">
              <p class="font-semibold text-agro-dark">{{ offer.product_name }}</p>
              <p class="text-xs text-agro-light">{{ offer.product_slug }}</p>
            </td>
            <td class="px-5 py-4 text-right font-bold text-agro">{{ offer.price }} грн</td>
            <td class="px-5 py-4 text-right text-agro-dark">{{ offer.quantity }}</td>
            <td class="px-5 py-4 text-center">
              <button @click="toggleStock(offer)" class="text-lg">{{ offer.in_stock ? '✅' : '❌' }}</button>
            </td>
            <td class="px-5 py-4 text-right">
              <button @click="deleteOffer(offer)" class="text-red-400 hover:text-red-600 transition-colors">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модалка додавання -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAdd" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAdd = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
            <h2 class="font-bold text-agro-dark text-xl mb-5">➕ Нова пропозиція</h2>

            <!-- Пошук товару -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Товар з каталогу</label>
              <div class="relative">
                <input v-model="productSearch" @input="searchProducts" class="input" placeholder="Введіть назву препарату..." />
                <div v-if="productResults.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                  <button
                    v-for="p in productResults"
                    :key="p.slug"
                    @mousedown.prevent="selectProduct(p)"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover border-b border-agro-border last:border-0"
                  >{{ p.name }}</button>
                </div>
              </div>
              <p v-if="selectedProduct" class="text-xs text-agro mt-1 font-medium">✅ {{ selectedProduct.name }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Ціна (грн)</label>
                <input v-model="newOffer.price" type="number" class="input" placeholder="0" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Кількість</label>
                <input v-model="newOffer.quantity" type="number" class="input" placeholder="0" />
              </div>
            </div>

            <div class="flex gap-3 mt-5">
              <button @click="showAdd = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="addOffer" :disabled="!selectedProduct || saving" class="btn-primary flex-1">{{ saving ? '...' : 'Додати' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Товари' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const api = useAgroApi()

const loading = ref(true)
const saving = ref(false)
const showAdd = ref(false)
const offers = ref<any[]>([])
const productSearch = ref('')
const productResults = ref<any[]>([])
const selectedProduct = ref<any>(null)
const newOffer = reactive({ price: '', quantity: '' })
let searchTimer: any = null

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const { data: sellerData } = await supabase.from('seller_profiles').select('id').eq('user_id', uid).single()
const sellerId = sellerData?.id

const load = async () => {
  if (!sellerId) { loading.value = false; return }
  const { data } = await supabase.from('seller_offers').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false })
  offers.value = data || []
  loading.value = false
}

await load()

const searchProducts = () => {
  clearTimeout(searchTimer)
  if (!productSearch.value.trim()) { productResults.value = []; return }
  searchTimer = setTimeout(async () => {
    const data = await api.getProducts({ search: productSearch.value, limit: 10 }).catch(() => ({ items: [] }))
    productResults.value = (Array.isArray(data) ? data : data.items || [])
  }, 300)
}

const selectProduct = (p: any) => {
  selectedProduct.value = p
  productSearch.value = p.name
  productResults.value = []
}

const addOffer = async () => {
  if (!selectedProduct.value || !sellerId) return
  saving.value = true
  await supabase.from('seller_offers').insert({
    seller_id: sellerId,
    product_slug: selectedProduct.value.slug,
    product_name: selectedProduct.value.name,
    price: parseFloat(newOffer.price) || 0,
    quantity: parseInt(newOffer.quantity) || 0,
    in_stock: true,
  })
  selectedProduct.value = null
  productSearch.value = ''
  Object.assign(newOffer, { price: '', quantity: '' })
  showAdd.value = false
  saving.value = false
  await load()
}

const toggleStock = async (offer: any) => {
  await supabase.from('seller_offers').update({ in_stock: !offer.in_stock }).eq('id', offer.id)
  offer.in_stock = !offer.in_stock
}

const { confirm: confirmDialog } = useConfirm()

const deleteOffer = async (offer: any) => {
  if (!await confirmDialog(`"${offer.product_name}" буде видалено з ваших товарів.`, { title: 'Видалити товар?' })) return
  await supabase.from('seller_offers').delete().eq('id', offer.id)
  offers.value = offers.value.filter(o => o.id !== offer.id)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.dash-page { padding: 44px 56px; font-family: Manrope, sans-serif; max-width: 1196px; }
.dash-head { margin-bottom: 28px; }
.dash-title { font-family: 'Bitter', Georgia, serif; font-weight: 800; font-size: 28px; color: rgb(27,46,27); margin: 0; }
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-subtitle { font-size: 15.5px; color: rgb(107,122,100); margin: 4px 0 0; }
.dash-icon-box { width: 40px; height: 40px; border-radius: 10px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
.dash-btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: 10px; background: rgb(47,82,51); color: rgb(250,246,236); font-weight: 700; font-size: 14px; border: none; cursor: pointer; }
@media (max-width: 640px) { .dash-page { padding: 24px 20px; } }
</style>
