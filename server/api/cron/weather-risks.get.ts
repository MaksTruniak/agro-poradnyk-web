import { createClient } from '@supabase/supabase-js'
import { regionKey } from '../../../shared/utils/regionCoords'
import { estimatePhase, effectivePhase } from '../../../shared/utils/phaseEstimate'
import { plantingStage, phasesForStage } from '../../../shared/utils/plantingStage'
import { weatherRisks, RISK_ICONS, type WeatherRisk } from '../../../shared/utils/weatherRisks'
import { guessCropGroup, isPerennialGroup } from '../../../app/utils/cropGroups'
import { sendWeatherRiskEmail } from '../../utils/email'
import { notifyUser } from '../../utils/notify'

// Щоранку: заморозки на чутливих фазах і погода для інфекцій по багаторічних насадженнях.
// Сповіщення в кабінет — про високі ризики; лист — лише про сильний заморозок у прогнозі (раз на ту саму ніч).
export default defineEventHandler(async (event) => {
  if (getHeader(event, 'authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const today = kyivToday()
  // ?dry=1 — нічого не надсилати, лише показати фазу й ризики по кожній культурі
  const dry = getQuery(event).dry === '1'
  const report: { crop: string; region: string; phase: string | null; risks: string[] }[] = []
  const now = new Date(today + 'T12:00:00')

  const [{ data: farms, error }, { data: catalog }, { data: phases }] = await Promise.all([
    supabase.from('farms').select('id, user_id, name, region, farm_crops(id, crop_type, variety, catalog_id, planting_year)').not('region', 'is', null),
    supabase.from('crop_catalog').select('id, group_key'),
    supabase.from('growth_phases').select('key, order_num, crop_groups').is('created_by', null).order('order_num'),
  ])
  if (error) throw createError({ statusCode: 500, message: error.message })

  const groupById = new Map((catalog || []).map((c: any) => [c.id, c.group_key]))
  const phasesFor = (group: string) => (phases || [])
    .filter((p: any) => !p.crop_groups?.length || p.crop_groups.includes(group)).map((p: any) => p.key as string)

  const crops = (farms || []).flatMap((f: any) => (f.farm_crops || []).map((c: any) => ({
    ...c, farm: f, group: (c.catalog_id && groupById.get(c.catalog_id)) || guessCropGroup(c.crop_type),
  }))).filter((c: any) => isPerennialGroup(c.group) && regionKey(c.farm.region))
  if (!crops.length) return { ok: true, users: 0, emails: 0 }

  // Остання відмітка фази по кожній культурі
  const current = new Map<string, { phase_key: string; observed_at: string }>()
  for (let i = 0; i < crops.length; i += 200) {
    const { data: rows } = await supabase.from('planting_phases').select('farm_crop_id, phase_key, observed_at, created_at')
      .in('farm_crop_id', crops.slice(i, i + 200).map((c: any) => c.id))
      .order('observed_at', { ascending: false }).order('created_at', { ascending: false })
    for (const r of rows || []) if (!current.has(r.farm_crop_id)) current.set(r.farm_crop_id, r)
  }

  const byUser = new Map<string, { farmIds: Set<string>; lines: string[]; frost: { key: string; line: string }[] }>()
  for (const region of new Set(crops.map((c: any) => regionKey(c.farm.region)!))) {
    let dd, fc
    try { [dd, fc] = await Promise.all([getDegreeDays(region, today), getForecast(region)]) }
    catch (e) { console.error('[weather-risks cron] weather', region, e); continue }

    for (const c of crops.filter((c: any) => regionKey(c.farm.region) === region)) {
      const stage = plantingStage(c.group, c.planting_year, now)
      const keys = phasesFor(c.group)
      const options = phasesForStage(keys, stage)
      const phase = effectivePhase(estimatePhase(c.group, dd, keys, stage, now), current.get(c.id) ?? null, options, now)
      const all = weatherRisks(c.group, phase, fc, today)
      if (dry) report.push({ crop: `${c.farm.name}: ${c.crop_type}`, region, phase, risks: all.map(r => `${r.level} ${r.title}`) })
      const risks = all.filter((r: WeatherRisk) => r.level === 'high')
      if (!risks.length) continue
      const u = byUser.get(c.farm.user_id) ?? { farmIds: new Set(), lines: [], frost: [] }
      const name = `${c.farm.name}: ${c.crop_type}${c.variety ? ` (${c.variety})` : ''}`
      for (const r of risks) {
        const line = `${RISK_ICONS[r.kind]} ${name} — ${r.title}`
        u.lines.push(line)
        if (r.kind === 'frost') u.frost.push({ key: `${c.id}:${r.date}`, line: `${line}. ${r.advice}` })
      }
      u.farmIds.add(c.farm.id)
      byUser.set(c.farm.user_id, u)
    }
  }

  if (dry) return { ok: true, today, crops: report }
  let emails = 0
  for (const [userId, u] of byUser) {
    const frostKeys = u.frost.map(f => f.key).sort()
    // Про ту саму ніч лист уже був, якщо попереднє сповіщення ще не прочитане й містить ці заморозки
    const { data: open } = await supabase.from('farm_notifications').select('data')
      .eq('user_id', userId).eq('type', 'weather_risk').eq('is_read', false).limit(1).maybeSingle()
    const alreadyMailed = new Set<string>((open?.data as any)?.frostKeys ?? [])
    const freshFrost = u.frost.filter(f => !alreadyMailed.has(f.key))
    try {
      await notifyUser(supabase, userId, {
        type: 'weather_risk',
        title: u.frost.length ? 'Загроза заморозку для насаджень' : 'Погодні ризики для насаджень',
        body: u.lines.join('\n'),
        data: { farmIds: [...u.farmIds], frostKeys: [...new Set([...alreadyMailed, ...frostKeys])] },
      })
    } catch (e) {
      console.error('[weather-risks cron] notification', userId, e)
    }
    if (!freshFrost.length) continue
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId)
      if (!userData?.user?.email) continue
      const name = userData.user.user_metadata?.name || userData.user.user_metadata?.full_name || userData.user.email.split('@')[0]
      await sendWeatherRiskEmail(userData.user.email, name, freshFrost.map(f => f.line), u.farmIds.size === 1 ? [...u.farmIds][0]! : null)
      emails++
    } catch (e) {
      console.error('[weather-risks cron] email', userId, e)
    }
  }
  return { ok: true, users: byUser.size, emails }
})
