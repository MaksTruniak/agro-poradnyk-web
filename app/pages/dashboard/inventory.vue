<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Склад</h1>
        <p class="dash-subtitle">Залишки та облік продукції</p>
      </div>
      <button v-if="!(isTeamMember && isViewer)" @click="showAdd = true" class="dash-btn-primary shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати препарат
      </button>
    </div>

    <!-- Сповіщення про нестачу -->
    <div v-if="lowStock.length" class="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <p class="font-bold text-amber-800 mb-2 flex items-center gap-1.5"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(180,130,40)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Закінчується запас</p>
      <div class="flex flex-wrap gap-2">
        <span v-for="item in lowStock" :key="item.id"
          class="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-medium">
          {{ item.name }} — {{ item.quantity }} {{ item.unit }}
        </span>
      </div>
    </div>

    <!-- Завантаження -->
    <div v-if="loading" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="card animate-pulse h-32"></div>
    </div>

    <!-- Порожньо -->
    <div v-else-if="!items.length" class="card text-center py-16">
      <div class="dash-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/>
        </svg>
      </div>
      <p class="font-bold text-agro-dark text-lg mb-2">Склад порожній</p>
      <p class="text-agro-light mb-6">Додайте препарати і добрива які є у вас в наявності</p>
      <button @click="showAdd = true" class="dash-btn-primary"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg> Додати препарат</button>
    </div>

    <!-- Список -->
    <div v-else class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="item in items" :key="item.id" class="card flex flex-col gap-3">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <p class="font-bold text-agro-dark truncate">{{ item.name }}</p>
            <p v-if="item.farm" class="text-xs text-agro-light mt-0.5 flex items-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(179,69,47)" stroke-width="1.7" stroke-linejoin="round"><path d="M12 22s7-7.4 7-12.5A7 7 0 005 9.5C5 14.6 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.3" stroke-width="1.5"/></svg> {{ item.farm.name }}</p>
          </div>
          <div class="text-right shrink-0 ml-3">
            <p class="text-xl font-extrabold" :class="item.quantity <= 0 ? 'text-red-500' : (item.min_quantity && item.quantity <= item.min_quantity) ? 'text-amber-500' : 'text-agro'">
              {{ item.quantity }}
            </p>
            <p class="text-xs text-agro-light">{{ item.unit }}</p>
          </div>
        </div>

        <div class="flex gap-2">
          <button @click="openLog(item, 'in')"
            class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-agro-border text-sm font-medium text-agro hover:bg-agro-hover transition-colors">
            <Plus :size="14" /> Надійшло
          </button>
          <button @click="openLog(item, 'out')"
            class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-agro-border text-sm font-medium text-agro-light hover:bg-agro-hover hover:text-agro-dark transition-colors">
            <Minus :size="14" /> Витрачено
          </button>
          <button @click="deleteItem(item)"
            class="w-9 h-9 flex items-center justify-center rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-colors">
            <Trash2 :size="14" />
          </button>
        </div>

        <!-- Остання операція -->
        <p v-if="item.last_log" class="text-xs text-agro-light">
          Останнє: <span v-if="item.last_log.type === 'in'" class="inline-flex items-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 11l4 4 4-4"/><path d="M3 19h18"/></svg></span><span v-else class="inline-flex items-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(107,122,100)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9M8 13l4-4 4 4"/><path d="M3 19h18"/></svg></span>
          {{ item.last_log.quantity }} {{ item.unit }} — {{ formatDate(item.last_log.created_at) }}
        </p>
      </div>

      <!-- Кнопка додати -->
      <button @click="showAdd = true"
        class="card border-2 border-dashed border-agro-border hover:border-agro flex flex-col items-center justify-center py-10 transition-colors group min-h-32">
        <span class="mb-2 group-hover:scale-110 transition-transform"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(122,138,114)" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
        <span class="font-semibold text-agro-light group-hover:text-agro transition-colors">Додати препарат</span>
      </button>
    </div>

    <!-- Модал: Додати препарат -->
    <div v-if="showAdd" class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" @click.self="showAdd = false; resetForm()">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-bold text-agro-dark text-lg">Додати препарат</h3>
          <button @click="showAdd = false; resetForm()" class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-agro-bg text-agro-light hover:text-agro-dark transition-colors">✕</button>
        </div>

        <div class="space-y-4">
          <div class="relative">
            <label class="block text-sm font-medium text-agro-dark mb-1">Назва препарату *</label>
            <input v-model="form.name" @input="onProductSearch" class="input" placeholder="Почніть вводити назву..." autocomplete="off" />
            <div v-if="productSuggestions.length" class="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-agro-border max-h-48 overflow-y-auto">
              <button v-for="p in productSuggestions" :key="p.id"
                @click="selectProduct(p)"
                class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0">
                <span class="font-medium text-agro-dark">{{ p.name }}</span>
                <span v-if="p.formulation_name" class="text-agro-light text-xs ml-2">{{ p.formulation_name }}</span>
              </button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Кількість *</label>
              <input v-model.number="form.quantity" type="number" min="0" step="0.1" class="input" placeholder="0" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Одиниця</label>
              <select v-model="form.unit" class="input">
                <option value="л">л</option>
                <option value="кг">кг</option>
                <option value="т">т</option>
                <option value="шт">шт</option>
                <option value="мл">мл</option>
                <option value="г">г</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">
              Мінімальний залишок
              <span class="text-agro-light font-normal">(сповіщення якщо менше)</span>
            </label>
            <div class="relative">
              <input v-model.number="form.min_quantity" type="number" min="0" step="0.1" class="input pr-12" placeholder="Не встановлено" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light text-sm">{{ form.unit }}</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Поле / ферма</label>
            <select v-model="form.farm_id" class="input">
              <option value="">— Загальний склад —</option>
              <option v-for="f in farms" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="showAdd = false; resetForm()" class="flex-1 btn-outline">Скасувати</button>
          <button @click="addItem" :disabled="saving || !form.name || !form.quantity"
            class="flex-1 btn-primary inline-flex items-center justify-center gap-1.5">
            <svg v-if="!saving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            {{ saving ? '...' : 'Додати' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модал: Операція (надійшло / витрачено) -->
    <div v-if="showLog" class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" @click.self="showLog = false">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div class="flex items-center justify-between mb-1">
        <h3 class="font-bold text-agro-dark text-lg">
          <template v-if="logForm.type === 'in'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 11l4 4 4-4"/><path d="M3 19h18"/></svg> Надійшло</template><template v-else><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(107,122,100)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9M8 13l4-4 4 4"/><path d="M3 19h18"/></svg> Витрачено</template>
        </h3>
          <button @click="showLog = false" class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-agro-bg text-agro-light hover:text-agro-dark transition-colors">✕</button>
        </div>
        <p class="text-agro-light text-sm mb-5">{{ selectedItem?.name }}</p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Кількість *</label>
            <div class="relative">
              <input v-model.number="logForm.quantity" type="number" min="0.1" step="0.1" class="input pr-12" placeholder="0" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light text-sm">{{ selectedItem?.unit }}</span>
            </div>
          </div>
          <div v-if="logForm.type === 'out'">
            <label class="block text-sm font-medium text-agro-dark mb-1">На яке поле</label>
            <select v-model="logForm.field_id" class="input">
              <option value="">— Не вказано —</option>
              <option v-for="f in farms" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Примітка</label>
            <input v-model="logForm.note" class="input" placeholder="Необов'язково..." />
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="showLog = false" class="flex-1 btn-outline">Скасувати</button>
          <button @click="saveLog" :disabled="saving || !logForm.quantity"
            class="flex-1 btn-primary inline-flex items-center justify-center gap-1.5">
            <svg v-if="!saving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {{ saving ? '...' : 'Зберегти' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Minus, Trash2 } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Склад препаратів — Кабінет' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { confirm: confirmDialog } = useConfirm()
