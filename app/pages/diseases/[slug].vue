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
          <div v-if="disease.source_image_url" class="w-full sm:w-48 h-48 rounded-2xl overflow-hidden bg-agro-hover shrink-0">
            <img :src="disease.source_image_url" :alt="disease.name" class="w-full h-full object-contain p-3" />
          </div>
          <div class="flex-1">
            <div class="flex flex-wrap gap-2 mb-3">
              <span v-if="disease.category?.name" class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                {{ categoryEmoji(disease.category.slug) }} {{ disease.category.name }}
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
          <NuxtLink v-for="p in disease.products" :key="p.id" :to="`/catalog/${p.slug}`"
            class="card hover:shadow-md transition-shadow flex items-center gap-3 group">
            <div v-if="p.source_image_url" class="w-10 h-10 rounded-xl overflow-hidden bg-agro-hover shrink-0">
              <img :src="p.source_image_url" :alt="p.name" class="w-full h-full object-contain p-1" loading="lazy" />
            </div>
            <div v-else class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center text-lg shrink-0">🧴</div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-agro-dark text-sm group-hover:text-agro transition-colors truncate">{{ p.name }}</p>
              <p v-if="p.manufacturers?.name" class="text-xs text-agro-light truncate">{{ p.manufacturers.name }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-else class="card text-center py-20">
      <p class="text-4xl mb-3">🦠</p>
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

const categoryEmoji = (slug?: string) => {
  if (slug === 'grib') return '🍄'
  if (slug === 'virus') return '🦠'
  if (slug === 'bakteriya') return '🔬'
  return '🌱'
}

const { data } = await useAsyncData(`disease-${route.params.slug}`, () =>
  api.getDisease(route.params.slug as string).catch(() => null)
)

disease.value = data.value?.disease || null
loading.value = false

useHead({ title: disease.value ? `${disease.value.name} — АгроПорадник` : 'Хвороба' })
</script>
