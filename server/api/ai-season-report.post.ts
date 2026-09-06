import Groq from 'groq-sdk'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { conversations, farmName, memory } = body

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw createError({ statusCode: 500, message: 'GROQ_API_KEY not configured' })

  const groq = new Groq({ apiKey })

  const now = new Date()
  const year = now.getFullYear()

  const prompt = `Ти агроном-аналітик платформи АгроПростір. На основі консультацій сезону ${year} склади детальний агрономічний звіт українською мовою.

${farmName ? `ГОСПОДАРСТВО: ${farmName}` : ''}
${memory ? `КОНТЕКСТ ГОСПОДАРСТВА:\n${memory}\n` : ''}

КОНСУЛЬТАЦІЇ СЕЗОНУ:
${conversations}

Сформуй звіт. У кожному розділі — конкретні факти з консультацій, не загальні слова. Якщо даних недостатньо — "Недостатньо даних за сезон".

## Загальна ситуація сезону
Коротко: які культури вирощувались, які головні виклики були, загальна оцінка сезону.

## Виявлені проблеми
Перелік: хвороби, шкідники, дефіцити живлення — з назвами культур і датами якщо відомі.

## Застосовані заходи та препарати
Що реально рекомендувалось: назви препаратів, дози, фази внесення. Згрупуй по культурах.

## Ефективність та спостереження
Що спрацювало добре, що виявилось недостатнім або потребує корекції.

## Рекомендації на сезон ${year + 1}
Конкретні агрономічні поради: що змінити у сівозміні, захисті, живленні на основі досвіду цього сезону.`

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
