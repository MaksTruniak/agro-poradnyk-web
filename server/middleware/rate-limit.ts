// In-memory rate limiter for sensitive API routes
// Resets on server restart — sufficient for basic abuse prevention

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/contact':          { max: 5,  windowMs: 60_000 },   // 5 per minute
  '/api/payment/create':   { max: 10, windowMs: 60_000 },   // 10 per minute
  '/api/calendar-explain': { max: 20, windowMs: 60_000 },   // 20 per minute
  '/api/ai-chat':          { max: 30, windowMs: 60_000 },   // 30 per minute
}

const store = new Map<string, { count: number; resetAt: number }>()

export default defineEventHandler((event) => {
  const path = event.path?.split('?')[0] ?? ''
  const rule = LIMITS[path]
  if (!rule) return

  const ip =
    getRequestHeader(event, 'x-forwarded-for')?.split(',')[0].trim() ||
    getRequestHeader(event, 'x-real-ip') ||
    'unknown'

  const key = `${ip}:${path}`
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + rule.windowMs })
    return
  }

  entry.count++
  if (entry.count > rule.max) {
    throw createError({ statusCode: 429, message: 'Забагато запитів. Спробуйте пізніше.' })
  }
})
