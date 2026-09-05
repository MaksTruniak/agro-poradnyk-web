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

  const prompt = `Ти агроном-експерт. Згенеруй реалістичну технологічну карту захисту та живлення для культури: ${cropFull}${areaNote}${regionNote}.

Поверни ТІЛЬКИ валідний JSON без жодного тексту до або після нього:
{
  "phases": [
    {
      "name": "Назва фази (наприклад: Передпосівна підготовка)",
      "treatments": [
        {
          "type": "захист або підживлення або обробка або полив",
          "product_name": "Назва препарату або добрива",
          "dosage": "норма внесення (наприклад: 2 л/га або 200 кг/га)",
          "notes": "короткі примітки: що саме це (фунгіцид, інсектицид, гербіцид, добриво тощо)"
        }
      ]
    }
  ]
}

Правила для поля "type" — використовуй ТІЛЬКИ одне з цих значень:
- "захист" — для фунгіцидів, інсектицидів, гербіцидів, протруйників
- "підживлення" — для добрив (NPK, КАС, мікродобрива тощо)
- "обробка" — для регуляторів росту, прилипачів, десикантів
- "полив" — для поливу або фертигації

Вимоги:
- Від 3 до 6 фаз відповідно до реального циклу вирощування
- Кожна фаза — від 1 до 4 обробок, різноманітних (і захист, і підживлення)
- Назви препаратів — реальні агрохімікати або діючі речовини
- Дози — реалістичні
- Відповідай тільки JSON, без \`\`\`json або інших маркерів`

  const completion = await groq.chat.completions.create({
    model: 'qwen/qwen3.8-27b',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    max_tokens: 2000,
  })

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
