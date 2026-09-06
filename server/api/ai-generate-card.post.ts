import Groq from 'groq-sdk'

export default defineEventHandler(async (event) => {
  const { cropType, variety, region, areaHa } = await readBody(event)

  if (!cropType) throw createError({ statusCode: 400, message: 'cropType required' })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw createError({ statusCode: 500, message: 'GROQ_API_KEY not configured' })

  const groq = new Groq({ apiKey })

  const cropFull = variety ? `${cropType} (${variety})` : cropType
  const areaNote = areaHa ? `, площа ${areaHa} га` : ''
  const regionNote = region ? `, регіон: ${region}` : ''

  const now = new Date()
  const monthNames = ['січень','лютий','березень','квітень','травень','червень','липень','серпень','вересень','жовтень','листопад','грудень']
  const currentMonth = monthNames[now.getMonth()]

  const prompt = `Ти агроном-експерт з агрохімічного захисту та живлення рослин в Україні. Згенеруй реалістичну технологічну карту для культури: ${cropFull}${areaNote}${regionNote}.
Поточний місяць: ${currentMonth}. Враховуй це для визначення актуальних фаз.

ВИМОГИ:
- Всі препарати — зареєстровані та реально доступні в Україні (не вигадані назви)
- Дози — реалістичні для українських умов і площі${areaHa ? ` ${areaHa} га` : ''}
- Фази — у хронологічному порядку реального циклу вирощування цієї культури
- 4–6 фаз, кожна 1–4 обробки з балансом захисту і живлення
- В полі notes — чітко вказуй клас препарату: фунгіцид, інсектицид, гербіцид, протруйник, мікродобриво, стимулятор тощо

Поверни ТІЛЬКИ валідний JSON — без тексту до або після, без \`\`\`json маркерів:
{
  "phases": [
    {
      "name": "Назва фази",
      "treatments": [
        {
          "type": "захист або підживлення або обробка або полив",
          "product_name": "Реальна назва препарату або добрива",
          "dosage": "норма внесення (наприклад: 1.5 л/га або 200 кг/га)",
          "notes": "клас і призначення: фунгіцид проти борошнистої роси тощо"
        }
      ]
    }
  ]
}

Значення поля "type" — ТІЛЬКИ одне з: "захист", "підживлення", "обробка", "полив"`

  let completion: any
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      completion = await groq.chat.completions.create({
        model: 'qwen/qwen3.8-27b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 2000,
      })
      break
    } catch (err: any) {
      const isRateLimit = err?.status === 429 || err?.error?.type === 'rate_limit_exceeded'
      if (isRateLimit && attempt < 3) {
        await new Promise(r => setTimeout(r, 2000 * attempt))
        continue
      }
      if (isRateLimit) throw createError({ statusCode: 429, message: 'Зараз велике навантаження на AI. Спробуйте за хвилину.' })
      throw err
    }
  }

  const text = completion.choices[0]?.message?.content?.trim() || ''

  // Витягуємо JSON навіть якщо модель додала зайвий текст
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw createError({ statusCode: 500, message: 'AI не повернув JSON' })

  try {
    const parsed = JSON.parse(jsonMatch[0])
    return parsed
  } catch {
    throw createError({ statusCode: 500, message: 'Помилка парсингу відповіді AI' })
  }
})
