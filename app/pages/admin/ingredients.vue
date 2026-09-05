<template>
  <div class="p-8">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-3"/><rect x="9" y="1" width="6" height="4" rx="1"/></svg>
        Діючі речовини
      </h1>
      <p class="text-agro-light mt-1">{{ total }} речовин у базі</p>
    </div>

    <div class="flex items-center gap-3 mb-5">
      <div class="relative flex-1 max-w-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input v-model="search" @input="onSearch" class="input pl-9 text-sm" placeholder="Пошук за назвою або slug..." />
      </div>
      <button @click="openModal(null)" class="btn-primary text-sm py-2 px-4 inline-flex items-center gap-1.5 shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати речовину
      </button>
    </div>

    <!-- Список -->
    <div v-if="loading && !items.length" class="card overflow-hidden p-0">
      <div v-for="i in 12" :key="i" class="flex items-center gap-4 px-5 py-3.5 border-b border-agro-border animate-pulse">
        <div class="flex-1"><div class="h-4 bg-agro-bg rounded w-1/3 mb-1.5"></div><div class="h-3 bg-agro-bg rounded w-1/5"></div></div>
        <div class="w-10 h-5 bg-agro-bg rounded-full shrink-0"></div>
      </div>
    </div>

    <div v-else class="card overflow-hidden p-0">
      <div class="divide-y divide-agro-border">
        <div v-for="item in items" :key="item.id"
          class="flex items-center gap-4 px-5 py-3.5 hover:bg-agro-bg transition-colors">
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-agro-dark truncate">{{ item.name }}</p>
            <p class="text-xs text-agro-light font-mono truncate">{{ item.slug }}</p>
          </div>
          <span class="shrink-0 text-xs tabular-nums text-agro-light font-medium">{{ item.product_count ?? '' }}</span>
          <div class="flex items-center gap-2 shrink-0">
            <button v-if="item.product_count > 0" @click="openProducts(item)"
              class="text-xs text-agro-light border border-agro-border hover:bg-agro-hover hover:text-agro rounded-xl px-3 py-1.5 transition-colors inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
              {{ item.product_count }} препар.
            </button>
            <button @click="openModal(item)" class="text-xs text-agro border border-agro-border hover:bg-agro-hover rounded-xl px-3 py-1.5 transition-colors inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Редагувати
            </button>
            <button @click="confirmDelete(item)" class="text-xs text-red-500 border border-red-200 hover:bg-red-50 rounded-xl px-3 py-1.5 transition-colors inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Видалити
            </button>
          </div>
        </div>
      </div>
      <div v-if="!loading && !items.length" class="text-center py-12 text-agro-light text-sm">Нічого не знайдено</div>
    </div>

    <!-- Пагінація -->
    <div v-if="totalPages > 1" class="flex items-center justify-between mt-4">
      <p class="text-sm text-agro-light">Сторінка {{ page }} з {{ totalPages }}</p>
      <div class="flex gap-2">
        <button @click="changePage(page - 1)" :disabled="page === 1"
          class="btn-outline text-sm py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed">← Назад</button>
        <button @click="changePage(page + 1)" :disabled="page >= totalPages"
          class="btn-outline text-sm py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed">Далі →</button>
      </div>
    </div>
  </div>

  <!-- Модалка редагування -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20" @click.self="modal.show = false">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-agro-border">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-agro-dark text-lg">{{ modal.isNew ? 'Нова діюча речовина' : 'Редагувати речовину' }}</h3>
              <button @click="modal.show = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-agro-hover text-agro-light">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Назва <span class="text-red-400">*</span></label>
                <input v-model="modal.form.name" @input="autoSlug" class="input text-sm" placeholder="Гліфосат" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Slug <span class="text-red-400">*</span></label>
                <input v-model="modal.form.slug" class="input text-sm font-mono" placeholder="hlyfоsat"
                  :disabled="!modal.isNew" :class="!modal.isNew ? 'opacity-50' : ''" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-agro-dark mb-1">Латинська назва</label>
              <input v-model="modal.form.latin" class="input text-sm italic" placeholder="Glyphosate" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-agro-dark mb-1">Хімічний клас</label>
              <input v-model="modal.form.chem_class" class="input text-sm" placeholder="Фосфонові кислоти" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-agro-dark mb-1">Механізм дії</label>
              <input v-model="modal.form.mechanism" class="input text-sm" placeholder="Інгібітор синтезу амінокислот" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-agro-dark mb-1">Група HRAC / IRAC</label>
              <input v-model="modal.form.group" class="input text-sm" placeholder="9" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-agro-dark mb-1">Опис / примітки</label>
              <textarea v-model="modal.form.notes" class="input text-sm resize-none" rows="3" placeholder="Додаткова інформація..." />
            </div>
          </div>

          <div class="px-6 pb-6 flex gap-3">
            <button @click="modal.show = false" class="btn-outline flex-1 text-sm py-2.5">Скасувати</button>
            <button @click="save" :disabled="modal.saving || !modal.form.name || !modal.form.slug"
              class="btn-primary flex-1 text-sm py-2.5 inline-flex items-center justify-center gap-1.5"
              :class="(modal.saving || !modal.form.name || !modal.form.slug) ? 'opacity-50 cursor-not-allowed' : ''">
              {{ modal.saving ? 'Збереження...' : 'Зберегти' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Drawer: препарати речовини -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="productsDrawer.show" class="fixed inset-0 z-50 flex justify-end bg-black/20" @click.self="productsDrawer.show = false">
        <Transition name="slide-right" appear>
          <div v-if="productsDrawer.show" class="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div class="px-6 pt-6 pb-4 border-b border-agro-border flex items-start justify-between gap-3 shrink-0">
              <div>
                <h3 class="font-bold text-agro-dark text-lg leading-tight">{{ productsDrawer.ingredient?.name }}</h3>
                <p class="text-xs text-agro-light font-mono mt-0.5">{{ productsDrawer.ingredient?.slug }}</p>
              </div>
              <button @click="productsDrawer.show = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-agro-hover text-agro-light shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto">
              <div v-if="productsDrawer.loading" class="p-6 space-y-3">
                <div v-for="i in 5" :key="i" class="flex gap-3 animate-pulse">
                  <div class="w-10 h-10 rounded-xl bg-agro-bg shrink-0"></div>
                  <div class="flex-1 pt-1"><div class="h-4 bg-agro-bg rounded w-3/4 mb-2"></div><div class="h-3 bg-agro-bg rounded w-1/2"></div></div>
                </div>
              </div>
              <div v-else-if="productsDrawer.products.length" class="divide-y divide-agro-border">
                <div v-for="p in productsDrawer.products" :key="p.id"
                  class="flex items-center gap-3 px-6 py-3.5 hover:bg-agro-bg transition-colors">
                  <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center shrink-0 overflow-hidden">
                    <img v-if="p.image_url" :src="p.image_url" class="w-full h-full object-contain p-1" @error="($event.target as HTMLImageElement).style.display='none'" />
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(107,122,100)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-agro-dark text-sm truncate">{{ p.name }}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span v-if="p.concentration" class="text-xs text-agro-light">{{ p.concentration }}</span>
                      <span v-if="p.type" class="text-xs bg-agro-bg text-agro-light px-2 py-0.5 rounded-full">{{ p.type }}</span>
                    </div>
                  </div>
                  <NuxtLink :to="`/pesticides/${p.slug}`" target="_blank"
                    class="shrink-0 w-7 h-7 flex items-center justify-center rounded-xl hover:bg-agro-hover text-agro-light transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </NuxtLink>
                </div>
              </div>
              <div v-else class="p-6 text-center text-agro-light text-sm">Немає прив'язаних препаратів</div>
            </div>

            <div class="px-6 py-4 border-t border-agro-border shrink-0">
              <p class="text-xs text-agro-light">{{ productsDrawer.products.length }} препаратів з цією речовиною</p>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- Модалка підтвердження видалення -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="deleteModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20" @click.self="deleteModal.show = false">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
          <div class="p-6">
            <div class="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(179,69,47)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <p class="font-bold text-agro-dark text-lg mb-1">Видалити речовину?</p>
            <p class="text-agro-light text-sm mb-1">«{{ deleteModal.item?.name }}»</p>
            <p v-if="deleteModal.count" class="text-sm text-amber-600 font-medium mt-2">
              Увага: ця речовина прив'язана до {{ deleteModal.count }} товарів. Зв'язки будуть видалені.
            </p>
          </div>
          <div class="px-6 pb-6 flex gap-3">
            <button @click="deleteModal.show = false" class="btn-outline flex-1 text-sm py-2.5">Скасувати</button>
            <button @click="doDelete" :disabled="deleteModal.deleting"
              class="flex-1 text-sm py-2.5 rounded-2xl font-bold bg-red-500 hover:bg-red-600 text-white transition-colors inline-flex items-center justify-center"
              :class="deleteModal.deleting ? 'opacity-50 cursor-not-allowed' : ''">
              {{ deleteModal.deleting ? 'Видалення...' : 'Так, видалити' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
useHead({ title: 'Діючі речовини — Адмін' })
definePageMeta({ layout: 'admin', middleware: 'admin' })

const supabase = useSupabaseClient()

const LIMIT = 40
const search = ref('')
const page = ref(1)
const total = ref(0)
const items = ref<any[]>([])
const loading = ref(true)

const totalPages = computed(() => Math.ceil(total.value / LIMIT))

let searchTimer: ReturnType<typeof setTimeout>
const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; load() }, 300)
}

const changePage = (p: number) => {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  load()
}

const load = async () => {
  loading.value = true
  let q = supabase.from('agro_active_ingredients')
    .select('*, agro_product_ingredients(count)', { count: 'exact' })

  if (search.value) q = q.ilike('name', `%${search.value}%`)

  const offset = (page.value - 1) * LIMIT
  const { data, count, error } = await q
    .range(offset, offset + LIMIT - 1)
    .order('name')

  if (!error) {
    items.value = (data || []).map((r: any) => ({
      ...r,
      product_count: r.agro_product_ingredients?.[0]?.count ?? 0,
    }))
    total.value = count ?? 0
  }
  loading.value = false
}

// Парсинг і серіалізація description (зберігає зворотну сумісність з поточним форматом)
const FIELD_KEYS: Record<string, string> = {
  latin:     'Латинська назва',
  chem_class:'Хімічний клас',
  mechanism: 'Механізм дії',
  group:     'Група',
}

const parseDescription = (desc: string | null) => {
  const result: Record<string, string> = { latin: '', chem_class: '', mechanism: '', group: '', notes: '' }
  if (!desc) return result
  const lines = desc.split('\n')
  const extras: string[] = []
  for (const line of lines) {
    const idx = line.indexOf(': ')
    if (idx === -1) { extras.push(line); continue }
    const key = line.slice(0, idx)
    const val = line.slice(idx + 2).trim()
    const field = Object.entries(FIELD_KEYS).find(([, label]) => label === key)?.[0]
    if (field) result[field] = val
    else extras.push(line)
  }
  result.notes = extras.join('\n').trim()
  return result
}

const serializeDescription = (form: typeof modal.form): string => {
  const parts: string[] = []
  if (form.latin)     parts.push(`Латинська назва: ${form.latin}`)
  if (form.chem_class) parts.push(`Хімічний клас: ${form.chem_class}`)
  if (form.mechanism) parts.push(`Механізм дії: ${form.mechanism}`)
  if (form.group)     parts.push(`Група: ${form.group}`)
  if (form.notes)     parts.push(form.notes)
  return parts.join('\n')
}

// Модалка редагування
const modal = reactive({
  show: false,
  isNew: false,
  saving: false,
  id: null as string | null,
  form: { name: '', slug: '', latin: '', chem_class: '', mechanism: '', group: '', notes: '' },
})

const autoSlug = () => {
  if (!modal.isNew) return
  modal.form.slug = modal.form.name
    .toLowerCase()
    .replace(/[аеєиіїоуюяьъ]/g, (c: string) => ({а:'a',е:'e',є:'ye',и:'y',і:'i',ї:'yi',о:'o',у:'u',ю:'yu',я:'ya',ь:'',ъ:''}[c] || c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const openModal = (item: any) => {
  modal.isNew = !item
  modal.id = item?.id ?? null
  const parsed = parseDescription(item?.description ?? null)
  modal.form = {
    name:      item?.name ?? '',
    slug:      item?.slug ?? '',
    latin:     parsed.latin,
    chem_class: parsed.chem_class,
    mechanism: parsed.mechanism,
    group:     parsed.group,
    notes:     parsed.notes,
  }
  modal.show = true
}

const save = async () => {
  if (!modal.form.name || !modal.form.slug) return
  modal.saving = true
  const payload = {
    name:        modal.form.name.trim(),
    slug:        modal.form.slug.trim(),
    description: serializeDescription(modal.form) || null,
  }

  if (modal.isNew) {
    const { data: row } = await supabase.from('agro_active_ingredients').insert(payload).select().single()
    if (row) items.value.unshift({ ...(row as any), product_count: 0 })
    total.value++
  } else {
    await supabase.from('agro_active_ingredients').update(payload).eq('id', modal.id)
    const idx = items.value.findIndex(r => r.id === modal.id)
    if (idx !== -1) items.value[idx] = { ...items.value[idx], ...payload }
  }

  modal.saving = false
  modal.show = false
}

// Drawer препаратів
const productsDrawer = reactive({
  show: false,
  loading: false,
  ingredient: null as any,
  products: [] as any[],
})

const openProducts = async (item: any) => {
  productsDrawer.ingredient = item
  productsDrawer.products = []
  productsDrawer.loading = true
  productsDrawer.show = true

  // Використовуємо server API (той самий шлях що вже працює на сторінці /ingredient/[slug])
  try {
    const data = await $fetch<any>('/api/agro', {
      query: { path: `/v1/active-ingredients/${item.slug}` }
    })
    productsDrawer.products = (data.products || []).map((p: any) => ({
      ...p,
      concentration: p.concentration || null,
    }))
  } catch (e) {
    console.error('openProducts error:', e)
  }
  productsDrawer.loading = false
}

// Модалка видалення
const deleteModal = reactive({
  show: false,
  deleting: false,
  item: null as any,
  count: 0,
})

const confirmDelete = async (item: any) => {
  deleteModal.item = item
  deleteModal.count = item.product_count ?? 0
  deleteModal.show = true
}

const doDelete = async () => {
  if (!deleteModal.item) return
  deleteModal.deleting = true
  // Видаляємо зв'язки з товарами
  await supabase.from('agro_product_ingredients').delete().eq('ingredient_id', deleteModal.item.id)
  // Видаляємо речовину
  await supabase.from('agro_active_ingredients').delete().eq('id', deleteModal.item.id)
  items.value = items.value.filter(r => r.id !== deleteModal.item.id)
  total.value--
  deleteModal.deleting = false
  deleteModal.show = false
}

onMounted(load)
</script>

<style scoped>
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.25s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
