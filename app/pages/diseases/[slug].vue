<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <div v-if="loading" class="card animate-pulse h-64"></div>

    <div v-else-if="disease">
      <!-- Хлібні крихти -->
      <div class="flex items-center gap-2 text-sm text-agro-light mb-6">
        <NuxtLink to="/diseases" class="hover:text-agro transition-colors">Хвороби</NuxtLink>
        <span>/</span>
        <span class="text-agro-dark">{{ disease.name }}</span>
      </div>

      <div class="card mb-6">
        <div class="flex flex-col sm:flex-row gap-6">
          <div class="w-full sm:w-48 h-48 rounded-2xl overflow-hidden bg-agro-hover shrink-0 flex items-center justify-center">
            <ProductImage :src="disease.source_image_url" :alt="disease.name"
              img-class="w-full h-full object-contain p-3"
              fallback-class="text-5xl"
              fallback-emoji="🦠" />
          </div>
          <div class="flex-1">
            <div class="flex flex-wrap gap-2 mb-3">
              <span v-if="disease.category?.name" class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium inline-flex items-center gap-1">
                <span v-html="categoryIcon(disease.category.slug)"></span> {{ disease.category.name }}
              </span>
              <span v-if="disease.culture" class="text-xs bg-agro-bg text-agro-light px-2 py-1 rounded-full">{{ disease.culture }}</span>
            </div>
            <h1 class="text-2xl font-extrabold text-agro-dark mb-1">{{ disease.name }}</h1>
            <p v-if="disease.latin_name" class="text-agro-light italic mb-4">{{ disease.latin_name }}</p>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div v-if="disease.pathogen" class="sm:col-span-2">
                <dt class="text-agro-light text-xs uppercase tracking-wide">Збудник</dt>
                <dd class="font-medium text-agro-dark mt-0.5">{{ disease.pathogen }}</dd>
              </div>
              <div v-if="disease.culture" class="sm:col-span-2">
                <dt class="text-agro-light text-xs uppercase tracking-wide">Культура</dt>
                <dd class="font-medium text-agro-dark mt-0.5">{{ disease.culture }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div v-if="disease.description" class="mt-6 pt-6 border-t border-agro-border">
          <p class="text-sm text-agro-dark leading-relaxed">{{ disease.description }}</p>
        </div>
      </div>

      <!-- Препарати -->
      <div v-if="disease.products?.length">
        <h2 class="text-xl font-bold text-agro-dark mb-4">🧴 Препарати для захисту</h2>
        <div class="grid sm:grid-cols-2 gap-3">
          <NuxtLink v-for="p in disease.products" :key="p.id" :to="`/pesticides/${p.slug}`"
            class="card hover:shadow-md transition-shadow flex items-center gap-3 group">
            <div class="w-10 h-10 rounded-xl overflow-hidden bg-agro-hover shrink-0 flex items-center justify-center">
              <ProductImage :src="p.source_image_url" :alt="p.name"
                img-class="w-full h-full object-contain p-1"
                fallback-class="text-lg" fallback-emoji="🧴" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-agro-dark text-sm group-hover:text-agro transition-colors truncate">{{ p.name }}</p>
              <p v-if="p.agro_manufacturers?.name" class="text-xs text-agro-light truncate">{{ p.agro_manufacturers.name }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-else class="card text-center py-20">
      <div class="w-16 h-16 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
      </div>
      <p class="font-bold text-agro-dark">Хворобу не знайдено</p>
      <NuxtLink to="/diseases" class="btn-primary mt-4 inline-block text-sm py-2 px-6">← До списку</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const api = useAgroApi()

const loading = ref(true)
const disease = ref<any>(null)

const categoryIcon = (slug?: string): string => {
  if (slug === 'grib') return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
  if (slug === 'virus') return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>'
  if (slug === 'bakteriya') return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 5V3M12 21v-2M5 12H3M21 12h-2"/></svg>'
  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 7 9 5 5c4 0 6 2 7 7z"/><path d="M12 12c0 0 5-3 7-7-4 0-6 2-7 7z"/></svg>'
}

const { data } = await useAsyncData(`disease-${route.params.slug}`, () =>
  api.getDisease(route.params.slug as string).catch(() => null)
)

disease.value = data.value?.disease || null
loading.value = false

useHead({ title: disease.value ? `${disease.value.name} — АгроПростір` : 'Хвороба' })
</script>
