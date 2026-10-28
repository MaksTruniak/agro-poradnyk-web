import { uniqueProducts } from '~~/shared/utils/aiProducts'

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
  // Історію чату очищає сервер: лише user/assistant, обмежена довжина, фото — лише в останньому повідомленні.
  // Чи є фото, визначає сервер (не прапорець з браузера) — від цього залежать модель і ліміт фото.
  let sanitized: ReturnType<typeof sanitizeChatMessages>
  try {
    sanitized = sanitizeChatMessages(body?.messages)
  } catch (e) {
    await requireAiAccess(event)  // без входу — 401, а не 400
    throw e
  }
  const { messages, hasImage } = sanitized
  const farmContext = clampText(body?.farmContext, AI_LIMITS.contextChars)
  const region = clampText(body?.region, 100)

  // Фото — окрема дія (3 кредити); без кредитів — 403 до виклику моделі
  const access = await requireAiAccess(event, hasImage ? 'photo' : 'chat')

  // Каталог для звірки препаратів вантажимо паралельно з відповіддю (на холодному екземплярі — кілька секунд)
  const catalog = getCatalog().catch((e) => { console.error('[ai-chat] catalog:', e); return null })
  const weatherInfo = region ? await getWeather(region) : null

  const now = new Date()
  const monthNames = ['січень','лютий','березень','квітень','травень','червень','липень','серпень','вересень','жовтень','листопад','грудень']
  const currentMonth = monthNames[now.getMonth()]
  const currentYear = now.getFullYear()
  const season = now.getMonth() >= 2 && now.getMonth() <= 4 ? 'весна' : now.getMonth() >= 5 && now.getMonth() <= 7 ? 'літо' : now.getMonth() >= 8 && now.getMonth() <= 10 ? 'осінь' : 'зима'

  // Незмінна частина інструкцій (кешується); дата, погода й дані господарства — окремо, після неї
  const context = [
    `КОНТЕКСТ ЧАСУ: зараз ${currentMonth} ${currentYear} року, ${season}. Враховуй це у рекомендаціях — які фази вегетації зараз актуальні, які роботи типові для цього сезону.`,
    weatherInfo ? `ПОТОЧНА ПОГОДА (${region}):\n${weatherInfo}\nВраховуй погодні умови у рекомендаціях.` : '',
    farmContext ? `ДАНІ ГОСПОДАРСТВА ФЕРМЕРА:\n${farmContext}\nВикористовуй цей контекст для персоналізованих порад.` : '',
  ].filter(Boolean).join('\n\n')

  let result: Awaited<ReturnType<typeof aiStream>>
  try {
    result = await aiStream(access.route!, { system: CHAT_SYSTEM_PROMPT, context, messages, cacheHistory: true }, 'ai-chat')
  } catch (err) {
    // AI не відповів — кредити повертаємо
    await releaseAiUsage(access)
    await recordAiRequest(access, null, 'error')
    throw err
  }

  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')

  const encoder = new TextEncoder()
  const send = (controller: ReadableStreamDefaultController, data: unknown) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  const readable = new ReadableStream({
    async start(controller) {
      // Спершу — скільки кредитів лишилось (для лічильника на екрані)
      send(controller, { meta: { credits: access.credits, charged: access.charged } })
      let ok = true
      let full = ''
      let counts: Record<string, number> | undefined
      try {
        for await (const text of result.text) if (text) { full += text; send(controller, { text }) }
      } catch (streamErr) {
        ok = false
        console.error('[ai-chat] stream error:', streamErr)
      } finally {
        const fin = result.finish()
        // Препарати з @ — звіряємо з каталогом після тексту: посилання на сторінку або «немає в каталозі»
        const cat = ok && !fin.refused ? await catalog : null
        if (cat) {
          const products = matchMentions(cat, full)
          if (products.length) send(controller, { products })
          const unique = uniqueProducts(products)
          counts = { products_found: unique.filter(p => p.found).length, products_unknown: unique.filter(p => !p.found && !p.generic).length }
        }
        await recordAiRequest(access, fin.usage, !ok ? 'error' : fin.refused ? 'refused' : 'ok', counts)
        if (!ok || fin.refused) await releaseAiUsage(access)
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    },
  })
  return sendStream(event, readable)
})
