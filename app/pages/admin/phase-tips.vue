<template>
  <div class="p-8">
    <div class="mb-7 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22V12"/><path d="M5 3a7 7 0 007 7 7 7 0 00-7-7"/><path d="M19 3a7 7 0 01-7 7 7 7 0 017-7"/>
          </svg>
          Поради за фазами
        </h1>
        <p class="text-agro-light mt-1">Що робити на кожній фенофазі багаторічних культур. Фермер бачить лише опубліковані поради.</p>
      </div>
      <button @click="openAdd" class="btn-primary shrink-0">+ Додати пораду</button>
    </div>

    <!-- Фільтри -->
    <div class="flex gap-3 flex-wrap mb-5 items-center">
      <select v-model="filterGroup" class="input-sm" @change="filterPhase = ''">
        <option value="">Всі групи</option>
        <option v-for="(label, key) in PERENNIAL_GROUP_LABELS" :key="key" :value="key">{{ label }}</option>
      </select>
      <select v-model="filterPhase" class="input-sm">
        <option value="">Всі фази</option>
        <option v-for="p in filterPhaseOptions" :key="p" :value="p">{{ p }}</option>
      </select>
      <select v-model="filterStatus" class="input-sm">
        <option value="">Всі</option>
        <option value="draft">Чернетки</option>
        <option value="published">Опубліковані</option>
      </select>
      <span class="text-sm text-agro-light ml-auto">
        {{ filtered.length }} порад · чернеток: {{ filtered.filter(i => !i.is_published).length }}
      </span>
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="i in 8" :key="i" class="card animate-pulse h-14" />
    </div>

    <div v-else class="space-y-6">
      <div v-for="section in sections" :key="section.key">
        <p class="text-xs font-bold uppercase tracking-wider text-agro-light mb-2">
          {{ PERENNIAL_GROUP_LABELS[section.group] }} · {{ section.phase }}
        </p>
        <div class="space-y-2">
          <div v-for="item in section.items" :key="item.id" class="card flex items-start gap-4 py-3 px-4"
            :class="{ 'opacity-80': !item.is_published }">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :class="TIP_URGENCY_BADGE[item.urgency]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="TIP_CATEGORIES[item.category]?.svg" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="font-semibold text-agro-dark text-sm">{{ item.title }}</p>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="TIP_URGENCY_BADGE[item.urgency]">{{ TIP_URGENCY_LABEL[item.urgency] }}</span>
                <span class="text-xs text-agro-light">{{ TIP_CATEGORIES[item.category]?.label }}</span>
              </div>
              <p class="text-xs text-agro-light mt-1 leading-relaxed">{{ item.description }}</p>
            </div>
            <div class="flex gap-1 shrink-0 items-center">
              <button @click="togglePublished(item)"
                class="text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors"
                :class="item.is_published ? 'border-agro text-agro hover:bg-agro-hover' : 'border-agro-border text-agro-light hover:bg-agro-bg'"
                :title="item.is_published ? 'Зняти з публікації' : 'Опублікувати'">
                {{ item.is_published ? 'Опубліковано' : 'Чернетка' }}
              </button>
              <button @click="openEdit(item)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-agro-hover text-agro transition-colors" title="Редагувати">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button @click="deleteItem(item)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Видалити">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="filtered.length === 0" class="card text-center py-12 text-agro-light">
        Порад не знайдено
      </div>
    </div>

    <!-- Модалка -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="modal.open = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
            <div class="px-6 pt-6 pb-4 border-b border-agro-border flex items-center justify-between">
              <h2 class="font-extrabold text-agro-dark text-lg">{{ modal.id ? 'Редагувати пораду' : 'Нова порада' }}</h2>
              <button @click="modal.open = false" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-agro-bg text-agro-light">✕</button>
            </div>
            <div class="px-6 py-5 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">Група культур</label>
                  <select v-model="modal.crop_group" class="input" @change="modal.phase_key = ''">
                    <option v-for="(label, key) in PERENNIAL_GROUP_LABELS" :key="key" :value="key">{{ label }}</option>
                  </select>
                </div>
                <div>
                  <label class="label">Фенофаза</label>
                  <select v-model="modal.phase_key" class="input">
                    <option value="" disabled>Оберіть фазу</option>
                    <option v-for="p in modalPhaseOptions" :key="p" :value="p">{{ p }}</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="label">Назва</label>
                <input v-model="modal.title" class="input" maxlength="160" placeholder="Обробка від борошнистої роси" />
              </div>
              <div>
                <label class="label">Що робити</label>
                <textarea v-model="modal.description" class="input resize-none" rows="4" maxlength="2000" placeholder="Коротко й конкретно: що, проти чого, коли..." />
              </div>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="label">Категорія</label>
                  <select v-model="modal.category" class="input">
                    <option v-for="(c, k) in TIP_CATEGORIES" :key="k" :value="k">{{ c.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="label">Пріоритет</label>
                  <select v-model="modal.urgency" class="input">
                    <option v-for="(l, k) in TIP_URGENCY_LABEL" :key="k" :value="k">{{ l }}</option>
                  </select>
                </div>
                <div>
                  <label class="label">Порядок</label>
                  <input v-model.number="modal.order_num" type="number" min="0" class="input" />
                </div>
              </div>
              <label class="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" v-model="modal.is_published" class="w-4 h-4 accent-agro rounded" />
                <span class="text-sm font-medium text-agro-dark">Опубліковано — фермери бачать цю пораду</span>
              </label>
            </div>
            <div class="px-6 pb-6 flex gap-3">
              <button @click="modal.open = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="save" :disabled="saving || !modal.title.trim() || !modal.phase_key" class="btn-primary flex-1">
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
import { PERENNIAL_GROUP_LABELS } from '~/utils/cropGroups'
import { TIP_CATEGORIES, TIP_URGENCY_LABEL, TIP_URGENCY_BADGE } from '~/utils/tipCategories'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Поради за фазами — Адмін' })

const supabase = useSupabaseClient()
const { confirm: confirmDialog } = useConfirm()

const loading = ref(true)
const saving = ref(false)
const items = ref<any[]>([])
// Системні фенофази: ключ, порядок, групи культур
const phases = ref<{ key: string; order_num: number; crop_groups: string[] | null }[]>([])

const filterGroup = ref('')
const filterPhase = ref('')
const filterStatus = ref<'' | 'draft' | 'published'>('')

const phasesOf = (group: string) => phases.value
  .filter(p => !group || !p.crop_groups || p.crop_groups.includes(group))
  .map(p => p.key)
const phaseOrder = (key: string) => phases.value.find(p => p.key === key)?.order_num ?? 99

const filterPhaseOptions = computed(() => [...new Set(phasesOf(filterGroup.value))])
const modalPhaseOptions = computed(() => phasesOf(modal.crop_group))

const GROUP_ORDER = Object.keys(PERENNIAL_GROUP_LABELS)

const filtered = computed(() => items.value.filter(i => {
  if (filterGroup.value && i.crop_group !== filterGroup.value) return false
  if (filterPhase.value && i.phase_key !== filterPhase.value) return false
  if (filterStatus.value === 'draft' && i.is_published) return false
  if (filterStatus.value === 'published' && !i.is_published) return false
  return true
}))

// Групуємо за культурою і фазою — у порядку циклу
const sections = computed(() => {
  const map = new Map<string, { key: string; group: string; phase: string; items: any[] }>()
  for (const i of filtered.value) {
    const key = `${i.crop_group}|${i.phase_key}`
    if (!map.has(key)) map.set(key, { key, group: i.crop_group, phase: i.phase_key, items: [] })
    map.get(key)!.items.push(i)
  }
  return [...map.values()].sort((a, b) =>
    GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || phaseOrder(a.phase) - phaseOrder(b.phase))
})

const modal = reactive({
  open: false, id: '', crop_group: 'berry_shrub', phase_key: '', title: '', description: '',
  category: 'disease', urgency: 'medium', order_num: 0, is_published: false,
})

const load = async () => {
  loading.value = true
  const [{ data }, { data: phaseRows }] = await Promise.all([
    supabase.from('phase_tips').select('*').order('order_num'),
    supabase.from('growth_phases').select('key, order_num, crop_groups').is('created_by', null).order('order_num'),
  ])
  items.value = data || []
  phases.value = phaseRows || []
  loading.value = false
}

const openAdd = () => {
  Object.assign(modal, {
    open: true, id: '', crop_group: filterGroup.value || 'berry_shrub', phase_key: filterPhase.value || '',
    title: '', description: '', category: 'disease', urgency: 'medium', order_num: 0, is_published: false,
  })
}

const openEdit = (item: any) => {
  Object.assign(modal, {
    open: true, id: item.id, crop_group: item.crop_group, phase_key: item.phase_key, title: item.title,
    description: item.description || '', category: item.category, urgency: item.urgency,
    order_num: item.order_num || 0, is_published: item.is_published,
  })
}

const save = async () => {
  const payload = {
    crop_group: modal.crop_group, phase_key: modal.phase_key, title: modal.title.trim(),
    description: modal.description.trim(), category: modal.category, urgency: modal.urgency,
    order_num: Number(modal.order_num) || 0, is_published: modal.is_published,
  }
  if (!payload.title || !payload.phase_key) { useToast().error('Вкажіть фазу і назву'); return }
  saving.value = true
  const res = modal.id
    ? await supabase.from('phase_tips').update(payload).eq('id', modal.id).select('id')
    : await supabase.from('phase_tips').insert(payload).select('id')
  saving.value = false
  if (!adminWriteOk(res, 'Не вдалося зберегти пораду')) return
  modal.open = false
  await load()
}

const togglePublished = async (item: any) => {
  const res = await supabase.from('phase_tips').update({ is_published: !item.is_published }).eq('id', item.id).select('id')
  if (!adminWriteOk(res, 'Не вдалося змінити статус')) return
  item.is_published = !item.is_published
}

const deleteItem = async (item: any) => {
  if (!await confirmDialog(`Пораду "${item.title}" буде видалено.`, { title: 'Видалити пораду?' })) return
  const res = await supabase.from('phase_tips').delete().eq('id', item.id).select('id')
  if (!adminWriteOk(res, 'Не вдалося видалити пораду')) return
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
