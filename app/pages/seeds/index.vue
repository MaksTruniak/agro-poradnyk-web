<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark flex items-center gap-2"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle mr-2"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/></svg> Насіння</h1>
      <p class="text-agro-light mt-1">{{ total }} сортів у базі</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Сайдбар культур -->
      <aside class="lg:w-56 shrink-0">
        <div class="card p-3">
          <p class="text-xs font-semibold text-agro-light uppercase tracking-wide px-2 mb-2">Культура</p>
          <button
            @click="activeCrop = ''; offset = 0; load()"
            class="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5"
            :class="!activeCrop ? 'bg-agro text-white' : 'text-agro-light hover:bg-agro-hover hover:text-agro-dark'"
          >Всі культури</button>
          <button
            v-for="c in CROPS"
            :key="c.name"
            @click="activeCrop = c.name; offset = 0; load()"
            class="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5 flex items-center gap-2"
            :class="activeCrop === c.name ? 'bg-agro text-white' : 'text-agro-light hover:bg-agro-hover hover:text-agro-dark'"
          >
            <span v-html="c.emoji"></span><span>{{ c.name }}</span>
          </button>
        </div>
      </aside>

      <!-- Основний контент -->
      <div class="flex-1 min-w-0">
        <div class="relative mb-5">
          <input v-model="search" @input="onSearch" class="input pl-10" placeholder="Пошук сорту або гібриду..." />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></span>
          <button v-if="search" @click="search = ''; load()" class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light hover:text-agro-dark">✕</button>
        </div>

        <div v-if="loading" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="i in 12" :key="i" class="card animate-pulse h-32"></div>
        </div>

        <div v-else-if="items.length" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <NuxtLink
            v-for="item in items"
            :key="item.id"
            :to="`/pesticides/${item.slug}`"
            class="card hover:shadow-md transition-shadow group flex flex-col gap-2"
          >
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl overflow-hidden bg-agro-hover shrink-0 flex items-center justify-center">
                <ProductImage :src="item.source_image_url" :alt="item.name" img-class="w-full h-full object-contain p-1" fallback-class="text-lg" fallback-emoji="🌿" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-agro-dark text-sm group-hover:text-agro transition-colors leading-snug">{{ item.name }}</p>
                <p v-if="item.manufacturer?.name" class="text-xs text-agro-light mt-0.5 truncate">{{ item.manufacturer.name }}</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-1">
              <span v-if="item.seed_crop" class="text-xs bg-agro-bg text-agro-light px-2 py-0.5 rounded-full">{{ item.seed_crop }}</span>
              <span v-if="item.seed_maturity_group" class="text-xs bg-agro-bg text-agro-light px-2 py-0.5 rounded-full">{{ item.seed_maturity_group }}</span>
              <span v-if="item.seed_yield_potential" class="text-xs bg-agro-bg text-agro-light px-2 py-0.5 rounded-full">{{ item.seed_yield_potential }} т/га</span>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="card text-center py-16">
          <div class="w-16 h-16 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/></svg>
          </div>
          <p class="font-bold text-agro-dark">Нічого не знайдено</p>
          <p class="text-agro-light text-sm mt-1">Спробуйте інший запит або культуру</p>
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
useHead({ title: 'Насіння — АгроПростір' })

const GRAIN_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/></svg>'
const LEAF_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 7 9 5 5c4 0 6 2 7 7z"/><path d="M12 12c0 0 5-3 7-7-4 0-6 2-7 7z"/></svg>'

const CROPS = [
  { name: 'Кукурудза',       emoji: LEAF_SVG },
  { name: 'Соняшник',        emoji: LEAF_SVG },
  { name: 'Пшениця озима',   emoji: GRAIN_SVG },
  { name: 'Пшениця яра',     emoji: GRAIN_SVG },
  { name: 'Ріпак озимий',    emoji: LEAF_SVG },
  { name: 'Ріпак ярий',      emoji: LEAF_SVG },
  { name: 'Буряк цукровий',  emoji: LEAF_SVG },
  { name: 'Соя',             emoji: LEAF_SVG },
  { name: 'Картопля',        emoji: LEAF_SVG },
  { name: 'Ячмінь ярий',     emoji: GRAIN_SVG },
  { name: 'Ячмінь озимий',   emoji: GRAIN_SVG },
  { name: 'Горох',           emoji: LEAF_SVG },
  { name: 'Жито озиме',      emoji: GRAIN_SVG },
  { name: 'Сорго',           emoji: LEAF_SVG },
  { name: 'Тритикале озиме', emoji: GRAIN_SVG },
  { name: 'Овес',            emoji: GRAIN_SVG },
  { name: 'Льон',            emoji: LEAF_SVG },
  { name: 'Просо',           emoji: LEAF_SVG },
  { name: 'Вика',            emoji: LEAF_SVG },
  { name: 'Гречка',          emoji: LEAF_SVG },
  { name: 'Гірчиця',         emoji: LEAF_SVG },
  { name: 'Квасоля',         emoji: LEAF_SVG },
  { name: 'Кавун',           emoji: LEAF_SVG },
  { name: 'Нут',             emoji: LEAF_SVG },
  { name: 'Гарбузи',         emoji: LEAF_SVG },
  { name: 'Рис',             emoji: GRAIN_SVG },
  { name: 'Коноплі',         emoji: LEAF_SVG },
  { name: 'Люпин',           emoji: LEAF_SVG },
  { name: 'Рижій',           emoji: LEAF_SVG },
  { name: 'Сориз',           emoji: LEAF_SVG },
  { name: 'Амарант',         emoji: LEAF_SVG },
  { name: 'Буряк кормовий',  emoji: LEAF_SVG },
  { name: 'Люцерна',         emoji: LEAF_SVG },
  { name: 'Чина',            emoji: LEAF_SVG },
  { name: 'Кінські боби',    emoji: LEAF_SVG },
  { name: 'Спельта',         emoji: GRAIN_SVG },
  { name: 'Гірчиця біла',    emoji: LEAF_SVG },
  { name: 'Цибуля',          emoji: LEAF_SVG },
  { name: 'Сочевиця',        emoji: LEAF_SVG },
  { name: 'Морква',          emoji: LEAF_SVG },
  { name: 'Часник',          emoji: LEAF_SVG },
]

const cropEmojiMap = Object.fromEntries(CROPS.map(c => [c.name, c.emoji]))
const cropEmoji = (name: string) => cropEmojiMap[name] || '🌾'

const api = useAgroApi()
const LIMIT = 40

const search = ref('')
const activeCrop = ref('')
const offset = ref(0)
const currentPage = computed(() => Math.floor(offset.value / LIMIT) + 1)
const totalPages = computed(() => Math.ceil(total.value / LIMIT))

const load = async () => {
  loading.value = true
  const data = await api.getProducts({
    search: search.value || undefined,
    includeTypes: ['seed'],
    seedCrop: activeCrop.value || undefined,
    limit: LIMIT,
    page: currentPage.value,
  })
  items.value = data.items || data.data || []
  total.value = data.meta?.total || data.total || 0
  loading.value = false
}

const { data: initData, pending } = useLazyAsyncData('seeds-index', () =>
  $fetch('/api/agro', { query: { path: '/v1/products', include_types: 'seed', limit: LIMIT, page: 1 } })
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
