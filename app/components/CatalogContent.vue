<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <!-- Заголовок -->
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark">🛒 Каталог препаратів</h1>
      <p class="text-agro-light mt-1">Препарати та добрива від перевірених продавців</p>
    </div>

    <!-- Пошук -->
    <div class="flex gap-3 mb-5">
      <div class="relative flex-1">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-agro-light text-lg">🔍</span>
        <input
          v-model="searchInput"
          @input="onSearch"
          class="input pl-12 text-base"
          placeholder="Пошук по назві..."
        />
      </div>
      <!-- Фільтр по діючій речовині -->
      <div class="relative w-72">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-agro-light">🧪</span>
        <input
          v-model="ingredientInput"
          @input="onIngredientSearch"
          @focus="showIngredientSuggestions = true"
          @blur="setTimeout(() => showIngredientSuggestions = false, 200)"
          class="input pl-10 text-base"
          :class="selectedIngredient ? 'border-agro bg-agro-hover' : ''"
          placeholder="Діюча речовина..."
        />
        <button v-if="selectedIngredient" @click="clearIngredient" class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light hover:text-agro-dark">✕</button>
        <!-- Підказки -->
        <div v-if="showIngredientSuggestions && ingredientSuggestions.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-20 overflow-hidden">
          <button
            v-for="s in ingredientSuggestions"
            :key="s.slug || s.name"
            @mousedown.prevent="selectIngredient(s)"
            class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0"
          >
            🧪 {{ s.name }}
          </button>
        </div>
      </div>
    </div>

      <!-- Активний фільтр бренду -->
      <div v-if="selectedManufacturer" class="flex items-center gap-2 mb-4 bg-agro-hover border border-agro rounded-xl px-4 py-2.5 w-fit">
        <span class="text-sm font-semibold text-agro">🏭 {{ selectedManufacturer }}</span>
        <button @click="clearManufacturer" class="text-agro hover:text-agro-dark ml-1">✕</button>
      </div>

      <!-- Фільтри по типах -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;margin-top:20px">
        <button
          @click="selectType('')"
          class="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors whitespace-nowrap"
          :class="!selectedType ? 'bg-agro text-white border-agro' : 'border-agro-border text-agro-light bg-white hover:border-agro hover:text-agro'"
        >Всі</button>
        <button
          v-for="t in types"
          :key="t.slug"
          @click="selectType(t.slug)"
          class="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors whitespace-nowrap"
          :class="selectedType === t.slug ? 'bg-agro text-white border-agro' : 'border-agro-border text-agro-light bg-white hover:border-agro hover:text-agro'"
        >{{ TYPE_EMOJI[t.slug] || '🌿' }} {{ t.name }}</button>
      </div>

      <!-- Товари -->
      <div>

        <!-- Скелетон -->
        <div v-if="loading" class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          <div v-for="i in 6" :key="i" class="card animate-pulse">
            <div class="flex items-center justify-between mb-3">
              <div class="w-8 h-8 bg-agro-bg rounded-lg"></div>
              <div class="h-6 bg-agro-bg rounded-full w-24"></div>
            </div>
            <div class="h-5 bg-agro-bg rounded w-3/4 mb-1"></div>
            <div class="h-5 bg-agro-bg rounded w-1/2 mb-3"></div>
            <div class="h-4 bg-agro-bg rounded w-1/3 mb-4"></div>
            <div class="border-t border-agro-bg pt-4 flex items-center justify-between">
              <div>
                <div class="h-3 bg-agro-bg rounded w-8 mb-1"></div>
                <div class="h-6 bg-agro-bg rounded w-20"></div>
              </div>
              <div class="flex gap-2">
                <div class="h-9 bg-agro-bg rounded-xl w-24"></div>
                <div class="h-9 bg-agro-bg rounded-xl w-24"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Товари -->
        <div v-else class="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mb-12">
          <div
            v-for="product in products"
            :key="product.slug"
            class="card hover:shadow-md transition-all group"
          >
            <NuxtLink :to="`/catalog/${product.slug}`" class="block">
              <div class="flex items-center justify-between mb-3">
                <span class="text-3xl">{{ TYPE_EMOJI[product.type] || '🌿' }}</span>
                <span class="text-xs font-semibold bg-agro-hover text-agro px-2.5 py-1 rounded-full">
                  {{ typeLabel(product.type) }}
                </span>
              </div>
              <h3 class="font-bold text-agro-dark group-hover:text-agro transition-colors mb-1 line-clamp-2 leading-snug">
                {{ product.name }}
              </h3>
              <NuxtLink
                v-if="product.manufacturer"
                :to="`/brand/${product.manufacturer?.slug || product.manufacturer}`"
                @click.stop
                class="text-xs text-agro-light mb-4 hover:text-agro hover:underline transition-colors block"
              >{{ product.manufacturer?.name || product.manufacturer }}</NuxtLink>
            </NuxtLink>

            <div class="border-t border-agro-border pt-4 flex justify-end pr-1">
              <NuxtLink :to="`/catalog/${product.slug}`" class="btn-outline text-sm py-2 px-3">Детально</NuxtLink>
            </div>
          </div>
        </div>

        <!-- Пусто -->
        <div v-if="!loading && products.length === 0" class="text-center py-20">
          <p class="text-5xl mb-4">🔍</p>
          <p class="font-bold text-agro-dark text-lg">Нічого не знайдено</p>
          <p class="text-agro-light mt-2">Спробуйте змінити запит або тип</p>
        </div>

        <!-- Завантажити більше -->
        <div v-if="hasMore && !loading" class="mt-12 mb-8 text-center">
          <button @click="loadMore" :disabled="loadingMore" class="btn-outline">
            {{ loadingMore ? 'Завантаження...' : 'Завантажити ще' }}
          </button>
        </div>
      </div>
  </div>

