<template>
  <div class="max-w-7xl mx-auto px-8 py-12">
    <!-- Заголовок -->
    <div class="mb-10">
      <h1 class="text-3xl font-extrabold text-agro-dark">Кошик</h1>
      <p v-if="items.length" class="text-agro-light mt-1">{{ items.length }} {{ itemWord }} на суму {{ total }} грн</p>
    </div>

    <div v-if="loading" class="flex justify-center py-24">
      <div class="animate-spin text-5xl">🌿</div>
    </div>

    <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center py-32 text-center">
      <div class="w-24 h-24 bg-agro-hover rounded-3xl flex items-center justify-center text-5xl mb-6">🛒</div>
      <h2 class="text-2xl font-bold text-agro-dark mb-2">Кошик порожній</h2>
      <p class="text-agro-light mb-8 max-w-xs">Перегляньте каталог і додайте потрібні препарати або добрива</p>
      <NuxtLink to="/catalog" class="btn-primary px-8 py-3 text-base">Перейти до каталогу →</NuxtLink>
    </div>

    <div v-else class="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
      <!-- Товари -->
      <div class="space-y-4">
        <div v-for="(group, sellerId) in grouped" :key="sellerId" class="bg-white rounded-2xl border border-agro-border overflow-hidden">
          <!-- Продавець -->
          <div class="flex items-center gap-3 px-6 py-4 bg-agro-hover border-b border-agro-border">
            <div class="w-8 h-8 rounded-xl bg-agro/20 flex items-center justify-center text-agro font-bold text-sm">🏪</div>
            <p class="font-bold text-agro-dark">{{ group.sellerName }}</p>
            <span class="ml-auto text-sm text-agro-light">{{ group.items.length }} поз.</span>
          </div>

          <!-- Рядки товарів -->
          <div class="divide-y divide-agro-border">
            <div v-for="item in group.items" :key="item.id" class="flex items-center gap-5 px-6 py-5">
              <!-- Іконка -->
              <div class="w-14 h-14 rounded-2xl bg-agro-hover flex items-center justify-center text-3xl shrink-0">🌿</div>

              <!-- Назва + ціна -->
              <div class="flex-1 min-w-0">
                <NuxtLink :to="`/catalog/${item.seller_offers?.product_slug}`" class="font-semibold text-agro-dark hover:text-agro transition-colors text-base line-clamp-2 leading-snug">
                  {{ item.seller_offers?.product_name }}
                </NuxtLink>
                <p class="text-sm text-agro-light mt-1">{{ item.seller_offers?.price }} грн / шт</p>
              </div>

              <!-- Кількість -->
              <div class="flex items-center bg-agro-hover rounded-xl overflow-hidden shrink-0">
                <button @click="updateQty(item.id, item.quantity - 1)" class="w-10 h-10 flex items-center justify-center text-agro font-bold hover:bg-agro hover:text-white transition-colors text-xl">−</button>
                <span class="w-10 text-center font-bold text-agro-dark">{{ item.quantity }}</span>
                <button @click="updateQty(item.id, item.quantity + 1)" class="w-10 h-10 flex items-center justify-center text-agro font-bold hover:bg-agro hover:text-white transition-colors text-xl">+</button>
              </div>

              <!-- Сума -->
              <p class="font-extrabold text-agro text-xl w-28 text-right shrink-0">
                {{ (item.seller_offers?.price * item.quantity).toLocaleString('uk-UA') }} грн
              </p>

              <!-- Видалити -->
              <button @click="removeItem(item.id)" class="w-9 h-9 rounded-xl flex items-center justify-center text-agro-light hover:bg-red-50 hover:text-red-500 transition-colors shrink-0">
                🗑
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Підсумок -->
      <div class="bg-white rounded-2xl border border-agro-border p-6 sticky top-24">
        <h2 class="font-bold text-agro-dark text-xl mb-5">Підсумок</h2>

        <div class="space-y-3 mb-5">
          <div v-for="(group, sellerId) in grouped" :key="sellerId" class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-sm">🏪</span>
              <span class="text-sm text-agro-light truncate">{{ group.sellerName }}</span>
            </div>
            <span class="text-sm font-semibold text-agro-dark shrink-0 ml-2">{{ group.subtotal.toLocaleString('uk-UA') }} грн</span>
          </div>
        </div>

        <div class="border-t border-agro-border pt-5 mb-6">
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold text-agro-dark">Разом</span>
            <span class="text-3xl font-extrabold text-agro">{{ total.toLocaleString('uk-UA') }} грн</span>
          </div>
        </div>

        <NuxtLink to="/checkout" class="btn-primary w-full text-center block py-4 text-base font-bold rounded-xl">
          Оформити замовлення →
        </NuxtLink>
        <NuxtLink to="/catalog" class="block text-center text-agro-light text-sm mt-4 hover:text-agro transition-colors">
          ← Продовжити покупки
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const loading = ref(true)
const items = ref<any[]>([])

const loadCart = async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) { loading.value = false; return }
  const { data } = await client
    .from('cart_items')
    .select('*, seller_offers(id, price, product_name, product_slug, seller_profiles(id, company_name, user_id))')
    .eq('user_id', user.id)
  items.value = data || []
  loading.value = false
}

onMounted(loadCart)

const itemWord = computed(() => {
  const n = items.value.length
  if (n === 1) return 'товар'
  if (n >= 2 && n <= 4) return 'товари'
  return 'товарів'
})

const grouped = computed(() => {
  const map: Record<string, { sellerName: string; items: any[]; subtotal: number }> = {}
  for (const item of items.value) {
    const sid = item.seller_offers?.seller_profiles?.id || 'unknown'
    const name = item.seller_offers?.seller_profiles?.company_name || 'Продавець'
    if (!map[sid]) map[sid] = { sellerName: name, items: [], subtotal: 0 }
    map[sid].items.push(item)
    map[sid].subtotal += (item.seller_offers?.price || 0) * item.quantity
  }
  return map
})

const total = computed(() =>
  items.value.reduce((sum, i) => sum + (i.seller_offers?.price || 0) * i.quantity, 0)
)

const updateQty = async (itemId: string, qty: number) => {
  if (qty < 1) { removeItem(itemId); return }
  await client.from('cart_items').update({ quantity: qty }).eq('id', itemId)
  const item = items.value.find(i => i.id === itemId)
  if (item) item.quantity = qty
}

const removeItem = async (itemId: string) => {
  await client.from('cart_items').delete().eq('id', itemId)
  items.value = items.value.filter(i => i.id !== itemId)
}
</script>
