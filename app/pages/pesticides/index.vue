<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark">🛡️ Пестициди</h1>
      <p class="text-agro-light mt-1">{{ total }} препаратів у базі</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Сайдбар -->
      <aside class="lg:w-56 shrink-0 space-y-4">
        <!-- Тип препарату -->
        <div class="card p-3">
          <p class="text-xs font-semibold text-agro-light uppercase tracking-wide px-2 mb-2">Тип препарату</p>
          <button @click="activeType = ''; offset = 0; syncUrl()"
            class="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5"
            :class="!activeType ? 'bg-agro text-white' : 'text-agro-light hover:bg-agro-hover hover:text-agro-dark'">
            Всі типи
          </button>
          <button v-for="t in PESTICIDE_TYPES" :key="t.slug"
            @click="activeType = t.slug; offset = 0; syncUrl()"
            class="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5 flex items-center gap-2"
            :class="activeType === t.slug ? 'bg-agro text-white' : 'text-agro-light hover:bg-agro-hover hover:text-agro-dark'">
            <span>{{ t.emoji }}</span><span>{{ t.name }}</span>
          </button>
        </div>

        <!-- Діюча речовина -->
        <div class="card p-3">
          <p class="text-xs font-semibold text-agro-light uppercase tracking-wide px-2 mb-2">Діюча речовина</p>
          <div class="relative mb-2">
            <input v-model="ingSearch" @input="onIngSearch" placeholder="Пошук..."
              class="input text-sm py-1.5 pl-8 pr-8" />
            <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-agro-light text-xs">🔍</span>
            <button v-if="ingSearch" @click="ingSearch = ''; ingFiltered = ingredients"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-agro-light hover:text-agro-dark text-xs">✕</button>
          </div>
          <div class="max-h-52 overflow-y-auto">
            <button @click="activeIngredient = ''; offset = 0; syncUrl()"
              class="w-full text-left px-3 py-1.5 rounded-xl text-sm font-medium transition-colors mb-0.5"
              :class="!activeIngredient ? 'bg-agro text-white' : 'text-agro-light hover:bg-agro-hover hover:text-agro-dark'">
              Всі
            </button>
            <button v-for="ing in ingFiltered.slice(0, 80)" :key="ing.slug"
              @click="activeIngredient = ing.slug; offset = 0; syncUrl()"
              class="w-full text-left px-3 py-1.5 rounded-xl text-sm transition-colors mb-0.5 truncate"
              :class="activeIngredient === ing.slug ? 'bg-agro text-white font-medium' : 'text-agro-light hover:bg-agro-hover hover:text-agro-dark'">
              {{ ing.name }}
            </button>
          </div>
          <p v-if="activeIngredient" class="mt-2 px-2">
            <button @click="activeIngredient = ''; offset = 0; syncUrl()"
              class="text-xs text-agro hover:underline">✕ Скинути фільтр</button>
          </p>
        </div>
      </aside>

      <!-- Контент -->
      <div class="flex-1 min-w-0">
        <div class="relative mb-5">
          <input v-model="search" @input="onSearch" class="input pl-10" placeholder="Пошук препарату..." />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light">🔍</span>
          <button v-if="search" @click="search = ''; offset = 0; syncUrl()" class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light hover:text-agro-dark">✕</button>
        </div>

        <!-- Активний фільтр по інгредієнту -->
        <div v-if="activeIngredient" class="mb-4 flex items-center gap-2 flex-wrap">
          <span class="text-sm text-agro-light">Діюча речовина:</span>
          <span class="inline-flex items-center gap-1 bg-agro/10 text-agro text-sm px-3 py-1 rounded-full font-medium">
            {{ ingredients.find(i => i.slug === activeIngredient)?.name || activeIngredient }}
            <button @click="activeIngredient = ''; offset = 0; syncUrl()" class="ml-1 hover:text-agro-dark">✕</button>
          </span>
        </div>

        <div v-if="loading" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="i in 12" :key="i" class="card animate-pulse h-28"></div>
        </div>

        <div v-else-if="items.length" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <NuxtLink v-for="item in items" :key="item.id" :to="`/pesticides/${item.slug}`"
            class="card hover:shadow-md transition-shadow group flex flex-col gap-2">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl overflow-hidden bg-agro-hover shrink-0 flex items-center justify-center">
                <ProductImage :src="item.source_image_url" :alt="item.name"
                  img-class="w-full h-full object-contain p-1" fallback-class="text-lg"
                  :fallback-emoji="typeEmoji(item.type)" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-agro-dark text-sm group-hover:text-agro transition-colors leading-snug">{{ item.name }}</p>
                <p v-if="item.manufacturer?.name" class="text-xs text-agro-light mt-0.5 truncate">{{ item.manufacturer.name }}</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-1">
              <span class="text-xs bg-agro-bg text-agro-light px-2 py-0.5 rounded-full">{{ typeName(item.type) }}</span>
              <span v-if="item.formulation_name" class="text-xs bg-agro-bg text-agro-light px-2 py-0.5 rounded-full font-mono">{{ item.formulation_name }}</span>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="card text-center py-16">
          <p class="text-4xl mb-3">🛡️</p>
          <p class="font-bold text-agro-dark">Нічого не знайдено</p>
          <p class="text-agro-light text-sm mt-1">Спробуйте інший запит або тип</p>
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
useHead({ title: 'Пестициди — АгроПростір' })

