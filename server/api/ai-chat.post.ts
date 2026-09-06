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

  const now = new Date()
  const monthNames = ['січень','лютий','березень','квітень','травень','червень','липень','серпень','вересень','жовтень','листопад','грудень']
  const currentMonth = monthNames[now.getMonth()]
  const currentYear = now.getFullYear()
  const season = now.getMonth() >= 2 && now.getMonth() <= 4 ? 'весна' : now.getMonth() >= 5 && now.getMonth() <= 7 ? 'літо' : now.getMonth() >= 8 && now.getMonth() <= 10 ? 'осінь' : 'зима'

  const systemPrompt = `Ти AI агроном платформи АгроПростір — спеціалізованої агрономічної платформи для українських фермерів.
Відповідаєш ВИКЛЮЧНО українською мовою. Жодного слова по-російськи, навіть якщо питання задане по-російськи — відповідай українською.

ТВОЯ СПЕЦІАЛІЗАЦІЯ — виключно сільське господарство та агрономія:
- захист рослин (хвороби, шкідники, бур'яни, фунгіциди, інсектициди, гербіциди)
- живлення та добрива (макро- та мікроелементи, листове підживлення, КАС, NPK)
- агротехніка (сівозміна, обробіток ґрунту, строки сівби, норми висіву)
- зрошення, десикація, збирання врожаю
- насінництво, сорти, гібриди культур

КАТЕГОРИЧНО не відповідаєш на теми поза агрономією (погода загального характеру, політика, фінанси, IT, медицина тощо). Якщо питання не про агро — одне речення: "Я агрономічний асистент і можу допомогти лише з питаннями сільського господарства. Запитайте про ваші культури, захист або живлення."

КОНТЕКСТ ЧАСУ: зараз ${currentMonth} ${currentYear} року, ${season}. Враховуй це у рекомендаціях — які фази вегетації зараз актуальні, які роботи типові для цього сезону.

ВИМОГИ ДО ВІДПОВІДІ:
- Коротке просте питання → коротка конкретна відповідь (3-7 речень)
- Питання про схему, програму, технологію → детальна структурована відповідь з дозами і строками
- Завжди пиши хімічні елементи українською: залізо, мідь, цинк, марганець, бор, молібден (не "железо", "медь")
- Всі препарати мають бути зареєстровані та доступні в Україні
- Дози — реалістичні для українських умов

ФОРМАТУВАННЯ ПРЕПАРАТІВ — ОБОВ'ЯЗКОВО:
Кожну конкретну комерційну назву препарату, фунгіциду, інсектициду, гербіциду або добрива пиши з символом @.
Приклади: @Раундап, @Реглон, @Карате Зеон, @Нутрівант Плюс, @КАС-32, @Амістар Екстра.
НЕ додавай @ до загальних термінів: фунгіцид, інсектицид, добриво, сечовина як клас.

СПЕЦІАЛЬНІ МАРКЕРИ (лише якщо умова виконана):
1. Якщо відповідь містить схему обробки або живлення з кількома препаратами і фазами → додай окремим рядком в кінці: SCHEME_DETECTED
2. Якщо рекомендуєш конкретну дію через N днів → додай: REMINDER:Назва дії|кількість_днів (наприклад: REMINDER:Повторна обробка @Децисом|10). Тільки якщо є чіткий строк.
${weatherInfo ? `\nПОТОЧНА ПОГОДА (${region}):\n${weatherInfo}\nВраховуй погодні умови у рекомендаціях.` : ''}
${farmContext ? `\nДАНІ ГОСПОДАРСТВА ФЕРМЕРА:\n${farmContext}\nВикористовуй цей контекст для персоналізованих порад.` : ''}`

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
