<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <NuxtLink to="/catalog" class="inline-flex items-center gap-2 text-agro-light hover:text-agro mb-8 text-sm font-medium">
      ← Назад до каталогу
    </NuxtLink>

    <!-- Скелетон картки товару -->
    <div v-if="loading" class="grid gap-8 animate-pulse">
      <div class="xl:col-span-2 space-y-6">
        <div class="card">
          <div class="flex items-start gap-4 mb-6">
            <div class="w-12 h-12 bg-agro-bg rounded-xl shrink-0"></div>
            <div class="flex-1">
              <div class="h-5 bg-agro-bg rounded-full w-24 mb-3"></div>
              <div class="h-7 bg-agro-bg rounded w-2/3 mb-2"></div>
              <div class="h-4 bg-agro-bg rounded w-1/3"></div>
            </div>
          </div>
          <div class="h-4 bg-agro-bg rounded w-full mb-2"></div>
          <div class="h-4 bg-agro-bg rounded w-5/6 mb-2"></div>
          <div class="h-4 bg-agro-bg rounded w-4/6 mb-6"></div>
          <div class="h-4 bg-agro-bg rounded w-32 mb-3"></div>
          <div class="flex gap-2">
            <div class="h-8 bg-agro-bg rounded-lg w-28"></div>
            <div class="h-8 bg-agro-bg rounded-lg w-24"></div>
            <div class="h-8 bg-agro-bg rounded-lg w-32"></div>
          </div>
        </div>
        <div class="card">
          <div class="h-5 bg-agro-bg rounded w-40 mb-4"></div>
          <div class="grid sm:grid-cols-2 gap-4">
            <div v-for="i in 4" :key="i">
              <div class="h-4 bg-agro-bg rounded w-24 mb-2"></div>
              <div class="h-3 bg-agro-bg rounded w-full mb-1"></div>
              <div class="h-3 bg-agro-bg rounded w-4/5"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="product" class="grid gap-8">
      <!-- Основна інфо -->
      <div class="xl:col-span-2 space-y-6">
        <div class="card">
          <div class="flex items-start gap-4 mb-6">
            <div class="text-5xl">{{ TYPE_EMOJI[product.type] || '🌿' }}</div>
            <div class="flex-1">
              <div class="flex flex-wrap gap-2 mb-2">
                <span class="text-xs font-semibold bg-agro-hover text-agro px-3 py-1 rounded-full">
                  {{ TYPE_LABELS[product.type] || product.type }}
                </span>
              </div>
              <h1 class="text-2xl font-extrabold text-agro-dark">{{ product.name }}</h1>
              <NuxtLink
                v-if="product.manufacturer"
                :to="`/brand/${product.manufacturer?.slug || product.manufacturer}`"
                class="text-agro-light mt-1 hover:text-agro hover:underline inline-block transition-colors"
              >{{ product.manufacturer?.name || product.manufacturer }}</NuxtLink>
            </div>
          </div>

          <p v-if="product.description" class="text-agro-light leading-relaxed">{{ product.description }}</p>

          <!-- Діючі речовини -->
          <div v-if="product.active_ingredients?.length" class="mt-6">
            <p class="font-bold text-agro-dark mb-3 text-sm uppercase tracking-wide">Діючі речовини</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="ai in product.active_ingredients"
                :key="ai.name || ai"
                class="bg-agro-bg border border-agro-border text-agro-dark text-sm px-3 py-1.5 rounded-lg"
              >
                {{ ai.name || ai }}
                <span v-if="ai.concentration" class="text-agro-light"> {{ ai.concentration }}</span>
              </span>
            </div>
          </div>

          <!-- Культури та шкідники -->
          <div v-if="product.crops?.length || product.pests?.length" class="mt-6 grid sm:grid-cols-2 gap-4">
            <div v-if="product.crops?.length">
              <p class="font-bold text-agro-dark mb-2 text-sm uppercase tracking-wide">🌾 Культури</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="c in product.crops" :key="c" class="text-xs bg-agro-bg px-2 py-1 rounded-md text-agro-light">{{ c }}</span>
              </div>
            </div>
            <div v-if="product.pests?.length">
              <p class="font-bold text-agro-dark mb-2 text-sm uppercase tracking-wide">🐛 Шкідники/хвороби</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="p in product.pests" :key="p" class="text-xs bg-agro-bg px-2 py-1 rounded-md text-agro-light">{{ p }}</span>
              </div>
            </div>
          </div>

          <!-- Норма витрати -->
          <div v-if="product.dosage" class="mt-6 bg-agro-hover rounded-xl p-4">
            <p class="font-bold text-agro-dark text-sm mb-1">💧 Норма витрати</p>
            <p class="text-agro-light text-sm">{{ product.dosage }}</p>
          </div>
        </div>

        <!-- Аналоги -->
        <div v-if="analogs.length" class="card">
          <p class="font-bold text-agro-dark mb-4">🔄 Аналоги</p>
          <div class="grid sm:grid-cols-2 gap-3">
            <NuxtLink
              v-for="a in analogs.slice(0, 6)"
              :key="a.slug"
              :to="`/catalog/${a.slug}`"
              class="flex items-center gap-3 p-3 rounded-xl border border-agro-border hover:border-agro hover:bg-agro-hover transition-colors"
            >
              <span class="text-xl">{{ TYPE_EMOJI[a.type] || '🌿' }}</span>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm text-agro-dark truncate">{{ a.name }}</p>
                <p v-if="a.manufacturer" class="text-xs text-agro-light truncate">{{ a.manufacturer }}</p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

    </div>

    <div v-else class="text-center py-20">
      <p class="text-5xl mb-4">😔</p>
      <p class="font-bold text-agro-dark text-lg">Товар не знайдено</p>
      <NuxtLink to="/catalog" class="btn-primary inline-block mt-4">До каталогу</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const slug = route.params.slug as string
