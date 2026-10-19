import { REGION_COORDS } from '../../shared/utils/regionCoords'
import { degreeDays, type DegreeDays } from '../../shared/utils/phaseEstimate'
import type { Forecast } from '../../shared/utils/weatherRisks'

// Погода області з Open-Meteo. Вона однакова для всіх, тож кеш спільний: одна відповідь на область.

export const kyivToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' })

/** Сума активних температур з 1 січня (кеш 6 год) */
export const getDegreeDays = defineCachedFunction(async (region: string, today: string): Promise<DegreeDays & { region: string; date: string }> => {
  const { lat, lon } = REGION_COORDS[region]!
  const data: any = await $fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}`
    + `&start_date=${today.slice(0, 4)}-01-01&end_date=${today}&daily=temperature_2m_mean&timezone=Europe%2FKyiv`, { timeout: 10_000 })
  const means: (number | null)[] | undefined = data?.daily?.temperature_2m_mean
  if (!Array.isArray(means)) throw new Error('Open-Meteo: немає даних')
  return { region, date: today, gdd5: degreeDays(means, 5), gdd10: degreeDays(means, 10) }
}, { maxAge: 6 * 60 * 60, name: 'degree-days', getKey: (region: string, today: string) => `${region}:${today}` })

/** Минулі 2 доби + прогноз на 4 дні, погодинно (кеш 1 год) */
export const getForecast = defineCachedFunction(async (region: string): Promise<Forecast> => {
  const { lat, lon } = REGION_COORDS[region]!
  const data: any = await $fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + '&hourly=temperature_2m,relative_humidity_2m,precipitation'
    + '&daily=temperature_2m_min,temperature_2m_mean,precipitation_sum'
    + '&past_days=2&forecast_days=4&timezone=Europe%2FKyiv', { timeout: 10_000 })
  if (!Array.isArray(data?.daily?.time) || !Array.isArray(data?.hourly?.time)) throw new Error('Open-Meteo: немає прогнозу')
  return {
    daily: { time: data.daily.time, tmin: data.daily.temperature_2m_min, tmean: data.daily.temperature_2m_mean, precip: data.daily.precipitation_sum },
    hourly: { time: data.hourly.time, temp: data.hourly.temperature_2m, rh: data.hourly.relative_humidity_2m, precip: data.hourly.precipitation },
  }
}, { maxAge: 60 * 60, name: 'forecast', getKey: (region: string) => region })
