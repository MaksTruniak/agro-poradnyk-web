<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 8h16l-1.5 11a2 2 0 01-2 1.7h-9a2 2 0 01-2-1.7L4 8z" /><path d="M8 8V6a4 4 0 018 0v2" /><circle cx="10" cy="14" r="1.2" /><circle cx="14" cy="14" r="1.2" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Скоро урожай</h1>
        <p class="dash-subtitle">Коли й де фермери збиратимуть ягоди, фрукти й виноград — домовляйтесь заздалегідь</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-4">
      <button v-if="buyerCrops.length" type="button" class="ho-chip" :aria-pressed="mode === 'mine'" @click="mode = 'mine'">Що закуповую</button>
      <button type="button" class="ho-chip" :aria-pressed="mode === 'all'" @click="mode = 'all'">Усі культури</button>
      <select v-model="region" class="input ho-select" aria-label="Область">
        <option value="">Усі області</option>
        <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
      </select>
      <select v-model.number="horizon" class="input ho-select" aria-label="Період">
        <option :value="30">наступні 30 днів</option>
        <option :value="60">наступні 2 місяці</option>
        <option :value="365">увесь сезон</option>
      </select>
      <span class="text-sm text-agro-light ml-auto">{{ shown.length }} {{ plural(shown.length, 'насадження', 'насадження', 'насаджень') }}<template v-if="totalTons"> · ~{{ fmtT(totalTons) }} т очікувано</template></span>
    </div>

    <p v-if="!buyerCrops.length && !loading" class="text-sm text-agro-light mb-4">
      Додайте культури в <NuxtLink to="/dashboard/buyer-crops" class="text-agro font-semibold hover:underline">«Що закуповую»</NuxtLink> — тут залишаться лише вони, а щопонеділка приходитиме зведенка.
    </p>

    <div v-if="loading" class="space-y-3"><div v-for="i in 4" :key="i" class="card animate-pulse h-20" /></div>

    <div v-else-if="!shown.length" class="card text-center py-12 text-agro-light">
      <p class="text-3xl mb-2">🧺</p>
      <p class="font-semibold text-agro-dark mb-1">За цими умовами збору найближчим часом немає</p>
      <p class="text-sm">Спробуйте інший період або всі культури. Строк збору видно для насаджень, де фермер вказав сорт.</p>
    </div>

    <div v-else class="space-y-2" data-test="outlook-list">
      <div v-for="it in shown" :key="it.crop.id" class="ho-row" data-test="outlook-row">
        <div class="ho-when" :class="{ 'ho-when-now': it.inDays <= 0 }">
          <span class="ho-when-big">{{ it.inDays <= 0 ? 'зараз' : it.window.from.slice(8, 10) + '.' + it.window.from.slice(5, 7) }}</span>
          <span class="text-[11px]">{{ whenLabel(it.inDays) }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-agro-dark">
            {{ it.crop.crop_type }}<template v-if="it.crop.variety"> · {{ it.crop.variety }}</template>
            <span class="text-xs font-normal text-agro-light"> · {{ it.window.label }}</span>
          </p>
          <p class="text-sm text-agro-light">
            збір ~{{ formatWindow(it.window) }}
            <template v-if="it.crop.area_ha"> · {{ String(it.crop.area_ha).replace('.', ',') }} га</template>
            <template v-if="it.tons"> · <b class="text-agro-dark">~{{ fmtT(it.tons) }} т</b> за планом</template>
          </p>
          <p class="text-sm mt-0.5">
            <NuxtLink :to="`/farmer/${farmOf(it.crop.farm_id)?.user_id}`" class="text-agro font-semibold hover:underline">{{ farmerName(it.crop.farm_id) }}</NuxtLink>
            <span v-if="farmOf(it.crop.farm_id)?.region" class="text-agro-light"> · {{ farmOf(it.crop.farm_id)?.region }}</span>
          </p>
        </div>
        <NuxtLink :to="`/farmer/${farmOf(it.crop.farm_id)?.user_id}`" class="ho-btn shrink-0" data-test="outlook-contact">Домовитись →</NuxtLink>
      </div>
    </div>

    <p v-if="!loading && unknown" class="text-xs text-agro-light mt-4">
      Ще {{ unknown }} {{ plural(unknown, 'насадження', 'насадження', 'насаджень') }} без відомого строку стиглості сорту — їх видно в каталозі фермерів.
    </p>
    <p class="text-xs text-agro-light mt-6">
      Строки — орієнтовні для середнього року в центрі України; обсяг — за плановою врожайністю, яку вказав фермер. Показано лише культури, які фермери відкрили в каталозі.
    </p>
  </div>
</template>

<script setup lang="ts">
import { isPerennialGroup } from '~/utils/cropGroups'
import { demandMatches, harvestOutlook, whenLabel, type OutlookCrop } from '~~/shared/utils/harvestOutlook'
import { findVariety, formatWindow } from '~~/shared/utils/ripening'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Скоро урожай — АгроПростір' })

const supabase = useSupabaseClient() as any
const growthPhases = useGrowthPhases()
const today = new Date().toLocaleDateString('sv-SE')

const loading = ref(true)
const buyerCrops = ref<string[]>([])
const crops = ref<OutlookCrop[]>([])
const farms = ref<{ id: string; user_id: string; region: string | null }[]>([])
const names = ref<Record<string, string>>({})
const varieties = ref<any[]>([])
const mode = ref<'mine' | 'all'>('all')
const region = ref('')
const horizon = ref(60)

const farmOf = (id: string) => farms.value.find(f => f.id === id)
const farmerName = (farmId: string) => names.value[farmOf(farmId)?.user_id ?? ''] || 'Фермер'
const regions = computed(() => [...new Set(farms.value.map(f => f.region).filter(Boolean))].sort((a, b) => a!.localeCompare(b!, 'uk')) as string[])

const outlook = computed(() => harvestOutlook(crops.value, {
  today, horizon: horizon.value,
  groupOf: ct => growthPhases.groupForCrop(ct),
  varietyOf: c => findVariety(varieties.value, c.crop_type, c.variety),
}))
const filtered = computed(() => crops.value.filter(c =>
  (mode.value === 'all' || buyerCrops.value.some(b => demandMatches(b, c.crop_type)))
  && (!region.value || farmOf(c.farm_id)?.region === region.value)))
const shown = computed(() => {
  const ids = new Set(filtered.value.map(c => c.id))
  return outlook.value.filter(i => ids.has(i.crop.id))
})
const unknown = computed(() => filtered.value.length - harvestOutlook(filtered.value, {
  today, horizon: 400, groupOf: ct => growthPhases.groupForCrop(ct), varietyOf: c => findVariety(varieties.value, c.crop_type, c.variety),
}).length)
const totalTons = computed(() => shown.value.reduce((s, i) => s + (i.tons ?? 0), 0))
const fmtT = (t: number) => String(Math.round(t * 10) / 10).replace('.', ',')
const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many
}

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  const uid = session?.user?.id
  const [{ data: bc }, { data: fc }] = await Promise.all([
    uid ? supabase.from('buyer_crops').select('crop_type').eq('user_id', uid) : Promise.resolve({ data: [] }),
    supabase.from('farm_crops').select('id, farm_id, crop_type, variety, area_ha, planting_year, planned_yield_t')
      .or('show_in_catalog.is.null,show_in_catalog.eq.true'),
    growthPhases.load(),
  ])
  buyerCrops.value = [...new Set((bc || []).map((r: any) => r.crop_type))] as string[]
  if (buyerCrops.value.length) mode.value = 'mine'
  crops.value = (fc || []).filter((c: any) => isPerennialGroup(growthPhases.groupForCrop(c.crop_type)))
  const farmIds = [...new Set(crops.value.map(c => c.farm_id))]
  const varietyNames = [...new Set(crops.value.map(c => c.variety).filter(Boolean))]
  const [{ data: pf }, { data: vs }] = await Promise.all([
    farmIds.length ? supabase.from('public_farms').select('id, user_id, region').in('id', farmIds) : Promise.resolve({ data: [] }),
    varietyNames.length ? supabase.from('varieties').select('crop_type, name, ripening, harvest_from, harvest_to').in('name', varietyNames).not('ripening', 'is', null) : Promise.resolve({ data: [] }),
  ])
  farms.value = pf || []
  varieties.value = vs || []
  // Свої поля (якщо заготівельник ще й фермер) не показуємо
  crops.value = crops.value.filter(c => farmOf(c.farm_id) && farmOf(c.farm_id)!.user_id !== uid)
  const userIds = [...new Set(farms.value.map(f => f.user_id))]
  if (userIds.length) {
    const { data: pp } = await supabase.from('public_profiles').select('id, name').in('id', userIds)
    names.value = Object.fromEntries((pp || []).map((p: any) => [p.id, p.name]))
  }
  loading.value = false
})
</script>

