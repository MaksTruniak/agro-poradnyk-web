<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Витрати та прибуток</h1>
        <p class="dash-subtitle">Фінансовий облік господарства</p>
      </div>
      <button v-if="hasPaidPlan" @click="openAddModal" class="btn-primary inline-flex items-center gap-1.5 shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати
      </button>
    </div>

    <!-- Upgrade для Basic -->
    <div v-if="!hasPaidPlan" class="card text-center py-16">
      <div class="w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-5">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
      </div>
      <p class="font-bold text-agro-dark text-lg mb-2">Витрати та прибуток</p>
      <p class="text-agro-light text-sm mb-5 max-w-sm mx-auto">Ведіть облік витрат, фіксуйте врожай і бачте реальну прибутковість кожного поля — доступно на тарифі Бізнес</p>
      <NuxtLink to="/dashboard/subscription" class="dash-btn-primary inline-flex">Перейти на Бізнес →</NuxtLink>
    </div>

    <template v-else>
      <!-- Фільтри -->
      <div class="flex flex-wrap gap-3 mb-5">
        <select v-model="filterYear" class="input w-auto">
          <option v-for="y in years" :key="y" :value="y">{{ y }} рік</option>
        </select>
        <select v-model="filterCrop" class="input w-auto">
          <option value="">Всі культури</option>
          <option v-for="c in cropOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="filterFarm" class="input w-auto">
          <option value="">Всі поля</option>
          <option value="__general__">Загальні</option>
          <option v-for="f in farms" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
      </div>

      <!-- Картки підсумку -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div class="card">
          <p class="text-xs text-agro-light uppercase tracking-wide mb-1 font-semibold">Витрати</p>
          <p class="text-2xl font-bold text-red-600">{{ totalExpenses.toLocaleString('uk-UA') }} <span class="text-base font-normal">грн</span></p>
        </div>
        <div class="card">
          <p class="text-xs text-agro-light uppercase tracking-wide mb-1 font-semibold">Дохід</p>
          <p class="text-2xl font-bold text-agro">{{ totalRevenue.toLocaleString('uk-UA') }} <span class="text-base font-normal">грн</span></p>
        </div>
        <div class="card">
          <p class="text-xs text-agro-light uppercase tracking-wide mb-1 font-semibold">Прибуток</p>
          <p class="text-2xl font-bold" :class="profit >= 0 ? 'text-agro-dark' : 'text-red-600'">
            {{ profit >= 0 ? '' : '−' }}{{ Math.abs(profit).toLocaleString('uk-UA') }} <span class="text-base font-normal">грн</span>
          </p>
        </div>
        <div class="card">
          <p class="text-xs text-agro-light uppercase tracking-wide mb-1 font-semibold">Рентабельність</p>
          <p class="text-2xl font-bold" :class="profitability >= 0 ? 'text-agro-dark' : 'text-red-600'">
            {{ profitability >= 0 ? '+' : '' }}{{ profitability }}%
          </p>
        </div>
      </div>

      <!-- Витрати по категоріях -->
      <div v-if="filteredExpenses.length" class="card mb-5">
        <p class="text-xs font-bold uppercase tracking-wider text-agro-light mb-4">По категоріях</p>
        <div class="space-y-2">
          <div v-for="cat in categoryTotals" :key="cat.key" class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" :style="{ background: cat.bg }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="cat.color" v-html="cat.svg" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-agro-dark">{{ cat.label }}</span>
                <span class="text-sm font-bold text-agro-dark">{{ cat.total.toLocaleString('uk-UA') }} грн</span>
              </div>
              <div class="h-1.5 bg-agro-bg rounded-full overflow-hidden">
                <div class="h-full rounded-full" :style="{ width: cat.pct + '%', background: cat.color }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Список витрат -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs font-bold uppercase tracking-wider text-agro-light">Витрати</p>
          <span class="text-xs text-agro-light">{{ filteredExpenses.length }} записів</span>
        </div>

        <div v-if="loading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="h-14 bg-agro-bg rounded-xl animate-pulse" />
        </div>

        <div v-else-if="!filteredExpenses.length" class="text-center py-10">
          <p class="text-agro-light text-sm">Витрат ще немає. Додайте першу витрату.</p>
        </div>

        <div v-else class="space-y-2">
          <div v-for="exp in filteredExpenses" :key="exp.id"
            class="flex items-center gap-3 p-3 rounded-xl hover:bg-agro-hover transition-colors group">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              :style="{ background: CATEGORIES[exp.category]?.bg || '#f3f4f6' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                :stroke="CATEGORIES[exp.category]?.color || '#6b7280'"
                v-html="CATEGORIES[exp.category]?.svg || CATEGORIES.other.svg" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-agro-dark text-sm truncate">
                {{ exp.description || CATEGORIES[exp.category]?.label || exp.category }}
              </p>
              <p class="text-xs text-agro-light">
                {{ formatDate(exp.expense_date) }}
                <span v-if="exp.farm_name"> · {{ exp.farm_name }}</span>
                <span v-if="exp.crop_type"> · {{ exp.crop_type }}</span>
              </p>
            </div>
            <p class="font-bold text-agro-dark shrink-0">{{ exp.amount_uah.toLocaleString('uk-UA') }} грн</p>
            <button @click="deleteExpense(exp.id)"
              class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-agro-light hover:text-red-500 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Дохід з угод -->
      <div v-if="filteredSales.length" class="card mt-4">
        <p class="text-xs font-bold uppercase tracking-wider text-agro-light mb-4">Дохід з продажів</p>
        <div class="space-y-2">
          <div v-for="s in filteredSales" :key="s.id"
            class="flex items-center gap-3 p-3 rounded-xl hover:bg-agro-hover transition-colors">
            <div class="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0 text-base">
              {{ s.source === 'deal' ? '🤝' : '🌾' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-agro-dark text-sm">{{ s.crop_type }} <span class="text-xs font-normal text-agro-light">{{ s.source === 'deal' ? '· платформа' : '· вручну' }}</span></p>
              <p class="text-xs text-agro-light">{{ formatDate(s.sold_at || s.created_at) }} · {{ s.quantity_tons?.toFixed(2) }} т × {{ s.price_per_ton?.toLocaleString('uk-UA') }} грн/т</p>
            </div>
            <p class="font-bold text-agro shrink-0">{{ s.total_price?.toLocaleString('uk-UA') }} грн</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Модальне вікно додавання витрати -->
    <div v-if="modal.open" class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div class="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-5">
          <p class="font-bold text-agro-dark text-lg">Нова витрата</p>
          <button @click="modal.open = false" class="p-1.5 rounded-lg hover:bg-agro-hover text-agro-light">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Категорія -->
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-2">Категорія</label>
            <div class="grid grid-cols-3 gap-2">
              <button v-for="(cat, key) in CATEGORIES" :key="key"
                @click="modal.category = key"
                :class="['flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-medium',
                  modal.category === key ? 'border-agro bg-agro/10 text-agro' : 'border-agro-border hover:bg-agro-hover text-agro-dark']">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="modal.category === key ? 'rgb(47,82,51)' : 'rgb(107,122,100)'" v-html="cat.svg" />
                {{ cat.label }}
              </button>
            </div>
          </div>

          <!-- Опис -->
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Опис (необов'язково)</label>
            <input v-model="modal.description" type="text" class="input" placeholder="Наприклад: Дизель для трактора">
          </div>

          <!-- Сума -->
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Сума, грн</label>
            <input v-model="modal.amount" type="number" min="0" step="0.01" class="input" placeholder="0.00">
          </div>

          <!-- Дата -->
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Дата</label>
            <input v-model="modal.date" type="date" class="input">
          </div>

          <!-- Поле -->
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Поле (необов'язково)</label>
            <select v-model="modal.farm_id" class="input">
              <option value="">Загальна витрата</option>
              <option v-for="f in farms" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
          </div>

          <!-- Культура -->
          <div v-if="modal.farm_id">
            <label class="block text-sm font-medium text-agro-dark mb-1">Культура (необов'язково)</label>
            <select v-model="modal.crop_type" class="input">
              <option value="">Без культури</option>
              <option v-for="c in farmCrops(modal.farm_id)" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="modal.open = false" class="btn-outline flex-1">Скасувати</button>
          <button @click="saveExpense" :disabled="!modal.amount || !modal.category || modal.saving"
            class="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center">
            {{ modal.saving ? 'Збереження...' : 'Зберегти' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Витрати та прибуток' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)

const CATEGORIES: Record<string, { label: string; icon: string; svg: string; color: string; bg: string }> = {
  fuel:       { label: 'Паливо',  icon: '⛽', color: '#ef4444', bg: '#fef2f2', svg: '<path d="M3 22V8l2-4h10l2 4v14" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12h14M7 8v4M13 8v4" stroke-width="1.6" stroke-linecap="round"/><path d="M17 8h1a2 2 0 012 2v3a2 2 0 002 2v5" stroke-width="1.6" stroke-linecap="round"/><path d="M21 20a1 1 0 01-2 0v-2h2v2z" stroke-width="1.4"/>' },
  fertilizer: { label: 'Добрива', icon: '🌱', color: '#22c55e', bg: '#f0fdf4', svg: '<path d="M12 22V12" stroke-width="1.6" stroke-linecap="round"/><path d="M12 12C12 7 7 4 3 5c0 4 3 8 9 7z" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 12c0-5 5-8 9-7-1 4-4 8-9 7z" stroke-width="1.6" stroke-linejoin="round"/>' },
  chemicals:  { label: 'ЗЗР',     icon: '🧪', color: '#a855f7', bg: '#faf5ff', svg: '<path d="M9 3h6M10 3v5l-5 9a2 2 0 001.7 3h10.6A2 2 0 0019 17l-5-9V3" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 14h7" stroke-width="1.6" stroke-linecap="round"/>' },
  machinery:  { label: 'Техніка', icon: '🚜', color: '#f97316', bg: '#fff7ed', svg: '<path d="M3 17a3 3 0 106 0 3 3 0 00-6 0zM14 17a3 3 0 106 0 3 3 0 00-6 0z" stroke-width="1.6"/><path d="M9 17H6M17 17h-3M6 17V9l3-5h8l2 4v9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 9h10" stroke-width="1.6" stroke-linecap="round"/>' },
  labor:      { label: 'Праця',   icon: '👷', color: '#3b82f6', bg: '#eff6ff', svg: '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke-width="1.6" stroke-linecap="round"/><circle cx="9" cy="7" r="4" stroke-width="1.6"/><path d="M20 8v6M23 11h-6" stroke-width="1.6" stroke-linecap="round"/>' },
  other:      { label: 'Інше',    icon: '📦', color: '#6b7280', bg: '#f9fafb', svg: '<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke-width="1.6" stroke-linejoin="round"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke-width="1.6" stroke-linecap="round"/>' },
}

// Стан
const hasPaidPlan = ref(false)
const farms = ref<{ id: string; name: string; farm_crops: { crop_type: string }[] }[]>([])
const expenses = ref<any[]>([])
const sales = ref<any[]>([])

const filterYear = ref(new Date().getFullYear())
const filterCrop = ref('')
const filterFarm = ref('')

const years = computed(() => {
  const cur = new Date().getFullYear()
  return [cur, cur - 1, cur - 2]
})

const cropOptions = computed(() => {
  const set = new Set<string>()
  expenses.value.forEach(e => { if (e.crop_type) set.add(e.crop_type) })
  sales.value.forEach(s => { if (s.crop_type) set.add(s.crop_type) })
  farms.value.forEach(f => f.farm_crops?.forEach(c => set.add(c.crop_type)))
  return [...set].sort()
})

const farmCrops = (farmId: string) => {
  const f = farms.value.find(f => f.id === farmId)
  return f?.farm_crops?.map(c => c.crop_type) || []
}

// Фільтровані витрати
const filteredExpenses = computed(() => {
  return expenses.value.filter(e => {
    const year = new Date(e.expense_date).getFullYear()
    if (year !== filterYear.value) return false
    if (filterCrop.value && e.crop_type !== filterCrop.value) return false
    if (filterFarm.value === '__general__' && e.farm_id) return false
    if (filterFarm.value && filterFarm.value !== '__general__' && e.farm_id !== filterFarm.value) return false
    return true
  })
})

// Фільтровані продажі
const filteredSales = computed(() => {
  return sales.value.filter(s => {
    const date = s.sold_at || s.created_at
    if (!date) return false
    const year = new Date(date).getFullYear()
    if (year !== filterYear.value) return false
    if (filterCrop.value && s.crop_type !== filterCrop.value) return false
    return true
  })
})

const totalExpenses = computed(() => filteredExpenses.value.reduce((sum, e) => sum + (e.amount_uah || 0), 0))
const totalRevenue = computed(() => filteredSales.value.reduce((sum, s) => sum + (s.total_price || 0), 0))
const profit = computed(() => totalRevenue.value - totalExpenses.value)
const profitability = computed(() => {
  if (!totalExpenses.value) return 0
  return Math.round((profit.value / totalExpenses.value) * 100)
})

const categoryTotals = computed(() => {
  const map: Record<string, number> = {}
  filteredExpenses.value.forEach(e => {
    map[e.category] = (map[e.category] || 0) + e.amount_uah
  })
  return Object.entries(map)
    .map(([key, total]) => ({ key, total, pct: Math.round((total / totalExpenses.value) * 100), ...CATEGORIES[key] || { label: key, icon: '📦', color: '#6b7280', bg: '#f9fafb' } }))
    .sort((a, b) => b.total - a.total)
})

// Модальне вікно
const modal = reactive({
  open: false,
  category: 'fuel',
  description: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  farm_id: '',
  crop_type: '',
  saving: false,
})

function openAddModal() {
  modal.open = true
  modal.category = 'fuel'
  modal.description = ''
  modal.amount = ''
  modal.date = new Date().toISOString().slice(0, 10)
  modal.farm_id = ''
  modal.crop_type = ''
}

async function saveExpense() {
  if (!modal.amount || !modal.category || modal.saving) return
  modal.saving = true

  const { data: { session } } = await supabase.auth.getSession()

  const farmName = farms.value.find(f => f.id === modal.farm_id)?.name

  const { data, error } = await supabase.from('expenses').insert({
    user_id: session?.user?.id,
    farm_id: modal.farm_id || null,
    crop_type: modal.crop_type || null,
    category: modal.category,
    description: modal.description || null,
    amount_uah: parseFloat(modal.amount),
    expense_date: modal.date,
  }).select().single()

  if (!error && data) {
    expenses.value.unshift({ ...data, farm_name: farmName })
  }
  modal.saving = false
  modal.open = false
}

async function deleteExpense(id: string) {
  await supabase.from('expenses').delete().eq('id', id)
  expenses.value = expenses.value.filter(e => e.id !== id)
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })

// Завантаження
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  const uid = session?.user?.id
  if (!uid) { loading.value = false; return }

  const [subRes, farmsRes, expRes, manualSalesRes, dealsRes] = await Promise.all([
    supabase.from('subscriptions').select('plan, expires_at').eq('user_id', uid).maybeSingle(),
    supabase.from('farms').select('id, name, farm_crops(crop_type)').eq('user_id', uid).order('created_at'),
    supabase.from('expenses').select('*').eq('user_id', uid).order('expense_date', { ascending: false }),
    supabase.from('manual_sales').select('id, crop_type, quantity_tons, price_per_ton, total_price, sold_at, created_at').eq('farmer_id', uid).eq('status', 'completed').order('sold_at', { ascending: false }),
    supabase.from('deals').select('id, crop_type, quantity_tons, display_quantity, unit, price_per_ton, display_price, total_price, completed_at, created_at').eq('farmer_id', uid).eq('status', 'completed').order('completed_at', { ascending: false }),
  ])

  const plan = subRes.data?.plan ?? 'basic'
  const active = !subRes.data?.expires_at || new Date(subRes.data.expires_at) > new Date()
  const currentPlan = active ? plan : 'basic'
  hasPaidPlan.value = currentPlan === 'business' || currentPlan === 'business_pro'

  farms.value = farmsRes.data || []

  const farmMap: Record<string, string> = {}
  farms.value.forEach(f => { farmMap[f.id] = f.name })

  expenses.value = (expRes.data || []).map(e => ({ ...e, farm_name: e.farm_id ? farmMap[e.farm_id] : null }))

  // Об'єднуємо manual_sales і deals в один список продажів
  const manualSales = (manualSalesRes.data || []).map(s => ({ ...s, source: 'manual' }))
  const platformDeals = (dealsRes.data || []).map(d => ({
    id: d.id,
    crop_type: d.crop_type,
    quantity_tons: d.unit === 'кг' ? (d.display_quantity || 0) / 1000 : (d.display_quantity || d.quantity_tons || 0),
    price_per_ton: d.display_price || d.price_per_ton,
    total_price: d.total_price,
    sold_at: d.completed_at || d.created_at,
    created_at: d.created_at,
    source: 'deal',
  }))
  sales.value = [...manualSales, ...platformDeals].sort((a, b) =>
    new Date(b.sold_at || b.created_at).getTime() - new Date(a.sold_at || a.created_at).getTime()
  )

  loading.value = false
})
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
</style>
