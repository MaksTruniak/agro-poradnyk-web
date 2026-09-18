<template>
  <div class="p-8">
    <div class="mb-7 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Агрокалендар
        </h1>
        <p class="text-agro-light mt-1">Підказки по догляду за культурами по місяцях</p>
      </div>
      <button @click="openAdd" class="btn-primary shrink-0">+ Додати підказку</button>
    </div>

    <!-- Фільтри -->
    <div class="flex gap-3 flex-wrap mb-5">
      <select v-model="filterMonth" class="input-sm">
        <option value="">Всі місяці</option>
        <option v-for="(m, i) in MONTHS" :key="i+1" :value="i+1">{{ m }}</option>
      </select>
      <select v-model="filterCrop" class="input-sm">
        <option value="">Всі культури</option>
        <option v-for="c in cropList" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="filterCategory" class="input-sm">
        <option value="">Всі категорії</option>
        <option v-for="(c, k) in CATEGORIES" :key="k" :value="k">{{ c.label }}</option>
      </select>
      <select v-model="filterUrgency" class="input-sm">
        <option value="">Всі пріоритети</option>
        <option value="high">Важливо</option>
        <option value="medium">Рекомендовано</option>
        <option value="low">Опційно</option>
      </select>
      <span class="text-sm text-agro-light self-center ml-auto">{{ filtered.length }} підказок</span>
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="i in 8" :key="i" class="card animate-pulse h-14" />
    </div>

    <div v-else class="space-y-2">
      <div v-for="item in filtered" :key="item.id"
        class="card flex items-center gap-4 py-3 px-4">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
          :class="URGENCY_STYLE[item.urgency]">
          {{ item.month }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-semibold text-agro-dark text-sm">{{ item.title }}</p>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="URGENCY_BADGE[item.urgency]">
              {{ URGENCY_LABEL[item.urgency] }}
            </span>
            <span class="text-xs bg-agro-hover text-agro px-2 py-0.5 rounded-full">{{ item.crop_type }}</span>
            <span class="text-xs text-agro-light">{{ CATEGORIES[item.category]?.label }}</span>
          </div>
          <p class="text-xs text-agro-light mt-0.5 truncate">{{ item.description }}</p>
        </div>
        <div class="flex gap-1 shrink-0">
          <button @click="openEdit(item)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-agro-hover text-agro transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button @click="deleteItem(item)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
      <div v-if="filtered.length === 0" class="card text-center py-12 text-agro-light">
        Підказок не знайдено
      </div>
    </div>

    <!-- Модалка -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="modal.open = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
            <div class="px-6 pt-6 pb-4 border-b border-agro-border flex items-center justify-between">
              <h2 class="font-extrabold text-agro-dark text-lg">{{ modal.id ? 'Редагувати' : 'Нова підказка' }}</h2>
              <button @click="modal.open = false" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-agro-bg text-agro-light">✕</button>
            </div>
            <div class="px-6 py-5 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">Культура</label>
                  <input v-model="modal.crop_type" class="input" placeholder="смородина" />
                </div>
                <div>
                  <label class="label">Місяць (1-12)</label>
                  <select v-model="modal.month" class="input">
                    <option v-for="(m, i) in MONTHS" :key="i+1" :value="i+1">{{ i+1 }} — {{ m }}</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">Тиждень від</label>
                  <select v-model="modal.week_from" class="input">
                    <option v-for="w in 4" :key="w" :value="w">{{ w }}</option>
                  </select>
                </div>
                <div>
                  <label class="label">Тиждень до</label>
                  <select v-model="modal.week_to" class="input">
                    <option v-for="w in 4" :key="w" :value="w">{{ w }}</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="label">Назва</label>
                <input v-model="modal.title" class="input" placeholder="Осіннє підживлення" />
              </div>
              <div>
                <label class="label">Опис</label>
                <textarea v-model="modal.description" class="input resize-none" rows="3" placeholder="Детальний опис заходу..." />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">Категорія</label>
                  <select v-model="modal.category" class="input">
                    <option v-for="(c, k) in CATEGORIES" :key="k" :value="k">{{ c.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="label">Пріоритет</label>
                  <select v-model="modal.urgency" class="input">
                    <option value="high">Важливо</option>
                    <option value="medium">Рекомендовано</option>
                    <option value="low">Опційно</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="px-6 pb-6 flex gap-3">
              <button @click="modal.open = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="save" :disabled="saving || !modal.title || !modal.crop_type" class="btn-primary flex-1">
                {{ saving ? '...' : 'Зберегти' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const supabase = useSupabaseClient()
const { confirm: confirmDialog } = useConfirm()

const loading = ref(true)
const saving = ref(false)
const items = ref<any[]>([])

const filterMonth = ref<number | ''>('')
const filterCrop = ref('')
const filterCategory = ref('')
const filterUrgency = ref('')

const MONTHS = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']

const CATEGORIES: Record<string, { label: string }> = {
  pest:        { label: 'Шкідники' },
  disease:     { label: 'Хвороби' },
  nutrition:   { label: 'Живлення' },
  irrigation:  { label: 'Полив' },
  harvest:     { label: 'Збір' },
  preparation: { label: 'Підготовка' },
}

const URGENCY_LABEL: Record<string, string> = { high: 'Важливо', medium: 'Рекомендовано', low: 'Опційно' }
const URGENCY_BADGE: Record<string, string> = {
  high: 'bg-red-50 text-red-600',
  medium: 'bg-amber-50 text-amber-600',
  low: 'bg-agro-hover text-agro',
}
const URGENCY_STYLE: Record<string, string> = {
  high: 'bg-red-50 text-red-600',
  medium: 'bg-amber-50 text-amber-600',
  low: 'bg-agro-hover text-agro',
}

const cropList = computed(() => [...new Set(items.value.map(i => i.crop_type))].sort())

const filtered = computed(() => items.value.filter(i => {
  if (filterMonth.value && i.month !== Number(filterMonth.value)) return false
  if (filterCrop.value && i.crop_type !== filterCrop.value) return false
  if (filterCategory.value && i.category !== filterCategory.value) return false
  if (filterUrgency.value && i.urgency !== filterUrgency.value) return false
  return true
}))

const modal = reactive({
  open: false, id: '', crop_type: '', month: 9, week_from: 1, week_to: 4,
  title: '', description: '', category: 'pest', urgency: 'medium',
})

const load = async () => {
  loading.value = true
  const { data } = await supabase.from('agro_calendar').select('*').order('crop_type').order('month').order('week_from')
  items.value = data || []
  loading.value = false
}

const openAdd = () => {
  Object.assign(modal, { open: true, id: '', crop_type: '', month: 9, week_from: 1, week_to: 4, title: '', description: '', category: 'pest', urgency: 'medium' })
}

const openEdit = (item: any) => {
  Object.assign(modal, { open: true, id: item.id, crop_type: item.crop_type, month: item.month, week_from: item.week_from, week_to: item.week_to, title: item.title, description: item.description, category: item.category, urgency: item.urgency })
}

const save = async () => {
  saving.value = true
  const payload = { crop_type: modal.crop_type.toLowerCase().trim(), month: Number(modal.month), week_from: Number(modal.week_from), week_to: Number(modal.week_to), title: modal.title.trim(), description: modal.description.trim(), category: modal.category, urgency: modal.urgency }
  if (modal.id) {
    await supabase.from('agro_calendar').update(payload).eq('id', modal.id)
  } else {
    await supabase.from('agro_calendar').insert(payload)
  }
  saving.value = false
  modal.open = false
  await load()
}

const deleteItem = async (item: any) => {
  if (!await confirmDialog(`Підказку "${item.title}" буде видалено.`, { title: 'Видалити підказку?' })) return
  await supabase.from('agro_calendar').delete().eq('id', item.id)
  await load()
}

onMounted(load)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.label { display: block; font-size: 13px; font-weight: 600; color: rgb(27,46,27); margin-bottom: 6px; }
.input-sm { padding: 7px 12px; border: 1px solid #dde6d5; border-radius: 10px; font-size: 13px; color: #1B2E1B; background: white; outline: none; }
.input-sm:focus { border-color: #2F5233; }
</style>
