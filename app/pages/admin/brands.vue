<template>
  <div class="p-8">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg>
        Бренди
      </h1>
      <p class="text-agro-light mt-1">{{ brands.length }} виробників у базі</p>
    </div>

    <div class="flex items-center justify-between mb-4">
      <div class="relative flex-1 max-w-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input v-model="search" class="input pl-9 text-sm" placeholder="Пошук за назвою, країною, slug..." />
      </div>
      <button @click="openModal(null)" class="btn-primary text-sm py-2 px-4 inline-flex items-center gap-1.5 ml-3 shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати бренд
      </button>
    </div>

    <div v-if="loading" class="card overflow-hidden p-0">
      <div v-for="i in 8" :key="i" class="flex items-center gap-4 px-5 py-3.5 border-b border-agro-border animate-pulse">
        <div class="w-10 h-10 rounded-xl bg-agro-bg shrink-0"></div>
        <div class="flex-1"><div class="h-4 bg-agro-bg rounded w-1/3 mb-1.5"></div><div class="h-3 bg-agro-bg rounded w-1/4"></div></div>
      </div>
    </div>

    <div v-else class="card overflow-hidden p-0">
      <div class="divide-y divide-agro-border">
        <div v-for="b in filtered" :key="b.id"
          class="flex items-center gap-4 px-5 py-3.5 transition-colors"
          :class="b.is_active === false ? 'bg-gray-50 opacity-60' : 'hover:bg-agro-bg'">
          <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center shrink-0 overflow-hidden">
            <img v-if="b.logo_url" :src="b.logo_url" :alt="b.name" class="w-full h-full object-contain p-1" @error="($event.target as HTMLImageElement).style.display='none'" />
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-agro-dark truncate">{{ b.name }}</p>
            <p class="text-xs text-agro-light truncate">{{ [b.country, b.slug].filter(Boolean).join(' · ') }}</p>
          </div>
          <span v-if="b.is_active === false" class="shrink-0 text-xs bg-gray-100 text-gray-500 border border-gray-200 rounded-full px-2 py-0.5 font-medium">Приховано</span>
          <button @click="openModal(b)" class="shrink-0 text-xs text-agro border border-agro-border hover:bg-agro-hover rounded-xl px-3 py-1.5 transition-colors inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Редагувати
          </button>
        </div>
      </div>
      <div v-if="!filtered.length" class="text-center py-12 text-agro-light text-sm">Нічого не знайдено</div>
    </div>
  </div>

  <!-- Модалка -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="modal.show = false">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-agro-border">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-agro-dark text-lg">{{ modal.isNew ? 'Додати бренд' : 'Редагувати бренд' }}</h3>
              <button @click="modal.show = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-agro-hover text-agro-light">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div class="p-6 space-y-4">
            <!-- Лого -->
            <div>
              <label class="block text-xs font-semibold text-agro-dark mb-2">Логотип</label>
              <div class="flex items-center gap-4">
                <div class="w-20 h-20 rounded-2xl bg-agro-hover flex items-center justify-center shrink-0 overflow-hidden border-2 border-dashed border-agro-border">
                  <img v-if="modal.logoPreview || modal.form.logo_url" :src="modal.logoPreview || modal.form.logo_url" class="w-full h-full object-contain p-1.5" @error="($event.target as HTMLImageElement).style.display='none'" />
                  <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(107,122,100)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div class="flex-1">
                  <label class="cursor-pointer inline-flex items-center gap-1.5 text-sm font-medium text-agro border border-agro-border rounded-xl px-4 py-2 hover:bg-agro-hover transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    {{ modal.logoFile ? modal.logoFile.name : 'Завантажити лого' }}
                    <input type="file" accept="image/*" class="hidden" @change="onLogoFile" />
                  </label>
                  <p v-if="modal.logoFile" class="text-xs text-agro-light mt-1">{{ (modal.logoFile.size / 1024).toFixed(0) }} KB</p>
                  <p v-else-if="modal.form.logo_url" class="text-xs text-agro-light mt-1 truncate max-w-[220px]">{{ modal.form.logo_url }}</p>
                  <p v-else class="text-xs text-agro-light mt-1">PNG, JPG, SVG до 2 MB</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Назва <span class="text-red-400">*</span></label>
                <input v-model="modal.form.name" class="input text-sm" placeholder="Bayer" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Slug</label>
                <input v-model="modal.form.slug" class="input text-sm font-mono" placeholder="bayer" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Країна</label>
                <input v-model="modal.form.country" class="input text-sm" placeholder="Німеччина" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-agro-dark mb-1">Сайт</label>
                <input v-model="modal.form.website_url" class="input text-sm" placeholder="https://bayer.com" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-agro-dark mb-1">Опис</label>
              <textarea v-model="modal.form.description" class="input text-sm resize-none" rows="3" placeholder="Коротко про бренд..." />
            </div>

            <!-- Видимість -->
            <div class="rounded-2xl border border-agro-border px-4 py-3 flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-agro-dark">Показувати у списку</p>
                <p class="text-xs text-agro-light mt-0.5">Якщо вимкнено — бренд і всі його товари приховані</p>
              </div>
              <button type="button" @click="modal.form.is_active = !modal.form.is_active"
                class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                :class="modal.form.is_active ? 'bg-agro' : 'bg-gray-200'">
                <span class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200"
                  :class="modal.form.is_active ? 'translate-x-5' : 'translate-x-0'" />
              </button>
            </div>
          </div>

          <div class="px-6 pb-6 flex gap-3">
            <button @click="modal.show = false" class="btn-outline flex-1 text-sm py-2.5">Скасувати</button>
            <button @click="save" :disabled="modal.saving || !modal.form.name"
              class="btn-primary flex-1 text-sm py-2.5 inline-flex items-center justify-center gap-1.5"
              :class="(modal.saving || !modal.form.name) ? 'opacity-50 cursor-not-allowed' : ''">
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
useHead({ title: 'Бренди — Адмін' })
definePageMeta({ layout: 'admin', middleware: 'admin' })

