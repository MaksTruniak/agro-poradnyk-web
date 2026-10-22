<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 11l3-3 3 2 4-4" /><path d="M3 12l4 4 3-1 3 3 3-1 5-5" /><path d="M17 6h3v3" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Хто купує</h1>
        <p class="dash-subtitle">Заготівельники, які шукають ваші культури</p>
      </div>
    </div>

    <div v-if="myCrops.length > 1" class="flex flex-wrap gap-2 mb-4">
      <button type="button" class="dm-chip" :aria-pressed="!crop" @click="crop = ''">Усі мої культури</button>
      <button v-for="c in myCrops" :key="c" type="button" class="dm-chip" :aria-pressed="crop === c" @click="crop = c">{{ c }}</button>
    </div>

    <div v-if="loading" class="space-y-3"><div v-for="i in 3" :key="i" class="card animate-pulse h-20" /></div>

    <div v-else-if="!shown.length" class="card text-center py-12 text-agro-light">
      <p class="text-3xl mb-2">🤝</p>
      <p class="font-semibold text-agro-dark mb-1">Поки ніхто не шукає {{ crop ? `«${crop}»` : 'ваші культури' }}</p>
      <p class="text-sm">Заготівельники бачать ваші насадження в каталозі й у розділі «Скоро урожай», якщо культура не прихована.</p>
    </div>

    <div v-else class="space-y-2" data-test="demand-list">
      <div v-for="d in shown" :key="d.id" class="dm-row" data-test="demand-row">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-agro-dark">
            <NuxtLink :to="`/buyers/${d.user_id}`" class="hover:underline">{{ names[d.user_id]?.name || 'Заготівельник' }}</NuxtLink>
            <span v-if="names[d.user_id]?.region" class="text-sm font-normal text-agro-light"> · {{ names[d.user_id]?.region }}</span>
          </p>
          <p class="text-sm text-agro-dark">
            {{ d.crop_type }}<template v-if="volume(d)"> · {{ volume(d) }}</template>
          </p>
          <p v-if="d.notes" class="text-sm text-agro-light mt-0.5">{{ d.notes }}</p>
        </div>
        <NuxtLink :to="`/buyers/${d.user_id}`" class="dm-btn shrink-0">Зв'язатися →</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { demandMatches } from '~~/shared/utils/harvestOutlook'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Хто купує — АгроПростір' })

const route = useRoute()
const supabase = useSupabaseClient() as any
const { getQueryUserId } = useTeamContext()

const loading = ref(true)
const crop = ref(typeof route.query.crop === 'string' ? route.query.crop : '')
const myCrops = ref<string[]>([])
const demand = ref<any[]>([])
const names = ref<Record<string, { name: string; region: string | null }>>({})

const shown = computed(() => demand.value.filter(d => crop.value
  ? demandMatches(d.crop_type, crop.value)
  : myCrops.value.some(c => demandMatches(d.crop_type, c))))
const volume = (d: any) => {
  const f = (n: number | null) => n != null ? String(n).replace('.', ',') : ''
  if (d.min_qty != null && d.max_qty != null) return `${f(d.min_qty)}–${f(d.max_qty)} ${d.unit}`
  if (d.min_qty != null) return `від ${f(d.min_qty)} ${d.unit}`
  if (d.max_qty != null) return `до ${f(d.max_qty)} ${d.unit}`
  return ''
}

onMounted(async () => {
  const uid = await getQueryUserId()
  const [{ data: farms }, { data: bc }] = await Promise.all([
    uid ? supabase.from('farms').select('farm_crops(crop_type)').eq('user_id', uid) : Promise.resolve({ data: [] }),
    supabase.from('buyer_crops').select('id, user_id, crop_type, min_qty, max_qty, unit, notes').order('created_at', { ascending: false }),
  ])
  myCrops.value = [...new Set((farms || []).flatMap((f: any) => (f.farm_crops || []).map((c: any) => c.crop_type)))] as string[]
  demand.value = (bc || []).filter((d: any) => d.user_id !== uid)
  const ids = [...new Set(demand.value.map(d => d.user_id))]
  if (ids.length) {
    const { data: pp } = await supabase.from('public_profiles').select('id, name, region').in('id', ids)
    names.value = Object.fromEntries((pp || []).map((p: any) => [p.id, { name: p.name, region: p.region }]))
  }
  loading.value = false
})
</script>

<style scoped>
.dm-chip { font: 600 13px/1 inherit; padding: 7px 12px; border-radius: 99px; border: 1px solid rgb(214, 224, 196); background: white; color: rgb(70, 90, 64); }
.dm-chip[aria-pressed="true"] { background: rgb(47, 82, 51); border-color: rgb(47, 82, 51); color: white; }
.dm-row { display: flex; align-items: center; gap: 14px; padding: 12px 14px; background: white; border: 1px solid rgb(226, 232, 214); border-radius: 14px; }
.dm-btn { padding: 6px 12px; border-radius: 9px; font-size: 13px; font-weight: 600; color: white; background: rgb(47, 82, 51); }
@media (max-width: 560px) { .dm-row { flex-wrap: wrap; } .dm-btn { width: 100%; text-align: center; } }
</style>
