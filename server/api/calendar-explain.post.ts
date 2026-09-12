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

  const prompt = `Ти агроном-консультант. Фермер вирощує ${tip.crop_type}${region ? ` в ${region} області` : ''}.
Зараз ${monthName}. Підказка агрокалендаря: "${tip.title}" — ${tip.description}

Дай коротке практичне пояснення (3-4 речення):
1. Чому саме зараз це важливо зробити
2. Що конкретно використати або як виконати
3. Що буде якщо пропустити цей захід

Відповідай українською, без зайвих вступів, одразу по суті.`

  const groq = new Groq({ apiKey })
  const completion = await groq.chat.completions.create({
    model: 'qwen/qwen3-8b',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.5,
  })

  const text = completion.choices[0]?.message?.content?.trim() || ''
  // Remove <think>...</think> blocks if present
  const clean = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

  return { explanation: clean }
})
