<template>
  <div class="max-w-7xl mx-auto px-4 py-10">

    <div v-if="loading" class="space-y-6">
      <div class="h-8 bg-agro-hover rounded-xl w-64 animate-pulse"></div>
      <div class="h-4 bg-agro-hover rounded w-40 animate-pulse"></div>
      <div class="card animate-pulse h-40"></div>
    </div>

    <div v-else-if="!ingredient" class="text-center py-20">
      <p class="text-5xl mb-4">🔬</p>
      <p class="font-bold text-agro-dark text-lg">Речовину не знайдено</p>
      <NuxtLink to="/catalog" class="btn-primary inline-block mt-6">До каталогу</NuxtLink>
    </div>

    <div v-else>
      <!-- Хлібні крихти -->
      <nav class="text-sm text-agro-light mb-6 flex items-center gap-2">
        <NuxtLink to="/" class="hover:text-agro transition-colors">Головна</NuxtLink>
        <span>/</span>
        <NuxtLink to="/catalog" class="hover:text-agro transition-colors">Каталог</NuxtLink>
        <span>/</span>
        <span class="text-agro-dark">{{ ingredient.name }}</span>
      </nav>

      <!-- Заголовок -->
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-agro-dark">🔬 {{ ingredient.name }}</h1>
        <p v-if="latinName" class="text-agro-light mt-1 text-lg italic">{{ latinName }}</p>
      </div>

      <!-- Характеристики -->
      <div v-if="fields.length" class="card mb-8">
        <h2 class="font-bold text-agro-dark mb-4">Характеристики</h2>
        <div class="grid sm:grid-cols-2 gap-3">
          <div v-for="f in fields" :key="f.label" class="flex gap-3">
            <span class="text-agro-light text-sm min-w-[140px] shrink-0">{{ f.label }}</span>
            <span class="text-agro-dark text-sm font-medium">{{ f.value }}</span>
          </div>
        </div>
      </div>

      <!-- Препарати -->
      <div>
        <h2 class="font-bold text-agro-dark text-xl mb-4">
          Препарати з {{ ingredient.name }}
          <span class="text-agro-light font-normal text-base ml-2">({{ products.length }})</span>
        </h2>

        <div v-if="products.length === 0" class="card text-center py-10 text-agro-light">
          Препаратів поки не знайдено
        </div>

        <div v-else class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <NuxtLink
            v-for="p in products"
            :key="p.id"
            :to="`/catalog/${p.slug}`"
            class="card hover:shadow-md transition-all group"
          >
            <div class="flex items-start gap-3 mb-3">
              <img v-if="p.source_image_url" :src="p.source_image_url" :alt="p.name"
                class="w-12 h-12 object-contain rounded-lg bg-agro-bg shrink-0" />
              <div v-else class="w-12 h-12 rounded-lg bg-agro-hover flex items-center justify-center text-xl shrink-0">
                {{ typeEmoji(p.type) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-agro-dark group-hover:text-agro transition-colors">{{ p.name }}</p>
                <p v-if="p.manufacturer?.name" class="text-xs text-agro-light mt-0.5">{{ p.manufacturer.name }}</p>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs bg-agro-bg border border-agro-border text-agro-light px-2 py-0.5 rounded-full">
                {{ typeLabel(p.type) }}
              </span>
              <span v-if="p.active_ingredients?.[0]?.concentration" class="text-xs text-agro-light">
                {{ p.active_ingredients[0].concentration }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const api = useAgroApi()

const loading = ref(true)
const ingredient = ref<any>(null)
const products = ref<any[]>([])

const TYPE_EMOJI: Record<string, string> = {
  herbicide: '🌿', fungicide: '🍄', insecticide: '🐛',
  seed_treatment: '🌱', growth_regulator: '📏', rodenticide: '🐀',
}
const TYPE_LABELS: Record<string, string> = {
  herbicide: 'Гербіцид', fungicide: 'Фунгіцид', insecticide: 'Інсектицид',
  seed_treatment: 'Протруйник', growth_regulator: 'Регулятор росту', rodenticide: 'Родентицид',
}
const typeEmoji = (t: string) => TYPE_EMOJI[t] || '🧪'
const typeLabel = (t: string) => TYPE_LABELS[t] || t

// Парсимо description у зручні поля
const FIELD_LABELS: Record<string, string> = {
  'Латинська назва': 'Назва латиницею',
  'Хімічна формула': 'Формула',
  'Хімічний клас': 'Хімічний клас',
  'Механізм дії': 'Механізм дії',
  'Спосіб проникнення': 'Проникнення',
  'Способи застосування': 'Застосування',
  'Культури': 'Культури',
  'Спектр дії': 'Спектр дії',
}

const latinName = computed(() => {
  if (!ingredient.value?.description) return null
  const match = ingredient.value.description.match(/Латинська назва: (.+)/)
  return match?.[1] || null
})

const fields = computed(() => {
  if (!ingredient.value?.description) return []
  return ingredient.value.description
    .split('\n')
    .map((line: string) => {
      const [key, ...rest] = line.split(': ')
      const value = rest.join(': ').trim()
      if (!value || key === 'Латинська назва') return null
      return { label: FIELD_LABELS[key] || key, value }
    })
    .filter(Boolean)
})

useSeoMeta({
  title: computed(() => ingredient.value ? `${ingredient.value.name} — діюча речовина` : 'Діюча речовина'),
})

onMounted(async () => {
  const slug = route.params.slug as string
  try {
    const data = await api.getActiveIngredient(slug)
    ingredient.value = data.ingredient
    products.value = data.products || []
  } catch {
    ingredient.value = null
  }
  loading.value = false
})
</script>
