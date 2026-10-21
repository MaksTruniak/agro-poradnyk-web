import { createClient } from '@supabase/supabase-js'
import { regionKey } from '../../../shared/utils/regionCoords'
import { addDays } from '../../../shared/utils/weatherRisks'
import { assemblePlan, planDigest } from '../../../shared/utils/weekPlan'
import { guessCropGroup, isPerennialGroup } from '../../../app/utils/cropGroups'
import { sendWeekPlanEmail } from '../../utils/email'
import { KYIV_TZ, notifyUser } from '../../utils/notify'

// Щопонеділка: план на тиждень по багаторічних насадженнях — лист і сповіщення в кабінет.
// Той самий план, що на сторінці /dashboard/week (assemblePlan). Хто вимкнув у налаштуваннях — не отримує.
// ?dry=1 — нічого не надсилати, повернути рядки листа; ?user=<uuid> — лише для одного власника.
export default defineEventHandler(async (event) => {
  if (getHeader(event, 'authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const q = getQuery(event)
  const dry = q.dry === '1'
  const onlyUser = typeof q.user === 'string' && /^[0-9a-f-]{36}$/i.test(q.user) ? q.user : null
  const today = kyivToday()
  const now = new Date(today + 'T12:00:00')

  let farmsQuery = supabase.from('farms').select('id, user_id, name, region, farm_crops(id, farm_id, crop_type, variety, catalog_id, planting_year)')
  if (onlyUser) farmsQuery = farmsQuery.eq('user_id', onlyUser)
  const [{ data: farms, error }, { data: catalog }, { data: phases }, { data: optedOut }] = await Promise.all([
    farmsQuery,
    supabase.from('crop_catalog').select('id, name, group_key').not('group_key', 'is', null),
    supabase.from('growth_phases').select('key, order_num, crop_groups').is('created_by', null).order('order_num'),
    supabase.from('notification_settings').select('user_id').eq('week_digest', false),
  ])
  if (error) throw createError({ statusCode: 500, message: error.message })

  const byId = new Map((catalog || []).map((c: any) => [c.id, c.group_key as string]))
  const byName = new Map((catalog || []).map((c: any) => [String(c.name).toLowerCase().trim(), c.group_key as string]))
  const groupOf = (c: any): string | null => (c.catalog_id && byId.get(c.catalog_id)) || byName.get(c.crop_type.toLowerCase().trim()) || guessCropGroup(c.crop_type)
  const phasesOf = (_c: any, group: string | null) => (phases || [])
    .filter((p: any) => !p.crop_groups?.length || (group && p.crop_groups.includes(group))).map((p: any) => p.key as string)
  const skip = new Set((optedOut || []).map((r: any) => r.user_id))

  // Власники з багаторічними насадженнями
  const owners = new Map<string, any[]>()
  for (const f of farms || []) {
    if (skip.has(f.user_id)) continue
    if (!(f.farm_crops || []).some((c: any) => isPerennialGroup(groupOf(c)))) continue
    owners.set(f.user_id, [...(owners.get(f.user_id) ?? []), f])
  }

  // Погода — один раз на область
  const weather = new Map<string, { dd: any; fc: any }>()
  const weatherFor = async (region: string | null) => {
    const key = regionKey(region)
    if (!key) return { dd: null, fc: null }
    if (!weather.has(key)) {
      const [dd, fc] = await Promise.all([getDegreeDays(key, today).catch(() => null), getForecast(key).catch(() => null)])
      weather.set(key, { dd, fc: fc ? { ...fc, today } : null })
    }
    return weather.get(key)!
  }

  const report: { userId: string; lines: unknown[]; more: number }[] = []
  let emails = 0
  for (const [userId, userFarms] of owners) {
    try {
      const crops = userFarms.flatMap((f: any) => f.farm_crops || [])
      const ids = crops.map((c: any) => c.id)
      for (const f of userFarms) await weatherFor(f.region)
      const [phaseRows, programs, journal, care, reminders] = await Promise.all([
        supabase.from('planting_phases').select('farm_crop_id, phase_key, observed_at').in('farm_crop_id', ids)
          .order('observed_at', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('protection_programs')
          .select('farm_crop_id, program_treatments(id, product_name, dosage, phase, type, status, done_at, waiting_days)').in('farm_crop_id', ids),
        supabase.from('field_treatments').select('farm_id, crop_type, product_name, treatment_date, waiting_days')
          .eq('user_id', userId).not('waiting_days', 'is', null).gte('treatment_date', addDays(today, -366)),
        supabase.from('planting_care_log').select('farm_crop_id, task_key, period').in('farm_crop_id', ids)
          .gte('period', `${Number(today.slice(0, 4)) - 1}-01`),
        supabase.from('reminders').select('id, description, scheduled_date, farm_id, farm_crop_id')
          .eq('user_id', userId).eq('from_agronomist', false).is('completed_at', null)
          .gte('scheduled_date', new Date(`${addDays(today, -14)}T00:00:00Z`).toISOString())
          .lte('scheduled_date', new Date(`${addDays(today, 8)}T00:00:00Z`).toISOString())
          .order('scheduled_date'),
      ])
      const plan = assemblePlan({
        crops,
        farmRegion: id => userFarms.find((f: any) => f.id === id)?.region ?? null,
        groupOf,
        isPerennial: isPerennialGroup,
        phasesOf,
        phaseRows: phaseRows.data || [],
        programs: programs.data || [],
        journal: journal.data || [],
        care: care.data || [],
        reminders: reminders.data || [],
        weather: region => weather.get(regionKey(region) ?? '') ?? { dd: null, fc: null },
        today,
        timeZone: KYIV_TZ,
        now,
      })
      if (!plan.items.length) continue
      const cropName = (id: string | null) => {
        const c = crops.find((c: any) => c.id === id)
        return c ? `${c.crop_type}${c.variety ? ` (${c.variety})` : ''}` : null
      }
      const digest = planDigest(plan.items, { crop: cropName, farm: id => userFarms.find((f: any) => f.id === id)?.name ?? null })
      if (dry) { report.push({ userId, lines: digest.lines, more: digest.more }); continue }

      await notifyUser(supabase, userId, {
        type: 'week_plan',
        title: digest.urgent ? `План на тиждень: ${digest.urgent} терміново` : `План на тиждень: ${plan.items.length}`,
        body: digest.lines.slice(0, 5).map(l => `${l.icon} ${l.title}${l.meta ? ` — ${l.meta}` : ''}`).join('\n'),
      }).catch(e => console.error('[week-digest cron] notification', userId, e))

      const { data: userData } = await supabase.auth.admin.getUserById(userId)
      if (!userData?.user?.email) continue
      const name = userData.user.user_metadata?.name || userData.user.user_metadata?.full_name || userData.user.email.split('@')[0]
      await sendWeekPlanEmail(userData.user.email, name, digest.lines, digest.more)
      emails++
    } catch (e) {
      console.error('[week-digest cron]', userId, e)
    }
  }
  return dry ? { ok: true, today, users: report } : { ok: true, users: owners.size, emails }
})
