<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark">🌾 Фермери</h1>
      <p class="text-agro-light mt-1">Учасники спільноти АгроПорадник</p>
    </div>

    <!-- Пошук + фільтр -->
    <div class="flex flex-col sm:flex-row gap-3 mb-8">
      <div class="relative flex-1 max-w-xl">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-agro-light">🔍</span>
        <input v-model="search" class="input pl-11" placeholder="Пошук за ім'ям або регіоном..." />
      </div>
      <select v-model="regionFilter" class="input max-w-xs">
        <option value="">Всі регіони</option>
        <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
      </select>
    </div>

    <div v-if="loading" class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="i in 6" :key="i" class="card animate-pulse h-40"></div>
    </div>

    <div v-else-if="filtered.length === 0" class="text-center py-20">
      <p class="text-5xl mb-4">🌾</p>
      <p class="font-bold text-agro-dark text-lg">Нічого не знайдено</p>
      <p class="text-agro-light mt-2">Спробуйте інший пошук або регіон</p>
    </div>

    <div v-else class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="farmer in filtered" :key="farmer.id" class="card hover:shadow-md transition-all">
        <!-- Шапка -->
        <div class="flex items-start gap-4 mb-4">
          <div class="w-14 h-14 rounded-2xl bg-agro-hover flex items-center justify-center font-bold text-agro text-xl shrink-0">
            {{ farmer.name?.[0]?.toUpperCase() || '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-agro-dark">{{ farmer.name }}</h3>
            <p v-if="farmer.city || farmer.region" class="text-sm text-agro-light mt-0.5">
              📍 {{ [farmer.city, farmer.region].filter(Boolean).join(', ') }}
            </p>
          </div>
          <span class="text-xs bg-agro-hover text-agro px-2.5 py-1 rounded-full font-semibold shrink-0">
            {{ ROLE_LABEL[farmer.role] || 'Фермер' }}
          </span>
        </div>

        <!-- Культури -->
        <div v-if="farmer.crops?.length" class="mb-4">
          <p class="text-xs text-agro-light uppercase tracking-wide mb-2">Вирощує</p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="c in farmer.crops.slice(0, 6)" :key="c"
              class="text-xs bg-agro-bg text-agro-dark px-2 py-0.5 rounded-full border border-agro-border">
              {{ c }}
            </span>
            <span v-if="farmer.crops.length > 6" class="text-xs text-agro-light">+{{ farmer.crops.length - 6 }}</span>
          </div>
        </div>
        <div v-else class="mb-4 text-xs text-agro-light italic">Культури не вказано</div>

        <!-- Статистика -->
        <div class="flex gap-4 text-xs text-agro-light border-t border-agro-border pt-3">
          <span>🌾 {{ farmer.fields_count || 0 }} {{ pluralField(farmer.fields_count) }}</span>
          <span>📐 {{ farmer.total_ha ? farmer.total_ha + ' га' : '—' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Фермери' })

const supabase = useSupabaseClient()
const search = ref('')
const regionFilter = ref('')

const pluralField = (n: number) => {
  if (!n) return 'полів'
  if (n === 1) return 'поле'
  if (n >= 2 && n <= 4) return 'поля'
  return 'полів'
}

const { data: farmersData, pending: loading } = await useAsyncData('farmers', async () => {
  const { data: usersData, error } = await supabase
    .from('users')
    .select('id, name, region, city, role')
    .eq('role', 'farmer')
    .order('name')

  if (error || !usersData?.length) return []

  const ids = usersData.map((u: any) => u.id)
  const { data: farmsData } = await supabase
    .from('farms')
    .select('user_id, hectares, farm_crops(crop_type)')
    .in('user_id', ids)

  return usersData.map((u: any) => {
    const userFarms = (farmsData || []).filter((f: any) => f.user_id === u.id)
    const crops = [...new Set(userFarms.flatMap((f: any) => (f.farm_crops || []).map((c: any) => c.crop_type)))]
    const total_ha = userFarms.reduce((sum: number, f: any) => sum + (f.hectares || 0), 0)
    return { ...u, city: u.city || '', fields_count: userFarms.length, crops, total_ha: total_ha || null }
  })
})

const farmers = computed(() => farmersData.value || [])

const regions = computed(() => [...new Set(farmers.value.map(f => f.region).filter(Boolean))].sort())

const filtered = computed(() => farmers.value.filter(f => {
  const q = search.value.toLowerCase()
  const matchSearch = !q || f.name?.toLowerCase().includes(q) || f.region?.toLowerCase().includes(q) || f.city?.toLowerCase().includes(q)
  const matchRegion = !regionFilter.value || f.region === regionFilter.value
  return matchSearch && matchRegion
}))
</script>
