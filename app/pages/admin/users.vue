<template>
  <div class="p-8">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        Користувачі
      </h1>
      <p class="text-agro-light mt-1">{{ total }} зареєстровано</p>
    </div>

    <!-- Пошук -->
    <div class="flex items-center gap-3 mb-5">
      <div class="relative flex-1 max-w-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input v-model="search" class="input pl-9 text-sm" placeholder="Пошук за email..." />
      </div>
    </div>

    <!-- Список -->
    <div v-if="loading" class="card overflow-hidden p-0">
      <div v-for="i in 12" :key="i" class="flex items-center gap-4 px-5 py-3.5 border-b border-agro-border animate-pulse">
        <div class="w-10 h-10 rounded-full bg-agro-bg shrink-0"></div>
        <div class="flex-1"><div class="h-4 bg-agro-bg rounded w-1/3 mb-1.5"></div><div class="h-3 bg-agro-bg rounded w-1/4"></div></div>
      </div>
    </div>

    <div v-else class="card overflow-hidden p-0">
      <div class="divide-y divide-agro-border">
        <div v-for="user in filtered" :key="user.id" class="flex items-center gap-3 px-5 py-3 hover:bg-agro-bg transition-colors">
          <div class="w-10 h-10 rounded-full bg-agro-hover flex items-center justify-center shrink-0 text-agro font-bold text-sm">
            {{ (user.email || '?')[0].toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-agro-dark truncate text-sm">{{ user.email }}</p>
            <p class="text-xs text-agro-light truncate">
              {{ user.user_metadata?.full_name || user.user_metadata?.name || '' }}
              <span v-if="user.user_metadata?.role" class="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
                :class="user.user_metadata.role === 'agronomist' ? 'bg-agro-hover text-agro' : 'bg-agro-bg text-agro-light'">
                {{ roleLabel(user.user_metadata.role) }}
              </span>
            </p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <span v-for="c in (user.coupons || [])" :key="c.code"
              class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
              :title="`Знижка ${c.discount_percent}%`">
              {{ c.code }}
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
              :class="{
                'bg-agro text-white': user.plan === 'pro',
                'bg-blue-100 text-blue-700': user.plan === 'business',
                'bg-amber-100 text-amber-700': user.plan === 'custom',
                'bg-agro-bg text-agro-light': !user.plan || user.plan === 'basic',
              }">
              {{ user.plan === 'pro' ? 'PRO' : user.plan === 'business' ? 'Business' : user.plan === 'custom' ? 'Custom' : 'Basic' }}
            </span>
            <div class="text-right">
              <p class="text-xs text-agro-light">{{ formatDate(user.created_at) }}</p>
              <p class="text-[10px] mt-0.5" :class="user.confirmed_at ? 'text-green-500' : 'text-amber-500'">
                {{ user.confirmed_at ? 'Підтверджено' : 'Не підтверджено' }}
              </p>
            </div>
            <button @click="openManage(user)" class="text-xs font-semibold text-agro hover:text-agro-dark transition-colors px-2 py-1 border border-agro-border rounded-lg hover:bg-agro-bg">
              Керувати
            </button>
          </div>
        </div>
      </div>
      <div v-if="!filtered.length" class="text-center py-12 text-agro-light text-sm">Нічого не знайдено</div>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-between mt-4">
      <p class="text-sm text-agro-light">Сторінка {{ page }} з {{ totalPages }}</p>
      <div class="flex gap-2">
        <button @click="changePage(page - 1)" :disabled="page === 1" class="btn-outline text-sm py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed">← Назад</button>
        <button @click="changePage(page + 1)" :disabled="page >= totalPages" class="btn-outline text-sm py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed">Далі →</button>
      </div>
    </div>
  </div>

  <!-- Модал керування юзером -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="modal.show = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
          <h2 class="font-bold text-agro-dark text-lg mb-1">Керування користувачем</h2>
          <p class="text-sm text-agro-light mb-5 truncate">{{ modal.email }}</p>

          <!-- Таби -->
          <div class="flex gap-1 bg-agro-bg rounded-xl p-1 mb-5">
            <button @click="modal.tab = 'plan'" class="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
              :class="modal.tab === 'plan' ? 'bg-white text-agro-dark shadow-sm' : 'text-agro-light hover:text-agro-dark'">
              Підписка
            </button>
            <button @click="modal.tab = 'coupon'" class="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
              :class="modal.tab === 'coupon' ? 'bg-white text-agro-dark shadow-sm' : 'text-agro-light hover:text-agro-dark'">
              Купон на знижку
            </button>
          </div>

          <!-- Підписка -->
          <div v-if="modal.tab === 'plan'">
            <div class="grid grid-cols-2 gap-2 mb-4">
              <button v-for="p in PLANS" :key="p.value" @click="modal.plan = p.value"
                class="py-3 px-3 rounded-xl text-sm font-semibold border transition-colors"
                :class="modal.plan === p.value ? 'bg-agro text-white border-agro' : 'bg-white text-agro-light border-agro-border hover:border-agro hover:text-agro-dark'">
                {{ p.label }}
              </button>
            </div>
            <div v-if="modal.plan !== 'basic'" class="space-y-2 mb-4">
              <label class="block text-sm font-medium text-agro-dark">Дійсна до</label>
              <input v-model="modal.expires_at" type="date" class="input text-sm" />
            </div>
            <p v-if="saveMsg" class="text-green-600 text-sm font-semibold mb-3 text-center">✓ {{ saveMsg }}</p>
            <p v-if="saveError" class="text-red-500 text-sm mb-3 text-center">{{ saveError }}</p>
            <div class="flex justify-center gap-3">
              <button @click="modal.show = false" class="btn-outline px-8">Закрити</button>
              <button @click="savePlan" :disabled="saving" class="btn-primary px-8 disabled:opacity-50">
                {{ saving ? '...' : 'Зберегти' }}
              </button>
            </div>
          </div>

          <!-- Купон -->
          <div v-else>
            <div class="flex gap-2 mb-4">
              <input v-model="modal.coupon_code" type="text" class="input text-sm flex-1 font-mono uppercase" placeholder="PROMO2024"
                @input="modal.coupon_code = modal.coupon_code.toUpperCase()" />
              <button @click="generateCode" class="shrink-0 text-xs font-semibold text-agro border border-agro-border rounded-xl px-3 hover:bg-agro-bg transition-colors">
                Генерувати
              </button>
            </div>
            <div class="flex items-center gap-3 mb-4">
              <label class="text-sm font-medium text-agro-dark">Знижка %</label>
              <input v-model.number="modal.coupon_discount" type="number" min="1" max="100" class="input text-sm w-24 font-mono" />
            </div>
            <p v-if="saveMsg" class="text-green-600 text-sm font-semibold mb-3 text-center">✓ {{ saveMsg }}</p>
            <p v-if="saveError" class="text-red-500 text-sm mb-3 text-center">{{ saveError }}</p>
            <div class="flex justify-center gap-3">
              <button @click="modal.show = false" class="btn-outline px-8">Закрити</button>
              <button @click="saveCoupon" :disabled="saving || !modal.coupon_code.trim()" class="btn-primary px-8 disabled:opacity-50">
                {{ saving ? '...' : 'Зберегти купон' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
useHead({ title: 'Користувачі — Адмін' })
definePageMeta({ layout: 'admin', middleware: 'admin' })

const supabase = useSupabaseClient()

const LIMIT = 50
const page = ref(1)
const total = ref(0)
const users = ref<any[]>([])
const loading = ref(true)
const search = ref('')
const saving = ref(false)
const saveMsg = ref('')
const saveError = ref('')

const PLANS = [
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'PRO' },
  { value: 'business', label: 'Business' },
  { value: 'custom', label: 'Custom' },
]

const modal = reactive({
  show: false,
  tab: 'plan' as 'plan' | 'coupon',
  userId: '',
  email: '',
  plan: 'basic',
  expires_at: '',
  coupon_code: '',
  coupon_discount: 10,
})

const totalPages = computed(() => Math.ceil(total.value / LIMIT))
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u => u.email?.toLowerCase().includes(q) || u.user_metadata?.full_name?.toLowerCase().includes(q))
})

