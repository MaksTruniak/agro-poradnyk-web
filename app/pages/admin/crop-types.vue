<template>
  <div class="p-8">
    <div class="mb-7 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22V12"/><path d="M8 18c0-4 4-8 4-8s4 4 4 8"/><path d="M5 22h14"/><path d="M4 12c0-4 3.5-7 8-7s8 3 8 7"/>
          </svg>
          Культури
        </h1>
        <p class="text-agro-light mt-1">Довідник культур та їх сортів</p>
      </div>
      <button @click="openAdd" class="btn-primary shrink-0">+ Додати культуру</button>
    </div>

    <!-- Таби категорій -->
    <div v-if="!loading" class="flex gap-2 flex-wrap mb-5">
      <button @click="activeCategory = null"
        class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
        :class="activeCategory === null ? 'bg-agro text-white border-agro' : 'bg-white text-agro-light border-agro-border hover:border-agro hover:text-agro-dark'">
        Всі ({{ items.length }})
      </button>
      <button v-for="cat in categories" :key="cat.id" @click="activeCategory = cat.id"
        class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
        :class="activeCategory === cat.id ? 'bg-agro text-white border-agro' : 'bg-white text-agro-light border-agro-border hover:border-agro hover:text-agro-dark'">
        {{ cat.name }} ({{ items.filter(i => i.category_id === cat.id).length }})
      </button>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="card animate-pulse h-16" />
    </div>

    <div v-else class="space-y-2">
      <div v-for="item in filteredItems" :key="item.id" class="card p-0 overflow-hidden">
        <div class="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-agro-bg/40 transition-colors"
          @click="toggleExpand(item.id)">
          <span class="text-agro-light text-xs transition-transform inline-block" :class="expanded === item.id ? 'rotate-90' : ''">▶</span>
          <div class="w-8 h-8 shrink-0 flex items-center justify-center">
            <img :src="`/crops/${cropToSlug(item.name)}.svg`" :alt="item.name" class="w-7 h-7 object-contain"
              @error="($event.target as HTMLImageElement).style.display='none'" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-agro-dark">{{ item.name }}</p>
            <p class="text-xs text-agro-light mt-0.5">{{ item.category || '—' }}</p>
          </div>
          <span class="text-xs text-agro-light shrink-0">{{ varieties[item.id] ? varieties[item.id].length : (varietyCounts[item.id] ?? 0) }} сортів</span>
          <button @click.stop="openEdit(item)"
            class="shrink-0 text-xs font-semibold text-agro hover:text-agro-dark transition-colors px-2">
            Редагувати
          </button>
        </div>

        <div v-if="expanded === item.id" class="border-t border-agro-border bg-agro-bg/30">
          <div class="px-5 py-3 flex items-center justify-between">
            <p class="text-xs font-bold text-agro-light uppercase tracking-wide">Сорти</p>
            <button @click="openAddVariety(item)" class="text-xs font-semibold text-agro hover:text-agro-dark transition-colors">
              + Додати сорт
            </button>
          </div>

          <div v-if="loadingVarieties[item.id]" class="px-5 pb-4 text-xs text-agro-light">Завантаження...</div>
          <div v-else-if="!(varieties[item.id] || []).length" class="px-5 pb-4 text-xs text-agro-light italic">Сортів ще немає</div>

          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-agro-border">
                <th class="text-left px-5 py-2.5 text-agro-light font-semibold text-xs uppercase tracking-wide">Назва сорту</th>
                <th class="text-left px-5 py-2.5 text-agro-light font-semibold text-xs uppercase tracking-wide">Сезон</th>
                <th class="px-5 py-2.5 text-center text-agro-light font-semibold text-xs uppercase tracking-wide">Активний</th>
                <th class="px-5 py-2.5 w-24"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in varieties[item.id]" :key="v.id"
                class="border-b border-agro-border last:border-0 hover:bg-white/60 transition-colors">
                <td class="px-5 py-3 font-medium text-agro-dark">{{ v.name }}</td>
                <td class="px-5 py-3">
                  <span v-if="v.season" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" :class="seasonClass(v.season)">
                    {{ seasonLabel(v.season) }}
                  </span>
                  <span v-else class="text-agro-light text-xs">—</span>
                </td>
                <td class="px-5 py-3 text-center">
                  <span class="inline-block w-2 h-2 rounded-full" :class="v.is_active ? 'bg-green-500' : 'bg-gray-300'" />
                </td>
                <td class="px-5 py-3 text-right">
                  <button @click="openEditVariety(item, v)" class="text-xs font-semibold text-agro hover:text-agro-dark transition-colors">Редагувати</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!items.length" class="card text-center py-12 text-agro-light">Немає культур</div>
    </div>
  </div>

  <!-- Модал культури -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="modal.show = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
          <h2 class="font-bold text-agro-dark text-lg mb-5">{{ modal.id ? 'Редагувати культуру' : 'Додати культуру' }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Назва <span class="text-red-400">*</span></label>
              <input v-model="modal.name" type="text" class="input" placeholder="Пшениця" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Категорія</label>
              <select v-model="modal.category_id" class="input">
                <option value="">— без категорії —</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.emoji }} {{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Опис</label>
              <textarea v-model="modal.description" class="input resize-none" rows="2" placeholder="Короткий опис" />
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button @click="modal.show = false" class="btn-outline flex-1">Скасувати</button>
            <button @click="save" :disabled="!modal.name || saving" class="btn-primary flex-1 flex items-center justify-center disabled:opacity-50">
              {{ saving ? '...' : 'Зберегти' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Модал сорту -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="vModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="vModal.show = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <h2 class="font-bold text-agro-dark text-lg mb-1">{{ vModal.id ? 'Редагувати сорт' : 'Додати сорт' }}</h2>
          <p class="text-sm text-agro-light mb-5">{{ vModal.cropName }}</p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Назва сорту <span class="text-red-400">*</span></label>
              <input v-model="vModal.name" type="text" class="input" placeholder="Пшехиба" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-2">Сезон</label>
              <div class="flex gap-2 flex-wrap">
                <button v-for="s in seasons" :key="s.value" @click="vModal.season = vModal.season === s.value ? '' : s.value"
                  type="button" class="px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors"
                  :class="vModal.season === s.value ? 'bg-agro text-white border-agro' : 'bg-white text-agro-light border-agro-border hover:border-agro'">
                  {{ s.label }}
                </button>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <button @click="vModal.is_active = !vModal.is_active" type="button"
                class="w-10 h-6 rounded-full transition-colors flex items-center px-0.5"
                :class="vModal.is_active ? 'bg-agro' : 'bg-gray-200'">
                <span class="w-5 h-5 rounded-full bg-white shadow transition-transform" :class="vModal.is_active ? 'translate-x-4' : 'translate-x-0'" />
              </button>
              <span class="text-sm font-medium text-agro-dark">Активний</span>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button @click="vModal.show = false" class="btn-outline flex-1">Скасувати</button>
            <button @click="saveVariety" :disabled="!vModal.name || vSaving" class="btn-primary flex-1 flex items-center justify-center disabled:opacity-50">
              {{ vSaving ? '...' : 'Зберегти' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'Культури — Адмін' })

const supabase = useSupabaseClient()
const items = ref<any[]>([])
const categories = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const vSaving = ref(false)
const expanded = ref<string | null>(null)
const activeCategory = ref<string | null>(null)
const filteredItems = computed(() => activeCategory.value ? items.value.filter(i => i.category_id === activeCategory.value) : items.value)
const varieties = ref<Record<string, any[]>>({})
const varietyCounts = ref<Record<string, number>>({})
const loadingVarieties = ref<Record<string, boolean>>({})

const seasons = [
  { value: 'winter', label: 'Озимий' },
  { value: 'spring', label: 'Ярий' },
  { value: 'summer', label: 'Літній' },
  { value: 'autumn', label: 'Осінній' },
]
const seasonLabel = (v: string) => seasons.find(s => s.value === v)?.label || v
const seasonClass = (v: string) => ({ winter: 'bg-blue-50 text-blue-700', spring: 'bg-green-50 text-green-700', summer: 'bg-amber-50 text-amber-700', autumn: 'bg-orange-50 text-orange-700' }[v] || 'bg-agro-bg text-agro-dark')

const modal = reactive({ show: false, id: null as string | null, name: '', category_id: '', description: '' })
const vModal = reactive({ show: false, id: null as string | null, cropId: '', cropName: '', name: '', season: '', is_active: true })

async function toggleExpand(id: string) {
  if (expanded.value === id) { expanded.value = null; return }
  expanded.value = id
  if (!varieties.value[id]) {
    loadingVarieties.value[id] = true
    const item = items.value.find(i => i.id === id)
    const { data } = await supabase.from('varieties').select('id, name, season, is_active').ilike('crop_type', item?.name || '').order('name')
    varieties.value[id] = data || []
    loadingVarieties.value[id] = false
  }
}

const cropToSlug = (name: string) => name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яіїєґ0-9-]/gi, '') || ''

function openAdd() {
  Object.assign(modal, { show: true, id: null, name: '', category_id: '', description: '' })
}
function openEdit(item: any) {
  Object.assign(modal, { show: true, id: item.id, name: item.name, category_id: item.category_id || '', description: item.description || '' })
}
function openAddVariety(item: any) {
  Object.assign(vModal, { show: true, id: null, cropId: item.id, cropName: item.name, name: '', season: '', is_active: true })
}
function openEditVariety(item: any, v: any) {
  Object.assign(vModal, { show: true, id: v.id, cropId: item.id, cropName: item.name, name: v.name, season: v.season || '', is_active: v.is_active })
}

async function save() {
  saving.value = true
  const cat = categories.value.find(c => c.id === modal.category_id)
  const payload: any = { name: modal.name, description: modal.description || null, category_id: modal.category_id || null, category: cat?.name || null }
  if (modal.id) {
    await supabase.from('crop_catalog').update(payload).eq('id', modal.id)
    const idx = items.value.findIndex(i => i.id === modal.id)
    if (idx !== -1) Object.assign(items.value[idx], payload)
  } else {
    const { data } = await supabase.from('crop_catalog').insert(payload).select().single()
    if (data) { items.value.push(data); varieties.value[data.id] = [] }
  }
  saving.value = false
  modal.show = false
}

async function saveVariety() {
  vSaving.value = true
  const payload = { crop_type: vModal.cropName, name: vModal.name, season: vModal.season || null, is_active: vModal.is_active }
  if (vModal.id) {
    await supabase.from('varieties').update(payload).eq('id', vModal.id)
    const list = varieties.value[vModal.cropId] || []
    const idx = list.findIndex((v: any) => v.id === vModal.id)
    if (idx !== -1) Object.assign(list[idx], { ...payload })
  } else {
    const { data } = await supabase.from('varieties').insert(payload).select().single()
    if (data) { if (!varieties.value[vModal.cropId]) varieties.value[vModal.cropId] = []; varieties.value[vModal.cropId].push(data) }
  }
  vSaving.value = false
  vModal.show = false
}

async function load() {
  const [itemsRes, catsRes, countsRes] = await Promise.all([
    supabase.from('crop_catalog').select('*').order('name'),
    supabase.from('crop_categories').select('id, name, emoji').order('order_num'),
    supabase.from('varieties').select('crop_type'),
  ])
  items.value = itemsRes.data || []
  categories.value = catsRes.data || []
  const counts: Record<string, number> = {}
  for (const row of countsRes.data || []) {
    const item = (itemsRes.data || []).find(i => i.name.toLowerCase() === (row.crop_type || '').toLowerCase())
    if (item) counts[item.id] = (counts[item.id] || 0) + 1
  }
  varietyCounts.value = counts
  loading.value = false
}

onMounted(load)
</script>
