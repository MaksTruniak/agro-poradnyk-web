<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6l4.5 2 5-4 4.5 2 4-2v12l-4 2-4.5-2-5 4-4.5-2L3 6z"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Поля клієнтів</h1>
        <p class="dash-subtitle">Поля фермерів з активними угодами</p>
      </div>
    </div>

    <div v-if="loading" class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="i in 3" :key="i" class="card animate-pulse">
        <div class="h-5 bg-agro-bg rounded w-1/2 mb-3"></div>
        <div class="h-3 bg-agro-bg rounded w-full mb-2"></div>
        <div class="h-3 bg-agro-bg rounded w-3/4"></div>
      </div>
    </div>

    <div v-else-if="groups.length === 0" class="card text-center py-16">
      <div class="dash-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6l4.5 2 5-4 4.5 2 4-2v12l-4 2-4.5-2-5 4-4.5-2L3 6z"/>
        </svg>
      </div>
      <p class="font-bold text-agro-dark text-lg mb-2">Поки немає полів клієнтів</p>
      <p class="text-agro-light">Поля з'являться коли ви підтвердите угоду з фермером</p>
      <NuxtLink to="/dashboard/agreements" class="dash-btn-primary inline-flex mt-4">До угод →</NuxtLink>
    </div>

    <div v-else class="space-y-6">
      <div v-for="group in groups" :key="group.farmer_id">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-full bg-agro-hover flex items-center justify-center font-bold text-agro text-sm">
            {{ group.farmer_name?.[0]?.toUpperCase() || '?' }}
          </div>
          <p class="font-bold text-agro-dark">{{ group.farmer_name }}</p>
          <span class="text-xs text-agro-light">{{ group.farms.length }} {{ group.farms.length === 1 ? 'поле' : 'поля' }}</span>
        </div>
        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="farm in group.farms" :key="farm.id" class="card hover:shadow-md transition-all">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="font-bold text-agro-dark">{{ farm.name }}</h3>
                <p v-if="farm.region" class="text-xs text-agro-light flex items-center gap-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(179,69,47)" stroke-width="1.7" stroke-linejoin="round"><path d="M12 22s7-7.4 7-12.5A7 7 0 005 9.5C5 14.6 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.3" stroke-width="1.5"/></svg>
                  {{ farm.region }}
                </p>
              </div>
              <span class="font-bold text-agro text-sm">{{ farm.hectares }} га</span>
            </div>
            <div class="flex flex-wrap gap-1.5 mb-4">
              <span v-for="crop in farm.farm_crops" :key="crop.id" class="text-xs bg-agro-hover text-agro px-2 py-0.5 rounded-full">
                {{ crop.crop_type }}
              </span>
              <span v-if="!farm.farm_crops?.length" class="text-xs text-agro-light">Культур не вказано</span>
            </div>
            <div class="flex gap-2">
              <NuxtLink :to="`/dashboard/farm/${farm.id}?readOnly=1`" class="btn-outline text-sm py-2 flex-1 text-center inline-flex items-center justify-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="9" ry="6"/><circle cx="12" cy="12" r="2.5"/></svg>
                Переглянути
              </NuxtLink>
              <NuxtLink :to="`/dashboard/protection/${farm.id}`" class="btn-primary text-sm py-2 flex-1 inline-flex items-center justify-center gap-1.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Програма
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Поля клієнтів' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)
const groups = ref<any[]>([])

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }

  // Беремо активні угоди — фермери цього агронома (з farm_id якщо є)
  const { data: agreements } = await supabase.from('agreements')
    .select('farmer_id, farm_id')
    .eq('agronomist_id', user.id)
    .eq('status', 'active')

  if (!agreements?.length) { loading.value = false; return }

  const farmerIds = [...new Set(agreements.map((a: any) => a.farmer_id))]
  // farm_id з угод (якщо вказано)
  const specificFarmIds = agreements.filter((a: any) => a.farm_id).map((a: any) => a.farm_id)

  if (!specificFarmIds.length) { loading.value = false; return }

  const [farmsRes, farmersRes] = await Promise.all([
    supabase.from('farms').select('*, farm_crops(id, crop_type, area_ha)').in('id', specificFarmIds),
    supabase.from('users').select('id, name').in('id', farmerIds),
  ])

  const farmerMap = Object.fromEntries((farmersRes.data || []).map((f: any) => [f.id, f.name]))

  const grouped: Record<string, any> = {}
  for (const farm of farmsRes.data || []) {
    const fid = farm.user_id
    if (!grouped[fid]) grouped[fid] = { farmer_id: fid, farmer_name: farmerMap[fid] || 'Фермер', farms: [] }
    grouped[fid].farms.push(farm)
  }
  groups.value = Object.values(grouped)
  loading.value = false
})
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
</style>