const { isTeamMember, isViewer, getQueryUserId } = useTeamContext()

const items = ref<any[]>([])
const farms = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showAdd = ref(false)
const showLog = ref(false)
const selectedItem = ref<any>(null)

const form = ref({ name: '', quantity: 0, unit: 'л', farm_id: '', min_quantity: null as number | null })
const logForm = ref({ type: 'in', quantity: 0, field_id: '', note: '' })
const productSuggestions = ref<any[]>([])
let searchTimer: any = null

const onProductSearch = () => {
  clearTimeout(searchTimer)
  const q = form.value.name.trim()
  if (q.length < 2) { productSuggestions.value = []; return }
  searchTimer = setTimeout(async () => {
    const { data } = await supabase.from('agro_products')
      .select('id, name, formulation_name')
      .ilike('name', `%${q}%`)
      .limit(8)
    productSuggestions.value = data || []
  }, 250)
}

const selectProduct = (p: any) => {
  form.value.name = p.name
  productSuggestions.value = []
}

const lowStock = computed(() => items.value.filter(i => i.min_quantity != null && i.quantity <= i.min_quantity))

const formatDate = (d: string) => new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })

const resetForm = () => {
  form.value = { name: '', quantity: 0, unit: 'л', farm_id: '', min_quantity: null }
  productSuggestions.value = []
}

