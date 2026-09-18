<template>
  <div class="dash-page">
    <div class="dash-head">
      <NuxtLink to="/dashboard/harvest?tab=workers" class="dash-icon-box shrink-0 hover:bg-agro-hover transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </NuxtLink>
      <div v-if="worker" class="flex items-center gap-3 flex-1 min-w-0">
        <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center shrink-0 font-bold text-agro text-sm">
          {{ worker.first_name[0] }}{{ worker.last_name[0] }}
        </div>
        <div>
          <h1 class="dash-title bitter">{{ worker.first_name }} {{ worker.last_name }}</h1>
          <p class="dash-subtitle">{{ worker.phone }}</p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-3 gap-4"><div v-for="i in 3" :key="i" class="card animate-pulse h-20"></div></div>
      <div class="card animate-pulse h-40"></div>
    </div>

    <template v-else>
      <!-- Зведення по всіх обліках -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="card text-center">
          <p class="dash-stat-num">{{ totals.kg.toFixed(1) }}</p>
          <p class="dash-stat-label">кг зібрано</p>
        </div>
        <div class="card text-center">
          <p class="dash-stat-num">{{ totals.earned.toLocaleString('uk-UA') }}</p>
          <p class="dash-stat-label">грн нараховано</p>
        </div>
        <div class="card text-center">
          <p class="dash-stat-num text-orange-500">{{ totals.debt.toLocaleString('uk-UA') }}</p>
          <p class="dash-stat-label">грн до виплати</p>
        </div>
      </div>

      <!-- По кожному обліку -->
      <div v-if="!seasons.length" class="card text-center py-12 text-agro-light">Збирач не доданий до жодного обліку</div>

      <div v-else class="space-y-4">
        <div v-for="s in seasons" :key="s.id" class="card">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex-1">
              <p class="font-bold text-agro-dark">{{ s.crop }}<span v-if="s.variety" class="font-normal text-agro-light ml-1">({{ s.variety }})</span></p>
              <p class="text-xs text-agro-light mt-0.5">{{ s._custom_price ?? s.price_per_kg }} грн/кг · {{ s.status === 'active' ? 'Активний' : 'Завершений' }}</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-agro">{{ s._kg.toFixed(1) }} кг</p>
              <p class="text-xs text-agro-light">{{ s._earned.toLocaleString('uk-UA') }} грн</p>
            </div>
          </div>

          <div v-if="s._records.length" class="space-y-1 border-t border-agro-border pt-3">
            <div v-for="r in s._records" :key="r.id" class="flex items-center gap-3 text-sm py-1.5">
              <p class="text-agro-light text-xs w-28 shrink-0">{{ formatDate(r.recorded_at) }}</p>
              <p class="flex-1 text-agro-dark font-medium">{{ r.weight_kg }} кг</p>
              <p class="font-bold text-agro">{{ Number(r.amount).toLocaleString('uk-UA') }} грн</p>
            </div>
          </div>
          <p v-else class="text-sm text-agro-light border-t border-agro-border pt-3">Записів ще немає</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const route = useRoute()
const supabase = useSupabaseClient()
const workerId = route.params.id as string

const loading = ref(true)
const worker = ref<any>(null)
const seasons = ref<any[]>([])

const totals = computed(() => {
  const kg = seasons.value.reduce((s, season) => s + season._kg, 0)
  const earned = seasons.value.reduce((s, season) => s + season._earned, 0)
  const paid = seasons.value.reduce((s, season) => s + season._paid, 0)
  return { kg, earned, paid, debt: earned - paid }
})

const formatDate = (d: string) => new Date(d).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const load = async () => {
  const { data: workerData } = await supabase
    .from('harvest_workers')
    .select('*')
    .eq('id', workerId)
    .single()
  if (!workerData) { loading.value = false; return }
  worker.value = workerData

  const { data: swData, error: swError } = await supabase
    .from('harvest_season_workers')
    .select('custom_price_per_kg, harvest_seasons(*)')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false })

  const seasonList = (swData || []).map((sw: any) => ({
    ...sw.harvest_seasons,
    _custom_price: sw.custom_price_per_kg,
    _records: [],
    _kg: 0,
    _earned: 0,
    _paid: 0,
  }))

  if (seasonList.length) {
    const seasonIds = seasonList.map((s: any) => s.id)
    const [recRes, payRes] = await Promise.all([
      supabase.from('harvest_records').select('*').eq('worker_id', workerId).in('season_id', seasonIds).order('recorded_at', { ascending: false }),
      supabase.from('harvest_payments').select('*').eq('worker_id', workerId).in('season_id', seasonIds).eq('status', 'confirmed'),
    ])

    for (const s of seasonList) {
      s._records = (recRes.data || []).filter((r: any) => r.season_id === s.id)
      s._kg = s._records.reduce((sum: number, r: any) => sum + Number(r.weight_kg), 0)
      s._earned = s._records.reduce((sum: number, r: any) => sum + Number(r.amount), 0)
      s._paid = (payRes.data || []).filter((p: any) => p.season_id === s.id).reduce((sum: number, p: any) => sum + Number(p.amount), 0)
    }
  }

  seasons.value = seasonList
  loading.value = false
}

onMounted(load)
</script>
