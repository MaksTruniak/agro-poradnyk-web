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
        <div v-for="b in filtered" :key="b.id" class="flex items-center gap-4 px-5 py-3.5 hover:bg-agro-bg transition-colors">
          <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center shrink-0 overflow-hidden">
            <img v-if="b.logo_url" :src="b.logo_url" :alt="b.name" class="w-full h-full object-contain p-1" @error="($event.target as HTMLImageElement).style.display='none'" />
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-agro-dark truncate">{{ b.name }}</p>
            <p class="text-xs text-agro-light truncate">{{ [b.country, b.slug].filter(Boolean).join(' · ') }}</p>
          </div>
          <a v-if="b.website_url" :href="b.website_url" target="_blank" class="text-xs text-agro-light hover:text-agro transition-colors shrink-0 hidden md:block truncate max-w-[180px]">{{ b.website_url }}</a>
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
            <!-- Лого превʼю -->
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-agro-hover flex items-center justify-center shrink-0 overflow-hidden border border-agro-border">
                <img v-if="modal.form.logo_url" :src="modal.form.logo_url" class="w-full h-full object-contain p-1" @error="($event.target as HTMLImageElement).style.display='none'" />
                <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(107,122,100)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg>
              </div>
              <div class="flex-1">
                <label class="block text-xs font-semibold text-agro-dark mb-1">URL логотипу</label>
                <input v-model="modal.form.logo_url" class="input text-sm" placeholder="https://example.com/logo.png" />
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
  form: { name: '', slug: '', logo_url: '', country: '', website_url: '', description: '' },
})

const openModal = (brand: any) => {
  modal.isNew = !brand
  modal.id = brand?.id ?? null
  modal.form = {
    name: brand?.name ?? '',
    slug: brand?.slug ?? '',
    logo_url: brand?.logo_url ?? '',
    country: brand?.country ?? '',
    website_url: brand?.website_url ?? '',
    description: brand?.description ?? '',
  }
  modal.show = true
}

const save = async () => {
  if (!modal.form.name) return
  modal.saving = true
  const payload = { ...modal.form }
  if (!payload.slug) payload.slug = payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  if (modal.isNew) {
    const { data } = await supabase.from('manufacturers').insert(payload).select().single()
    if (data) brands.value.unshift(data)
  } else {
    await supabase.from('manufacturers').update(payload).eq('id', modal.id)
    const idx = brands.value.findIndex(b => b.id === modal.id)
    if (idx !== -1) brands.value[idx] = { ...brands.value[idx], ...payload }
  }
  modal.saving = false
  modal.show = false
}

onMounted(async () => {
  const { data } = await supabase.from('manufacturers').select('*').order('name')
  brands.value = data || []
  loading.value = false
})
</script>
