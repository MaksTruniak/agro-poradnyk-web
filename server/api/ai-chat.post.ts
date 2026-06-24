import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages, farmContext, provider = 'groq' } = body

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

  const encoder = new TextEncoder()

  // Claude
  if (provider === 'claude') {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw createError({ statusCode: 500, message: 'ANTHROPIC_API_KEY not configured' })

    const client = new Anthropic({ apiKey })
    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })
    return sendStream(event, readable)
  }

  // Gemini
  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw createError({ statusCode: 500, message: 'GEMINI_API_KEY not configured' })

    const genai = new GoogleGenerativeAI(apiKey)
    const model = genai.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      systemInstruction: systemPrompt,
    })

    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
    const lastMessage = messages[messages.length - 1].content

    const chat = model.startChat({ history })
    const result = await chat.sendMessageStream(lastMessage)

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })
    return sendStream(event, readable)
  }

  // Groq
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw createError({ statusCode: 500, message: 'GROQ_API_KEY not configured' })

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
