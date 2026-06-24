<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <NuxtLink to="/cart" class="inline-flex items-center gap-2 text-agro-light hover:text-agro mb-8 text-sm font-medium">
      ← Назад до кошика
    </NuxtLink>

    <h1 class="text-2xl font-extrabold text-agro-dark mb-8">📋 Оформлення замовлення</h1>

    <div v-if="success" class="text-center py-20">
      <p class="text-6xl mb-4">✅</p>
      <p class="font-bold text-agro-dark text-2xl mb-2">Замовлення оформлено!</p>
      <p class="text-agro-light mb-2">Номер: <span class="font-bold text-agro">#{{ orderId }}</span></p>
      <p class="text-agro-light mb-8">Продавці отримали повідомлення про ваше замовлення.</p>
      <NuxtLink to="/catalog" class="btn-primary inline-block">До каталогу →</NuxtLink>
    </div>

    <div v-else class="grid lg:grid-cols-3 gap-8">
      <!-- Форма -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Контактні дані -->
        <div class="card">
          <h2 class="font-bold text-agro-dark mb-5 text-lg">👤 Контактні дані</h2>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Ім'я</label>
              <input v-model="form.name" class="input" placeholder="Ваше ім'я" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Телефон</label>
              <input v-model="form.phone" class="input" placeholder="+380..." />
            </div>
          </div>
        </div>

        <!-- Доставка -->
        <div class="card">
          <h2 class="font-bold text-agro-dark mb-5 text-lg">🚚 Доставка</h2>

          <div v-if="availableDelivery.length === 0" class="text-agro-light text-sm mb-4">
            Продавець не вказав способи доставки
          </div>
          <div class="flex flex-wrap gap-3 mb-5">
            <button
              v-for="opt in availableDelivery"
              :key="opt.key"
              @click="form.delivery = opt.key"
              class="flex-1 min-w-[140px] border-2 rounded-xl p-4 text-left transition-colors"
              :class="form.delivery === opt.key ? 'border-agro bg-agro-hover' : 'border-agro-border'"
            >
              <p class="font-semibold text-agro-dark">{{ opt.icon }} {{ opt.label }}</p>
              <p v-if="opt.key === 'pickup' && sellerPickupAddress" class="text-xs text-agro-light mt-1">{{ sellerPickupAddress }}</p>
              <p v-else-if="opt.key === 'nova_poshta'" class="text-xs text-agro-light mt-1">Доставка у відділення або поштомат</p>
              <p v-else-if="opt.key === 'ukrposhta'" class="text-xs text-agro-light mt-1">Доставка Укрпоштою</p>
            </button>
          </div>

          <!-- Нова Пошта / Укрпошта -->
          <div v-if="form.delivery === 'nova_poshta' || form.delivery === 'ukrposhta'" class="space-y-4">
            <!-- Місто -->
            <div class="relative">
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Місто</label>
              <input
                v-model="citySearch"
                @input="onCitySearch"
                @focus="showCities = true"
                @blur="setTimeout(() => showCities = false, 200)"
                class="input"
                :class="selectedCity ? 'border-agro' : ''"
                placeholder="Введіть назву міста..."
              />
              <div v-if="showCities && cityResults.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-20 max-h-52 overflow-y-auto">
                <button
                  v-for="city in cityResults"
                  :key="city.DeliveryCity"
                  @mousedown.prevent="selectCity(city)"
                  class="w-full text-left px-4 py-3 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0"
                >{{ city.Present }}</button>
              </div>
              <div v-if="cityLoading" class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light text-sm">...</div>
            </div>

            <!-- Відділення -->
            <div v-if="selectedCity" class="relative">
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Відділення</label>
              <input
                v-model="warehouseSearch"
                @input="onWarehouseSearch"
                @focus="showWarehouses = true"
                @blur="setTimeout(() => showWarehouses = false, 200)"
                class="input"
                :class="selectedWarehouse ? 'border-agro' : ''"
                placeholder="Номер або адреса відділення..."
              />
              <div v-if="showWarehouses && warehouseResults.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-20 max-h-52 overflow-y-auto">
                <button
                  v-for="w in warehouseResults"
                  :key="w.Ref"
                  @mousedown.prevent="selectWarehouse(w)"
                  class="w-full text-left px-4 py-3 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0"
                >{{ w.Description }}</button>
              </div>
              <div v-if="warehouseLoading" class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light text-sm">...</div>
            </div>
          </div>
        </div>

        <!-- Оплата -->
        <div class="card">
          <h2 class="font-bold text-agro-dark mb-5 text-lg">💳 Оплата</h2>
          <div class="flex gap-3">
            <button
              @click="form.payment = 'cash'"
              class="flex-1 border-2 rounded-xl p-4 text-left transition-colors"
              :class="form.payment === 'cash' ? 'border-agro bg-agro-hover' : 'border-agro-border'"
            >
              <p class="font-semibold text-agro-dark">💵 Готівка при отриманні</p>
            </button>
            <button
              @click="form.payment = 'card'"
              class="flex-1 border-2 rounded-xl p-4 text-left transition-colors"
              :class="form.payment === 'card' ? 'border-agro bg-agro-hover' : 'border-agro-border'"
            >
              <p class="font-semibold text-agro-dark">💳 Картою онлайн</p>
              <p class="text-xs text-agro-light mt-1">LiqPay (скоро)</p>
            </button>
          </div>
        </div>

        <!-- Коментар -->
        <div class="card">
          <h2 class="font-bold text-agro-dark mb-4 text-lg">💬 Коментар</h2>
          <textarea
            v-model="form.comment"
            class="input resize-none"
            rows="3"
            placeholder="Додаткова інформація для продавця..."
          />
        </div>
      </div>

      <!-- Підсумок -->
      <div class="lg:col-span-1">
        <div class="card sticky top-24">
          <p class="font-bold text-agro-dark text-lg mb-4">Ваше замовлення</p>

          <div class="space-y-3 mb-4 max-h-64 overflow-y-auto">
            <div v-for="item in items" :key="item.id" class="flex justify-between text-sm">
              <div class="flex-1 min-w-0 mr-2">
                <p class="text-agro-dark truncate">{{ item.seller_offers?.product_name }}</p>
                <p class="text-agro-light text-xs">{{ item.seller_offers?.price }} грн × {{ item.quantity }}</p>
              </div>
              <span class="font-semibold text-agro-dark shrink-0">{{ item.seller_offers?.price * item.quantity }} грн</span>
            </div>
          </div>

          <div class="border-t border-agro-border pt-4 mb-5">
            <div class="flex justify-between items-center">
              <span class="font-bold text-agro-dark">Разом</span>
              <span class="font-extrabold text-agro text-2xl">{{ total }} грн</span>
            </div>
          </div>

          <p v-if="error" class="text-red-500 text-sm mb-3">{{ error }}</p>

          <button
            @click="handleOrder"
            :disabled="ordering"
            class="btn-primary w-full py-4 text-base"
          >
            {{ ordering ? 'Оформлення...' : `Підтвердити замовлення · ${total} грн` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

useSeoMeta({ title: 'Оформлення замовлення' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const np = useNovaPost()

const loading = ref(true)
const ordering = ref(false)
const success = ref(false)
const orderId = ref('')
const error = ref('')
const items = ref<any[]>([])
const uid = ref<string | null>(null)
const sellerPickupAddress = ref('')

const ALL_DELIVERY_OPTIONS = [
  { key: 'nova_poshta', label: 'Нова Пошта', icon: '📦' },
  { key: 'ukrposhta', label: 'Укрпошта', icon: '✉️' },
  { key: 'pickup', label: 'Самовивіз', icon: '🏪' },
]
const availableDelivery = ref(ALL_DELIVERY_OPTIONS)

const form = reactive({
  name: '',
  phone: '',
  delivery: 'nova_poshta',
  payment: 'cash',
  comment: '',
})

// Нова Пошта
const citySearch = ref('')
const cityResults = ref<any[]>([])
const cityLoading = ref(false)
const showCities = ref(false)
const selectedCity = ref<any>(null)

const warehouseSearch = ref('')
const warehouseResults = ref<any[]>([])
const warehouseLoading = ref(false)
const showWarehouses = ref(false)
const selectedWarehouse = ref<any>(null)

let cityTimer: any = null
let warehouseTimer: any = null

// Завантажуємо кошик і профіль після монтування (getSession() = null на SSR)
const loadCheckout = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  uid.value = user.id

  const [cartData, profileData] = await Promise.all([
    supabase.from('cart_items')
      .select('*, seller_offers(id, price, product_name, product_slug, seller_profiles(id, company_name, user_id))')
      .eq('user_id', user.id),
    supabase.from('users').select('name, phone').eq('id', user.id).single(),
  ])

  items.value = cartData.data || []
  if (profileData.data) {
    form.name = profileData.data.name || ''
    form.phone = profileData.data.phone || ''
  }

  // Підтягуємо опції доставки продавця (беремо першого продавця з кошика)
  const sellerId = cartData.data?.[0]?.seller_offers?.seller_profiles?.id
  if (sellerId) {
    const { data: sp } = await supabase.from('seller_profiles')
      .select('delivery_options, pickup_address')
      .eq('id', sellerId).single()
    if (sp?.delivery_options?.length) {
      availableDelivery.value = ALL_DELIVERY_OPTIONS.filter(o => sp.delivery_options.includes(o.key))
      form.delivery = availableDelivery.value[0]?.key || 'nova_poshta'
    }
    sellerPickupAddress.value = sp?.pickup_address || ''
  }

  loading.value = false
}

onMounted(loadCheckout)

const total = computed(() =>
  items.value.reduce((sum, i) => sum + (i.seller_offers?.price || 0) * i.quantity, 0)
)

const onCitySearch = () => {
  selectedCity.value = null
  selectedWarehouse.value = null
  clearTimeout(cityTimer)
  if (citySearch.value.length < 2) { cityResults.value = []; return }
  cityTimer = setTimeout(async () => {
    cityLoading.value = true
    cityResults.value = await np.searchCities(citySearch.value).catch(() => [])
    cityLoading.value = false
  }, 400)
}

const selectCity = async (city: any) => {
  selectedCity.value = city
  citySearch.value = city.Present
  cityResults.value = []
  warehouseSearch.value = ''
  selectedWarehouse.value = null
  warehouseLoading.value = true
  warehouseResults.value = await np.getWarehouses(city.DeliveryCity).catch(() => [])
  warehouseLoading.value = false
}

const onWarehouseSearch = () => {
  if (!selectedCity.value) return
  clearTimeout(warehouseTimer)
  warehouseTimer = setTimeout(async () => {
    warehouseLoading.value = true
    warehouseResults.value = await np.getWarehouses(selectedCity.value.DeliveryCity, warehouseSearch.value).catch(() => [])
    warehouseLoading.value = false
  }, 300)
}

const selectWarehouse = (w: any) => {
  selectedWarehouse.value = w
  warehouseSearch.value = w.Description
  warehouseResults.value = []
}

const handleOrder = async () => {
  error.value = ''
  if (!form.name || !form.phone) { error.value = "Заповніть ім'я та телефон"; return }
  if ((form.delivery === 'nova_poshta' || form.delivery === 'ukrposhta') && (!selectedCity.value || !selectedWarehouse.value)) {
    error.value = 'Оберіть місто та відділення'; return
  }

  ordering.value = true
  if (!uid.value) { error.value = 'Не авторизовано'; ordering.value = false; return }
  await supabase.from('users').update({ phone: form.phone }).eq('id', uid.value)

  const deliveryAddress = form.delivery === 'nova_poshta'
    ? `${selectedCity.value?.Present}, ${selectedWarehouse.value?.Description}`
    : ''

  // Групуємо товари по продавцю — окреме замовлення для кожного
  const bySeller: Record<string, { sellerId: string; items: any[]; total: number }> = {}
  for (const item of items.value) {
    const sellerId = item.seller_offers?.seller_profiles?.id || 'unknown'
    if (!bySeller[sellerId]) bySeller[sellerId] = { sellerId, items: [], total: 0 }
    bySeller[sellerId].items.push(item)
    bySeller[sellerId].total += (item.seller_offers?.price || 0) * item.quantity
  }

  let firstOrderId = ''
  for (const group of Object.values(bySeller)) {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: uid.value,
        seller_id: group.sellerId,
        total: group.total,
        status: 'pending',
        delivery_method: form.delivery,
        delivery_address: deliveryAddress,
        payment_method: form.payment,
        comment: form.comment || null,
      })
      .select().single()

    if (orderError) { error.value = orderError.message; ordering.value = false; return }
    if (!firstOrderId) firstOrderId = order.id

    await supabase.from('order_items').insert(
      group.items.map(item => ({
        order_id: order.id,
        offer_id: item.seller_offers.id,
        quantity: item.quantity,
        price: item.seller_offers.price,
        buyer_user_id: uid.value,
        delivery_method: form.delivery,
        delivery_address: deliveryAddress,
        payment_method: form.payment,
        comment: form.comment || null,
      }))
    )

    // Мінусуємо зі складу
    for (const item of group.items) {
      const { data: offer } = await supabase.from('seller_offers').select('quantity').eq('id', item.seller_offers.id).single()
      if (offer) {
        const newQty = Math.max((offer.quantity || 0) - item.quantity, 0)
        await supabase.from('seller_offers').update({ quantity: newQty, in_stock: newQty > 0 }).eq('id', item.seller_offers.id)
      }
    }
  }

  await supabase.from('cart_items').delete().eq('user_id', uid.value)

  ordering.value = false
  orderId.value = firstOrderId.slice(0, 8).toUpperCase()
  success.value = true
}
</script>
