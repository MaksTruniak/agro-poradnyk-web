import { REGION_COORDS, regionKey } from '../../../shared/utils/regionCoords'
import { degreeDays } from '../../../shared/utils/phaseEstimate'

// Сума активних температур з 1 січня для області — для підказки фенофази.
// Погода спільна для всіх, тож кеш теж спільний: одна відповідь на область на 6 годин.
export default defineCachedEventHandler(async (event) => {
  const region = regionKey(String(getQuery(event).region || ''))
  if (!region) throw createError({ statusCode: 400, message: 'Невідома область' })
  const { lat, lon } = REGION_COORDS[region]!

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' })
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}`
    + `&start_date=${today.slice(0, 4)}-01-01&end_date=${today}&daily=temperature_2m_mean&timezone=Europe%2FKyiv`
  const data: any = await $fetch(url, { timeout: 10_000 }).catch(() => null)
  const means: (number | null)[] | undefined = data?.daily?.temperature_2m_mean
  if (!Array.isArray(means)) throw createError({ statusCode: 502, message: 'Погода недоступна' })

  return { region, date: today, gdd5: degreeDays(means, 5), gdd10: degreeDays(means, 10) }
}, {
  maxAge: 6 * 60 * 60,
  name: 'degree-days',
  getKey: event => `${regionKey(String(getQuery(event).region || '')) ?? 'none'}:${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' })}`,
})