</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Каталог препаратів і добрив',
  description: 'Тисячі агрохімічних препаратів і добрив. Гербіциди, фунгіциди, інсектициди, добрива від перевірених продавців з доставкою.',
  ogTitle: 'Каталог препаратів — АгроПорадник',
})

const api = useAgroApi()

const ingredientInput = ref('')
const selectedIngredient = ref('')
const ingredientSuggestions = ref<any[]>([])
const showIngredientSuggestions = ref(false)
let ingredientTimer: any = null

const onIngredientSearch = () => {
  clearTimeout(ingredientTimer)
  selectedIngredient.value = ''
  if (!ingredientInput.value.trim()) {
    ingredientSuggestions.value = []
    loadProducts(1, searchInput.value, selectedType.value, '')
    return
  }
  ingredientTimer = setTimeout(async () => {
    const data = await api.searchActiveIngredients(ingredientInput.value).catch(() => ({ items: [] }))
    ingredientSuggestions.value = data.items || []
  }, 300)
}

const selectIngredient = (s: any) => {
  selectedIngredient.value = s.slug || s.name
  ingredientInput.value = s.name
  showIngredientSuggestions.value = false
  loadProducts(1, '', '', selectedIngredient.value)
}

const clearIngredient = () => {
  selectedIngredient.value = ''
  ingredientInput.value = ''
  ingredientSuggestions.value = []
  loadProducts(1, searchInput.value, selectedType.value, '')
}


const TYPE_EMOJI: Record<string, string> = {
  herbicide: '🌿', fungicide: '🧴', insecticide: '🐛', fertilizer: '💊',
  seed: '🌱', growth_regulator: '📈', rodenticide: '🐀', biostimulator: '⚡',
  adjuvant: '🔬', seed_treatment: '🛡️', desiccant: '☀️', inoculant: '🦠',
  bio_product: '🍃', biofungicide: '🍄', disinfectant: '🧹', fumigant: '💨',
  retardant: '🔽', acaricide: '🕷️', liquid_complex_fertilizer: '💧',
  sprayer_cleaner: '🚿', biological_fungicide: '🌿',
}

const TYPE_LABELS: Record<string, string> = {
  herbicide: 'Гербіцид', fungicide: 'Фунгіцид', insecticide: 'Інсектицид',
  fertilizer: 'Добриво', seed: 'Насіння', growth_regulator: 'Регулятор росту',
  rodenticide: 'Родентицид', biostimulator: 'Біостимулятор', adjuvant: 'Ад\'ювант',
  seed_treatment: 'Протруювач', desiccant: 'Десикант', inoculant: 'Інокулянт',
  bio_product: 'Біопрепарат', biofungicide: 'Біофунгіцид', disinfectant: 'Дезінфектант',
  fumigant: 'Фумігант', retardant: 'Ретардант', acaricide: 'Акарицид',
  liquid_complex_fertilizer: 'РКД', sprayer_cleaner: 'Очисник', biological_fungicide: 'Біофунгіцид',
}

const typeLabel = (slug: string) => TYPE_LABELS[slug] || slug

const types = ref<{ slug: string; name: string }[]>([])
const products = ref<any[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const page = ref(1)
const selectedType = ref('')
const selectedManufacturer = ref('')
const searchInput = ref('')
let searchTimer: any = null

const route = useRoute()

// Завантаження типів
const typesData = await api.getProductTypes().catch(() => [])
const typeList = Array.isArray(typesData) ? typesData : (typesData.types || typesData.items || [])
types.value = typeList.map((t: any) => ({ slug: t.slug, name: t.name }))

// Читаємо search з URL якщо передано (наприклад з AI чату)
if (route.query.search) {
  searchInput.value = route.query.search as string
}

// Завантаження товарів
const loadProducts = async (p: number, q: string, type: string, ingredient = '', manufacturer = '') => {
  if (p === 1) loading.value = true
  else loadingMore.value = true

  try {
    const data = await api.getProducts({ search: q, type, ingredient, manufacturer, page: p, limit: 20 })
    const items = Array.isArray(data) ? data : (data.items || data.data || [])

    if (p === 1) products.value = items
    else products.value.push(...items)

    hasMore.value = items.length === 20
    page.value = p

  } finally {
    loading.value = false
    loadingMore.value = false
  }
}


const selectType = (type: string) => {
  selectedType.value = type
  searchInput.value = ''
  clearIngredient()
  loadProducts(1, '', type, '')
}

const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    selectedType.value = ''
    selectedIngredient.value = ''
    ingredientInput.value = ''
    loadProducts(1, searchInput.value, '', '')
  }, 400)
}

const selectManufacturer = (manufacturer: any) => {
  const slug = manufacturer?.slug || manufacturer?.name || manufacturer
  const name = manufacturer?.name || manufacturer
  selectedManufacturer.value = slug
  searchInput.value = ''
  selectedType.value = ''
  selectedIngredient.value = ''
  ingredientInput.value = ''
  loadProducts(1, '', '', '', slug)
}

const clearManufacturer = () => {
  selectedManufacturer.value = ''
  loadProducts(1, searchInput.value, selectedType.value, selectedIngredient.value, '')
}

const loadMore = () => loadProducts(page.value + 1, searchInput.value, selectedType.value, selectedIngredient.value, selectedManufacturer.value)

// Підхоплення manufacturer з query (при переході зі сторінки товару)
const initManufacturer = route.query.manufacturer as string
if (initManufacturer) selectedManufacturer.value = initManufacturer

await loadProducts(1, searchInput.value, '', '', initManufacturer || '')
</script>


<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
