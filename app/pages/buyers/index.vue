<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark flex items-center gap-2"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg> Заготівельники</h1>
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
        {{ c }}
      </button>
    </div>

    <div v-if="loading" class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="i in 6" :key="i" class="card animate-pulse h-36"></div>
    </div>

    <div v-else-if="filtered.length === 0" class="text-center py-20">
      <div class="w-16 h-16 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-4"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg></div>
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
                <template v-if="buyer.city || buyer.region"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgb(179,69,47)" stroke-width="1.7" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:2px"><path d="M12 22s7-7.4 7-12.5A7 7 0 005 9.5C5 14.6 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.3" stroke-width="1.5"/></svg>{{ [buyer.city, buyer.region].filter(Boolean).join(', ') }}</template><template v-else><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:3px"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg>Заготівельник</template>
              </p>
              <span v-if="buyer.is_verified_buyer" class="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full font-semibold shrink-0"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Перевірений</span>
            </div>
          </div>
          <div v-if="buyer.buyer_rating > 0" class="text-right shrink-0">
            <p class="text-sm font-bold text-amber-500 flex items-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> {{ buyer.buyer_rating }}</p>
          </div>
        </div>

        <div class="flex-1 mb-4">
          <p class="text-xs text-agro-light uppercase tracking-wide mb-2">Закуповує</p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="c in buyer.crops" :key="c.id"
              class="text-xs px-2 py-0.5 rounded-full border bg-agro-bg text-agro-dark border-agro-border">
              {{ c.crop_type }}
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