<style scoped>
.ho-chip { font: 600 13px/1 inherit; padding: 7px 12px; border-radius: 99px; border: 1px solid rgb(214, 224, 196); background: white; color: rgb(70, 90, 64); }
.ho-chip[aria-pressed="true"] { background: rgb(47, 82, 51); border-color: rgb(47, 82, 51); color: white; }
.ho-select { width: auto; padding: 6px 10px; font-size: 13px; }
.ho-row { display: flex; align-items: center; gap: 14px; padding: 12px 14px; background: white; border: 1px solid rgb(226, 232, 214); border-radius: 14px; }
.ho-when { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 72px; flex-shrink: 0; padding: 6px 0; border-radius: 12px; background: rgb(238, 241, 227); color: rgb(70, 90, 64); text-align: center; }
.ho-when-now { background: rgb(253, 240, 214); color: rgb(130, 80, 10); }
.ho-when-big { font-family: 'Bitter', Georgia, serif; font-size: 17px; font-weight: 800; color: rgb(27, 46, 27); }
.ho-btn { padding: 6px 12px; border-radius: 9px; font-size: 13px; font-weight: 600; color: white; background: rgb(47, 82, 51); }
.ho-btn:hover { background: rgb(38, 68, 42); }
@media (max-width: 560px) { .ho-row { flex-wrap: wrap; } .ho-btn { width: 100%; text-align: center; } }
</style>
