import Groq from 'groq-sdk'

// Спільне для AI-ендпоінтів: моделі, очищення вхідних даних, фільтр <think>, повтори при 429.

// qwen3.8-27b приймає й зображення (llama-4-scout Groq вимкнув 17.07.2026)
export const AI_TEXT_MODEL = 'qwen/qwen3.8-27b'
export const AI_VISION_MODEL = 'qwen/qwen3.8-27b'

// qwen3.8 — модель з міркуваннями: за замовчуванням пише їх у відповідь (<think>) і витрачає на них токени.
// 'hidden' — міркування не потрапляють у текст; effort 'none' — без міркувань (коротко, дешево, без русизмів у тесті);
// 'low' і вище — для задач, де міркування окупаються (більший max_tokens: приховані міркування теж рахуються).
export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high'
export const reasoningParams = (effort: ReasoningEffort = 'none') => ({ reasoning_format: 'hidden', reasoning_effort: effort })

// Groq (безкоштовний тариф, на всю організацію): 1000 запитів/день, 8000 токенів/хв, 200 тис. токенів/день
// і 1000 вихідних токенів/хв (OTPM) — запит з max_tokens понад цей ліміт Groq відхиляє одразу.
export const AI_MAX_OUTPUT_TOKENS = 1000

// Межі вхідних даних (захист від довільних запитів за рахунок платформи)
export const AI_LIMITS = {
  chatMessages: 20,        // скільки останніх повідомлень розмови йде в модель
  messageChars: 4000,      // довжина одного повідомлення
  contextChars: 4000,      // farmContext, prevSummary, memory
  reportChars: 30000,      // текст консультацій для звіту за сезон
  imageBytes: 6 * 1024 * 1024,
}

export function getGroq() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw createError({ statusCode: 500, message: 'GROQ_API_KEY not configured' })
  return new Groq({ apiKey })
}

export const clampText = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')

/** Прибирає міркування моделі (<think>…</think>), зокрема незакритий блок наприкінці */
export const stripThink = (text: string) =>
  text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*$/, '').trim()

/** Фільтр <think> для стріму: теги можуть розірватися між шматками. push — на кожен шматок, flush — в кінці. */
export function createThinkFilter() {
  let buffer = ''
  let inThink = false
  const push = (chunk: string): string => {
    buffer += chunk
    let out = ''
    while (buffer) {
      if (inThink) {
        const end = buffer.indexOf('</think>')
        if (end === -1) { buffer = buffer.slice(-7); return out }  // чекаємо закриття
        buffer = buffer.slice(end + 8).replace(/^\s+/, '')
        inThink = false
      } else {
        const start = buffer.indexOf('<think>')
        if (start !== -1) {
          out += buffer.slice(0, start)
          buffer = buffer.slice(start + 7)
          inThink = true
          continue
        }
        // Хвіст, що може бути початком «<think>», притримуємо до наступного шматка
        const lt = buffer.lastIndexOf('<')
        const keep = lt !== -1 && '<think>'.startsWith(buffer.slice(lt)) ? buffer.length - lt : 0
        out += buffer.slice(0, buffer.length - keep)
        buffer = buffer.slice(buffer.length - keep)
        return out
      }
    }
    return out
  }
  const flush = () => { const rest = inThink ? '' : buffer; buffer = ''; return rest }
  return { push, flush }
}

type ChatContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>
export interface ChatMessage { role: 'user' | 'assistant'; content: ChatContent }

const isAllowedImage = (url: unknown): url is string =>
  typeof url === 'string'
  && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(url)
  && url.length <= AI_LIMITS.imageBytes * 1.4

/**
 * Історія чату з браузера → безпечний вигляд для моделі:
 * лише ролі user/assistant (системне повідомлення ставить сервер), останні N повідомлень, обмежена довжина;
 * фото — лише в останньому повідомленні користувача (у старих замінюється на «[фото]»).
 * hasImage визначає сервер, а не браузер.
 */
export function sanitizeChatMessages(raw: unknown): { messages: ChatMessage[]; hasImage: boolean } {
  if (!Array.isArray(raw)) throw createError({ statusCode: 400, message: 'messages required' })
  const recent = raw.slice(-AI_LIMITS.chatMessages)
  const out: ChatMessage[] = []
  let hasImage = false
  recent.forEach((m: any, i: number) => {
    if (m?.role !== 'user' && m?.role !== 'assistant') return
    const isLast = i === recent.length - 1
    if (typeof m.content === 'string') {
      out.push({ role: m.role, content: clampText(m.content, AI_LIMITS.messageChars) })
      return
    }
    if (!Array.isArray(m.content)) return
    const text = m.content.filter((p: any) => p?.type === 'text').map((p: any) => clampText(p.text, AI_LIMITS.messageChars)).join('\n')
    const image = m.content.find((p: any) => p?.type === 'image_url')?.image_url?.url
    if (isLast && m.role === 'user' && isAllowedImage(image)) {
      hasImage = true
      out.push({ role: 'user', content: [{ type: 'image_url', image_url: { url: image } }, { type: 'text', text: text || 'Що на фото?' }] })
    } else {
      out.push({ role: m.role, content: image ? `[фото] ${text}`.trim() : text })
    }
  })
  if (!out.length || out[out.length - 1]!.role !== 'user') {
    throw createError({ statusCode: 400, message: 'Останнє повідомлення має бути від користувача' })
  }
  return { messages: out, hasImage }
}

const isRateLimit = (err: any) => err?.status === 429 || err?.error?.type === 'rate_limit_exceeded'

/** Виклик Groq з повтором при 429; помилки — зрозумілі для користувача */
export async function groqWithRetry<T>(call: () => Promise<T>, tag: string, retries = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call()
    } catch (err: any) {
      if (isRateLimit(err) && attempt < retries) {
        await new Promise(r => setTimeout(r, 2000 * attempt))
        continue
      }
      console.error(`[${tag}] groq error:`, err?.message, err?.status)
      if (isRateLimit(err)) throw createError({ statusCode: 429, message: 'Зараз велике навантаження на AI. Спробуйте за хвилину.' })
      throw createError({ statusCode: 502, message: 'AI тимчасово недоступний. Спробуйте ще раз.' })
    }
  }
}

/** Текстова відповідь моделі без міркувань */
export async function groqText(tag: string, params: { messages: any[]; max_tokens: number; temperature?: number; model?: string; effort?: ReasoningEffort }) {
  const groq = getGroq()
  const { effort, ...rest } = params
  const res: any = await groqWithRetry(() => groq.chat.completions.create({
    model: params.model || AI_TEXT_MODEL, ...rest, max_tokens: Math.min(params.max_tokens, AI_MAX_OUTPUT_TOKENS),
    ...reasoningParams(effort), stream: false,
  } as any), tag)
  return stripThink(res.choices[0]?.message?.content || '')
}