const api = useAgroApi()

const TYPE_EMOJI: Record<string, string> = {
  herbicide: '🌿', fungicide: '🧴', insecticide: '🐛', fertilizer: '💊',
  seed: '🌱', growth_regulator: '📈', rodenticide: '🐀', biostimulator: '⚡',
  adjuvant: '🔬', seed_treatment: '🛡️', desiccant: '☀️', inoculant: '🦠',
  bio_product: '🍃', biofungicide: '🍄', liquid_complex_fertilizer: '💧',
}

const TYPE_LABELS: Record<string, string> = {
  herbicide: 'Гербіцид', fungicide: 'Фунгіцид', insecticide: 'Інсектицид',
  fertilizer: 'Добриво', seed: 'Насіння', growth_regulator: 'Регулятор росту',
  rodenticide: 'Родентицид', biostimulator: 'Біостимулятор', adjuvant: 'Ад\'ювант',
  seed_treatment: 'Протруювач', desiccant: 'Десикант', inoculant: 'Інокулянт',
  bio_product: 'Біопрепарат', biofungicide: 'Біофунгіцид',
  liquid_complex_fertilizer: 'РКД',
}

const loading = ref(true)
const product = ref<any>(null)
const analogs = ref<any[]>([])

const { data } = await useAsyncData(`catalog-${slug}`, async () => {
  const [productData, analogsData] = await Promise.all([
    api.getProduct(slug).catch(() => null),
    api.getAnalogs(slug).catch(() => []),
  ])
  return { productData, analogsData }
})

product.value = data.value?.productData?.product || data.value?.productData || null
const analogsList = data.value?.analogsData?.analogs || data.value?.analogsData?.items || data.value?.analogsData
analogs.value = Array.isArray(analogsList) ? analogsList : []
loading.value = false

if (product.value) {
  useSeoMeta({
    title: product.value.name,
    description: `${product.value.name} — ${TYPE_LABELS[product.value.type] || ''}. ${product.value.description?.slice(0, 150) || ''}`,
    ogTitle: product.value.name,
  })
}

</script>
