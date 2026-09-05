import Groq from 'groq-sdk'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages, prevSummary } = body

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw createError({ statusCode: 500, message: 'GROQ_API_KEY not configured' })

  const groq = new Groq({ apiKey })

  const prompt = `Ти помічник агронома. Проаналізуй цю розмову і склади короткий підсумок (3-5 речень) що буде корисний в майбутніх консультаціях з цим фермером.

Включи:
- Які проблеми або запитання були (хвороби, шкідники, добрива тощо)
- Які препарати або методи рекомендувались
- Стан культур якщо згадувався
- Будь-які важливі факти про господарство

${prevSummary ? `Попередній контекст про цього фермера:\n${prevSummary}\n\nДоповни або оновити його новою інформацією.` : ''}

Розмова:
${messages.map((m: any) => `${m.role === 'user' ? 'Фермер' : 'AI'}: ${m.content}`).join('\n')}

Дай лише підсумок без зайвих слів.`

  const res = await groq.chat.completions.create({
    model: 'qwen/qwen3.8-27b',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  return { summary: res.choices[0]?.message?.content || '' }
})
