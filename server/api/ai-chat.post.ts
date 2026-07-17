import Groq from 'groq-sdk'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages, farmContext } = body

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw createError({ statusCode: 500, message: 'GROQ_API_KEY not configured' })

  const systemPrompt = `Ти AI агроном платформи AgroPoradnyk. Відповідаєш виключно українською мовою.
Ти фахівець з агрономії: захист рослин, добрива, сівозміна, шкідники, хвороби культур.
Даєш конкретні практичні поради. Якщо питання не стосується сільського господарства — ввічливо поверни розмову до агрономії.

ВАЖЛИВО — форматування препаратів і добрив:
Коли згадуєш будь-який препарат, фунгіцид, інсектицид, гербіцид, добриво або засіб захисту рослин — обов'язково пиши його назву з символом @: @Раундап, @Реглон, @Карате Зеон, @Нутрівант Плюс.
Це стосується лише конкретних комерційних назв, не загальних термінів (не додавай @ до слів "фунгіцид", "гербіцид" тощо).

Якщо відповідь містить схему обробки або живлення (кілька препаратів з дозами і фазами) — додай в кінці окремим рядком: SCHEME_DETECTED
${farmContext ? `\nКонтекст господарства:\n${farmContext}` : ''}`

  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')

  const groq = new Groq({ apiKey })
  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content
        if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })
  return sendStream(event, readable)
})
