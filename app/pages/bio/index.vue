<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark">🍃 Біопрепарати</h1>
      <p class="text-agro-light mt-1">{{ total }} препаратів у базі</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">
      <aside class="lg:w-56 shrink-0">
        <div class="card p-3">
          <p class="text-xs font-semibold text-agro-light uppercase tracking-wide px-2 mb-2">Категорія</p>
          <button
            @click="activeType = ''; offset = 0; load()"
            class="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5"
            :class="!activeType ? 'bg-agro text-white' : 'text-agro-light hover:bg-agro-hover hover:text-agro-dark'"
          >Всі</button>
          <button
            v-for="t in BIO_TYPES"
            :key="t.slug"
            @click="activeType = t.slug; offset = 0; load()"
            class="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5 flex items-center gap-2"
            :class="activeType === t.slug ? 'bg-agro text-white' : 'text-agro-light hover:bg-agro-hover hover:text-agro-dark'"
          >
            <span>{{ t.emoji }}</span><span>{{ t.name }}</span>
          </button>
        </div>
      </aside>

      <div class="flex-1 min-w-0">
        <div class="relative mb-5">
          <input v-model="search" @input="onSearch" class="input pl-10" placeholder="Пошук біопрепарату..." />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light">🔍</span>
          <button v-if="search" @click="search = ''; load()" class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light hover:text-agro-dark">✕</button>
        </div>

        <div v-if="loading" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="i in 12" :key="i" class="card animate-pulse h-28"></div>
        </div>

        <div v-else-if="items.length" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <NuxtLink
            v-for="item in items"
            :key="item.id"
            :to="`/catalog/${item.slug}`"
            class="card hover:shadow-md transition-shadow group flex flex-col gap-2"
          >
            <div class="flex items-start gap-3">
              <div v-if="item.source_image_url" class="w-10 h-10 rounded-xl overflow-hidden bg-agro-hover shrink-0">
                <img :src="item.source_image_url" :alt="item.name" class="w-full h-full object-contain p-1" loading="lazy" />
              </div>
              <div v-else class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center text-xl shrink-0">
                {{ typeEmoji(item.type) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-agro-dark text-sm group-hover:text-agro transition-colors leading-snug">{{ item.name }}</p>
                <p v-if="item.manufacturer?.name" class="text-xs text-agro-light mt-0.5 truncate">{{ item.manufacturer.name }}</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-1">
              <span class="text-xs bg-agro-bg text-agro-light px-2 py-0.5 rounded-full">{{ typeName(item.type) }}</span>
              <span v-if="item.chem_class" class="text-xs bg-agro-bg text-agro-light px-2 py-0.5 rounded-full truncate max-w-[160px]">{{ item.chem_class }}</span>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="card text-center py-16">
          <p class="text-4xl mb-3">🍃</p>
          <p class="font-bold text-agro-dark">Нічого не знайдено</p>
          <p class="text-agro-light text-sm mt-1">Спробуйте інший запит</p>
        </div>

        <div v-if="total > LIMIT" class="flex items-center justify-center gap-2 mt-8">
          <button @click="prevPage" :disabled="offset === 0"
            class="px-4 py-2 rounded-xl border border-agro-border text-sm font-medium text-agro-dark hover:bg-agro-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors">← Назад</button>
          <span class="text-sm text-agro-light px-2">{{ currentPage }} / {{ totalPages }}</span>
          <button @click="nextPage" :disabled="offset + LIMIT >= total"
            class="px-4 py-2 rounded-xl border border-agro-border text-sm font-medium text-agro-dark hover:bg-agro-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Далі →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Біопрепарати — АгроПорадник' })

const BIO_TYPES = [
  { slug: 'bio_product',          name: 'Мікробні та гумінові', emoji: '🍃' },
  { slug: 'biostimulator',        name: 'Біостимулятори',       emoji: '⚡' },
  { slug: 'biofungicide',         name: 'Біофунгіциди',         emoji: '🍄' },
  { slug: 'biological_fungicide', name: 'Біофунгіциди біол.',   emoji: '🌿' },
  { slug: 'inoculant',            name: 'Інокулянти',           emoji: '🦠' },
]

const BIO_SLUGS = BIO_TYPES.map(t => t.slug)
const typeMap = Object.fromEntries(BIO_TYPES.map(t => [t.slug, t]))
const typeEmoji = (slug: string) => typeMap[slug]?.emoji || '🍃'
const typeName = (slug: string) => typeMap[slug]?.name || slug

const api = useAgroApi()
const LIMIT = 40

const search = ref('')
const activeType = ref('')
const offset = ref(0)
const currentPage = computed(() => Math.floor(offset.value / LIMIT) + 1)
const totalPages = computed(() => Math.ceil(total.value / LIMIT))

const load = async () => {
  loading.value = true
  const data = await api.getProducts({
    search: search.value || undefined,
    type: activeType.value || undefined,
    includeTypes: activeType.value ? undefined : BIO_SLUGS,
    limit: LIMIT,
    page: currentPage.value,
  })
  items.value = data.items || data.data || []
  total.value = data.meta?.total || data.total || 0
  loading.value = false
}

const { data: initData, pending } = useLazyAsyncData('bio-index', () =>
  $fetch('/api/agro', { query: { path: '/v1/products', include_types: BIO_SLUGS.join(','), limit: LIMIT, page: 1 } })
  .catch(() => ({ items: [], total: 0 }))
)

const items = ref<any[]>([])
const total = ref(0)
const loading = computed(() => pending.value && !items.value.length)

watch(initData, (val) => {
  if (!val || items.value.length) return
  items.value = val.items || val.data || []
  total.value = val.meta?.total || val.total || 0
}, { immediate: true })
let searchTimer: any = null

const onSearch = () => {
  clearTimeout(searchTimer)
  offset.value = 0
  searchTimer = setTimeout(load, 300)
}

const nextPage = () => { offset.value += LIMIT; load() }
const prevPage = () => { offset.value = Math.max(0, offset.value - LIMIT); load() }
</script>
