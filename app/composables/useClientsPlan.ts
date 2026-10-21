// План на тиждень по всіх клієнтах агронома (активна співпраця): той самий assemblePlan, що й у фермера.
// Агроном читає фази, техкарти, догляд і рослини клієнтів за правилами доступу «agronomist: read».
import { isPerennialGroup } from '~/utils/cropGroups'
import { regionKey } from '~~/shared/utils/regionCoords'
import type { Forecast } from '~~/shared/utils/weatherRisks'
import type { DegreeDays } from '~~/shared/utils/phaseEstimate'
import { assemblePlan, type PlanItem } from '~~/shared/utils/weekPlan'
import { findVariety } from '~~/shared/utils/ripening'
import { getActivePlan, isAgronomistPro } from '~~/shared/utils/plan'

export interface ClientFarm { id: string; name: string; region: string | null; user_id: string }
export interface ClientCrop { id: string; farm_id: string; crop_type: string; variety: string | null; planting_year: number | null; area_ha: number | null }
export interface Client { id: string; name: string; items: PlanItem[]; urgent: number }

export function useClientsPlan() {
  const supabase = useSupabaseClient() as any
  const growthPhases = useGrowthPhases()

  const loading = ref(true)
  const isPro = ref(false)
  const uid = ref<string | null>(null)
  const farms = ref<ClientFarm[]>([])
  const crops = ref<ClientCrop[]>([])
  const clients = ref<Client[]>([])
  const today = new Date().toLocaleDateString('sv-SE')

  const load = async () => {
    loading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    uid.value = session?.user?.id ?? null
    if (!uid.value) { loading.value = false; return }

    const [{ data: sub }, { data: agreements }] = await Promise.all([
      supabase.from('subscriptions').select('plan, expires_at').eq('user_id', uid.value).eq('profile', 'agronomist').maybeSingle(),
      supabase.from('agreements').select('farmer_id').eq('agronomist_id', uid.value).eq('status', 'active'),
      growthPhases.load(),
    ])
    isPro.value = isAgronomistPro(getActivePlan(sub))
    const farmerIds = [...new Set((agreements || []).map((a: any) => a.farmer_id))] as string[]
    if (!farmerIds.length) { clients.value = []; loading.value = false; return }

    const [{ data: farmRows }, { data: profiles }] = await Promise.all([
      supabase.from('farms').select('id, name, region, user_id, farm_crops(id, farm_id, crop_type, variety, planting_year, area_ha)')
        .in('user_id', farmerIds).order('name'),
      supabase.from('public_profiles').select('id, name').in('id', farmerIds),
    ])
    farms.value = (farmRows || []).map((f: any) => ({ id: f.id, name: f.name, region: f.region, user_id: f.user_id }))
    crops.value = (farmRows || []).flatMap((f: any) => f.farm_crops || [])
    const perennial = crops.value.filter(c => isPerennialGroup(growthPhases.groupForCrop(c.crop_type)))
    const ids = perennial.map(c => c.id)

    const regions = [...new Set(farms.value.filter(f => perennial.some(c => c.farm_id === f.id)).map(f => regionKey(f.region)).filter(Boolean))] as string[]
    const weather: Record<string, { dd: DegreeDays | null; fc: (Forecast & { today: string }) | null }> = {}
    const weatherLoad = Promise.all(regions.map(async region => {
      const [dd, fc] = await Promise.all([
        $fetch<DegreeDays>('/api/weather/degree-days', { query: { region } }).catch(() => null),
        $fetch<Forecast & { today: string }>('/api/weather/forecast', { query: { region } }).catch(() => null),
      ])
      weather[region] = { dd, fc }
    }))
    const empty = Promise.resolve({ data: [] as any[] })
    const varietyNames = [...new Set(perennial.map(c => c.variety).filter(Boolean))] as string[]
    const [phasesRes, programsRes, careRes, varietiesRes] = await Promise.all([
      ids.length ? supabase.from('planting_phases').select('farm_crop_id, phase_key, observed_at')
        .in('farm_crop_id', ids).order('observed_at', { ascending: false }).order('created_at', { ascending: false }) : empty,
      ids.length ? supabase.from('protection_programs')
        .select('farm_crop_id, program_treatments(id, product_name, dosage, phase, type, status, done_at, waiting_days)')
        .in('farm_crop_id', ids) : empty,
      ids.length ? supabase.from('planting_care_log').select('farm_crop_id, task_key, period')
        .in('farm_crop_id', ids).gte('period', `${Number(today.slice(0, 4)) - 1}-01`) : empty,
      varietyNames.length ? supabase.from('varieties').select('crop_type, name, ripening, harvest_from, harvest_to')
        .in('name', varietyNames).not('ripening', 'is', null) : empty,
      weatherLoad,
    ])

    const plan = assemblePlan({
      crops: perennial,
      farmRegion: id => farms.value.find(f => f.id === id)?.region ?? null,
      groupOf: c => growthPhases.groupForCrop(c.crop_type),
      isPerennial: isPerennialGroup,
      phasesOf: c => growthPhases.phasesForCrop(c.crop_type).map(p => p.key),
      phaseRows: phasesRes.data || [],
      programs: programsRes.data || [],
      // Журнал обробок і нагадування фермера агрономові не видно
      journal: [],
      care: careRes.data || [],
      reminders: [],
      weather: region => weather[regionKey(region) ?? ''] ?? { dd: null, fc: null },
      varietyOf: c => findVariety((varietiesRes.data || []) as any[], c.crop_type, c.variety),
      today,
    })

    const nameOf = (id: string) => (profiles || []).find((p: any) => p.id === id)?.name || 'Клієнт'
    clients.value = farmerIds.map(id => {
      const farmIds = farms.value.filter(f => f.user_id === id).map(f => f.id)
      const items = plan.items.filter(i => i.farmId && farmIds.includes(i.farmId))
      return { id, name: nameOf(id), items, urgent: items.filter(i => i.priority === 'high').length }
    }).sort((a, b) => b.urgent - a.urgent || b.items.length - a.items.length || a.name.localeCompare(b.name, 'uk'))
    loading.value = false
  }

  const cropOf = (id: string | null) => crops.value.find(c => c.id === id) ?? null
  const farmOf = (id: string | null) => farms.value.find(f => f.id === id) ?? null
  const clientOf = (farmId: string | null) => clients.value.find(c => c.id === farmOf(farmId)?.user_id) ?? null

  /** Відкрити консультаційний чат з клієнтом (створити, якщо немає) з чернеткою поради */
  const writeToClient = async (farmerId: string, draft: string) => {
    if (!uid.value) return null
    const { data: existing } = await supabase.from('chats').select('id')
      .eq('farmer_id', farmerId).eq('agronomist_id', uid.value).eq('type', 'human').is('title', null).limit(1).maybeSingle()
    let chatId = existing?.id
    if (!chatId) {
      const { data: created } = await supabase.from('chats')
        .insert({ farmer_id: farmerId, agronomist_id: uid.value, type: 'human', is_unlocked: true }).select('id').single()
      chatId = created?.id
    }
    if (!chatId) return null
    await navigateTo({ path: `/dashboard/chats/${chatId}`, query: { draft } })
    return chatId
  }

  return { loading, isPro, clients, farms, crops, today, load, cropOf, farmOf, clientOf, writeToClient }
}
