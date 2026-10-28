import Groq from 'groq-sdk'
import Anthropic from '@anthropic-ai/sdk'
import type { AiRoute, AiUsage } from './aiConfig'

// Спільне для AI-ендпоінтів: моделі, очищення вхідних даних, фільтр <think>, повтори при 429.

// qwen3.8-27b приймає й зображення (llama-4-scout Groq вимкнув 17.07.2026)
export const AI_TEXT_MODEL = 'qwen/qwen3.8-27b'
export const AI_VISION_MODEL = 'qwen/qwen3.8-27b'

// qwen3.8 — модель з міркуваннями: за замовчуванням пише їх у відповідь (<think>) і витрачає на них токени.
// 'hidden' — міркування не потрапляють у текст; effort 'none' — без міркувань (коротко, дешево, без русизмів у тесті);
// 'low' і вище — для задач, де міркування окупаються (більший max_tokens: приховані міркування теж рахуються).
export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high'
export const reasoningParams = (effort: ReasoningEffort = 'none'): Record<string, string> => ({ reasoning_format: 'hidden', reasoning_effort: effort })

// Groq (безкоштовний тариф, на всю організацію): 1000 запитів/день, 8000 токенів/хв, 200 тис. токенів/день
// і 1000 вихідних токенів/хв (OTPM) — запит з max_tokens понад цей ліміт Groq відхиляє одразу.
export const AI_MAX_OUTPUT_TOKENS = 1000

