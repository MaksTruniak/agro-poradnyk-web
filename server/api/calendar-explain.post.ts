import { createClient } from '@supabase/supabase-js'

// Пояснення підказки агрокалендаря. Саму підказку сервер бере з таблиці agro_calendar за id —
// довільний текст з браузера не приймається.
export default defineEventHandler(async (event) => {
  await requireAiAccess(event)
  const body = await readBody(event).catch(() => ({}))
  const tipId = body?.tipId ?? body?.tip?.id
  if (!tipId) throw createError({ statusCode: 400, message: 'tipId required' })
  const region = clampText(body?.region, 100)
  const areaHa = Number(body?.area_ha) > 0 ? Number(body.area_ha) : null

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: tip } = await supabase.from('agro_calendar').select('crop_type, title, description, month').eq('id', tipId).maybeSingle()
  if (!tip) throw createError({ statusCode: 404, message: 'Підказку не знайдено' })

  const monthNames = ['', 'січні', 'лютому', 'березні', 'квітні', 'травні', 'червні', 'липні', 'серпні', 'вересні', 'жовтні', 'листопаді', 'грудні']
  const monthName = monthNames[tip.month] || ''
  const areaInfo = areaHa ? ` на площі ${areaHa} га` : ''
  const prompt = `Ти агроном-консультант для фермерських господарств. Фермер вирощує ${tip.crop_type}${areaInfo}${region ? ` в ${region} області` : ''} у промисловому масштабі.
Зараз ${monthName}. Підказка агрокалендаря: "${tip.title}" — ${tip.description}

Дай коротке практичне пояснення (3-4 речення) для фермера з комерційним господарством:
1. Чому саме зараз це важливо зробити
2. Як виконати в польових умовах (норми на га або на 100 кущів, техніка виконання)
3. Що буде якщо пропустити цей захід (економічні наслідки)

Відповідай українською, без зайвих вступів, одразу по суті. Не давай поради для домашнього саду.`

  const explanation = await groqText('calendar-explain', { messages: [{ role: 'user', content: prompt }], max_tokens: 400, temperature: 0.5 })
  return { explanation }
})
