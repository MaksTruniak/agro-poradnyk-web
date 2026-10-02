// Обмеження частоти запитів для чутливих API.
// Лічильник — у базі (функція hit_rate_limit), тому спільний для всіх серверних екземплярів на Vercel.
// Якщо база недоступна — запасний лічильник у пам'яті екземпляра.

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/contact':               { max: 5,  windowMs: 60_000 },
  '/api/payment/create':        { max: 10, windowMs: 60_000 },
  '/api/calendar-explain':      { max: 20, windowMs: 60_000 },
  '/api/ai-chat':               { max: 30, windowMs: 60_000 },
  '/api/upload-image':          { max: 20, windowMs: 60_000 },
  '/api/deals/send-invoice':    { max: 5,  windowMs: 60_000 },
  '/api/email/welcome':         { max: 3,  windowMs: 60_000 },
  '/api/team/invite':           { max: 5,  windowMs: 60_000 },
  '/api/harvest/create-worker': { max: 10, windowMs: 60_000 },
  '/api/ai-generate-card':      { max: 10, windowMs: 60_000 },
  '/api/ai-summary':            { max: 10, windowMs: 60_000 },
  '/api/ai-season-report':      { max: 5,  windowMs: 60_000 },
}

const memory = new Map<string, { count: number; resetAt: number }>()

const memoryHit = (key: string, max: number, windowMs: number) => {
  const now = Date.now()
  const entry = memory.get(key)
  if (!entry || now > entry.resetAt) {
    memory.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  entry.count++
  return entry.count <= max
}

export default defineEventHandler(async (event) => {
  const path = event.path?.split('?')[0] ?? ''
  const rule = LIMITS[path]
  if (!rule) return

  // На Vercel реальну IP-адресу клієнта дає x-vercel-forwarded-for / x-real-ip
  const ip =
    getRequestHeader(event, 'x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    getRequestHeader(event, 'x-real-ip') ||
    getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'

  const key = `${ip}:${path}`
  let allowed: boolean | null = null
  try {
    const { data, error } = await serviceClient().rpc('hit_rate_limit', {
      p_key: key,
      p_max: rule.max,
      p_window_seconds: Math.round(rule.windowMs / 1000),
    })
    if (!error && typeof data === 'boolean') allowed = data
  } catch {}
  if (allowed === null) allowed = memoryHit(key, rule.max, rule.windowMs)

  if (!allowed) {
    throw createError({ statusCode: 429, message: 'Забагато запитів. Спробуйте пізніше.' })
  }
})