// Межі вхідних даних (захист від довільних запитів за рахунок платформи)
export const AI_LIMITS = {
  chatMessages: 20,        // скільки останніх повідомлень розмови йде в модель
  historyChars: 12000,     // і не більше стільки символів разом (≈ 5 тис. токенів): старше покриває пам'ять розмови
  historyStep: 6,          // початок вікна історії зсувається кроками (стабільний префікс для кешу)
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
  const last = raw.length - 1
  const convert = (m: any, i: number): ChatMessage | null => {
    if (m?.role !== 'user' && m?.role !== 'assistant') return null
    if (typeof m.content === 'string') return { role: m.role, content: clampText(m.content, AI_LIMITS.messageChars) }
    if (!Array.isArray(m.content)) return null
    const text = m.content.filter((p: any) => p?.type === 'text').map((p: any) => clampText(p.text, AI_LIMITS.messageChars)).join('\n')
    const image = m.content.find((p: any) => p?.type === 'image_url')?.image_url?.url
    if (i === last && m.role === 'user' && isAllowedImage(image)) {
      return { role: 'user', content: [{ type: 'image_url', image_url: { url: image } }, { type: 'text', text: text || 'Що на фото?' }] }
    }
    return { role: m.role, content: image ? `[фото] ${text}`.trim() : text }
  }
  const textLen = (m: ChatMessage | null) => !m ? 0 : typeof m.content === 'string' ? m.content.length
    : m.content.reduce((s, p: any) => s + (p.type === 'text' ? (p.text?.length || 0) : 0), 0)

  // Довга розмова — найдорожча частина питання (вхідні токени): не більше chatMessages повідомлень і historyChars символів;
  // останнє (саме питання) — завжди
  const lo = Math.max(0, raw.length - AI_LIMITS.chatMessages)
  const converted = new Map<number, ChatMessage | null>()
  for (let i = lo; i <= last; i++) converted.set(i, convert(raw[i], i))
  let from = last
  let total = textLen(converted.get(last) ?? null)
  while (from > lo && total + textLen(converted.get(from - 1) ?? null) <= AI_LIMITS.historyChars) total += textLen(converted.get(--from) ?? null)
  // Початок вікна зсувається кроками по historyStep повідомлень від початку розмови, а не на одне щоразу:
  // поки він той самий, попередня частина розмови береться з кешу Claude (читання в 20 разів дешевше за вхід)
  from = Math.min(last, Math.ceil(from / AI_LIMITS.historyStep) * AI_LIMITS.historyStep)

  const out: ChatMessage[] = []
  for (let i = from; i <= last; i++) { const m = converted.get(i); if (m) out.push(m) }
  if (!out.length || out[out.length - 1]!.role !== 'user') {
    throw createError({ statusCode: 400, message: 'Останнє повідомлення має бути від користувача' })
  }
  while (out.length > 1 && out[0]!.role !== 'user') out.shift()  // розмова починається з питання
  const lastMsg = out[out.length - 1]!
  return { messages: out, hasImage: typeof lastMsg.content !== 'string' }
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

// ── Провайдери: однаковий виклик для Claude і Groq ───────────────────────────────

export interface AiCallInput {
  /** Незмінна частина інструкцій — кешується (Claude) */
  system: string
  /** Змінна частина: дата, погода, дані господарства — після кешованої */
  context?: string
  messages: ChatMessage[]
  /** Кешувати розмову (чат): наступне питання читає попередні повідомлення з кешу */
  cacheHistory?: boolean
}

export interface AiResult { text: string; usage: AiUsage; refused: boolean; model: string }

const REFUSAL_TEXT = 'Не можу відповісти на це питання. Спробуйте сформулювати інакше.'

let anthropicClient: Anthropic | null = null
const getAnthropic = () => {
  if (!process.env.ANTHROPIC_API_KEY) throw createError({ statusCode: 500, message: 'ANTHROPIC_API_KEY not configured' })
  return (anthropicClient ||= new Anthropic())
}

/** Повідомлення у форматі Claude: фото — base64 image-блок */
function toClaudeMessages(messages: ChatMessage[]): Anthropic.Beta.BetaMessageParam[] {
  return messages.map(m => {
    if (typeof m.content === 'string') return { role: m.role, content: m.content || ' ' }
    return {
      role: m.role,
      content: m.content.map(part => {
        if (part.type === 'text') return { type: 'text' as const, text: part.text || ' ' }
        const match = part.image_url.url.match(/^data:(image\/[a-z+]+);base64,(.*)$/i)
        const media = (match?.[1] || 'image/jpeg').toLowerCase().replace('image/jpg', 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
        return { type: 'image' as const, source: { type: 'base64' as const, media_type: media, data: match?.[2] || '' } }
      }),
    }
  })
}

/**
 * Кеш розмови: позначка на останньому повідомленні — наступне питання читає всю попередню розмову з кешу
 * (0,05× ціни входу замість 1×; запис нової частини — 1,25×). Для розмов, а не для разових запитів (техкарта, звіт).
 */
function withHistoryCache(messages: Anthropic.Beta.BetaMessageParam[]): Anthropic.Beta.BetaMessageParam[] {
  const lastMsg = messages[messages.length - 1]
  if (!lastMsg) return messages
  const blocks: any[] = typeof lastMsg.content === 'string' ? [{ type: 'text', text: lastMsg.content }] : [...lastMsg.content]
  blocks[blocks.length - 1] = { ...blocks[blocks.length - 1], cache_control: { type: 'ephemeral' } }
  return [...messages.slice(0, -1), { ...lastMsg, content: blocks }]
}

function claudeParams(route: AiRoute, input: AiCallInput) {
  const system: Anthropic.Beta.BetaTextBlockParam[] = [{ type: 'text', text: input.system, cache_control: { type: 'ephemeral' } }]
  if (input.context) system.push({ type: 'text', text: input.context })
  return {
    model: route.model,
    max_tokens: route.maxTokens,
    // 'none' — без параметра effort (так і для моделей, що його не підтримують, як Haiku)
    ...(route.effort === 'none' ? {} : { output_config: { effort: route.effort } }),
    system,
    messages: input.cacheHistory ? withHistoryCache(toClaudeMessages(input.messages)) : toClaudeMessages(input.messages),
    // Якщо модель відхилить запит фільтрами безпеки — API сам повторить його на іншій моделі Claude
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  } as any
}

const claudeUsage = (u: any): AiUsage => ({
  input: u?.input_tokens || 0,
  output: u?.output_tokens || 0,
  cacheRead: u?.cache_read_input_tokens || 0,
  cacheWrite: u?.cache_creation_input_tokens || 0,
  thinking: u?.output_tokens_details?.thinking_tokens || 0,
})

function claudeError(err: any, tag: string): never {
  console.error(`[${tag}] anthropic error:`, err?.status, err?.message)
  if (err instanceof Anthropic.RateLimitError) throw createError({ statusCode: 429, message: 'Зараз велике навантаження на AI. Спробуйте за хвилину.' })
  throw createError({ statusCode: 502, message: 'AI тимчасово недоступний. Спробуйте ще раз.' })
}

function groqMessages(input: AiCallInput) {
  return [{ role: 'system', content: input.context ? `${input.system}\n${input.context}` : input.system }, ...input.messages]
}

const groqUsage = (u: any): AiUsage => ({ input: u?.prompt_tokens || 0, output: u?.completion_tokens || 0, cacheRead: 0, cacheWrite: 0 })

/** Відповідь цілком (техкарта, звіт, пам'ять, агрокалендар) */
export async function aiComplete(route: AiRoute, input: AiCallInput, tag: string): Promise<AiResult> {
  if (route.provider === 'anthropic') {
    let res: any
    try { res = await getAnthropic().beta.messages.create(claudeParams(route, input)) } catch (err) { claudeError(err, tag) }
    const refused = res.stop_reason === 'refusal'
    const text = refused ? REFUSAL_TEXT : res.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
    return { text: text.trim(), usage: claudeUsage(res.usage), refused, model: res.model || route.model }
  }
  const groq = getGroq()
  const res: any = await groqWithRetry(() => groq.chat.completions.create({
    model: route.model, messages: groqMessages(input) as any,
    max_tokens: Math.min(route.maxTokens, AI_MAX_OUTPUT_TOKENS), ...reasoningParams(route.effort), stream: false,
  } as any), tag)
  return { text: stripThink(res.choices[0]?.message?.content || ''), usage: groqUsage(res.usage), refused: false, model: route.model }
}

/** Відповідь стрімом (AI-чат): text — шматки тексту; після завершення — finish() з токенами */
export async function aiStream(route: AiRoute, input: AiCallInput, tag: string) {
  let usage: AiUsage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
  let refused = false
  let model = route.model

  if (route.provider === 'anthropic') {
    let stream: any
    try {
      stream = getAnthropic().beta.messages.stream(claudeParams(route, input))
      // Чекаємо початку відповіді, щоб помилку (ліміт, ключ) повернути як HTTP-помилку, а не порожній стрім
      await stream.withResponse()
    } catch (err) { claudeError(err, tag) }
    async function* text() {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') yield event.delta.text as string
      }
      const final = await stream.finalMessage()
      usage = claudeUsage(final.usage)
      model = final.model || model
      if (final.stop_reason === 'refusal') { refused = true; yield `\n\n${REFUSAL_TEXT}` }
    }
    return { text: text(), finish: () => ({ usage, refused, model }) }
  }

  const groq = getGroq()
  const stream: any = await groqWithRetry(() => groq.chat.completions.create({
    model: route.model, messages: groqMessages(input) as any, stream: true,
    max_tokens: Math.min(route.maxTokens, AI_MAX_OUTPUT_TOKENS), ...reasoningParams(route.effort),
  } as any), tag)
  async function* text() {
    const think = createThinkFilter()
    for await (const chunk of stream) {
      const piece = think.push(chunk.choices?.[0]?.delta?.content || '')
      if (piece) yield piece
      const u = chunk.x_groq?.usage || chunk.usage
      if (u) usage = groqUsage(u)
    }
    const rest = think.flush()
    if (rest) yield rest
  }
  return { text: text(), finish: () => ({ usage, refused, model }) }
}
