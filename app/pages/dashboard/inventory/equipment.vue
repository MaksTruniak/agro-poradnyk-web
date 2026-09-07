<template>
  <div class="dash-page">
    <div class="dash-head">
      <NuxtLink to="/dashboard/inventory" class="dash-icon-box shrink-0 hover:bg-agro-hover transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </NuxtLink>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Техніка</h1>
        <p class="dash-subtitle">Трактори, комбайни та інша техніка</p>
      </div>
      <button @click="showAdd = true" class="dash-btn-primary shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати
      </button>
    </div>

    <div v-if="loading" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="card animate-pulse h-36"></div>
    </div>

    <div v-else-if="!items.length" class="card text-center py-16">
      <div class="dash-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(60,80,180)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5a2 2 0 00-2 2v7h2"/>
          <circle cx="7.5" cy="18" r="1.5"/><circle cx="17.5" cy="18" r="1.5"/>
        </svg>
      </div>
      <p class="font-bold text-agro-dark text-lg mb-2">Техніки не додано</p>
      <p class="text-agro-light mb-6">Додайте трактори, комбайни та іншу техніку господарства</p>
      <button @click="showAdd = true" class="dash-btn-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати техніку
      </button>
    </div>

    <div v-else class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="item in items" :key="item.id" class="card flex flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <p class="font-bold text-agro-dark truncate">{{ item.name }}</p>
            <p class="text-xs text-agro-light mt-0.5">{{ item.type }}<span v-if="item.year"> · {{ item.year }} р.</span></p>
          </div>
          <span class="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold" :class="statusClass(item.status)">
            {{ statusLabel(item.status) }}
          </span>
        </div>

        <p v-if="item.next_service_date" class="text-xs flex items-center gap-1.5"
          :class="isServiceSoon(item.next_service_date) ? 'text-amber-600 font-semibold' : 'text-agro-light'">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          ТО: {{ formatDate(item.next_service_date) }}
          <span v-if="isServiceSoon(item.next_service_date)">⚠️</span>
        </p>

        <p v-if="item.notes" class="text-xs text-agro-light italic truncate">{{ item.notes }}</p>

        <div class="flex gap-2 mt-auto">
          <button @click="openEdit(item)" class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-agro-border text-sm font-medium text-agro hover:bg-agro-hover transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Редагувати
          </button>
          <button @click="deleteItem(item)" class="w-9 h-9 flex items-center justify-center rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>

      <button @click="showAdd = true" class="card border-2 border-dashed border-agro-border hover:border-agro flex flex-col items-center justify-center py-10 transition-colors group min-h-36">
        <span class="mb-2 group-hover:scale-110 transition-transform">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(122,138,114)" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </span>
        <span class="font-semibold text-agro-light group-hover:text-agro transition-colors">Додати техніку</span>
      </button>
    </div>

    <!-- Модал: Додати/Редагувати -->
    <div v-if="showAdd || showEdit" class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" @click.self="closeModal">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-bold text-agro-dark text-lg">{{ showEdit ? 'Редагувати техніку' : 'Додати техніку' }}</h3>
          <button @click="closeModal" class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-agro-bg text-agro-light hover:text-agro-dark transition-colors">✕</button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Назва *</label>
            <input v-model="form.name" class="input" placeholder="напр. Трактор МТЗ-82" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Тип техніки</label>
              <select v-model="form.type" class="input">
                <option value="Трактор">Трактор</option>
                <option value="Комбайн">Комбайн</option>
                <option value="Сівалка">Сівалка</option>
                <option value="Обприскувач">Обприскувач</option>
                <option value="Культиватор">Культиватор</option>
                <option value="Плуг">Плуг</option>
                <option value="Причіп">Причіп</option>
                <option value="Автомобіль">Автомобіль</option>
                <option value="Інше">Інше</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Рік випуску</label>
              <input v-model.number="form.year" type="number" min="1950" :max="new Date().getFullYear()" class="input" placeholder="2010" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Стан</label>
            <select v-model="form.status" class="input">
              <option value="ok">Працює</option>
              <option value="repair">На ремонті</option>
              <option value="idle">Не використовується</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Наступне ТО</label>
            <input v-model="form.next_service_date" type="date" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Нотатки</label>
            <textarea v-model="form.notes" class="input resize-none" rows="2" placeholder="Додаткова інформація..."></textarea>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="closeModal" class="flex-1 btn-outline">Скасувати</button>
          <button @click="saveItem" :disabled="saving || !form.name" class="flex-1 btn-primary inline-flex items-center justify-center">
            {{ saving ? '...' : (showEdit ? 'Зберегти' : 'Додати') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Техніка — Склад' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const items = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showAdd = ref(false)
const showEdit = ref(false)
const editId = ref<string | null>(null)

const emptyForm = () => ({ name: '', type: 'Трактор', year: null as number | null, status: 'ok', next_service_date: '', notes: '' })
const form = ref(emptyForm())

const formatDate = (d: string) => new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
const isServiceSoon = (d: string) => { const diff = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24); return diff >= 0 && diff <= 14 }

const statusLabel = (s: string) => ({ ok: 'Працює', repair: 'Ремонт', idle: 'Простій' }[s] || s)
const statusClass = (s: string) => ({
  ok: 'bg-green-100 text-green-700',
  repair: 'bg-red-100 text-red-700',
  idle: 'bg-gray-100 text-gray-600',
}[s] || 'bg-gray-100 text-gray-600')

function openEdit(item: any) {
  form.value = { name: item.name, type: item.type || 'Трактор', year: item.year, status: item.status, next_service_date: item.next_service_date || '', notes: item.notes || '' }
  editId.value = item.id
  showEdit.value = true
}

function closeModal() { showAdd.value = false; showEdit.value = false; editId.value = null; form.value = emptyForm() }

async function load() {
  loading.value = true
  const uid = user.value?.id
  if (!uid) { loading.value = false; return }
  const { data } = await supabase.from('equipment').select('*').eq('user_id', uid).order('name')
  items.value = data || []
  loading.value = false
}

async function saveItem() {
  if (!form.value.name) return
  saving.value = true
  const uid = user.value?.id
  const payload = { name: form.value.name, type: form.value.type, year: form.value.year || null, status: form.value.status, next_service_date: form.value.next_service_date || null, notes: form.value.notes || null }
  if (showEdit.value && editId.value) {
    await supabase.from('equipment').update(payload).eq('id', editId.value)
  } else {
    await supabase.from('equipment').insert({ ...payload, user_id: uid })
  }
  await load(); saving.value = false; closeModal()
}

async function deleteItem(item: any) {
  if (!confirm(`"${item.name}" буде видалено.`)) return
  await supabase.from('equipment').delete().eq('id', item.id)
  items.value = items.value.filter(i => i.id !== item.id)
}

onMounted(load)
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(235,240,255); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
</style>
