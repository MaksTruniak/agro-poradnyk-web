// Налаштування AI-дій: скільки кредитів коштує дія і на якій моделі вона працює.
// Модель міняється тут, в одному місці — облік вартості й кредити від цього не залежать.

export type AiProvider = 'anthropic' | 'groq'
export type AiAction = 'chat' | 'photo' | 'card' | 'report' | 'summary' | 'calendar'

export interface AiRoute {
  provider: AiProvider
  model: string
  /** Глибина міркувань: Claude — output_config.effort; Groq — reasoning_effort */
  effort: 'none' | 'low' | 'medium' | 'high'
  maxTokens: number
}

export interface AiActionConfig extends AiRoute {
  credits: number
  label: string
}

const CLAUDE = 'claude-opus-5-5'
const GROQ = 'qwen/qwen3.8-27b'

export const AI_ACTIONS: Record<AiAction, AiActionConfig> = {
  // Відповіді фермеру — Claude (у тесті Groq-модель вигадувала назви хвороб і вставляла русизми)
  chat:     { label: 'Питання AI агроному', credits: 1, provider: 'anthropic', model: CLAUDE, effort: 'low',    maxTokens: 4000 },
  photo:    { label: 'Діагностика за фото', credits: 3, provider: 'anthropic', model: CLAUDE, effort: 'medium', maxTokens: 4000 },
  card:     { label: 'AI техкарта',         credits: 5, provider: 'anthropic', model: CLAUDE, effort: 'medium', maxTokens: 8000 },
  report:   { label: 'Звіт за сезон',       credits: 5, provider: 'anthropic', model: CLAUDE, effort: 'low',    maxTokens: 6000 },
  // Службове й коротке — дешева модель
  summary:  { label: 'Пам\'ять розмови',    credits: 0, provider: 'groq',      model: GROQ,   effort: 'none',   maxTokens: 600 },
  calendar: { label: 'Пояснення агрокалендаря', credits: 1, provider: 'groq',  model: GROQ,   effort: 'none',   maxTokens: 400 },
}

/**
 * Коли кредити місяця закінчились — прості питання не блокуємо, а відповідаємо дешевою моделлю
 * (обмежено на день, щоб не з'їсти бюджет). Фото, техкарти й звіти — лише за кредити.
 */
export const AI_FALLBACK: AiRoute & { dailyLimit: number } = {
  provider: 'groq', model: GROQ, effort: 'none', maxTokens: 900, dailyLimit: 10,
}

/** Ціни моделей, $ за 1 млн токенів (вхід, вихід, читання з кешу, запис у кеш) */
export const MODEL_PRICES: Record<string, { in: number; out: number; cacheRead: number; cacheWrite: number }> = {
  'claude-opus-5-5':   { in: 4,   out: 20, cacheRead: 0.2,  cacheWrite: 5 },
  'claude-sonnet-5-5': { in: 2,   out: 10, cacheRead: 0.2,  cacheWrite: 2.5 },
  'claude-haiku-4-5':  { in: 1,   out: 5,  cacheRead: 0.1,  cacheWrite: 1.25 },
  'qwen/qwen3.8-27b':  { in: 0.8, out: 4,  cacheRead: 0.8,  cacheWrite: 0.8 },
}

export interface AiUsage { input: number; output: number; cacheRead: number; cacheWrite: number }

export function aiCostUsd(model: string, u: AiUsage) {
  const p = MODEL_PRICES[model]
  if (!p) return 0
  return (u.input * p.in + u.output * p.out + u.cacheRead * p.cacheRead + u.cacheWrite * p.cacheWrite) / 1_000_000
}
