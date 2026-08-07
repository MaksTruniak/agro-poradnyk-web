<template>
  <div class="p-8">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
        Товари
      </h1>
      <p class="text-agro-light mt-1">{{ total }} товарів у базі</p>
    </div>

    <!-- Фільтри -->
    <div class="flex flex-wrap gap-3 mb-4">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input v-model="search" @input="onSearch" class="input pl-9 text-sm" placeholder="Пошук за назвою..." />
      </div>
      <select v-model="typeFilter" @change="load(1)" class="input text-sm w-auto pr-8">
        <option value="">Всі типи</option>
        <option v-for="t in TYPES" :key="t.slug" :value="t.slug">{{ t.name }}</option>
      </select>
      <button @click="openModal(null)" class="btn-primary text-sm py-2 px-4 inline-flex items-center gap-1.5 ml-auto shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати товар
      </button>
    </div>

    <!-- Таблиця -->
    <div v-if="loading" class="card overflow-hidden p-0">
      <div v-for="i in 10" :key="i" class="flex items-center gap-4 px-5 py-3 border-b border-agro-border animate-pulse">
        <div class="w-10 h-10 rounded-xl bg-agro-bg shrink-0"></div>
        <div class="flex-1"><div class="h-4 bg-agro-bg rounded w-2/5 mb-1.5"></div><div class="h-3 bg-agro-bg rounded w-1/4"></div></div>
        <div class="w-20 h-6 bg-agro-bg rounded-full"></div>
      </div>
    </div>

    <div v-else class="card overflow-hidden p-0">
      <div class="divide-y divide-agro-border">
        <div v-for="p in items" :key="p.id" class="flex items-center gap-4 px-5 py-3 hover:bg-agro-bg transition-colors">
          <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center shrink-0 overflow-hidden">
            <img v-if="p.source_image_url" :src="p.source_image_url" :alt="p.name" class="w-full h-full object-contain p-0.5" @error="($event.target as HTMLImageElement).style.display='none'" />
            <span v-else class="text-lg">{{ TYPE_EMOJI[p.type] || '🌿' }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-agro-dark truncate">{{ p.name }}</p>
            <p class="text-xs text-agro-light truncate">{{ p.agro_manufacturers?.name || '—' }} · {{ p.slug }}</p>
          </div>
          <span class="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
            :class="TYPE_COLORS[p.type] || 'bg-gray-100 text-gray-600'">
            {{ TYPE_LABELS[p.type] || p.type }}
          </span>
          <button @click="openModal(p)" class="shrink-0 text-xs text-agro border border-agro-border hover:bg-agro-hover rounded-xl px-3 py-1.5 transition-colors inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Редагувати
          </button>
        </div>
      </div>
      <div v-if="!items.length" class="text-center py-12 text-agro-light text-sm">Нічого не знайдено</div>
    </div>

    <!-- Пагінація -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-5">
      <button @click="load(page - 1)" :disabled="page === 1" class="btn-outline text-sm py-1.5 px-3 disabled:opacity-40">←</button>
      <span class="text-sm text-agro-light">{{ page }} / {{ totalPages }}</span>
      <button @click="load(page + 1)" :disabled="page === totalPages" class="btn-outline text-sm py-1.5 px-3 disabled:opacity-40">→</button>
    </div>
  </div>

  <!-- Модалка -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="modal.show = false">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
          <div class="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-agro-border">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-agro-dark text-lg">{{ modal.isNew ? 'Додати товар' : 'Редагувати товар' }}</h3>
              <button @click="modal.show = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-agro-hover text-agro-light">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div class="p-6 space-y-4">
            <!-- Зображення -->
            <div>
              <label class="block text-xs font-semibold text-agro-dark mb-2">Зображення</label>
              <div class="flex items-center gap-4">
                <div class="w-20 h-20 rounded-2xl bg-agro-hover flex items-center justify-center shrink-0 overflow-hidden border-2 border-dashed border-agro-border">
                  <img v-if="modal.imgPreview || modal.form.source_image_url" :src="modal.imgPreview || modal.form.source_image_url" class="w-full h-full object-contain p-1.5" @error="($event.target as HTMLImageElement).style.display='none'" />
                  <span v-else class="text-3xl">{{ TYPE_EMOJI[modal.form.type] || '🌿' }}</span>
                </div>
                <div class="flex-1">
                  <label class="cursor-pointer inline-flex items-center gap-1.5 text-sm font-medium text-agro border border-agro-border rounded-xl px-4 py-2 hover:bg-agro-hover transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    {{ modal.imgFile ? modal.imgFile.name : 'Завантажити фото' }}
                    <input type="file" accept="image/*" class="hidden" @change="onImgFile" />
                  </label>
                  <p v-if="modal.imgFile" class="text-xs text-agro-light mt-1">{{ (modal.imgFile.size / 1024).toFixed(0) }} KB</p>
                  <p v-else class="text-xs text-agro-light mt-1">PNG, JPG, WebP до 5 MB</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Назва <span class="text-red-400">*</span></label>
                <input v-model="modal.form.name" class="input text-sm" placeholder="Раундап" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Slug</label>
                <input v-model="modal.form.slug" class="input text-sm font-mono" placeholder="roundup" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Тип <span class="text-red-400">*</span></label>
                <select v-model="modal.form.type" class="input text-sm">
                  <option value="">— обрати —</option>
                  <option v-for="t in TYPES" :key="t.slug" :value="t.slug">{{ t.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Виробник</label>
                <select v-model="modal.form.manufacturer_slug" class="input text-sm">
                  <option value="">— без виробника —</option>
                  <option v-for="b in brands" :key="b.slug" :value="b.slug">{{ b.name }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Хімічний клас</label>
                <input v-model="modal.form.chem_class" class="input text-sm" placeholder="Гліфосати" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Форма випуску</label>
                <select v-model="modal.form.formulation_name" class="input text-sm">
                  <option value="">— не вказано —</option>
                  <optgroup label="Рідкі">
                    <option value="ВР">ВР — водний розчин</option>
                    <option value="КЕ">КЕ — концентрат емульсії</option>
                    <option value="КС">КС — концентрат суспензії</option>
                    <option value="МЕ">МЕ — мікроемульсія</option>
                    <option value="СЕ">СЕ — суспо-емульсія</option>
                    <option value="ОД">ОД — олійна дисперсія</option>
                    <option value="ЕВ">ЕВ — емульсія вода в олії</option>
                  </optgroup>
                  <optgroup label="Тверді / порошки">
                    <option value="ВДГ">ВДГ — водно-диспергований гранулят</option>
                    <option value="ВГ">ВГ — водорозчинні гранули</option>
                    <option value="ЗП">ЗП — змочуваний порошок</option>
                    <option value="СП">СП — смочуваний порошок</option>
                    <option value="ВП">ВП — водорозчинний порошок</option>
                    <option value="ГР">ГР — гранули</option>
                    <option value="ТАБ">ТАБ — таблетки</option>
                    <option value="КД">КД — капсульна дисперсія</option>
                  </optgroup>
                  <optgroup label="Спеціальні">
                    <option value="ТН">ТН — текучий концентрат</option>
                    <option value="РКД">РКД — рідке комплексне добриво</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-agro-dark mb-1">Норма внесення / дозування</label>
              <input v-model="modal.form.dosage" class="input text-sm" placeholder="1–3 л/га" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-agro-dark mb-1">Опис</label>
              <textarea v-model="modal.form.description" class="input text-sm resize-none" rows="4" placeholder="Коротко про препарат..." />
            </div>

            <div>
              <label class="block text-xs font-semibold text-agro-dark mb-1">Культури (через кому)</label>
              <input v-model="modal.form.crops_str" class="input text-sm" placeholder="Пшениця, Кукурудза, Соняшник" />
            </div>
          </div>

          <div class="px-6 pb-6 flex gap-3">
            <button @click="modal.show = false" class="btn-outline flex-1 text-sm py-2.5">Скасувати</button>
            <button @click="save" :disabled="modal.saving || !modal.form.name || !modal.form.type"
              class="btn-primary flex-1 text-sm py-2.5 inline-flex items-center justify-center gap-1.5"
              :class="(modal.saving || !modal.form.name || !modal.form.type) ? 'opacity-50 cursor-not-allowed' : ''">
              <svg v-if="!modal.saving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v14a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              {{ modal.saving ? 'Збереження...' : 'Зберегти' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
useHead({ title: 'Товари — Адмін' })
definePageMeta({ layout: 'admin', middleware: 'admin' })

const supabase = useSupabaseClient()
const loading = ref(true)
const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const PER_PAGE = 30
const search = ref('')
const typeFilter = ref('')
const brands = ref<any[]>([])
let searchTimer: ReturnType<typeof setTimeout>

const totalPages = computed(() => Math.ceil(total.value / PER_PAGE))

const TYPES = [
  { slug: 'herbicide', name: 'Гербіциди' },
  { slug: 'fungicide', name: 'Фунгіциди' },
  { slug: 'insecticide', name: 'Інсектициди' },
  { slug: 'seed_treatment', name: 'Протруйники' },
  { slug: 'growth_regulator', name: 'Регулятори росту' },
  { slug: 'rodenticide', name: 'Родентициди' },
  { slug: 'fertilizer', name: 'Добрива' },
  { slug: 'bio_product', name: 'Біопрепарати' },
]

const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPES.map(t => [t.slug, t.name]))
const TYPE_EMOJI: Record<string, string> = {
  herbicide: '🌿', fungicide: '🍄', insecticide: '🐛', seed_treatment: '🌱',
  growth_regulator: '📈', rodenticide: '🐀', fertilizer: '💧', bio_product: '🧪',
}
const TYPE_COLORS: Record<string, string> = {
  herbicide: 'bg-green-50 text-green-700',
  fungicide: 'bg-orange-50 text-orange-700',
  insecticide: 'bg-red-50 text-red-700',
  seed_treatment: 'bg-blue-50 text-blue-700',
  growth_regulator: 'bg-purple-50 text-purple-700',
  rodenticide: 'bg-gray-100 text-gray-600',
  fertilizer: 'bg-cyan-50 text-cyan-700',
  bio_product: 'bg-emerald-50 text-emerald-700',
}

const modal = reactive({
  show: false,
  isNew: false,
  saving: false,
  id: null as string | null,
  detailsId: null as string | null,
  imgFile: null as File | null,
  imgPreview: '',
  form: {
    name: '', slug: '', type: '', manufacturer_slug: '',
    source_image_url: '', chem_class: '', formulation_name: '', dosage: '', description: '', crops_str: '',
  },
})

const onImgFile = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  modal.imgFile = file
  modal.imgPreview = URL.createObjectURL(file)
}

const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(1), 350)
}

