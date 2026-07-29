<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark">🏭 Заготівельники</h1>
      <p class="text-agro-light mt-1">Компанії та підприємці що закуповують сільськогосподарську продукцію</p>
    </div>

    <!-- Пошук + фільтр по культурі -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <div class="relative flex-1 max-w-xl">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-agro-light">🔍</span>
        <input v-model="search" class="input pl-11" placeholder="Пошук за назвою або регіоном..." />
      </div>
    </div>

    <!-- Фільтр по культурі -->
    <div v-if="allCrops.length" class="flex flex-wrap gap-2 mb-8">
      <button @click="cropFilter = ''"
        class="text-sm px-3 py-1.5 rounded-full border font-medium transition-colors"
        :class="!cropFilter ? 'bg-agro text-white border-agro' : 'bg-white text-agro-dark border-agro-border hover:border-agro'">
        Всі культури
      </button>
      <button v-for="c in allCrops" :key="c" @click="cropFilter = c"
        class="text-sm px-3 py-1.5 rounded-full border font-medium transition-colors"
        :class="cropFilter === c ? 'bg-agro text-white border-agro' : 'bg-white text-agro-dark border-agro-border hover:border-agro'">
        {{ cropEmoji(c) }} {{ c }}
      </button>
    </div>

    <div v-if="loading" class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="i in 6" :key="i" class="card animate-pulse h-36"></div>
    </div>

    <div v-else-if="filtered.length === 0" class="text-center py-20">
      <p class="text-5xl mb-4">🏭</p>
      <p class="font-bold text-agro-dark text-lg">Нічого не знайдено</p>
      <p class="text-agro-light mt-2">Спробуйте інший пошук або культуру</p>
    </div>

    <div v-else class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="buyer in filtered" :key="buyer.id" class="card hover:shadow-md transition-all flex flex-col text-left">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-2xl bg-agro-hover flex items-center justify-center font-bold text-agro text-xl shrink-0">
            {{ buyer.name?.[0]?.toUpperCase() || '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <NuxtLink :to="`/buyers/${buyer.id}`" class="font-bold text-agro-dark hover:text-agro transition-colors block truncate">{{ buyer.name }}</NuxtLink>
            <div class="flex items-center gap-1.5 flex-wrap">
              <p class="text-sm text-agro-light truncate">
                {{ buyer.city || buyer.region ? `📍 ${[buyer.city, buyer.region].filter(Boolean).join(', ')}` : '🏭 Заготівельник' }}
              </p>
              <span v-if="buyer.is_verified_buyer" class="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full font-semibold shrink-0">✅ Перевірений</span>
            </div>
          </div>
          <div v-if="buyer.buyer_rating > 0" class="text-right shrink-0">
            <p class="text-sm font-bold text-amber-500">⭐ {{ buyer.buyer_rating }}</p>
          </div>
        </div>

        <div class="flex-1 mb-4">
          <p class="text-xs text-agro-light uppercase tracking-wide mb-2">Закуповує</p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="c in buyer.crops" :key="c.id"
              class="text-xs px-2 py-0.5 rounded-full border bg-agro-bg text-agro-dark border-agro-border">
              {{ cropEmoji(c.crop_type) }} {{ c.crop_type }}
              <span v-if="c.min_qty || c.max_qty" class="text-agro-light">
                · {{ c.min_qty || '—' }}–{{ c.max_qty || '—' }} {{ c.unit }}
              </span>
            </span>
          </div>
        </div>

        <NuxtLink :to="`/buyers/${buyer.id}`" class="btn-primary w-full text-sm py-2.5 text-center block mt-auto">
          Детально →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Заготівельники — АгроПростір' })

const supabase = useSupabaseClient()
const { cropEmoji } = await import('~/utils/cropSlugs')

const search = ref('')
const cropFilter = ref('')
const buyers = ref<any[]>([])
const loading = ref(true)

const { data } = await supabase
  .from('users')
  .select('id, name, region, city, buyer_rating, buyer_reviews_count, is_verified_buyer, buyer_crops(id, crop_type, min_qty, max_qty, unit)')
  .eq('role', 'buyer')
  .order('name')

buyers.value = (data || [])
  .map((b: any) => ({ ...b, crops: b.buyer_crops || [] }))
  .filter((b: any) => b.crops.length > 0)
loading.value = false

const allCrops = computed(() => {
  const set = new Set<string>()
  buyers.value.forEach(b => b.crops.forEach((c: any) => set.add(c.crop_type)))
  return [...set].sort((a, b) => a.localeCompare(b, 'uk'))
})

const filtered = computed(() => buyers.value.filter(b => {
  const q = search.value.toLowerCase()
  const matchSearch = !q || b.name?.toLowerCase().includes(q) || b.region?.toLowerCase().includes(q) || b.city?.toLowerCase().includes(q)
  const matchCrop = !cropFilter.value || b.crops.some((c: any) => c.crop_type === cropFilter.value)
  return matchSearch && matchCrop
}))
</script>
