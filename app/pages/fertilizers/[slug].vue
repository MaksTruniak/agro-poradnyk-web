<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <NuxtLink to="/fertilizers" class="inline-flex items-center gap-1.5 text-sm text-agro-light hover:text-agro mb-6 transition-colors">
      ← Назад до добрив
    </NuxtLink>

    <div v-if="loading" class="space-y-4">
      <div class="card animate-pulse h-10 w-2/3"></div>
      <div class="card animate-pulse h-64"></div>
    </div>

    <div v-else-if="item" class="space-y-6">
      <div class="card">
        <div class="flex flex-col sm:flex-row gap-6">
          <div v-if="item.source_image_url" class="w-full sm:w-40 h-40 rounded-xl overflow-hidden bg-agro-hover shrink-0 flex items-center justify-center">
            <img :src="item.source_image_url" :alt="item.name" class="w-full h-full object-contain p-3" loading="lazy" />
          </div>
          <div v-else class="w-16 h-16 rounded-xl bg-agro-hover flex items-center justify-center text-3xl shrink-0">🌱</div>

          <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-extrabold text-agro-dark leading-snug mb-2">{{ item.name }}</h1>
            <div class="flex flex-wrap gap-2 mb-3">
              <span v-if="item.fertilizer_form" class="text-sm bg-agro-hover text-agro-light px-3 py-1 rounded-full">{{ item.fertilizer_form }}</span>
              <span v-if="item.fertilizer_type" class="text-sm bg-agro-hover text-agro-light px-3 py-1 rounded-full">{{ item.fertilizer_type }}</span>
              <span v-if="item.category_slug" class="text-sm bg-agro text-white px-3 py-1 rounded-full">{{ categoryName }}</span>
            </div>
            <p v-if="item.manufacturer" class="text-agro-light text-sm">Виробник: <span class="text-agro-dark font-medium">{{ item.manufacturer }}</span></p>
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="text-lg font-bold text-agro-dark mb-4">Характеристики</h2>
        <dl class="grid sm:grid-cols-2 gap-4">
          <div v-if="item.formula">
            <dt class="text-xs font-semibold text-agro-light uppercase tracking-wide mb-0.5">Формула</dt>
            <dd class="font-mono text-agro-dark text-sm">{{ item.formula }}</dd>
          </div>
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
        </dl>

        <div v-if="item.composition" class="mt-4 pt-4 border-t border-agro-border">
          <dt class="text-xs font-semibold text-agro-light uppercase tracking-wide mb-1.5">Склад</dt>
          <dd class="text-agro-dark text-sm leading-relaxed whitespace-pre-wrap">{{ item.composition }}</dd>
        </div>
      </div>

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
const item = ref<any>(null)
const loading = ref(true)

const CATEGORY_NAMES: Record<string, string> = {
  azotni: 'Азотні',
  fosforni: 'Фосфорні',
  kaliyni: 'Калійні',
  kompleksni: 'Комплексні',
  mikrodobriva: 'Мікродобрива',
}
const categoryName = computed(() => CATEGORY_NAMES[item.value?.category_slug] || item.value?.category_slug || '')

useHead(() => ({ title: item.value ? `${item.value.name} — АгроПорадник` : 'Добриво — АгроПорадник' }))

onMounted(async () => {
  const data = await api.getFertilizer(route.params.slug as string).catch(() => null)
  item.value = data?.fertilizer || null
  loading.value = false
})
</script>
