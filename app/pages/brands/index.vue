<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark mb-1">Виробники</h1>
      <p class="text-agro-light">{{ brands.length }} компаній</p>
    </div>

    <!-- Пошук -->
    <div class="mb-6">
      <input
        v-model="search"
        type="text"
        placeholder="Пошук виробника..."
        class="input max-w-sm"
      />
    </div>

    <!-- Скелетон -->
    <div v-if="loading" class="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="i in 12" :key="i" class="card animate-pulse">
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
    <div v-else class="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      <NuxtLink
        v-for="brand in filtered"
        :key="brand.slug"
        :to="`/brand/${brand.slug}`"
        class="card hover:shadow-md hover:border-agro transition-all group flex items-center gap-3"
      >
        <div class="w-12 h-12 rounded-xl bg-agro-hover flex items-center justify-center text-2xl shrink-0">🏭</div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-agro-dark group-hover:text-agro transition-colors truncate">{{ brand.name }}</p>
          <p v-if="brand.country" class="text-xs text-agro-light mt-0.5">📍 {{ brand.country }}</p>
          <p v-else class="text-xs text-agro-light mt-0.5">Виробник</p>
        </div>
      </NuxtLink>
    </div>

    <div v-if="!loading && filtered.length === 0" class="text-center py-16">
      <p class="text-4xl mb-3">🔍</p>
      <p class="text-agro-dark font-semibold">Нічого не знайдено</p>
      <p class="text-agro-light text-sm mt-1">Спробуйте інший запит</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { data: brandsData, pending } = useLazyAsyncData('brands-all', () =>
  $fetch<any>('/api/brands').catch(() => ({ items: [] }))
)

const brands = computed(() => brandsData.value?.items || [])
const loading = computed(() => pending.value)

const search = ref('')
const filtered = computed(() => {
  if (!search.value.trim()) return brands.value
  const q = search.value.toLowerCase()
  return brands.value.filter((b: any) => b.name.toLowerCase().includes(q))
})

useHead({ title: 'Виробники — АгроПорадник' })
</script>
