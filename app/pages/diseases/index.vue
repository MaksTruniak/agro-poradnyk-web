<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark">🦠 Хвороби рослин</h1>
      <p class="text-agro-light mt-1">{{ total }} хвороб у базі</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Сайдбар -->
      <aside class="lg:w-56 shrink-0 space-y-4">
        <!-- Тип збудника -->
        <div class="card p-3">
          <p class="text-xs font-semibold text-agro-light uppercase tracking-wide px-2 mb-2">Тип збудника</p>
          <button @click="activeCategory = ''; offset = 0; load()"
            class="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5"
            :class="!activeCategory ? 'bg-agro text-white' : 'text-agro-light hover:bg-agro-hover hover:text-agro-dark'">
            Всі
          </button>
          <button v-for="c in CATEGORIES" :key="c.slug"
            @click="activeCategory = c.slug; offset = 0; load()"
            class="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5 flex items-center gap-2"
            :class="activeCategory === c.slug ? 'bg-agro text-white' : 'text-agro-light hover:bg-agro-hover hover:text-agro-dark'">
            <span>{{ c.emoji }}</span><span>{{ c.name }}</span>
          </button>
        </div>
        <!-- Культура -->
        <div class="card p-3">
          <p class="text-xs font-semibold text-agro-light uppercase tracking-wide px-2 mb-2">Культура</p>
          <button @click="activeCulture = ''; offset = 0; load()"
            class="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5"
            :class="!activeCulture ? 'bg-agro text-white' : 'text-agro-light hover:bg-agro-hover hover:text-agro-dark'">
            Всі
          </button>
          <button v-for="c in CULTURES" :key="c"
            @click="activeCulture = c; offset = 0; load()"
            class="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5"
            :class="activeCulture === c ? 'bg-agro text-white' : 'text-agro-light hover:bg-agro-hover hover:text-agro-dark'">
            {{ c }}
          </button>
        </div>
      </aside>

      <!-- Контент -->
      <div class="flex-1 min-w-0">
        <div class="relative mb-5">
          <input v-model="search" @input="onSearch" class="input pl-10" placeholder="Пошук хвороби..." />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light">🔍</span>
          <button v-if="search" @click="search = ''; load()" class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light hover:text-agro-dark">✕</button>
        </div>

        <div v-if="loading" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="i in 12" :key="i" class="card animate-pulse h-28"></div>
        </div>

        <div v-else-if="items.length" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <NuxtLink v-for="item in items" :key="item.id" :to="`/diseases/${item.slug}`"
            class="card hover:shadow-md transition-shadow group flex flex-col gap-2">
            <div class="flex items-start gap-3">
              <div v-if="item.source_image_url" class="w-10 h-10 rounded-xl overflow-hidden bg-agro-hover shrink-0">
                <img :src="item.source_image_url" :alt="item.name" class="w-full h-full object-contain p-1" loading="lazy" />
              </div>
              <div v-else class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center text-xl shrink-0">
                {{ categoryEmoji(item.disease_categories?.slug) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-agro-dark text-sm group-hover:text-agro transition-colors leading-snug">{{ item.name }}</p>
                <p v-if="item.latin_name" class="text-xs text-agro-light mt-0.5 italic truncate">{{ item.latin_name }}</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-1">
              <span v-if="item.disease_categories?.name" class="text-xs bg-agro-bg text-agro-light px-2 py-0.5 rounded-full">{{ item.disease_categories.name }}</span>
              <span v-if="item.culture" class="text-xs bg-agro-bg text-agro-light px-2 py-0.5 rounded-full truncate max-w-[120px]">{{ item.culture }}</span>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="card text-center py-16">
          <p class="text-4xl mb-3">🦠</p>
          <p class="font-bold text-agro-dark">Нічого не знайдено</p>
        </div>

        <div v-if="total > LIMIT" class="flex items-center justify-center gap-2 mt-8">
          <button @click="prevPage" :disabled="offset === 0"
            class="px-4 py-2 rounded-xl border border-agro-border text-sm font-medium text-agro-dark hover:bg-agro-hover disabled:opacity-40 disabled:cursor-not-allowed">← Назад</button>
          <span class="text-sm text-agro-light px-2">{{ currentPage }} / {{ totalPages }}</span>
          <button @click="nextPage" :disabled="offset + LIMIT >= total"
            class="px-4 py-2 rounded-xl border border-agro-border text-sm font-medium text-agro-dark hover:bg-agro-hover disabled:opacity-40 disabled:cursor-not-allowed">Далі →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Хвороби рослин — АгроПорадник' })

const CATEGORIES = [
  { slug: 'grib',      name: 'Гриб',     emoji: '🍄' },
  { slug: 'virus',     name: 'Вірус',    emoji: '🦠' },
  { slug: 'bakteriya', name: 'Бактерія', emoji: '🔬' },
]

const CULTURES = [
  'пшениця', 'ячмінь', 'кукурудза', 'соняшник', 'соя', 'ріпак',
  'буряки', 'картопля', 'горох', 'жито', 'томати', 'огірки',
]

const categoryEmoji = (slug?: string) => {
  if (slug === 'grib') return '🍄'
  if (slug === 'virus') return '🦠'
  if (slug === 'bakteriya') return '🔬'
  return '🌱'
}

const api = useAgroApi()
const LIMIT = 40

const search = ref('')
const activeCategory = ref('')
const activeCulture = ref('')
const offset = ref(0)
const currentPage = computed(() => Math.floor(offset.value / LIMIT) + 1)
const totalPages = computed(() => Math.ceil(total.value / LIMIT))

const load = async () => {
  loading.value = true
  const data = await api.getDiseases({
    q: search.value || undefined,
    category: activeCategory.value || undefined,
    culture: activeCulture.value || undefined,
    limit: LIMIT,
    offset: offset.value,
  })
  items.value = data.items || []
  total.value = data.total || 0
  loading.value = false
}

const { data: initData, pending } = useLazyAsyncData('diseases-index', () =>
  $fetch('/api/agro', { query: { path: '/v1/diseases', limit: LIMIT, offset: 0 } })
  .catch(() => ({ items: [], total: 0 }))
)

const items = ref<any[]>([])
const total = ref(0)
const loading = computed(() => pending.value && !items.value.length)

watch(initData, (val) => {
  if (!val || items.value.length) return
  items.value = val.items || []
  total.value = val.total || 0
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
