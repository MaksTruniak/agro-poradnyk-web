import Groq from 'groq-sdk'

const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  'Вінницька': { lat: 49.23, lon: 28.47 },
  'Волинська': { lat: 50.74, lon: 25.32 },
  'Дніпропетровська': { lat: 48.46, lon: 35.04 },
  'Донецька': { lat: 48.02, lon: 37.80 },
  'Житомирська': { lat: 50.25, lon: 28.66 },
  'Закарпатська': { lat: 48.62, lon: 22.30 },
  'Запорізька': { lat: 47.84, lon: 35.14 },
  'Івано-Франківська': { lat: 48.92, lon: 24.71 },
  'Київська': { lat: 50.40, lon: 30.52 },
  'Кіровоградська': { lat: 48.51, lon: 32.26 },
  'Львівська': { lat: 49.84, lon: 24.03 },
  'Миколаївська': { lat: 46.97, lon: 32.00 },
  'Одеська': { lat: 46.48, lon: 30.73 },
  'Полтавська': { lat: 49.59, lon: 34.55 },
  'Рівненська': { lat: 50.62, lon: 26.25 },
  'Сумська': { lat: 50.91, lon: 34.80 },
  'Тернопільська': { lat: 49.55, lon: 25.59 },
  'Харківська': { lat: 49.99, lon: 36.23 },
  'Херсонська': { lat: 46.64, lon: 32.62 },
  'Хмельницька': { lat: 49.42, lon: 26.99 },
  'Черкаська': { lat: 49.44, lon: 32.06 },
  'Чернівецька': { lat: 48.29, lon: 25.94 },
  'Чернігівська': { lat: 51.49, lon: 31.29 },
}

async function getWeather(region: string): Promise<string | null> {
  try {
    const coords = Object.entries(REGION_COORDS).find(([key]) => region.includes(key))?.[1]
    if (!coords) return null
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&forecast_days=1&timezone=Europe%2FKyiv`
    const res = await fetch(url)
    const data = await res.json()
    const c = data.current
    const code = c.weather_code
    const condition = code === 0 ? 'ясно' : code <= 3 ? 'хмарно' : code <= 67 ? 'дощ' : code <= 77 ? 'сніг' : code <= 99 ? 'гроза' : 'мінлива хмарність'
    return `Поточна погода (${region}): ${c.temperature_2m}°C, ${condition}, вологість ${c.relative_humidity_2m}%, опади ${c.precipitation} мм, вітер ${c.wind_speed_10m} км/год`
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages, farmContext, hasImage, region } = body

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw createError({ statusCode: 500, message: 'GROQ_API_KEY not configured' })

  const weatherInfo = region ? await getWeather(region) : null

  const systemPrompt = `Ти AI агроном платформи АгроПростір. Відповідаєш ВИКЛЮЧНО українською мовою — жодного слова по-російськи.
Ти фахівець з агрономії: захист рослин, добрива, сівозміна, шкідники, хвороби культур.
Даєш конкретні практичні поради. Якщо питання не стосується сільського господарства — ввічливо поверни розмову до агрономії.
Слідкуй за мовою: залізо (не "железо"), мідь (не "медь"), цинк, марганець, бор — писати українською завжди.

ВАЖЛИВО — форматування препаратів і добрив:
Коли згадуєш будь-який препарат, фунгіцид, інсектицид, гербіцид, добриво або засіб захисту рослин — обов'язково пиши його назву з символом @: @Раундап, @Реглон, @Карате Зеон, @Нутрівант Плюс.
Це стосується лише конкретних комерційних назв, не загальних термінів (не додавай @ до слів "фунгіцид", "гербіцид" тощо).

Якщо відповідь містить схему обробки або живлення (кілька препаратів з дозами і фазами) — додай в кінці окремим рядком: SCHEME_DETECTED

Якщо ти рекомендуєш повторну обробку або дію через певну кількість днів — додай в кінці окремим рядком у форматі:
REMINDER:Назва нагадування|днів через скільки
Наприклад: REMINDER:Повторна обробка @Децисом|10
Тільки якщо є чіткий строк у відповіді.
${weatherInfo ? `\nАктуальна погода:\n${weatherInfo}` : ''}
${farmContext ? `\nКонтекст господарства:\n${farmContext}` : ''}`

  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')

  const groq = new Groq({ apiKey })
  const model = hasImage ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'qwen/qwen3.8-27b'

  const groqMessages = [{ role: 'system', content: systemPrompt }, ...messages]

  // Retry з backoff при 429 (rate limit)
  async function createStreamWithRetry(retries = 3, delayMs = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await groq.chat.completions.create({
          model,
          max_tokens: 1024,
          stream: true,
          messages: groqMessages,
        })
      } catch (err: any) {
        const isRateLimit = err?.status === 429 || err?.error?.type === 'rate_limit_exceeded'
        if (isRateLimit && attempt < retries) {
          console.warn(`[ai-chat] rate limit, retry ${attempt}/${retries} after ${delayMs}ms`)
          await new Promise(r => setTimeout(r, delayMs * attempt))
          continue
        }
        throw err
      }
    }
  }

  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')

  try {
    const stream = await createStreamWithRetry()

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of (stream as any)) {
            const text = chunk.choices[0]?.delta?.content
            if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (streamErr) {
          console.error('[ai-chat] stream error:', streamErr)
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } finally {
          controller.close()
        }
      },
    })
    return sendStream(event, readable)
  } catch (err: any) {
    const isRateLimit = err?.status === 429 || err?.error?.type === 'rate_limit_exceeded'
    console.error('[ai-chat] groq error:', err?.message, err?.status)
    if (isRateLimit) {
      throw createError({
        statusCode: 429,
        message: 'Зараз велике навантаження на AI. Спробуйте за хвилину.',
      })
    }
    throw createError({ statusCode: err?.status || 500, message: err?.message || 'Groq API error' })
  }
})
