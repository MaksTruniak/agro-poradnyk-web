<template>
  <div class="dash-page">
    <div class="dash-head">
      <NuxtLink to="/dashboard/inventory" class="dash-icon-box shrink-0 hover:bg-agro-hover transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </NuxtLink>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Пальне</h1>
        <p class="dash-subtitle">Облік дизелю, бензину та витрат</p>
      </div>
      <button @click="showAdd = true" class="dash-btn-primary shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати
      </button>
    </div>

    <div v-if="loading" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="card animate-pulse h-32"></div>
    </div>

    <div v-else-if="!items.length" class="card text-center py-16">
      <div class="dash-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(180,100,20)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 22V10l9-8 9 8v12"/><path d="M12 22v-6"/><path d="M8 22v-4h8v4"/>
        </svg>
      </div>
      <p class="font-bold text-agro-dark text-lg mb-2">Немає записів</p>
      <p class="text-agro-light mb-6">Додайте типи пального які є у господарстві</p>
      <button @click="showAdd = true" class="dash-btn-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати пальне
      </button>
    </div>

    <div v-else class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="item in items" :key="item.id" class="card flex flex-col gap-3">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <p class="font-bold text-agro-dark truncate">{{ item.fuel_type }}</p>
            <p v-if="item.price_per_unit" class="text-xs text-agro-light mt-0.5">{{ item.price_per_unit }} грн/{{ item.unit }}</p>
          </div>
          <div class="text-right shrink-0 ml-3">
            <p class="text-xl font-extrabold" :class="item.min_quantity && item.quantity <= item.min_quantity ? 'text-amber-500' : 'text-amber-700'">
              {{ item.quantity }}
            </p>
            <p class="text-xs text-agro-light">{{ item.unit }}</p>
          </div>
        </div>

        <div class="flex gap-2">
          <button @click="openLog(item, 'in')" class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-agro-border text-sm font-medium text-agro hover:bg-agro-hover transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v12M8 11l4 4 4-4"/></svg>
            Надійшло
          </button>
          <button @click="openLog(item, 'out')" class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-agro-border text-sm font-medium text-agro-light hover:bg-agro-hover hover:text-agro-dark transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21V9M8 13l4-4 4 4"/></svg>
            Витрачено
          </button>
          <button @click="deleteItem(item)" class="w-9 h-9 flex items-center justify-center rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>

        <p v-if="item.last_log" class="text-xs text-agro-light">
          Останнє: {{ item.last_log.quantity }} {{ item.unit }}
          <span v-if="item.last_log.vehicle"> · {{ item.last_log.vehicle }}</span>
          — {{ formatDate(item.last_log.created_at) }}
        </p>
      </div>

      <button @click="showAdd = true" class="card border-2 border-dashed border-agro-border hover:border-agro flex flex-col items-center justify-center py-10 transition-colors group min-h-32">
        <span class="mb-2 group-hover:scale-110 transition-transform">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(122,138,114)" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </span>
        <span class="font-semibold text-agro-light group-hover:text-agro transition-colors">Додати тип пального</span>
      </button>
    </div>

    <!-- Модал: Додати -->
    <div v-if="showAdd" class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" @click.self="showAdd = false">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-bold text-agro-dark text-lg">Додати пальне</h3>
          <button @click="showAdd = false" class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-agro-bg text-agro-light hover:text-agro-dark transition-colors">✕</button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Тип пального *</label>
            <select v-model="form.fuel_type" class="input">
              <option value="Дизель">Дизель</option>
              <option value="Бензин А-95">Бензин А-95</option>
              <option value="Бензин А-92">Бензин А-92</option>
              <option value="Газ (LPG)">Газ (LPG)</option>
              <option value="Адблю (AdBlue)">Адблю (AdBlue)</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Кількість *</label>
              <input v-model.number="form.quantity" type="number" min="0" step="1" class="input" placeholder="0" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Одиниця</label>
              <select v-model="form.unit" class="input">
                <option value="л">л</option>
                <option value="кг">кг</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Ціна за одиницю</label>
              <input v-model.number="form.price_per_unit" type="number" min="0" step="0.1" class="input" placeholder="грн" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Мін. залишок</label>
              <input v-model.number="form.min_quantity" type="number" min="0" class="input" placeholder="л" />
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showAdd = false" class="flex-1 btn-outline">Скасувати</button>
          <button @click="addItem" :disabled="saving || !form.fuel_type || !form.quantity" class="flex-1 btn-primary inline-flex items-center justify-center">
            {{ saving ? '...' : 'Додати' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модал: Операція -->
    <div v-if="showLog" class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" @click.self="showLog = false">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div class="flex items-center justify-between mb-1">
          <h3 class="font-bold text-agro-dark text-lg">{{ logForm.type === 'in' ? 'Надійшло' : 'Витрачено' }}</h3>
          <button @click="showLog = false" class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-agro-bg text-agro-light hover:text-agro-dark transition-colors">✕</button>
        </div>
        <p class="text-agro-light text-sm mb-5">{{ selectedItem?.fuel_type }}</p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Кількість *</label>
            <div class="relative">
              <input v-model.number="logForm.quantity" type="number" min="0.1" step="1" class="input pr-10" placeholder="0" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light text-sm">{{ selectedItem?.unit }}</span>
            </div>
          </div>
          <div v-if="logForm.type === 'out'">
            <label class="block text-sm font-medium text-agro-dark mb-1">Техніка / транспорт</label>
            <input v-model="logForm.vehicle" class="input" placeholder="напр. Трактор МТЗ-82" />
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Примітка</label>
            <input v-model="logForm.note" class="input" placeholder="Необов'язково..." />
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showLog = false" class="flex-1 btn-outline">Скасувати</button>
          <button @click="saveLog" :disabled="saving || !logForm.quantity" class="flex-1 btn-primary inline-flex items-center justify-center">
            {{ saving ? '...' : 'Зберегти' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Пальне — Склад' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const items = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showAdd = ref(false)
const showLog = ref(false)
const selectedItem = ref<any>(null)

const form = ref({ fuel_type: 'Дизель', quantity: 0, unit: 'л', price_per_unit: null as number | null, min_quantity: null as number | null })
const logForm = ref({ type: 'in', quantity: 0, vehicle: '', note: '' })

const formatDate = (d: string) => new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })

async function load() {
  loading.value = true
  const uid = user.value?.id
  if (!uid) { loading.value = false; return }
  const { data: fuels } = await supabase.from('fuel_inventory').select('*').eq('user_id', uid).order('fuel_type')
  const list = fuels || []
  if (list.length) {
    const ids = list.map(i => i.id)
    const { data: logs } = await supabase.from('fuel_log').select('fuel_id, type, quantity, vehicle, created_at').in('fuel_id', ids).order('created_at', { ascending: false })
    const lastLogMap: Record<string, any> = {}
    for (const log of logs || []) { if (!lastLogMap[log.fuel_id]) lastLogMap[log.fuel_id] = log }
    items.value = list.map(i => ({ ...i, last_log: lastLogMap[i.id] || null }))
  } else { items.value = [] }
  loading.value = false
}

async function addItem() {
  if (!form.value.fuel_type || !form.value.quantity) return
  saving.value = true
  const uid = user.value?.id
  const { data } = await supabase.from('fuel_inventory').insert({ user_id: uid, fuel_type: form.value.fuel_type, quantity: form.value.quantity, unit: form.value.unit, price_per_unit: form.value.price_per_unit || null, min_quantity: form.value.min_quantity || null }).select().single()
  if (data) await supabase.from('fuel_log').insert({ fuel_id: data.id, user_id: uid, type: 'in', quantity: form.value.quantity })
  await load(); saving.value = false; showAdd.value = false
  form.value = { fuel_type: 'Дизель', quantity: 0, unit: 'л', price_per_unit: null, min_quantity: null }
}

function openLog(item: any, type: 'in' | 'out') { selectedItem.value = item; logForm.value = { type, quantity: 0, vehicle: '', note: '' }; showLog.value = true }

async function saveLog() {
  if (!logForm.value.quantity || !selectedItem.value) return
  saving.value = true
  const delta = logForm.value.type === 'in' ? logForm.value.quantity : -logForm.value.quantity
  const newQty = Math.max(0, selectedItem.value.quantity + delta)
  await Promise.all([
    supabase.from('fuel_log').insert({ fuel_id: selectedItem.value.id, user_id: user.value!.id, type: logForm.value.type, quantity: logForm.value.quantity, vehicle: logForm.value.vehicle || null, note: logForm.value.note || null }),
    supabase.from('fuel_inventory').update({ quantity: newQty }).eq('id', selectedItem.value.id),
  ])
  await load(); saving.value = false; showLog.value = false
}

async function deleteItem(item: any) {
  if (!confirm(`"${item.fuel_type}" буде видалено.`)) return
  await supabase.from('fuel_inventory').delete().eq('id', item.id)
  items.value = items.value.filter(i => i.id !== item.id)
}

onMounted(load)
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(255,247,230); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
</style>
