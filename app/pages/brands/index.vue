<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark mb-1">Виробники</h1>
      <p class="text-agro-light">{{ total }} компаній</p>
    </div>

    <!-- Пошук -->
    <div class="mb-6">
      <input
        v-model="search"
        type="text"
        placeholder="Пошук виробника..."
        class="input max-w-sm"
        @input="onSearch"
      />
    </div>

    <!-- Скелетон -->
    <div v-if="loading" class="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="i in PER_PAGE" :key="i" class="card animate-pulse">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-agro-bg shrink-0"></div>
          <div class="flex-1">
            <div class="h-4 bg-agro-bg rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-agro-bg rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Список -->
    <div v-else-if="items.length" class="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      <NuxtLink
        v-for="brand in items"
        :key="brand.slug"
        :to="`/brands/${brand.slug}`"
        class="card hover:shadow-md hover:border-agro transition-all group flex items-center gap-3"
      >
        <div class="w-12 h-12 rounded-xl bg-agro-hover flex items-center justify-center shrink-0 overflow-hidden">
          <img v-if="brand.logo_url" :src="brand.logo_url" :alt="brand.name" class="w-full h-full object-contain p-1" />
          <span v-else class="text-2xl">🏭</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-agro-dark group-hover:text-agro transition-colors truncate">{{ brand.name }}</p>
          <p v-if="brand.country" class="text-xs text-agro-light mt-0.5">📍 {{ brand.country }}</p>
          <p v-else class="text-xs text-agro-light mt-0.5">Виробник</p>
        </div>
      </NuxtLink>
    </div>

    <!-- Порожньо -->
    <div v-else class="text-center py-16">
      <p class="text-4xl mb-3">🔍</p>
      <p class="text-agro-dark font-semibold">Нічого не знайдено</p>
      <p class="text-agro-light text-sm mt-1">Спробуйте інший запит</p>
    </div>

    <!-- Пагінація -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-10">
      <button
        @click="goTo(page - 1)"
        :disabled="page === 1"
        class="w-9 h-9 rounded-xl border border-agro-border flex items-center justify-center text-agro-light hover:border-agro hover:text-agro transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >←</button>

      <template v-for="p in pageNumbers" :key="p">
        <span v-if="p === '...'" class="text-agro-light px-1">…</span>
        <button
          v-else
          @click="goTo(p)"
          class="w-9 h-9 rounded-xl border font-semibold text-sm transition-colors"
          :class="p === page
            ? 'bg-agro border-agro text-white'
            : 'border-agro-border text-agro-dark hover:border-agro hover:text-agro'"
        >{{ p }}</button>
      </template>

      <button
        @click="goTo(page + 1)"
        :disabled="page === totalPages"
        class="w-9 h-9 rounded-xl border border-agro-border flex items-center justify-center text-agro-light hover:border-agro hover:text-agro transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >→</button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const PER_PAGE = 30

const supabase = useSupabaseClient()
const search = ref('')
const page = ref(1)
const items = ref<any[]>([])
const total = ref(0)
const loading = ref(true)

const totalPages = computed(() => Math.ceil(total.value / PER_PAGE))

const pageNumbers = computed(() => {
  const pages: (number | string)[] = []
  const tp = totalPages.value
  const p = page.value
  if (tp <= 7) {
    for (let i = 1; i <= tp; i++) pages.push(i)
  } else {
    pages.push(1)
    if (p > 3) pages.push('...')
    for (let i = Math.max(2, p - 1); i <= Math.min(tp - 1, p + 1); i++) pages.push(i)
    if (p < tp - 2) pages.push('...')
    pages.push(tp)
  }
  return pages
})

async function load() {
  loading.value = true
  const from = (page.value - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = (supabase as any).from('agro_manufacturers')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('name')

  if (search.value.trim()) {
    query = query.ilike('name', `%${search.value.trim()}%`)
  }

  const { data, count } = await query.range(from, to)
  items.value = data || []
  total.value = count || 0
  loading.value = false
}

function goTo(p: number) {
  page.value = p
  window.scrollTo({ top: 0, behavior: 'smooth' })
  load()
}

let searchTimer: ReturnType<typeof setTimeout>
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
}

onMounted(load)

useHead({ title: 'Виробники — АгроПростір' })
</script>