const supabase = useSupabaseClient()
const loading = ref(true)
const search = ref('')
const brands = ref<any[]>([])

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return !q ? brands.value : brands.value.filter(b =>
    b.name?.toLowerCase().includes(q) ||
    b.country?.toLowerCase().includes(q) ||
    b.slug?.toLowerCase().includes(q)
  )
})

const modal = reactive({
  show: false,
  isNew: false,
  saving: false,
  id: null as string | null,
  logoFile: null as File | null,
  logoPreview: '' as string,
  form: { name: '', slug: '', logo_url: '', country: '', website_url: '', description: '', is_active: true },
})

const onLogoFile = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  modal.logoFile = file
  modal.logoPreview = URL.createObjectURL(file)
}

const openModal = (brand: any) => {
  modal.isNew = !brand
  modal.id = brand?.id ?? null
  modal.logoFile = null
  modal.logoPreview = ''
  modal.form = {
    name: brand?.name ?? '',
    slug: brand?.slug ?? '',
    logo_url: brand?.logo_url ?? '',
    country: brand?.country ?? '',
    website_url: brand?.website_url ?? '',
    description: brand?.description ?? '',
    is_active: brand?.is_active !== false,
  }
  modal.show = true
}

const uploadLogo = async (file: File, slug: string): Promise<string | null> => {
  const ext = file.name.split('.').pop()
  const path = `brands/${slug}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
  if (error) { console.error(error); return null }
  const { data } = supabase.storage.from('logos').getPublicUrl(path)
  return data.publicUrl
}

const save = async () => {
  if (!modal.form.name) return
  modal.saving = true

  const payload: any = { ...modal.form }
  if (!payload.slug) payload.slug = payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  if (modal.logoFile) {
    const url = await uploadLogo(modal.logoFile, payload.slug)
    if (url) payload.logo_url = url
  }

  if (modal.isNew) {
    const { data } = await supabase.from('agro_manufacturers').insert(payload).select().single()
    if (data) brands.value.unshift(data)
  } else {
    await supabase.from('agro_manufacturers').update(payload).eq('id', modal.id)
    const idx = brands.value.findIndex(b => b.id === modal.id)
    if (idx !== -1) brands.value[idx] = { ...brands.value[idx], ...payload }
  }

  modal.saving = false
  modal.show = false
}

onMounted(async () => {
  const { data } = await supabase.from('agro_manufacturers').select('*').order('name')
  brands.value = data || []
  loading.value = false
})
</script>
