<template>
  <div class="max-w-5xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark">Діючі речовини</h1>
      <p class="text-agro-light mt-1">{{ total }} речовин у базі</p>
    </div>

    <!-- Пошук -->
    <div class="relative mb-6">
      <input
        v-model="search"
        @input="onSearch"
        class="input pl-10 text-base"
        placeholder="Пошук за назвою..."
      />
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
      <button v-if="search" @click="search = ''; load()" class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light hover:text-agro-dark">✕</button>
    </div>

    <!-- Алфавітний фільтр -->
    <div v-if="!search" class="flex flex-wrap gap-1.5 mb-6">
      <button
        @click="activeLetter = ''; load()"
        class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
        :class="!activeLetter ? 'bg-agro text-white' : 'bg-agro-bg text-agro-light hover:bg-agro-hover hover:text-agro-dark'"
      >Всі</button>
      <button
        v-for="l in ALPHABET"
        :key="l"
        @click="activeLetter = l; load()"
        class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
        :class="activeLetter === l ? 'bg-agro text-white' : 'bg-agro-bg text-agro-light hover:bg-agro-hover hover:text-agro-dark'"
      >{{ l }}</button>
    </div>

    <!-- Скелетон -->
    <div v-if="loading" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div v-for="i in 12" :key="i" class="card animate-pulse h-16"></div>
    </div>

    <!-- Список -->
    <div v-else-if="items.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <NuxtLink
        v-for="item in items"
        :key="item.id"
        :to="`/ingredient/${item.slug}`"
        class="card flex items-center gap-3 hover:shadow-md transition-shadow group"
      >
        <div class="w-9 h-9 rounded-xl bg-agro-hover flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-3"/><rect x="9" y="1" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-agro-dark text-sm group-hover:text-agro transition-colors truncate">{{ item.name }}</p>
        </div>
        <span class="text-agro-light text-xs shrink-0">→</span>
      </NuxtLink>
    </div>

    <div v-else class="card text-center py-16">
      <div class="w-16 h-16 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-3"/><rect x="9" y="1" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>
      </div>
      <p class="font-bold text-agro-dark">Нічого не знайдено</p>
      <p class="text-agro-light text-sm mt-1">Спробуйте інший запит</p>
    </div>

    <!-- Пагінація -->
    <div v-if="total > LIMIT && !search" class="flex items-center justify-center gap-2 mt-8">
      <button
        @click="prevPage"
        :disabled="offset === 0"
        class="px-4 py-2 rounded-xl border border-agro-border text-sm font-medium text-agro-dark hover:bg-agro-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >← Назад</button>
      <span class="text-sm text-agro-light px-2">{{ currentPage }} / {{ totalPages }}</span>
      <button
        @click="nextPage"
        :disabled="offset + LIMIT >= total"
        class="px-4 py-2 rounded-xl border border-agro-border text-sm font-medium text-agro-dark hover:bg-agro-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >Далі →</button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Діючі речовини — АгроПростір' })

const api = useAgroApi()

const LIMIT = 60
const ALPHABET = 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ'.split('')

const search = ref('')
const activeLetter = ref('')
const offset = ref(0)
const currentPage = computed(() => Math.floor(offset.value / LIMIT) + 1)
const totalPages = computed(() => Math.ceil(total.value / LIMIT))

const load = async () => {
  loading.value = true
  const data = await api.getActiveIngredients({
    q: search.value || undefined,
    letter: activeLetter.value || undefined,
    limit: LIMIT,
    offset: offset.value,
  })
  items.value = data.items || []
  total.value = data.total || 0
  loading.value = false
}

const { data: initData, pending } = useLazyAsyncData('ingredients-index', () =>
  $fetch('/api/agro', { query: { path: '/v1/active-ingredients', limit: LIMIT, offset: 0 } })
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
  activeLetter.value = ''
  searchTimer = setTimeout(load, 300)
}

const nextPage = () => { offset.value += LIMIT; load() }
const prevPage = () => { offset.value = Math.max(0, offset.value - LIMIT); load() }
</script>
