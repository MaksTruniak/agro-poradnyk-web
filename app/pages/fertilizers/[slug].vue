<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <NuxtLink to="/fertilizers" class="inline-flex items-center gap-2 text-agro-light hover:text-agro mb-8 text-sm font-medium transition-colors">
      ← Назад до добрив
    </NuxtLink>

    <!-- Скелетон -->
    <div v-if="loading" class="space-y-6 animate-pulse">
      <div class="card">
        <div class="flex items-start gap-4 mb-6">
          <div class="w-32 h-32 bg-agro-bg rounded-xl shrink-0"></div>
          <div class="flex-1">
            <div class="flex gap-2 mb-3">
              <div class="h-6 bg-agro-bg rounded-full w-24"></div>
              <div class="h-6 bg-agro-bg rounded-full w-20"></div>
            </div>
            <div class="h-7 bg-agro-bg rounded w-2/3 mb-2"></div>
            <div class="h-4 bg-agro-bg rounded w-1/3"></div>
          </div>
        </div>
        <div class="h-4 bg-agro-bg rounded w-full mb-2"></div>
        <div class="h-4 bg-agro-bg rounded w-5/6"></div>
      </div>
      <div class="card">
        <div class="h-5 bg-agro-bg rounded w-40 mb-4"></div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div v-for="i in 4" :key="i">
            <div class="h-3 bg-agro-bg rounded w-24 mb-2"></div>
            <div class="h-4 bg-agro-bg rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="item" class="space-y-6">
      <!-- Головна картка -->
      <div class="card">
        <div class="flex items-start gap-4 mb-6">
          <div class="shrink-0">
            <div class="w-32 h-32 rounded-xl bg-agro-bg flex items-center justify-center">
              <ProductImage :src="item.source_image_url" :alt="item.name"
                img-class="w-full h-full object-contain rounded-xl"
                fallback-class="text-5xl" fallback-emoji="🌱" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap gap-2 mb-2">
              <span v-if="categoryName" class="text-xs font-semibold bg-agro-hover text-agro px-3 py-1 rounded-full">{{ categoryName }}</span>
              <span v-if="item.fertilizer_form" class="text-xs font-semibold bg-agro-bg text-agro-light px-3 py-1 rounded-full">{{ item.fertilizer_form }}</span>
              <span v-if="item.fertilizer_type" class="text-xs font-semibold bg-agro-bg text-agro-light px-3 py-1 rounded-full">{{ item.fertilizer_type }}</span>
            </div>
            <h1 class="text-2xl font-extrabold text-agro-dark leading-snug">{{ item.name }}</h1>
            <p v-if="item.manufacturer" class="text-agro-light mt-1">{{ item.manufacturer }}</p>
          </div>
        </div>

        <!-- Склад -->
        <div v-if="item.composition" class="mt-2">
          <p class="font-bold text-agro-dark mb-2 text-sm uppercase tracking-wide">Склад</p>
          <p class="text-agro-dark text-sm leading-relaxed whitespace-pre-wrap">{{ item.composition }}</p>
        </div>

        <!-- Формула -->
        <div v-if="item.formula" class="mt-4 bg-agro-hover rounded-xl p-4">
          <p class="font-bold text-agro-dark text-sm mb-1">⚗️ Формула</p>
          <p class="font-mono text-agro-dark text-sm">{{ item.formula }}</p>
        </div>
      </div>

      <!-- Характеристики -->
      <div class="card">
        <h2 class="text-lg font-bold text-agro-dark mb-4">Характеристики</h2>
        <dl class="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          <div v-if="item.fertilizer_form">
            <dt class="text-xs font-semibold text-agro-light uppercase tracking-wide mb-0.5">Форма добрива</dt>
            <dd class="text-agro-dark text-sm">{{ item.fertilizer_form }}</dd>
          </div>
          <div v-if="item.fertilizer_type">
            <dt class="text-xs font-semibold text-agro-light uppercase tracking-wide mb-0.5">Тип добрива</dt>
            <dd class="text-agro-dark text-sm">{{ item.fertilizer_type }}</dd>
          </div>
          <div v-if="item.mass_fraction">
            <dt class="text-xs font-semibold text-agro-light uppercase tracking-wide mb-0.5">Масова частка</dt>
            <dd class="text-agro-dark text-sm">{{ item.mass_fraction }}</dd>
          </div>
          <div v-if="categoryName">
            <dt class="text-xs font-semibold text-agro-light uppercase tracking-wide mb-0.5">Категорія</dt>
            <dd class="text-agro-dark text-sm">{{ categoryName }}</dd>
          </div>
        </dl>
      </div>

      <!-- Джерело -->
      <div v-if="item.source_url" class="text-center">
        <a :href="item.source_url" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-sm text-agro-light hover:text-agro transition-colors">
          Джерело ↗
        </a>
      </div>
    </div>

    <div v-else class="card text-center py-16">
      <p class="text-4xl mb-3">🌱</p>
      <p class="font-bold text-agro-dark">Добриво не знайдено</p>
      <NuxtLink to="/fertilizers" class="text-agro text-sm mt-2 inline-block">← До списку добрив</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const api = useAgroApi()
const route = useRoute()
const slug = route.params.slug as string

const { data: pageData, pending } = useLazyAsyncData(`fertilizer-${slug}`, async () => {
  const data = await $fetch<any>('/api/agro', { query: { path: `/v1/fertilizers/${slug}` } }).catch(() => null)
  return data?.fertilizer || null
})

const item = computed(() => pageData.value || null)
const loading = computed(() => pending.value)

const CATEGORY_NAMES: Record<string, string> = {
  azotni: 'Азотні',
  fosforni: 'Фосфорні',
  kaliyni: 'Калійні',
  kompleksni: 'Комплексні',
  mikrodobriva: 'Мікродобрива',
}
const categoryName = computed(() => CATEGORY_NAMES[item.value?.category_slug] || item.value?.category_slug || '')

useHead(() => ({ title: item.value ? `${item.value.name} — АгроПростір` : 'Добриво — АгроПростір' }))
</script>