const load = async () => {
  loading.value = true
  const data = await $fetch('/api/admin/users', { query: { page: page.value, limit: LIMIT } }) as any
  users.value = data.users || []
  total.value = data.total || 0
  loading.value = false
}

const changePage = (p: number) => {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  load()
}

async function openManage(user: any) {
  saveMsg.value = ''
  saveError.value = ''
  const { data: sub } = await supabase.from('subscriptions').select('plan, expires_at').eq('user_id', user.id).maybeSingle()
  const expiresDate = sub?.expires_at ? new Date(sub.expires_at).toISOString().split('T')[0] : ''
  Object.assign(modal, {
    show: true,
    tab: 'plan',
    userId: user.id,
    email: user.email,
    plan: sub?.plan || 'basic',
    expires_at: expiresDate,
    coupon_code: '',
    coupon_discount: 10,
  })
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  modal.coupon_code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function savePlan() {
  saving.value = true
  saveMsg.value = ''
  saveError.value = ''
  try {
    const expiresAt = modal.plan !== 'basic' && modal.expires_at
      ? new Date(modal.expires_at).toISOString()
      : modal.plan === 'basic' ? new Date('2024-01-01').toISOString() : null
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: modal.userId,
      plan: modal.plan,
      status: modal.plan === 'basic' ? 'expired' : 'active',
      expires_at: expiresAt,
    }, { onConflict: 'user_id' })
    if (error) throw new Error(error.message)
    saveMsg.value = 'Підписку збережено'
    setTimeout(() => { saveMsg.value = '' }, 3000)
  } catch (e: any) {
    saveError.value = e.message
  }
  saving.value = false
}

async function saveCoupon() {
  saving.value = true
  saveMsg.value = ''
  saveError.value = ''
  try {
    const { error } = await supabase.from('coupons').insert({
      user_id: modal.userId,
      code: modal.coupon_code.trim().toUpperCase(),
      discount_percent: modal.coupon_discount,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    })
    if (error) throw new Error(error.message)
    saveMsg.value = `Купон ${modal.coupon_code} збережено`
    modal.coupon_code = ''
    setTimeout(() => { saveMsg.value = '' }, 3000)
  } catch (e: any) {
    saveError.value = e.message
  }
  saving.value = false
}

const roleLabel = (role: string) => {
  const map: Record<string, string> = { agronomist: 'Агроном', farmer: 'Фермер', seller: 'Продавець', admin: 'Адмін' }
  return map[role] || role
}

const formatDate = (iso: string) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(load)
</script>