const load = async (p = 1) => {
  loading.value = true
  page.value = p
  const from = (p - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let q = supabase.from('agro_products')
    .select('id, name, slug, type, source_image_url, manufacturer_slug, agro_manufacturers(name)', { count: 'exact' })
    .order('name').range(from, to)

  if (search.value.trim()) q = q.ilike('name', `%${search.value.trim()}%`)
  if (typeFilter.value) q = q.eq('type', typeFilter.value)

  const { data, count } = await q
  items.value = data || []
  total.value = count || 0
  loading.value = false
}

const openModal = async (product: any) => {
  modal.isNew = !product
  modal.id = product?.id ?? null
  modal.imgFile = null
  modal.imgPreview = ''
  modal.detailsId = null

  if (product) {
    const { data: details } = await supabase.from('agro_product_details')
      .select('*').eq('product_id', product.id).single()
    modal.detailsId = details?.id ?? null
    modal.form = {
      name: product.name ?? '',
      slug: product.slug ?? '',
      type: product.type ?? '',
      manufacturer_slug: product.manufacturer_slug ?? '',
      source_image_url: product.source_image_url ?? '',
      chem_class: details?.chem_class ?? '',
      formulation_name: product.formulation_name ?? '',
      dosage: details?.dosage ?? '',
      description: details?.description ?? '',
      crops_str: (product.crops || []).join(', '),
    }
  } else {
    modal.form = { name: '', slug: '', type: '', manufacturer_slug: '', source_image_url: '', chem_class: '', formulation_name: '', dosage: '', description: '', crops_str: '' }
  }
  modal.show = true
}

const uploadImage = async (file: File, slug: string): Promise<string | null> => {
  const ext = file.name.split('.').pop()
  const path = `products/${slug}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
  if (error) { console.error(error); return null }
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

const save = async () => {
  if (!modal.form.name || !modal.form.type) return
  modal.saving = true

  const slug = modal.form.slug || modal.form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  let imageUrl = modal.form.source_image_url

  if (modal.imgFile) {
    const url = await uploadImage(modal.imgFile, slug)
    if (url) imageUrl = url
  }

  const crops = modal.form.crops_str.split(',').map(s => s.trim()).filter(Boolean)

  const productPayload = {
    name: modal.form.name,
    slug,
    type: modal.form.type,
    manufacturer_slug: modal.form.manufacturer_slug || null,
    source_image_url: imageUrl || null,
    formulation_name: modal.form.formulation_name || null,
    crops,
  }

  const detailsPayload = {
    chem_class: modal.form.chem_class || null,
    dosage: modal.form.dosage || null,
    description: modal.form.description || null,
  }

  if (modal.isNew) {
    const { data: newProduct } = await supabase.from('agro_products').insert(productPayload).select().single()
    if (newProduct) {
      await supabase.from('agro_product_details').insert({ ...detailsPayload, product_id: (newProduct as any).id })
      items.value.unshift({ ...(newProduct as any), agro_manufacturers: brands.value.find(b => b.slug === modal.form.manufacturer_slug) })
      total.value++
    }
  } else {
    await supabase.from('agro_products').update(productPayload).eq('id', modal.id)
    if (modal.detailsId) {
      await supabase.from('agro_product_details').update(detailsPayload).eq('id', modal.detailsId)
    } else {
      await supabase.from('agro_product_details').insert({ ...detailsPayload, product_id: modal.id })
    }
    const idx = items.value.findIndex(p => p.id === modal.id)
    if (idx !== -1) {
      items.value[idx] = { ...items.value[idx], ...productPayload, agro_manufacturers: brands.value.find(b => b.slug === modal.form.manufacturer_slug) }
    }
  }

  modal.saving = false
  modal.show = false
}

onMounted(async () => {
  const [, { data: brandData }] = await Promise.all([
    load(1),
    supabase.from('agro_manufacturers').select('id, name, slug').order('name'),
  ])
  brands.value = brandData || []
})
</script>
