import { regionKey } from '../../../shared/utils/regionCoords'

// Сума активних температур з 1 січня для області — для підказки фенофази
export default defineEventHandler(async (event) => {
  const region = regionKey(String(getQuery(event).region || ''))
  if (!region) throw createError({ statusCode: 400, message: 'Невідома область' })
  try {
    return await getDegreeDays(region, kyivToday())
  } catch {
    throw createError({ statusCode: 502, message: 'Погода недоступна' })
  }
})
