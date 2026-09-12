import Groq from 'groq-sdk'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { tip, region } = body as {
    tip: { crop_type: string; title: string; description: string; category: string; month: number }
    region?: string
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw createError({ statusCode: 500, message: 'GROQ_API_KEY not configured' })

  const monthNames = ['', 'січні', 'лютому', 'березні', 'квітні', 'травні', 'червні', 'липні', 'серпні', 'вересні', 'жовтні', 'листопаді', 'грудні']
  const monthName = monthNames[tip.month] || ''

  const areaInfo = body.area_ha ? ` на площі ${body.area_ha} га` : ''
  const prompt = `Ти агроном-консультант для фермерських господарств. Фермер вирощує ${tip.crop_type}${areaInfo}${region ? ` в ${region} області` : ''} у промисловому масштабі.
Зараз ${monthName}. Підказка агрокалендаря: "${tip.title}" — ${tip.description}

Дай коротке практичне пояснення (3-4 речення) для фермера з комерційним господарством:
1. Чому саме зараз це важливо зробити
2. Як виконати в польових умовах (норми на га або на 100 кущів, техніка виконання)
3. Що буде якщо пропустити цей захід (економічні наслідки)

Відповідай українською, без зайвих вступів, одразу по суті. Не давай поради для домашнього саду.`

  const groq = new Groq({ apiKey })
  const completion = await groq.chat.completions.create({
    model: 'qwen/qwen3.8-27b',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.5,
  })

  const text = completion.choices[0]?.message?.content?.trim() || ''
  // Remove <think>...</think> blocks if present
  const clean = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

  return { explanation: clean }
})
