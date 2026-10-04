const TREATMENT_TYPES = ['захист', 'підживлення', 'обробка', 'полив']

/** Відповідь моделі → перевірена структура техкарти (браузер вставляє її в базу як є) */
function parseCard(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  let parsed: any
  try { parsed = JSON.parse(jsonMatch[0]) } catch { return null }
  if (!Array.isArray(parsed?.phases)) return null
  const phases = parsed.phases.slice(0, 8).map((p: any) => ({
    name: clampText(p?.name, 100).trim(),
    treatments: (Array.isArray(p?.treatments) ? p.treatments : []).slice(0, 6).map((t: any) => ({
      type: TREATMENT_TYPES.includes(t?.type) ? t.type : 'обробка',
      product_name: clampText(t?.product_name, 150).trim(),
      dosage: clampText(t?.dosage, 100).trim(),
      notes: clampText(t?.notes, 300).trim(),
    })).filter((t: any) => t.product_name),
  })).filter((p: any) => p.name && p.treatments.length)
  return phases.length ? { phases } : null
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const cropType = clampText(body?.cropType, 100).trim()
  const variety = clampText(body?.variety, 100).trim()
  const region = clampText(body?.region, 100).trim()
  const areaHa = Number(body?.areaHa) > 0 ? Number(body.areaHa) : null

  if (!cropType) {
    await requireAiAccess(event)  // без входу — 401, а не 400
    throw createError({ statusCode: 400, message: 'cropType required' })
  }

  const usage = { text: 1 }
  const access = await requireAiAccess(event, usage)

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

  let card: ReturnType<typeof parseCard> = null
  try {
    // Міркування моделі (<think>) прибирає groqText — інакше дужки з них ламали пошук JSON
    const text = await groqText('ai-generate-card', {
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 2000,
    })
    card = parseCard(text)
  } catch (err) {
    await releaseAiUsage(access, usage)
    throw err
  }
  if (!card) {
    await releaseAiUsage(access, usage)
    throw createError({ statusCode: 502, message: 'AI повернув некоректну карту. Спробуйте ще раз.' })
  }
  return card
})
