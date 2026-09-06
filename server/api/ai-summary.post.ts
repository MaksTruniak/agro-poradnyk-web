import Groq from 'groq-sdk'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages, prevSummary } = body

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw createError({ statusCode: 500, message: 'GROQ_API_KEY not configured' })

  const groq = new Groq({ apiKey })

  const now = new Date()
  const monthNames = ['січень','лютий','березень','квітень','травень','червень','липень','серпень','вересень','жовтень','листопад','грудень']
  const sessionDate = `${monthNames[now.getMonth()]} ${now.getFullYear()}`

  const prompt = `Ти агрономічний асистент. Проаналізуй розмову між фермером і AI агрономом і склади структурований агрономічний підсумок для використання в наступних консультаціях.

${prevSummary ? `ПОПЕРЕДНІЙ КОНТЕКСТ ПРО ГОСПОДАРСТВО:\n${prevSummary}\n\nДоповни або онови цей контекст новою інформацією з розмови нижче.` : ''}

РОЗМОВА (${sessionDate}):
${messages.map((m: any) => `${m.role === 'user' ? 'Фермер' : 'AI агроном'}: ${typeof m.content === 'string' ? m.content : '[фото/зображення]'}`).join('\n')}

Склади підсумок у такому форматі (якщо інформації по пункту немає — пропусти пункт):
Культури: [які культури фермера згадувались]
Проблеми: [хвороби, шкідники, дефіцити що виявлені]
Препарати: [що рекомендувалось із дозами]
Господарство: [регіон, площа, особливості якщо згадувались]
Нотатки: [важливі деталі для наступних консультацій]

Відповідай тільки підсумком без зайвих слів і вступу.`

  const res = await groq.chat.completions.create({
    model: 'qwen/qwen3.8-27b',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  return { summary: res.choices[0]?.message?.content || '' }
})
