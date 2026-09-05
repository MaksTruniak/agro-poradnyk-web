<template>
  <div class="p-8">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        Категорії
      </h1>
      <p class="text-agro-light mt-1">Управління категоріями товарів у каталозі</p>
    </div>

    <!-- Вкладки -->
    <div class="flex gap-1 mb-6 bg-agro-bg rounded-2xl p-1 w-fit">
      <button v-for="tab in TABS" :key="tab.key"
        @click="activeTab = tab.key"
        class="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        :class="activeTab === tab.key ? 'bg-white text-agro-dark shadow-sm' : 'text-agro-light hover:text-agro-dark'">
        {{ tab.label }}
      </button>
    </div>

    <div class="flex justify-end mb-4">
      <button @click="openModal(null)" class="btn-primary text-sm py-2 px-4 inline-flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати категорію
      </button>
    </div>

    <div v-if="loading" class="card overflow-hidden p-0">
      <div v-for="i in 6" :key="i" class="flex items-center gap-4 px-5 py-4 border-b border-agro-border animate-pulse">
        <div class="w-9 h-9 bg-agro-bg rounded-xl shrink-0"></div>
        <div class="flex-1"><div class="h-4 bg-agro-bg rounded w-1/3 mb-1.5"></div><div class="h-3 bg-agro-bg rounded w-1/5"></div></div>
        <div class="w-16 h-6 bg-agro-bg rounded-full"></div>
      </div>
    </div>

    <div v-else class="card overflow-hidden p-0">
      <div class="divide-y divide-agro-border">
        <div v-for="cat in currentList" :key="cat.slug"
          class="flex items-center gap-4 px-5 py-4 transition-colors"
          :class="cat.is_active === false ? 'bg-gray-50 opacity-60' : 'hover:bg-agro-bg'">
          <div class="w-9 h-9 rounded-xl bg-agro-hover flex items-center justify-center shrink-0" v-html="iconFor(cat.slug)"></div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-agro-dark">{{ cat.name }}</p>
            <p class="text-xs text-agro-light font-mono">{{ cat.slug }}</p>
          </div>
          <span class="shrink-0 text-sm font-bold text-agro-dark tabular-nums">{{ cat.count ?? 0 }}</span>
          <span class="shrink-0 text-xs text-agro-light">товарів</span>
          <span v-if="cat.is_active === false" class="shrink-0 text-xs bg-gray-100 text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">Приховано</span>
          <button @click="openModal(cat)" class="shrink-0 text-xs text-agro border border-agro-border hover:bg-agro-hover rounded-xl px-3 py-1.5 transition-colors inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Редагувати
          </button>
        </div>
      </div>
      <div v-if="!currentList.length" class="text-center py-12 text-agro-light text-sm">Немає категорій</div>
    </div>
  </div>

  <!-- Модалка -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20" @click.self="modal.show = false">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md">
          <div class="px-6 pt-6 pb-4 border-b border-agro-border flex items-center justify-between">
            <h3 class="font-bold text-agro-dark text-lg">{{ modal.isNew ? 'Нова категорія' : 'Редагувати категорію' }}</h3>
            <button @click="modal.show = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-agro-hover text-agro-light">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Назва <span class="text-red-400">*</span></label>
                <input v-model="modal.form.name" class="input text-sm" placeholder="Гербіциди" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Slug <span class="text-red-400">*</span></label>
                <input v-model="modal.form.slug" class="input text-sm font-mono" placeholder="herbicide"
                  :disabled="!modal.isNew" :class="!modal.isNew ? 'opacity-50' : ''" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-agro-dark mb-1">Опис</label>
              <input v-model="modal.form.description" class="input text-sm" placeholder="Короткий опис категорії" />
            </div>

            <div class="rounded-2xl border border-agro-border px-4 py-3 flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-agro-dark">Показувати у каталозі</p>
                <p class="text-xs text-agro-light mt-0.5">Якщо вимкнено — категорія прихована</p>
              </div>
              <button type="button" @click="modal.form.is_active = !modal.form.is_active"
                class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200"
                :class="modal.form.is_active ? 'bg-agro' : 'bg-gray-200'">
                <span class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200"
                  :class="modal.form.is_active ? 'translate-x-5' : 'translate-x-0'" />
              </button>
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
</template>

<script setup lang="ts">
useHead({ title: 'Категорії — Адмін' })
definePageMeta({ layout: 'admin', middleware: 'admin' })

const supabase = useSupabaseClient()

const TABS = [
  { key: 'pesticide', label: 'Пестициди' },
  { key: 'bio',       label: 'Біопрепарати' },
  { key: 'fertilizer', label: 'Добрива' },
] as const
type TabKey = typeof TABS[number]['key']

const activeTab = ref<TabKey>('pesticide')
const loading = ref(true)

