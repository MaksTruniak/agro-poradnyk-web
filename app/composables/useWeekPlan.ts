// План на тиждень по всіх полях господарства (власника — і в режимі команди)
import { isPerennialGroup } from '~/utils/cropGroups'
import { regionKey } from '~~/shared/utils/regionCoords'
import { addDays, type Forecast } from '~~/shared/utils/weatherRisks'
import type { DegreeDays } from '~~/shared/utils/phaseEstimate'
import { cropPlan, sortPlan, type PlanItem, type PlanTreatment } from '~~/shared/utils/weekPlan'

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
    const [phasesRes, programsRes, journalRes, careRes, remindersRes] = await Promise.all([
      ids.length ? supabase.from('planting_phases').select('farm_crop_id, phase_key, observed_at')
        .in('farm_crop_id', ids).order('observed_at', { ascending: false }).order('created_at', { ascending: false }) : empty,
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
      weatherLoad,
    ])

    const out: PlanItem[] = []
    for (const crop of perennial) {
      const farm = farms.value.find(f => f.id === crop.farm_id)
      const w = weather[regionKey(farm?.region) ?? ''] ?? { dd: null, fc: null }
      const program: PlanTreatment[] = (programsRes.data || []).filter((p: any) => p.farm_crop_id === crop.id)
        .flatMap((p: any) => p.program_treatments || [])
      const journal = (journalRes.data || [])
        .filter((j: any) => j.farm_id === crop.farm_id && j.crop_type && crop.crop_type.startsWith(j.crop_type.split(' (')[0]))
        .map((j: any) => ({ product_name: j.product_name, status: 'done', done_at: j.treatment_date, waiting_days: j.waiting_days }))
      out.push(...cropPlan({
        crop,
        group: growthPhases.groupForCrop(crop.crop_type),
        phases: growthPhases.phasesForCrop(crop.crop_type).map(p => p.key),
        current: (phasesRes.data || []).find((r: any) => r.farm_crop_id === crop.id) ?? null,
        dd: w.dd,
        forecast: w.fc,
        program,
        journal,
        careDone: new Set((careRes.data || []).filter((c: any) => c.farm_crop_id === crop.id).map((c: any) => `${c.task_key}:${c.period}`)),
      }, w.fc?.today ?? t))
    }

    for (const r of remindersRes.data || []) {
      const date = new Date(r.scheduled_date).toLocaleDateString('sv-SE')
      const crop = crops.value.find(c => c.id === r.farm_crop_id)
      out.push({
        id: `reminder:${r.id}`, kind: 'reminder', priority: date < t ? 'high' : 'normal', date,
        icon: '🔔', title: r.description,
        detail: date < t ? 'Прострочене нагадування' : `Нагадування · ${new Date(r.scheduled_date).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`,
        farmId: r.farm_id ?? crop?.farm_id ?? null, cropId: crop?.id ?? null, reminderId: r.id,
      })
    }

    items.value = sortPlan(out)
    loading.value = false
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

  /** Перенести пункт плану в нагадування на вказаний день о 8:00 */
  const remind = async (item: PlanItem, date: string) => {
    if (!ownerId.value) return false
    const crop = cropOf(item.cropId)
    const [y, m, d] = date.split('-').map(Number)
    const { error } = await supabase.from('reminders').insert({
      user_id: ownerId.value,
      description: `${item.title}${crop ? ` — ${crop.crop_type}` : ''}`,
      type: item.kind === 'treatment' ? 'обробка' : 'інше',
      scheduled_date: new Date(y!, m! - 1, d!, 8, 0, 0).toISOString(),
      from_agronomist: false,
      farm_id: item.farmId,
      farm_crop_id: item.cropId,
    })
    return !error
  }

  return { loading, items, farms, crops, today, load, cropOf, farmOf, markCareDone, remind }
}