const PESTICIDE_TYPES = [
  { slug: 'herbicide',        name: 'Гербіциди',        emoji: '🌿' },
  { slug: 'fungicide',        name: 'Фунгіциди',        emoji: '🧴' },
  { slug: 'insecticide',      name: 'Інсектициди',      emoji: '🐛' },
  { slug: 'acaricide',        name: 'Акарициди',        emoji: '🕷️' },
  { slug: 'seed_treatment',   name: 'Протруйники',      emoji: '🛡️' },
  { slug: 'rodenticide',      name: 'Родентициди',      emoji: '🐀' },
  { slug: 'growth_regulator', name: 'Регулятори росту', emoji: '📈' },
  { slug: 'retardant',        name: 'Ретарданти',       emoji: '🔽' },
  { slug: 'desiccant',        name: 'Десиканти',        emoji: '☀️' },
  { slug: 'adjuvant',         name: "Ад'юванти / ПАР",  emoji: '🔬' },
  { slug: 'fumigant',         name: 'Фуміганти',        emoji: '💨' },
]
const PESTICIDE_SLUGS = PESTICIDE_TYPES.map(t => t.slug)

const typeMap = Object.fromEntries(PESTICIDE_TYPES.map(t => [t.slug, t]))
const typeEmoji = (slug: string) => typeMap[slug]?.emoji || '🌿'
const typeName = (slug: string) => typeMap[slug]?.name || slug

const api = useAgroApi()
const supabase = useSupabaseClient()
const route = useRoute()
const router = useRouter()
const LIMIT = 40

const search = ref(String(route.query.q || ''))
const activeType = ref(String(route.query.type || ''))
const activeIngredient = ref(String(route.query.ingredient || ''))
const offset = ref(Number(route.query.offset) || 0)
const currentPage = computed(() => Math.floor(offset.value / LIMIT) + 1)
const totalPages = computed(() => Math.ceil(total.value / LIMIT))

// Завантажуємо діючі речовини для фільтру
const { data: ingData } = await useAsyncData('active-ingredients-list', () =>
  supabase.from('agro_active_ingredients').select('id, name, slug').order('name').then(r => r.data || [])
)
const ingredients = computed(() => ingData.value || [])
const ingSearch = ref('')
const ingFiltered = ref<any[]>([])
watch(ingredients, (v) => { ingFiltered.value = v }, { immediate: true })

const onIngSearch = () => {
  const q = ingSearch.value.toLowerCase()
  ingFiltered.value = q
    ? ingredients.value.filter(i => i.name.toLowerCase().includes(q))
    : ingredients.value
}

const syncUrl = () => {
  router.replace({
    query: {
      ...(search.value ? { q: search.value } : {}),
      ...(activeType.value ? { type: activeType.value } : {}),
      ...(activeIngredient.value ? { ingredient: activeIngredient.value } : {}),
      ...(offset.value ? { offset: offset.value } : {}),
    },
  })
}

const cacheKey = computed(() =>
  `pesticides-${search.value}-${activeType.value}-${activeIngredient.value}-${offset.value}`
)

const { data: asyncData, pending } = useAsyncData(
  cacheKey,
  () => api.getProducts({
    search: search.value || undefined,
    type: activeType.value || undefined,
    includeTypes: activeType.value ? undefined : PESTICIDE_SLUGS,
    ingredient: activeIngredient.value || undefined,
    limit: LIMIT,
    page: Math.floor(offset.value / LIMIT) + 1,
  }).catch(() => ({ items: [], total: 0 })),
  { watch: [cacheKey] }
)

const items = computed(() => asyncData.value?.items ?? [])
const total = computed(() => asyncData.value?.total ?? 0)
const loading = computed(() => pending.value)

let searchTimer: any = null
const onSearch = () => {
  clearTimeout(searchTimer)
  offset.value = 0
  searchTimer = setTimeout(syncUrl, 300)
}

const nextPage = () => { offset.value += LIMIT; syncUrl() }
const prevPage = () => { offset.value = Math.max(0, offset.value - LIMIT); syncUrl() }
</script>
