<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <div v-if="loading" class="card animate-pulse h-64"></div>

    <div v-else-if="pest">
      <!-- Хлібні крихти -->
      <div class="flex items-center gap-2 text-sm text-agro-light mb-6">
        <NuxtLink to="/pests" class="hover:text-agro transition-colors">Шкідники</NuxtLink>
        <span>/</span>
        <span class="text-agro-dark">{{ pest.name }}</span>
      </div>

      <div class="card mb-6">
        <div class="flex flex-col sm:flex-row gap-6">
          <div class="w-full sm:w-48 h-48 rounded-2xl overflow-hidden bg-agro-hover shrink-0 flex items-center justify-center">
            <ProductImage :src="pest.source_image_url" :alt="pest.name"
              img-class="w-full h-full object-contain p-3"
              fallback-class="text-5xl"
              fallback-emoji="🐛" />
          </div>
          <div class="flex-1">
            <div class="flex flex-wrap gap-2 mb-3">
              <span v-if="pest.category_name" class="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                🐞 {{ pest.category_name }}
              </span>
              <span v-if="pest.culture" class="text-xs bg-agro-bg text-agro-light px-2 py-1 rounded-full">{{ pest.culture }}</span>
            </div>
            <h1 class="text-2xl font-extrabold text-agro-dark mb-1">{{ pest.name }}</h1>
            <p v-if="pest.latin_name" class="text-agro-light italic mb-4">{{ pest.latin_name }}</p>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div v-if="pest.culture" class="sm:col-span-2">
                <dt class="text-agro-light text-xs uppercase tracking-wide">Культура</dt>
                <dd class="font-medium text-agro-dark mt-0.5">{{ pest.culture }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div v-if="pest.description" class="mt-6 pt-6 border-t border-agro-border">
          <p class="text-sm text-agro-dark leading-relaxed">{{ pest.description }}</p>
        </div>
      </div>

      <!-- Препарати -->
      <div v-if="pest.products?.length">
        <h2 class="text-xl font-bold text-agro-dark mb-4">🧴 Препарати для захисту</h2>
        <div class="grid sm:grid-cols-2 gap-3">
          <NuxtLink v-for="p in pest.products" :key="p.id" :to="`/pesticides/${p.slug}`"
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
      <p class="text-4xl mb-3">🐛</p>
      <p class="font-bold text-agro-dark">Шкідника не знайдено</p>
      <NuxtLink to="/pests" class="btn-primary mt-4 inline-block text-sm py-2 px-6">← До списку</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const api = useAgroApi()

const loading = ref(true)
const pest = ref<any>(null)

const { data } = await useAsyncData(`pest-${route.params.slug}`, () =>
  api.getPest(route.params.slug as string).catch(() => null)
)

pest.value = data.value?.pest || null
loading.value = false

useHead({ title: pest.value ? `${pest.value.name} — АгроПростір` : 'Шкідник' })
</script>
