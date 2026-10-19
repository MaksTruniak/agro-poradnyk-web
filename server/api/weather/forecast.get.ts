import { regionKey } from '../../../shared/utils/regionCoords'

// Погодинний прогноз області (минулі 2 доби + 4 дні) — для погодних ризиків насаджень
export default defineEventHandler(async (event) => {
  const region = regionKey(String(getQuery(event).region || ''))
  if (!region) throw createError({ statusCode: 400, message: 'Невідома область' })
  try {
    return { region, today: kyivToday(), ...(await getForecast(region)) }
  } catch {
    throw createError({ statusCode: 502, message: 'Погода недоступна' })
  }
})
