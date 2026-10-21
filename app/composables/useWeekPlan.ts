// План на тиждень по всіх полях господарства (власника — і в режимі команди)
import { isPerennialGroup } from '~/utils/cropGroups'
import { regionKey } from '~~/shared/utils/regionCoords'
import { addDays, type Forecast } from '~~/shared/utils/weatherRisks'
import type { DegreeDays } from '~~/shared/utils/phaseEstimate'
import { assemblePlan, type PlanItem } from '~~/shared/utils/weekPlan'
import { seasonTips, TIP_REMINDER_TYPE, type SeasonTip, type TipCrop } from '~~/shared/utils/seasonTips'
import { getActivePlan, isPaidFarmerPlan } from '~~/shared/utils/plan'

export interface PlanFarm { id: string; name: string; region: string | null }
export interface PlanCrop { id: string; farm_id: string; crop_type: string; variety: string | null; planting_year: number | null; area_ha: number | null }

export function useWeekPlan() {
  // Таблиці не типізовані (як і по всьому сайту) — рядки беремо як any
  const supabase = useSupabaseClient() as any
  const growthPhases = useGrowthPhases()
  const { getQueryUserId } = useTeamContext()

  const loading = ref(true)
  const ownerId = ref<string | null>(null)
  const farms = ref<PlanFarm[]>([])
  const crops = ref<PlanCrop[]>([])
  const items = ref<PlanItem[]>([])
  // Поради на цей час (за фазою й агрокалендарем) — на тарифі Бізнес
  const tips = ref<SeasonTip[]>([])
  const hasPaidPlan = ref(false)
  const tipExplanations = ref<Record<string, string>>({})
  const tipLoading = ref<Record<string, boolean>>({})
  const today = ref(new Date().toLocaleDateString('sv-SE'))

  const load = async () => {
    loading.value = true
    const uid = await getQueryUserId()
    ownerId.value = uid
    if (!uid) { loading.value = false; return }
    await growthPhases.load()

    const { data: farmRows } = await supabase.from('farms')
      .select('id, name, region, farm_crops(id, farm_id, crop_type, variety, planting_year, area_ha)')
      .eq('user_id', uid).order('name')
    farms.value = (farmRows || []).map((f: any) => ({ id: f.id, name: f.name, region: f.region }))
    crops.value = (farmRows || []).flatMap((f: any) => f.farm_crops || [])
    const perennial = crops.value.filter(c => isPerennialGroup(growthPhases.groupForCrop(c.crop_type)))
    const ids = perennial.map(c => c.id)

    // Погода — один запит на область
    const regions = [...new Set(farms.value.filter(f => perennial.some(c => c.farm_id === f.id)).map(f => regionKey(f.region)).filter(Boolean))] as string[]
    const weather: Record<string, { dd: DegreeDays | null; fc: (Forecast & { today: string }) | null }> = {}
    const weatherLoad = Promise.all(regions.map(async region => {
      const [dd, fc] = await Promise.all([
        $fetch<DegreeDays>('/api/weather/degree-days', { query: { region } }).catch(() => null),
        $fetch<Forecast & { today: string }>('/api/weather/forecast', { query: { region } }).catch(() => null),
      ])
      weather[region] = { dd, fc }
    }))

    const t = today.value
    const empty = Promise.resolve({ data: [] as any[] })
    const [phasesRes, programsRes, journalRes, careRes, remindersRes, subRes, calendarRes] = await Promise.all([
      crops.value.length ? supabase.from('planting_phases').select('farm_crop_id, phase_key, observed_at')
        .in('farm_crop_id', crops.value.map(c => c.id)).order('observed_at', { ascending: false }).order('created_at', { ascending: false }) : empty,
      ids.length ? supabase.from('protection_programs')
        .select('farm_crop_id, program_treatments(id, product_name, dosage, phase, type, status, done_at, waiting_days)')
        .in('farm_crop_id', ids) : empty,
      supabase.from('field_treatments').select('farm_id, crop_type, product_name, treatment_date, waiting_days')
        .eq('user_id', uid).not('waiting_days', 'is', null).gte('treatment_date', addDays(t, -366)),
      ids.length ? supabase.from('planting_care_log').select('farm_crop_id, task_key, period')
        .in('farm_crop_id', ids).gte('period', `${Number(t.slice(0, 4)) - 1}-01`) : empty,
      supabase.from('reminders').select('id, description, type, scheduled_date, farm_id, farm_crop_id')
        .eq('user_id', uid).is('completed_at', null)
        .gte('scheduled_date', `${addDays(t, -14)}T00:00:00`).lte('scheduled_date', `${addDays(t, 7)}T23:59:59`)
        .order('scheduled_date'),
      supabase.from('subscriptions').select('plan, expires_at').eq('user_id', uid).eq('profile', 'farmer').maybeSingle(),
      crops.value.length ? supabase.from('agro_calendar').select('id, crop_type, title, description, category, urgency')
        .eq('month', Number(t.slice(5, 7))) : empty,
      weatherLoad,
    ])
    hasPaidPlan.value = isPaidFarmerPlan(getActivePlan(subRes.data))

    const plan = assemblePlan({
      crops: crops.value,
      farmRegion: id => farms.value.find(f => f.id === id)?.region ?? null,
      groupOf: c => growthPhases.groupForCrop(c.crop_type),
      isPerennial: isPerennialGroup,
      phasesOf: c => growthPhases.phasesForCrop(c.crop_type).map(p => p.key),
      phaseRows: phasesRes.data || [],
      programs: programsRes.data || [],
      journal: journalRes.data || [],
      care: careRes.data || [],
      reminders: remindersRes.data || [],
      weather: region => weather[regionKey(region) ?? ''] ?? { dd: null, fc: null },
      today: t,
    })
    items.value = plan.items
    const tipCrops: TipCrop[] = plan.cropPhases
    tips.value = seasonTips(tipCrops, await loadPhaseTips(tipCrops), calendarRes.data || [])
    loading.value = false
  }

  const loadPhaseTips = async (list: TipCrop[]) => {
    const withPhase = list.filter(c => c.phase && c.group)
    if (!withPhase.length) return []
    const { data } = await supabase.from('phase_tips')
      .select('id, crop_group, phase_key, title, description, category, urgency, stages')
      .eq('is_published', true)
      .in('crop_group', [...new Set(withPhase.map(c => c.group))])
      .in('phase_key', [...new Set(withPhase.map(c => c.phase))])
      .order('order_num')
    return data || []
  }

  /** Пояснення поради агрокалендаря від AI (тариф Бізнес; текст сервер бере з agro_calendar за id) */
  const authHeader = useAuthHeader()
  const explainTip = async (tip: SeasonTip) => {
    if (tip.source !== 'calendar' || tipLoading.value[tip.id] || tipExplanations.value[tip.id]) return
    tipLoading.value[tip.id] = true
    try {
      const tipCrops = crops.value.filter(c => tip.cropIds.includes(c.id))
      const area = tipCrops.reduce((s, c) => s + (Number(c.area_ha) || 0), 0)
      const region = farms.value.find(f => tip.farmIds.includes(f.id) && f.region)?.region ?? ''
      const res = await $fetch<{ explanation: string }>('/api/calendar-explain', {
        method: 'POST',
        headers: await authHeader(),
        body: { tipId: tip.tipId, region, area_ha: area || null },
      })
      tipExplanations.value[tip.id] = res.explanation
    } catch {
      return false
    } finally {
      tipLoading.value[tip.id] = false
    }
    return true
  }

  const cropOf = (id: string | null) => crops.value.find(c => c.id === id) ?? null
  const farmOf = (id: string | null) => farms.value.find(f => f.id === id) ?? null

  /** Відмітити роботу з догляду виконаною */
  const markCareDone = async (item: PlanItem) => {
    if (!item.cropId || !item.careKey || !item.carePeriod) return false
    const { error } = await supabase.from('planting_care_log')
      .insert({ farm_crop_id: item.cropId, task_key: item.careKey, period: item.carePeriod })
    if (error && error.code !== '23505') return false
    items.value = items.value.filter(i => i.id !== item.id)
    return true
  }

  const addReminder = async (r: { description: string; type: string; date: string; farmId: string | null; cropId: string | null }) => {
    if (!ownerId.value) return false
    const [y, m, d] = r.date.split('-').map(Number)
    const { error } = await supabase.from('reminders').insert({
      user_id: ownerId.value,
      description: r.description,
      type: r.type,
      scheduled_date: new Date(y!, m! - 1, d!, 8, 0, 0).toISOString(),
      from_agronomist: false,
      farm_id: r.farmId,
      farm_crop_id: r.cropId,
    })
    return !error
  }

  /** Перенести пункт плану в нагадування на вказаний день о 8:00 */
  const remind = (item: PlanItem, date: string) => {
    const crop = cropOf(item.cropId)
    return addReminder({
      description: `${item.title}${crop ? ` — ${crop.crop_type}` : ''}`,
      type: item.kind === 'treatment' ? 'обробка' : 'інше',
      date, farmId: item.farmId, cropId: item.cropId,
    })
  }

  /** Порада → нагадування; прив'язка до насадження, лише якщо порада стосується одного */
  const remindTip = (tip: SeasonTip, date: string) => {
    const one = tip.cropIds.length === 1 ? cropOf(tip.cropIds[0]!) : null
    return addReminder({
      description: `${tip.title} — ${one?.crop_type ?? tip.crop_type}`,
      type: TIP_REMINDER_TYPE[tip.category] ?? 'інше',
      date, farmId: one?.farm_id ?? (tip.farmIds.length === 1 ? tip.farmIds[0]! : null), cropId: one?.id ?? null,
    })
  }

  return {
    loading, items, farms, crops, today, load, cropOf, farmOf, markCareDone, remind,
    tips, hasPaidPlan, tipExplanations, tipLoading, explainTip, remindTip,
  }
}
