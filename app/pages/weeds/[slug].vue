<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <div v-if="loading" class="card animate-pulse h-64"></div>

    <div v-else-if="weed">
      <!-- Хлібні крихти -->
      <div class="flex items-center gap-2 text-sm text-agro-light mb-6">
        <NuxtLink to="/weeds" class="hover:text-agro transition-colors">Бур'яни</NuxtLink>
        <span>/</span>
        <span class="text-agro-dark">{{ weed.name }}</span>
      </div>

      <div class="card mb-6">
        <div class="flex flex-col sm:flex-row gap-6">
          <div v-if="weed.source_image_url" class="w-full sm:w-48 h-48 rounded-2xl overflow-hidden bg-agro-hover shrink-0">
            <img :src="weed.source_image_url" :alt="weed.name" class="w-full h-full object-contain p-3" />
          </div>
          <div class="flex-1">
            <div class="flex flex-wrap gap-2 mb-3">
              <span v-if="weed.category?.name" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">{{ weed.category.name }}</span>
              <span v-if="weed.bio_class?.name" class="text-xs bg-agro-bg text-agro-light px-2 py-1 rounded-full">{{ weed.bio_class.name }}</span>
            </div>
            <h1 class="text-2xl font-extrabold text-agro-dark mb-1">{{ weed.name }}</h1>
            <p v-if="weed.latin_name" class="text-agro-light italic mb-4">{{ weed.latin_name }}</p>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div v-if="weed.family">
                <dt class="text-agro-light text-xs uppercase tracking-wide">Родина</dt>
                <dd class="font-medium text-agro-dark mt-0.5">{{ weed.family }}</dd>
              </div>
              <div v-if="weed.feeding_method">
                <dt class="text-agro-light text-xs uppercase tracking-wide">Спосіб живлення</dt>
                <dd class="font-medium text-agro-dark mt-0.5">{{ weed.feeding_method }}</dd>
              </div>
              <div v-if="weed.crops_affected" class="sm:col-span-2">
                <dt class="text-agro-light text-xs uppercase tracking-wide">Культури</dt>
                <dd class="font-medium text-agro-dark mt-0.5">{{ weed.crops_affected }}</dd>
              </div>
              <div v-if="weed.distribution_zones" class="sm:col-span-2">
                <dt class="text-agro-light text-xs uppercase tracking-wide">Зона поширення</dt>
                <dd class="font-medium text-agro-dark mt-0.5">{{ weed.distribution_zones }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div v-if="weed.description" class="mt-6 pt-6 border-t border-agro-border">
          <p class="text-sm text-agro-dark leading-relaxed">{{ weed.description }}</p>
        </div>
      </div>

      <!-- Гербіциди -->
      <div v-if="weed.herbicides?.length">
        <h2 class="text-xl font-bold text-agro-dark mb-4">🛡️ Гербіциди для боротьби</h2>
        <div class="grid sm:grid-cols-2 gap-3">
          <NuxtLink v-for="h in weed.herbicides" :key="h.id" :to="`/catalog/${h.slug}`"
            class="card hover:shadow-md transition-shadow flex items-center gap-3 group">
            <div v-if="h.source_image_url" class="w-10 h-10 rounded-xl overflow-hidden bg-agro-hover shrink-0">
              <img :src="h.source_image_url" :alt="h.name" class="w-full h-full object-contain p-1" loading="lazy" />
            </div>
            <div v-else class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center text-lg shrink-0">🧴</div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-agro-dark text-sm group-hover:text-agro transition-colors truncate">{{ h.name }}</p>
              <p v-if="h.manufacturers?.name" class="text-xs text-agro-light truncate">{{ h.manufacturers.name }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-else class="card text-center py-20">
      <p class="text-4xl mb-3">🌿</p>
      <p class="font-bold text-agro-dark">Бур'ян не знайдено</p>
      <NuxtLink to="/weeds" class="btn-primary mt-4 inline-block text-sm py-2 px-6">← До списку</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const api = useAgroApi()

const loading = ref(true)
const weed = ref<any>(null)

const { data } = await useAsyncData(`weed-${route.params.slug}`, () =>
  api.getWeed(route.params.slug as string).catch(() => null)
)

weed.value = data.value?.weed || null
loading.value = false

useHead({ title: weed.value ? `${weed.value.name} — АгроПорадник` : 'Бур\'ян' })
</script>
