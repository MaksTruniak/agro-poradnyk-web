<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="flex items-center gap-2.5 mb-1.5">
        <div class="dash-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>
          </svg>
        </div>
        <h1 class="dash-title bitter">{{ isSeller ? 'Замовлення клієнтів' : 'Замовлення' }}</h1>
      </div>
      <p class="dash-subtitle">Список замовлень та їх статус</p>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="card animate-pulse">
        <div class="h-5 bg-agro-bg rounded w-1/3 mb-3"></div>
        <div class="h-3 bg-agro-bg rounded w-full mb-2"></div>
        <div class="h-3 bg-agro-bg rounded w-2/3"></div>
      </div>
    </div>

    <div v-else-if="orders.length === 0" class="card text-center py-16">
      <div class="dash-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>
        </svg>
      </div>
      <p class="font-bold text-agro-dark text-lg mb-2">Замовлень поки немає</p>
    </div>

    <div v-else class="space-y-4">
      <div v-for="order in orders" :key="order.id" class="card">
        <div class="flex items-start justify-between mb-4">
          <div>
            <p class="font-bold text-agro-dark">#{{ order.id.slice(0,8).toUpperCase() }}</p>
            <p class="text-xs text-agro-light mt-0.5">{{ formatDate(order.created_at) }}</p>
          </div>
          <div class="flex items-center gap-3 flex-wrap justify-end">
            <span class="font-bold text-agro text-lg">{{ order.total }} грн</span>
            <span class="text-xs font-semibold px-3 py-1.5 rounded-full" :class="STATUS_CLASS[order.status]">
              {{ STATUS_LABEL[order.status] || order.status }}
            </span>
            <button
              v-if="isSeller && NEXT_STATUS[order.status]"
              @click="updateStatus(order.id, NEXT_STATUS[order.status])"
              class="text-xs border-2 border-agro text-agro rounded-lg px-3 py-1.5 font-semibold hover:bg-agro hover:text-white transition-colors"
            >{{ NEXT_STATUS_LABEL[order.status] }}</button>
            <button
              v-if="isSeller && order.status === 'pending'"
              @click="updateStatus(order.id, 'cancelled')"
              class="text-xs border-2 border-red-200 text-red-400 rounded-lg px-3 py-1.5 font-semibold hover:bg-red-50 transition-colors"
            >❌ Скасувати</button>
          </div>
        </div>

        <div class="space-y-2 mb-4">
          <div v-for="item in order.order_items" :key="item.id" class="flex justify-between text-sm">
            <span class="text-agro-dark">{{ item.seller_offers?.product_name }}</span>
            <span class="text-agro-light">{{ item.quantity }} × {{ item.price }} грн</span>
          </div>
        </div>

        <div class="border-t border-agro-border pt-3 flex flex-wrap gap-4 text-xs text-agro-light">
          <span v-if="order.delivery_method === 'nova_poshta'">📦 НП: {{ order.delivery_address }}</span>
          <span v-else-if="order.delivery_method === 'ukrposhta'">✉️ Укрпошта: {{ order.delivery_address }}</span>
          <span v-else>🏪 Самовивіз</span>
          <span>💳 {{ order.payment_method === 'cash' ? 'Готівка' : 'Картою' }}</span>
          <span v-if="order.comment">💬 {{ order.comment }}</span>
        </div>
        <div v-if="isSeller && order.users" class="mt-2 text-xs text-agro-light flex gap-4">
          <span>👤 {{ order.users.name || 'Покупець' }}</span>
          <span v-if="order.users.phone">📞 {{ order.users.phone }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Замовлення' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const MARKETPLACE = false
if (!MARKETPLACE) await navigateTo('/dashboard')

const supabase = useSupabaseClient()
const loading = ref(true)
const orders = ref<any[]>([])

const uid = ref<string | null>(null)
const profileRole = ref<string>('farmer')
const isSeller = computed(() => profileRole.value === 'seller')

const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ Нове', confirmed: '✅ Підтверджено', shipped: '🚚 Відправлено',
  delivered: '📦 Доставлено', cancelled: '❌ Скасовано', completed: '✔️ Виконано',
}
const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-agro-hover text-agro',
}
const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed', confirmed: 'shipped', shipped: 'delivered',
}
const NEXT_STATUS_LABEL: Record<string, string> = {
  pending: '✅ Підтвердити', confirmed: '🚚 Відправлено', shipped: '📦 Доставлено',
}

const STATUSES = [
  { value: 'pending', label: '⏳ Нове' },
  { value: 'confirmed', label: '✅ Підтверджено' },
  { value: 'shipped', label: '🚚 Відправлено' },
  { value: 'delivered', label: '📦 Доставлено' },
  { value: 'completed', label: '✔️ Виконано' },
  { value: 'cancelled', label: '❌ Скасовано' },
]

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

const load = async () => {
  loading.value = true
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }
  uid.value = user.id

  const { data: profileData } = await supabase.from('users').select('role').eq('id', user.id).single()
  profileRole.value = profileData?.role || 'farmer'

  if (profileRole.value === 'seller') {
    const { data: seller } = await supabase.from('seller_profiles').select('id').eq('user_id', user.id).single()
    if (seller) {
      const { data } = await supabase
        .from('orders').select('*, order_items(id, quantity, price, offer_id, seller_offers!offer_id(product_name)), users!user_id(name, phone)')
        .eq('seller_id', seller.id).order('created_at', { ascending: false })
      orders.value = data || []
    }
  } else {
    const { data } = await supabase
      .from('orders').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    orders.value = data || []
  }
  loading.value = false
}

onMounted(load)

const updateStatus = async (orderId: string, status: string) => {
  await supabase.from('orders').update({ status }).eq('id', orderId)
  const order = orders.value.find(o => o.id === orderId)
  if (order) order.status = status
}
</script>

<style scoped>
.dash-page { padding: 44px 56px; font-family: Manrope, sans-serif; max-width: 1196px; }
.dash-head { margin-bottom: 28px; }
.dash-title { font-family: 'Bitter', Georgia, serif; font-weight: 800; font-size: 28px; color: rgb(27,46,27); margin: 0; }
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-subtitle { font-size: 15.5px; color: rgb(107,122,100); margin: 4px 0 0; }
.dash-icon-box { width: 40px; height: 40px; border-radius: 10px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
@media (max-width: 640px) { .dash-page { padding: 24px 20px; } }
</style>
