<template>
  <div class="p-8">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Хвороби рослин
      </h1>
      <p class="text-agro-light mt-1">{{ total }} записів у базі</p>
    </div>

    <div class="flex items-center gap-3 mb-5">
      <div class="relative flex-1 max-w-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input v-model="search" @input="onSearch" class="input pl-9 text-sm" placeholder="Пошук за назвою..." />
      </div>
      <button @click="openModal(null)" class="btn-primary text-sm py-2 px-4 inline-flex items-center gap-1.5 shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати
      </button>
    </div>

    <div v-if="loading && !items.length" class="card overflow-hidden p-0">
      <div v-for="i in 12" :key="i" class="flex items-center gap-4 px-5 py-3.5 border-b border-agro-border animate-pulse">
        <div class="w-10 h-10 rounded-xl bg-agro-bg shrink-0"></div>
        <div class="flex-1"><div class="h-4 bg-agro-bg rounded w-1/3 mb-1.5"></div><div class="h-3 bg-agro-bg rounded w-1/5"></div></div>
      </div>
    </div>

    <div v-else class="card overflow-hidden p-0">
      <div class="divide-y divide-agro-border">
        <div v-for="item in items" :key="item.id" class="flex items-center gap-3 px-5 py-3 hover:bg-agro-bg transition-colors">
          <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center shrink-0 overflow-hidden">
            <img v-if="item.source_image_url" :src="item.source_image_url" class="w-full h-full object-contain p-1" @error="($event.target as HTMLImageElement).style.display='none'" />
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(107,122,100)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-agro-dark truncate text-sm">{{ item.name }}</p>
            <p class="text-xs text-agro-light truncate">{{ diseaseCategories.find(c => c.slug === item.category_slug)?.name || item.category_slug || item.slug }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button @click="openProducts(item)" class="text-xs text-agro-light border border-agro-border hover:bg-agro-hover hover:text-agro rounded-xl px-3 py-1.5 transition-colors inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Фунгіциди
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

    <div v-if="totalPages > 1" class="flex items-center justify-between mt-4">
      <p class="text-sm text-agro-light">Сторінка {{ page }} з {{ totalPages }}</p>
      <div class="flex gap-2">
        <button @click="changePage(page - 1)" :disabled="page === 1" class="btn-outline text-sm py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed">← Назад</button>
        <button @click="changePage(page + 1)" :disabled="page >= totalPages" class="btn-outline text-sm py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed">Далі →</button>
      </div>
    </div>
  </div>

  <!-- Drawer: препарати -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="drawer.show" class="fixed inset-0 z-50 flex justify-end bg-black/20" @click.self="drawer.show = false">
        <div class="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
          <div class="px-6 pt-6 pb-4 border-b border-agro-border flex items-start justify-between gap-3 shrink-0">
            <div>
              <p class="text-xs text-agro-light mb-0.5">Хвороба</p>
              <h3 class="font-bold text-agro-dark text-lg leading-tight">{{ drawer.item?.name }}</h3>
              <p v-if="drawer.item?.latin_name" class="text-xs text-agro-light italic mt-0.5">{{ drawer.item.latin_name }}</p>
            </div>
            <button @click="drawer.show = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-agro-hover text-agro-light shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto">
            <div v-if="drawer.loading" class="p-6 space-y-3">
              <div v-for="i in 4" :key="i" class="flex gap-3 animate-pulse">
                <div class="w-10 h-10 rounded-xl bg-agro-bg shrink-0"></div>
                <div class="flex-1 pt-1"><div class="h-4 bg-agro-bg rounded w-3/4 mb-2"></div><div class="h-3 bg-agro-bg rounded w-1/2"></div></div>
              </div>
            </div>
            <div v-else-if="drawer.products.length" class="divide-y divide-agro-border">
              <div v-for="p in drawer.products" :key="p.id" class="flex items-center gap-3 px-6 py-3.5 hover:bg-agro-bg transition-colors">
                <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center shrink-0 overflow-hidden">
                  <img v-if="p.source_image_url" :src="p.source_image_url" class="w-full h-full object-contain p-1" @error="($event.target as HTMLImageElement).style.display='none'" />
                  <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgb(107,122,100)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-agro-dark text-sm truncate">{{ p.name }}</p>
                  <p v-if="p.agro_manufacturers?.name" class="text-xs text-agro-light truncate">{{ p.agro_manufacturers.name }}</p>
                </div>
                <NuxtLink :to="`/pesticides/${p.slug}`" target="_blank" class="shrink-0 w-7 h-7 flex items-center justify-center rounded-xl hover:bg-agro-hover text-agro-light transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </NuxtLink>
              </div>
            </div>
            <div v-else class="p-6 text-center text-agro-light text-sm">Немає прив'язаних препаратів</div>
          </div>
          <div class="px-6 py-4 border-t border-agro-border shrink-0">
            <p class="text-xs text-agro-light">{{ drawer.products.length }} препаратів проти цієї хвороби</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Модалка редагування -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20" @click.self="modal.show = false">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-agro-border flex items-center justify-between">
            <h3 class="font-bold text-agro-dark text-lg">{{ modal.isNew ? 'Нова хвороба' : 'Редагувати' }}</h3>
            <button @click="modal.show = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-agro-hover text-agro-light">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Назва <span class="text-red-400">*</span></label>
                <input v-model="modal.form.name" @input="autoSlug" class="input text-sm" placeholder="Борошниста роса" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Slug <span class="text-red-400">*</span></label>
                <div class="flex gap-1.5">
                  <input v-model="modal.form.slug" class="input text-sm font-mono flex-1 min-w-0" />
                  <button type="button" @click="modal.form.slug = toSlug(modal.form.name)" title="Згенерувати з назви"
                    class="shrink-0 px-2 rounded-xl border border-agro-border hover:bg-agro-hover text-agro-light transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Латинська назва</label>
                <input v-model="modal.form.latin_name" class="input text-sm italic" placeholder="Erysiphe graminis" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Збудник</label>
                <input v-model="modal.form.pathogen" class="input text-sm" placeholder="Гриб Blumeria graminis" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Культура</label>
                <input v-model="modal.form.culture" class="input text-sm" placeholder="Пшениця" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Категорія</label>
                <select v-model="modal.form.category_slug" class="input text-sm">
                  <option value="">— не вибрано —</option>
                  <option v-for="cat in diseaseCategories" :key="cat.slug" :value="cat.slug">{{ cat.name }}</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-agro-dark mb-1">URL фото</label>
              <input v-model="modal.form.source_image_url" class="input text-sm" placeholder="https://..." />
            </div>
            <div>
              <label class="block text-xs font-semibold text-agro-dark mb-1">Опис</label>
              <textarea v-model="modal.form.description" class="input text-sm resize-none" rows="3" />
            </div>
          </div>
          <div class="px-6 pb-6 space-y-3">
            <p v-if="saveError" class="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{{ saveError }}</p>
            <div class="flex gap-3">
              <button @click="modal.show = false" class="btn-outline flex-1 text-sm py-2.5">Скасувати</button>
              <button @click="save" :disabled="modal.saving || !modal.form.name || !modal.form.slug"
                class="btn-primary flex-1 text-sm py-2.5 inline-flex items-center justify-center"
                :class="(modal.saving || !modal.form.name || !modal.form.slug) ? 'opacity-50 cursor-not-allowed' : ''">
                {{ modal.saving ? 'Збереження...' : 'Зберегти' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Підтвердження видалення -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="deleteModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20" @click.self="deleteModal.show = false">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
          <div class="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(179,69,47)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </div>
          <p class="font-bold text-agro-dark text-lg mb-1">Видалити хворобу?</p>
          <p class="text-agro-light text-sm mb-6">«{{ deleteModal.item?.name }}»</p>
          <div class="flex gap-3">
            <button @click="deleteModal.show = false" class="btn-outline flex-1 text-sm py-2.5">Скасувати</button>
            <button @click="doDelete" :disabled="deleteModal.deleting"
              class="flex-1 text-sm py-2.5 rounded-2xl font-bold bg-red-500 hover:bg-red-600 text-white transition-colors"
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
useHead({ title: 'Хвороби — Адмін' })
definePageMeta({ layout: 'admin', middleware: 'admin' })

const supabase = useSupabaseClient()
const api = useAgroApi()
const diseaseCategories = ref<{ slug: string; name: string }[]>([])
const LIMIT = 40
const search = ref('')
const page = ref(1)
const total = ref(0)
const items = ref<any[]>([])
const loading = ref(true)
const totalPages = computed(() => Math.ceil(total.value / LIMIT))

let searchTimer: ReturnType<typeof setTimeout>
const onSearch = () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { page.value = 1; load() }, 300) }
const changePage = (p: number) => { if (p < 1 || p > totalPages.value) return; page.value = p; load() }

const load = async () => {
  loading.value = true
  const { items: data, total: t } = await api.getDiseases({ q: search.value || undefined, limit: LIMIT, offset: (page.value - 1) * LIMIT })
  items.value = data
  total.value = t
  loading.value = false
}

const emptyForm = () => ({ name: '', slug: '', latin_name: '', pathogen: '', culture: '', category_slug: '', source_image_url: '', description: '' })

const modal = reactive({ show: false, isNew: false, saving: false, id: null as string | null, form: emptyForm() })

const TRANSLIT: Record<string, string> = { а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ye',ж:'zh',з:'z',и:'y',і:'i',ї:'yi',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'yu',я:'ya' }
const toSlug = (s: string) => s.toLowerCase().split('').map(c => TRANSLIT[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const autoSlug = () => { if (modal.isNew) modal.form.slug = toSlug(modal.form.name) }

const openModal = (item: any) => {
  modal.isNew = !item
  modal.id = item?.id ?? null
  modal.form = item ? { name: item.name ?? '', slug: item.slug ?? '', latin_name: item.latin_name ?? '', pathogen: item.pathogen ?? '', culture: item.culture ?? '', category_slug: item.category_slug ?? '', source_image_url: item.source_image_url ?? '', description: item.description ?? '' } : emptyForm()
  modal.show = true
}

const saveError = ref('')
const save = async () => {
  if (!modal.form.name || !modal.form.slug) return
  modal.saving = true
  saveError.value = ''
  const payload = { ...modal.form }
  if (modal.isNew) {
    const { data, error } = await supabase.from('agro_diseases').insert(payload).select().single()
    if (error) { saveError.value = error.message; modal.saving = false; return }
    if (data) { items.value.unshift(data as any); total.value++ }
  } else {
    const { error } = await supabase.from('agro_diseases').update(payload).eq('id', modal.id)
    if (error) { saveError.value = error.message; modal.saving = false; return }
    const idx = items.value.findIndex(r => r.id === modal.id)
    if (idx !== -1) items.value[idx] = { ...items.value[idx], ...payload }
  }
  modal.saving = false
  modal.show = false
}

const drawer = reactive({ show: false, loading: false, item: null as any, products: [] as any[] })

const openProducts = async (item: any) => {
  drawer.item = item
  drawer.products = []
  drawer.loading = true
  drawer.show = true
  try {
    const data = await api.getDisease(item.slug)
    drawer.products = data.disease?.products || []
  } catch {}
  drawer.loading = false
}

const deleteModal = reactive({ show: false, deleting: false, item: null as any })
const confirmDelete = (item: any) => { deleteModal.item = item; deleteModal.show = true }
const doDelete = async () => {
  deleteModal.deleting = true
  await supabase.from('agro_disease_products').delete().eq('disease_id', deleteModal.item.id)
  await supabase.from('agro_diseases').delete().eq('id', deleteModal.item.id)
  items.value = items.value.filter(r => r.id !== deleteModal.item.id)
  total.value--
  deleteModal.deleting = false
  deleteModal.show = false
}

onMounted(async () => {
  const { data } = await supabase.from('agro_categories').select('slug, name').eq('section', 'diseases').eq('is_active', true).order('sort_order')
  diseaseCategories.value = data || []
  load()
})
</script>