// Вбудовані дефолти (icons + назви)
const PESTICIDE_DEFAULTS: Record<string, { name: string; icon: string }> = {
  herbicide:        { name: 'Гербіциди',        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 7 9 5 5c4 0 6 2 7 7z"/><path d="M12 12c0 0 5-3 7-7-4 0-6 2-7 7z"/></svg>' },
  fungicide:        { name: 'Фунгіциди',        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>' },
  insecticide:      { name: 'Інсектициди',      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="13" rx="5" ry="6"/><path d="M12 7V3"/><path d="M7 14H4M20 14h-3"/></svg>' },
  acaricide:        { name: 'Акарициди',        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="13" rx="5" ry="6"/><path d="M12 7V3"/><path d="M7 14H4M20 14h-3"/></svg>' },
  seed_treatment:   { name: 'Протруйники',      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
  rodenticide:      { name: 'Родентициди',      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>' },
  growth_regulator: { name: 'Регулятори росту', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>' },
  retardant:        { name: 'Ретарданти',       icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>' },
  desiccant:        { name: 'Десиканти',        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>' },
  adjuvant:         { name: "Ад'юванти / ПАР",  icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6m-3 0v6l4 8H8l4-8V3"/></svg>' },
  fumigant:         { name: 'Фуміганти',        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/></svg>' },
}

const BIO_DEFAULTS: Record<string, { name: string; icon: string }> = {
  bio_product:          { name: 'Мікробні та гумінові', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22l10-10"/><path d="M16 8c0-4-3-6-7-6C5 2 2 7 2 12c0 0 4-1 7-4 1.5 3 5 6 9 6 0-2-1-5-2-6z"/></svg>' },
  biostimulator:        { name: 'Біостимулятори',       icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 7 9 5 5c4 0 6 2 7 7z"/><path d="M12 12c0 0 5-3 7-7-4 0-6 2-7 7z"/></svg>' },
  biofungicide:         { name: 'Біофунгіциди',         icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
  biological_fungicide: { name: 'Біофунгіциди біол.',   icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
  inoculant:            { name: 'Інокулянти',           icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>' },
}

const FERTILIZER_DEFAULTS: Record<string, { name: string; icon: string }> = {
  azotni:       { name: 'Азотні',       icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>' },
  kaliyni:      { name: 'Калійні',      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>' },
  kompleksni:   { name: 'Комплексні',   icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' },
  mikrodobriva: { name: 'Мікродобрива', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>' },
  fosforni:     { name: 'Фосфорні',     icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6m-3 0v6l4 8H8l4-8V3"/></svg>' },
}

const DEFAULTS_BY_SECTION: Record<TabKey, Record<string, { name: string; icon: string }>> = {
  pesticide:  PESTICIDE_DEFAULTS,
  bio:        BIO_DEFAULTS,
  fertilizer: FERTILIZER_DEFAULTS,
}

const DEFAULT_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'

const iconFor = (slug: string) => {
  return DEFAULTS_BY_SECTION[activeTab.value]?.[slug]?.icon || DEFAULT_ICON
}

// Дані по секціях
const data = reactive<Record<TabKey, any[]>>({
  pesticide:  [],
  bio:        [],
  fertilizer: [],
})

const currentList = computed(() => data[activeTab.value])

const modal = reactive({
  show: false,
  isNew: false,
  saving: false,
  id: null as string | null,
  form: { slug: '', name: '', description: '', is_active: true },
})

const openModal = (cat: any) => {
  modal.isNew = !cat
  modal.id = cat?.id ?? null
  modal.form = {
    slug: cat?.slug ?? '',
    name: cat?.name ?? '',
    description: cat?.description ?? '',
    is_active: cat?.is_active !== false,
  }
  modal.show = true
}

const save = async () => {
  if (!modal.form.name || !modal.form.slug) return
  modal.saving = true
  const payload = { ...modal.form, section: activeTab.value }

  if (modal.isNew) {
    const { data: row } = await supabase.from('agro_categories').insert(payload).select().single()
    if (row) {
      data[activeTab.value].push({ ...(row as any), count: 0 })
    }
  } else {
    await supabase.from('agro_categories').update(payload).eq('id', modal.id)
    const list = data[activeTab.value]
    const idx = list.findIndex(c => c.id === modal.id)
    if (idx !== -1) list[idx] = { ...list[idx], ...payload }
  }

  modal.saving = false
  modal.show = false
}

// Завантаження і підрахунок
const loadSection = async (section: TabKey) => {
  const defaults = DEFAULTS_BY_SECTION[section]
  const defaultSlugs = Object.keys(defaults)

  // Рахуємо товари
  const countMap: Record<string, number> = {}
  if (section === 'fertilizer') {
    await Promise.all(defaultSlugs.map(async (slug) => {
      const { count } = await supabase
        .from('agro_fertilizers')
        .select('id', { count: 'exact', head: true })
        .eq('category_slug', slug)
      countMap[slug] = count ?? 0
    }))
  } else {
    await Promise.all(defaultSlugs.map(async (slug) => {
      const { count } = await supabase
        .from('agro_products')
        .select('id', { count: 'exact', head: true })
        .eq('type', slug)
      countMap[slug] = count ?? 0
    }))
  }

  // З таблиці agro_categories
  const { data: rows, error } = await supabase
    .from('agro_categories')
    .select('*')
    .eq('section', section)
    .order('sort_order')
    .order('name')

  if (!error && rows?.length) {
    // Є записи в БД — додаємо count і можливі дефолти яких немає в БД
    const dbSlugs = new Set((rows as any[]).map(r => r.slug))
    const merged = (rows as any[]).map(r => ({ ...r, count: countMap[r.slug] ?? 0 }))
    // Додаємо дефолти яких немає в БД
    for (const slug of defaultSlugs) {
      if (!dbSlugs.has(slug)) {
        merged.push({ id: null, section, slug, name: defaults[slug].name, description: '', is_active: true, count: countMap[slug] ?? 0 })
      }
    }
    data[section] = merged
  } else {
    // Немає в БД — показуємо дефолти
    data[section] = defaultSlugs.map(slug => ({
      id: null,
      section,
      slug,
      name: defaults[slug].name,
      description: '',
      is_active: true,
      count: countMap[slug] ?? 0,
    }))
  }
}

onMounted(async () => {
  await loadSection('pesticide')
  loading.value = false
  // Завантажуємо решту у фоні
  loadSection('bio')
  loadSection('fertilizer')
})
</script>
