<template>
  <div class="min-h-screen bg-[#F5F8F0] flex flex-col">
    <!-- Хедер -->
    <div class="bg-white border-b border-[#E0EDCC] px-5 py-4 flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-[#EEF1E3] flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2C8 2 4 6 4 10c0 6 8 12 8 12s8-6 8-12c0-4-4-8-8-8z"/><circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div>
        <p class="font-bold text-[#1A3A06] text-sm">AgroPoradnyk</p>
        <p class="text-xs text-[#6B7A64]">Кабінет збирача</p>
      </div>
      <button v-if="worker" @click="logout" class="ml-auto text-xs text-[#6B7A64] hover:text-red-500 transition-colors">Вийти</button>
    </div>

    <!-- Логін -->
    <div v-if="checking" class="flex-1 flex items-center justify-center">
      <div class="w-8 h-8 border-2 border-[#2F5233] border-t-transparent rounded-full animate-spin"></div>
    </div>
    <div v-else-if="!worker" class="flex-1 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-sm border border-[#E0EDCC] w-full max-w-sm p-8">
        <h1 class="text-2xl font-bold text-[#1A3A06] mb-1 text-center">Вхід</h1>
        <p class="text-sm text-[#6B7A64] text-center mb-8">Кабінет збирача врожаю</p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-[#1A3A06] mb-1.5">Номер телефону</label>
            <input v-model="loginForm.login" type="tel" class="w-full border border-[#D4E8B8] rounded-xl px-4 py-3 text-[#1A3A06] focus:outline-none focus:border-[#3B6D11] bg-white" placeholder="+380..." @keydown.enter="doLogin" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-[#1A3A06] mb-1.5">Пароль</label>
            <input v-model="loginForm.password" type="password" class="w-full border border-[#D4E8B8] rounded-xl px-4 py-3 text-[#1A3A06] focus:outline-none focus:border-[#3B6D11] bg-white" placeholder="Ваш пароль" @keydown.enter="doLogin" />
          </div>
        </div>
        <p v-if="loginError" class="text-red-500 text-sm mt-3 text-center">{{ loginError }}</p>
        <button @click="doLogin" :disabled="loginLoading" class="w-full mt-6 bg-[#2F5233] text-[#FAF6EC] font-bold rounded-xl py-3 hover:bg-[#3D6B42] transition-colors">
          {{ loginLoading ? 'Вхід...' : 'Увійти' }}
        </button>
      </div>
    </div>

    <!-- Кабінет працівника: головна -->
    <div v-else-if="worker && !activeSeason" class="flex-1 p-4 max-w-lg mx-auto w-full">
      <!-- Ім'я + QR -->
      <div class="bg-white rounded-2xl border border-[#E0EDCC] p-5 mb-4 flex items-center gap-4">
        <div class="flex-1 min-w-0">
          <p class="text-lg font-bold text-[#1A3A06]">{{ worker.first_name }} {{ worker.last_name }}</p>
          <p class="text-sm text-[#6B7A64]">{{ worker.phone }}</p>
        </div>
        <button @click="showQRModal = true" class="shrink-0 flex flex-col items-center gap-1 text-[#2F5233] hover:opacity-70 transition-opacity">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            <path d="M14 14h3v3M17 14h3M14 17v3"/>
          </svg>
          <span class="text-xs font-medium">Мій QR</span>
        </button>
      </div>

      <!-- Підтвердження виплат по всіх обліках -->
      <div v-if="allPendingPayments.length" class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
        <p class="font-semibold text-amber-800 text-sm mb-3">Очікують підтвердження виплати</p>
        <div class="space-y-2">
          <div v-for="p in allPendingPayments" :key="p.id" class="flex items-center gap-3">
            <div class="flex-1">
              <p class="text-sm font-medium text-[#1A3A06]">{{ Number(p.amount).toLocaleString('uk-UA') }} грн</p>
              <p class="text-xs text-[#6B7A64]">{{ formatDateTime(p.paid_at) }} · {{ seasonName(p.season_id) }}</p>
            </div>
            <button @click="confirmPayment(p)" class="text-xs bg-green-600 text-white rounded-xl px-3 py-1.5 font-medium hover:bg-green-700 transition-colors">Підтверджую</button>
          </div>
        </div>
      </div>

      <!-- Загальна статистика -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-white rounded-2xl border border-[#E0EDCC] p-4 text-center">
          <p class="text-xl font-extrabold text-[#2F5233]">{{ totalStats.kg.toFixed(1) }}</p>
          <p class="text-xs text-[#6B7A64] mt-0.5">кг зібрано</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#E0EDCC] p-4 text-center">
          <p class="text-xl font-extrabold text-[#1A3A06]">{{ totalStats.earned.toLocaleString('uk-UA') }}</p>
          <p class="text-xs text-[#6B7A64] mt-0.5">грн зароблено</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#E0EDCC] p-4 text-center">
          <p class="text-xl font-extrabold text-green-600">{{ totalStats.paid.toLocaleString('uk-UA') }}</p>
          <p class="text-xs text-[#6B7A64] mt-0.5">грн виплачено</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#E0EDCC] p-4 text-center">
          <p class="text-xl font-extrabold" :class="totalStats.debt > 0 ? 'text-orange-500' : 'text-green-600'">{{ totalStats.debt.toLocaleString('uk-UA') }}</p>
          <p class="text-xs text-[#6B7A64] mt-0.5">грн до виплати</p>
        </div>
      </div>

      <!-- Список обліків -->
      <p class="text-xs font-semibold text-[#6B7A64] uppercase tracking-wide mb-2">Мої обліки</p>
      <div class="space-y-2">
        <button v-for="s in seasons" :key="s.id" @click="selectSeason(s)"
          class="w-full text-left bg-white rounded-2xl border border-[#E0EDCC] p-4 hover:border-[#2F5233] transition-colors flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-[#1A3A06] text-sm">{{ s.crop }}<span v-if="s.variety" class="font-normal text-[#6B7A64] ml-1">({{ s.variety }})</span></p>
            <p class="text-xs text-[#6B7A64] mt-0.5">{{ s._custom_price ?? s.price_per_kg }} грн/кг · {{ s.status === 'active' ? 'Активний' : 'Завершений' }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="font-bold text-[#2F5233] text-sm">{{ (s._kg || 0).toFixed(1) }} кг</p>
            <p class="text-xs text-[#6B7A64]">{{ (s._earned || 0).toLocaleString('uk-UA') }} грн</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(150,150,150)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>

    <!-- Детальний вид сезону -->
    <div v-else-if="worker && activeSeason" class="flex-1 p-4 max-w-lg mx-auto w-full">
      <!-- Назад + назва -->
      <div class="flex items-center gap-3 mb-4">
        <button @click="activeSeason = null" class="w-9 h-9 rounded-xl bg-white border border-[#E0EDCC] flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div class="flex-1">
          <p class="font-bold text-[#1A3A06]">{{ activeSeason.crop }}<span v-if="activeSeason.variety" class="font-normal text-[#6B7A64] ml-1">({{ activeSeason.variety }})</span></p>
          <p class="text-xs text-[#6B7A64]">{{ effectivePrice }} грн/кг · {{ activeSeason.status === 'active' ? 'Активний' : 'Завершений' }}</p>
        </div>
        <button @click="showQRModal = true" class="shrink-0 flex flex-col items-center gap-1 text-[#2F5233]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            <path d="M14 14h3v3M17 14h3M14 17v3"/>
          </svg>
          <span class="text-xs font-medium">QR</span>
        </button>
      </div>

      <!-- Статистика сезону -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-white rounded-2xl border border-[#E0EDCC] p-4 text-center">
          <p class="text-xl font-extrabold text-[#2F5233]">{{ myStats.kg.toFixed(1) }}</p>
          <p class="text-xs text-[#6B7A64] mt-0.5">кг зібрано</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#E0EDCC] p-4 text-center">
          <p class="text-xl font-extrabold text-[#1A3A06]">{{ myStats.earned.toLocaleString('uk-UA') }}</p>
          <p class="text-xs text-[#6B7A64] mt-0.5">грн зароблено</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#E0EDCC] p-4 text-center">
          <p class="text-xl font-extrabold text-green-600">{{ myStats.paid.toLocaleString('uk-UA') }}</p>
          <p class="text-xs text-[#6B7A64] mt-0.5">грн виплачено</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#E0EDCC] p-4 text-center">
          <p class="text-xl font-extrabold" :class="myStats.debt > 0 ? 'text-orange-500' : 'text-green-600'">{{ myStats.debt.toLocaleString('uk-UA') }}</p>
          <p class="text-xs text-[#6B7A64] mt-0.5">грн до виплати</p>
        </div>
      </div>

      <!-- Підтвердження виплат цього сезону -->
      <div v-if="pendingPayments.length" class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
        <p class="font-semibold text-amber-800 text-sm mb-3">Очікують підтвердження</p>
        <div class="space-y-2">
          <div v-for="p in pendingPayments" :key="p.id" class="flex items-center gap-3">
            <div class="flex-1">
              <p class="text-sm font-medium text-[#1A3A06]">{{ Number(p.amount).toLocaleString('uk-UA') }} грн</p>
              <p class="text-xs text-[#6B7A64]">{{ formatDateTime(p.paid_at) }}</p>
            </div>
            <button @click="confirmPayment(p)" class="text-xs bg-green-600 text-white rounded-xl px-3 py-1.5 font-medium hover:bg-green-700 transition-colors">Підтверджую</button>
          </div>
        </div>
      </div>

      <!-- Зважування -->
      <div class="bg-white rounded-2xl border border-[#E0EDCC] p-5">
        <p class="font-bold text-[#1A3A06] mb-4">Зважування</p>
        <div v-if="!records.length" class="text-center py-6 text-[#6B7A64] text-sm">Записів ще немає</div>
        <div v-else class="space-y-2">
          <div v-for="r in records" :key="r.id" class="flex items-center gap-3 p-3 bg-[#F5F8F0] rounded-xl">
            <div class="flex-1">
              <p class="text-sm font-medium text-[#1A3A06]">{{ r.weight_kg }} кг</p>
              <p class="text-xs text-[#6B7A64]">{{ formatDateTime(r.recorded_at) }} · {{ r.price_per_kg }} грн/кг</p>
            </div>
            <p class="font-bold text-[#2F5233]">{{ Number(r.amount).toLocaleString('uk-UA') }} грн</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Модал QR (глобальний) -->
    <div v-if="showQRModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="showQRModal=false">
      <div class="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
        <p class="font-bold text-[#1A3A06] text-lg">{{ worker?.first_name }} {{ worker?.last_name }}</p>
        <p v-if="activeSeason" class="text-sm text-[#6B7A64]">{{ activeSeason.crop }}<span v-if="activeSeason.variety"> ({{ activeSeason.variety }})</span></p>
        <canvas ref="myQrCanvas" width="220" height="220"></canvas>
        <button @click="showQRModal=false" class="w-full mt-2 border border-[#D4E8B8] rounded-xl py-2.5 text-[#2F5233] font-semibold text-sm hover:bg-[#F0F7EC] transition-colors">Закрити</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()

const checking = ref(true)
const worker = ref<any>(null)
const showQRModal = ref(false)
const myQrCanvas = ref<HTMLCanvasElement | null>(null)

watch(showQRModal, async (v) => {
  if (!v || !worker.value) return
  await nextTick()
  if (!myQrCanvas.value) return
  const QRCode = (await import('qrcode')).default
  const url = activeSeason.value
    ? `${window.location.origin}/dashboard/harvest/${activeSeason.value.id}?weigh=${worker.value.id}`
    : `${window.location.origin}/harvest-worker`
  QRCode.toCanvas(myQrCanvas.value, url, { width: 220, margin: 2 })
})
const seasons = ref<any[]>([])
const activeSeason = ref<any>(null)
const records = ref<any[]>([])
const pendingPayments = ref<any[]>([])

const loginForm = reactive({ login: '', password: '' })
const loginError = ref('')
const loginLoading = ref(false)

const allPayments = ref<any[]>([])

// Ціна для активного сезону
const effectivePrice = computed(() => {
  if (!activeSeason.value) return 0
  return activeSeason.value._custom_price ?? activeSeason.value.price_per_kg
})

const myStats = computed(() => {
  const kg = records.value.reduce((s, r) => s + Number(r.weight_kg), 0)
  const earned = records.value.reduce((s, r) => s + Number(r.amount), 0)
  const paid = allPayments.value.filter(p => p.status === 'confirmed').reduce((s, p) => s + Number(p.amount), 0)
  return { kg, earned, paid, debt: earned - paid }
})

const formatDateTime = (d: string) => new Date(d).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const doLogin = async () => {
  if (!loginForm.login || !loginForm.password) return
  loginLoading.value = true; loginError.value = ''

  // Конвертуємо телефон у синтетичний email
  const phoneDigits = loginForm.login.replace(/\D/g, '')
  const syntheticEmail = `${phoneDigits}@harvest.agroprostir.local`

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: loginForm.password,
  })
  if (authError) {
    loginLoading.value = false
    loginError.value = 'Невірний номер телефону або пароль'
    return
  }

  // Знаходимо запис працівника по auth_user_id
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase
    .from('harvest_workers')
    .select('*')
    .eq('auth_user_id', session!.user.id)
    .single()

  loginLoading.value = false
  if (error || !data) {
    await supabase.auth.signOut()
    loginError.value = 'Акаунт працівника не знайдено'
    return
  }
  worker.value = data
  await loadSeasons()
}

const allPendingPayments = ref<any[]>([])
const totalStats = computed(() => {
  const kg = seasons.value.reduce((s, season) => s + (season._kg || 0), 0)
  const earned = seasons.value.reduce((s, season) => s + (season._earned || 0), 0)
  const paid = seasons.value.reduce((s, season) => s + (season._paid || 0), 0)
  return { kg, earned, paid, debt: earned - paid }
})
const seasonName = (seasonId: string) => {
  const s = seasons.value.find(s => s.id === seasonId)
  if (!s) return ''
  return s.variety ? `${s.crop} (${s.variety})` : s.crop
}

const loadSeasons = async () => {
  const { data } = await supabase
    .from('harvest_season_workers')
    .select('custom_price_per_kg, harvest_seasons(*)')
    .eq('worker_id', worker.value.id)
    .order('created_at', { ascending: false })

  const seasonList = (data || []).map((sw: any) => ({
    ...sw.harvest_seasons,
    _custom_price: sw.custom_price_per_kg,
    _kg: 0,
    _earned: 0,
    _paid: 0,
  }))

  if (seasonList.length) {
    const seasonIds = seasonList.map((s: any) => s.id)
    const [recRes, payRes] = await Promise.all([
      supabase.from('harvest_records').select('*').eq('worker_id', worker.value.id).in('season_id', seasonIds),
      supabase.from('harvest_payments').select('*').eq('worker_id', worker.value.id).in('season_id', seasonIds),
    ])
    for (const s of seasonList) {
      const sRec = (recRes.data || []).filter((r: any) => r.season_id === s.id)
      const sPay = (payRes.data || []).filter((p: any) => p.season_id === s.id)
      s._kg = sRec.reduce((sum: number, r: any) => sum + Number(r.weight_kg), 0)
      s._earned = sRec.reduce((sum: number, r: any) => sum + Number(r.amount), 0)
      s._paid = sPay.filter((p: any) => p.status === 'confirmed').reduce((sum: number, p: any) => sum + Number(p.amount), 0)
    }
    allPendingPayments.value = (payRes.data || []).filter((p: any) => p.status === 'pending')
  }

  seasons.value = seasonList
}

const selectSeason = async (s: any) => {
  activeSeason.value = s
  records.value = []
  pendingPayments.value = []
  allPayments.value = []
  await loadData()
}

const loadData = async () => {
  if (!activeSeason.value) return
  const [recRes, payRes] = await Promise.all([
    supabase.from('harvest_records').select('*')
      .eq('worker_id', worker.value.id)
      .eq('season_id', activeSeason.value.id)
      .order('recorded_at', { ascending: false }),
    supabase.from('harvest_payments').select('*')
      .eq('worker_id', worker.value.id)
      .eq('season_id', activeSeason.value.id)
      .order('paid_at', { ascending: false }),
  ])
  records.value = recRes.data || []
  allPayments.value = payRes.data || []
  pendingPayments.value = (payRes.data || []).filter(p => p.status === 'pending')
}

const confirmPayment = async (p: any) => {
  const { error } = await supabase.from('harvest_payments').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', p.id)
  if (error) return

  // Оновлюємо локально одразу
  allPendingPayments.value = allPendingPayments.value.filter(x => x.id !== p.id)
  pendingPayments.value = pendingPayments.value.filter(x => x.id !== p.id)

  const s = seasons.value.find(s => s.id === p.season_id)
  if (s) s._paid = (s._paid || 0) + Number(p.amount)

  if (activeSeason.value) {
    allPayments.value = allPayments.value.map(x => x.id === p.id ? { ...x, status: 'confirmed' } : x)
  }
}

const logout = async () => {
  await supabase.auth.signOut()
  worker.value = null; seasons.value = []; activeSeason.value = null
  records.value = []; allPayments.value = []; pendingPayments.value = []
}

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  if (session.user.user_metadata?.role !== 'harvest_worker') return

  const { data } = await supabase
    .from('harvest_workers')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .single()

  if (data) {
    worker.value = data
    await loadSeasons()
  }
  checking.value = false
})
</script>
