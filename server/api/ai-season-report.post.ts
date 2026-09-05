import Groq from 'groq-sdk'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { conversations, farmName, memory } = body

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw createError({ statusCode: 500, message: 'GROQ_API_KEY not configured' })

  const groq = new Groq({ apiKey })

  const prompt = `Ти AI агроном платформи АгроПростір. На основі наданих консультацій сформуй детальний звіт сезону українською мовою.

${farmName ? `Господарство: ${farmName}` : ''}
${memory ? `Контекст господарства:\n${memory}\n` : ''}

Консультації сезону:
${conversations}

Сформуй структурований звіт з такими розділами:
## Загальна ситуація
(коротко про основні виклики сезону)

## Виявлені проблеми
(хвороби, шкідники, дефіцити)

## Застосовані заходи
(препарати, добрива, обробки що рекомендувались)

## Результати та спостереження
(що спрацювало, що ні)

## Рекомендації на наступний сезон
(конкретні поради для покращення)

Якщо інформації недостатньо по якомусь розділу — вкажи "Недостатньо даних". Будь конкретним і практичним.`

  try {
    const res = await groq.chat.completions.create({
      model: 'qwen/qwen3.8-27b',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })
    return { report: res.choices[0]?.message?.content || '' }
  } catch (err: any) {
    console.error('[ai-season-report] groq error:', err?.message, err?.status, err?.error)
    throw createError({ statusCode: err?.status || 500, message: err?.message || 'Groq error' })
  }
})