async function load() {
  loading.value = true
  const uid = await getQueryUserId()
  if (!uid) { loading.value = false; return }

  const [{ data: inv, error: invErr }, { data: farmsData }] = await Promise.all([
    supabase.from('farm_inventory').select('*, farm:farms(id, name)')
      .eq('user_id', uid)
      .order('name'),
    supabase.from('farms').select('id, name').eq('user_id', uid).order('name'),
  ])

  if (invErr) console.error('inventory error:', invErr)

  // Підвантажуємо останній лог для кожного
  const invList = inv || []
  if (invList.length) {
    const ids = invList.map(i => i.id)
    const { data: logs } = await supabase.from('farm_inventory_log')
      .select('inventory_id, type, quantity, created_at')
      .in('inventory_id', ids)
      .order('created_at', { ascending: false })
    const lastLogMap: Record<string, any> = {}
    for (const log of logs || []) {
      if (!lastLogMap[log.inventory_id]) lastLogMap[log.inventory_id] = log
    }
    items.value = invList.map(i => ({
      ...i,
      initial_quantity: Math.max(i.quantity, 10),
      last_log: lastLogMap[i.id] || null,
    }))
  } else {
    items.value = []
  }
  farms.value = farmsData || []
  loading.value = false
}

async function addItem() {
  if (!form.value.name || !form.value.quantity) return
  if (isTeamMember.value && isViewer.value) return
  saving.value = true

  const uid = await getQueryUserId()
  if (!uid) {
    alert('Немає сесії — спробуйте перезайти')
    saving.value = false
    return
  }

  const { data, error } = await supabase.from('farm_inventory').insert({
    user_id: uid,
    name: form.value.name,
    quantity: form.value.quantity,
    unit: form.value.unit,
    farm_id: form.value.farm_id || null,
    min_quantity: form.value.min_quantity || null,
  }).select().single()

  if (error) {
    console.error('addItem error:', error)
    alert('Помилка: ' + error.message)
    saving.value = false
    return
  }

  if (data) {
    await supabase.from('farm_inventory_log').insert({
      inventory_id: data.id,
      user_id: uid,
      type: 'in',
      quantity: form.value.quantity,
    })
    await load()
  }
  saving.value = false
  showAdd.value = false
  resetForm()
}

function openLog(item: any, type: 'in' | 'out') {
  selectedItem.value = item
  logForm.value = { type, quantity: 0, field_id: '', note: '' }
  showLog.value = true
}

async function saveLog() {
  if (!logForm.value.quantity || !selectedItem.value) return
  saving.value = true

  const delta = logForm.value.type === 'in' ? logForm.value.quantity : -logForm.value.quantity
  const newQty = Math.max(0, selectedItem.value.quantity + delta)

  await Promise.all([
    supabase.from('farm_inventory_log').insert({
      inventory_id: selectedItem.value.id,
      user_id: user.value!.id,
      type: logForm.value.type,
      quantity: logForm.value.quantity,
      field_id: logForm.value.field_id || null,
      note: logForm.value.note || null,
    }),
    supabase.from('farm_inventory').update({ quantity: newQty }).eq('id', selectedItem.value.id),
  ])

  await load()
  saving.value = false
  showLog.value = false
}

async function deleteItem(item: any) {
  if (!await confirmDialog(`"${item.name}" буде видалено зі складу.`, { title: 'Видалити запис?' })) return
  await supabase.from('farm_inventory').delete().eq('id', item.id)
  items.value = items.value.filter(i => i.id !== item.id)
}

onMounted(load)
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-card-title { font-family: 'Bitter', Georgia, serif; font-size: 17px; font-weight: 800; color: rgb(27,46,27); margin: 0; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
</style>
