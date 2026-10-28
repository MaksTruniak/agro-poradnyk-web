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

// Модель текстових питань можна змінити змінною середовища AI_CHAT_MODEL (відкат — без деплою коду).
// Лише моделі з цінами в MODEL_PRICES, інакше облік вартості й межі собівартості не працюватимуть.
const CHAT_MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5']
const CHAT_MODEL = CHAT_MODELS.includes(process.env.AI_CHAT_MODEL || '') ? process.env.AI_CHAT_MODEL! : CLAUDE

export const AI_ACTIONS: Record<AiAction, AiActionConfig> = {
  // Відповіді фермеру — Claude (у тесті Groq-модель вигадувала назви хвороб і вставляла русизми)
  // maxTokens — запобіжник від надто довгих (дорогих) відповідей; стислість задає промпт чату
  chat:     { label: 'Питання AI агроному', credits: 1, provider: 'anthropic', model: CHAT_MODEL, effort: 'low', maxTokens: 1500 },
  photo:    { label: 'Діагностика за фото', credits: 3, provider: 'anthropic', model: CLAUDE, effort: 'medium', maxTokens: 4000 },
  // Техкарта — шаблонний перелік препаратів і доз: low вдвічі дешевший і швидший за medium за тієї ж повноти (заміри 28.10.2026)
  card:     { label: 'AI техкарта',         credits: 5, provider: 'anthropic', model: CLAUDE, effort: 'low',    maxTokens: 8000 },
  report:   { label: 'Звіт за сезон',       credits: 5, provider: 'anthropic', model: CLAUDE, effort: 'low',    maxTokens: 6000 },
  // Службове й коротке — дешева модель
  summary:  { label: 'Пам\'ять розмови',    credits: 0, provider: 'groq',      model: GROQ,   effort: 'none',   maxTokens: 600 },
  calendar: { label: 'Пояснення агрокалендаря', credits: 1, provider: 'groq',  model: GROQ,   effort: 'none',   maxTokens: 400 },
}

/**
 * Пам'ять розмови, коли безкоштовний Groq відповів 429 (ліміт токенів на день на всю організацію):
 * повтор на найдешевшій моделі Claude, щоб підсумок розмови не губився.
 */
export const SUMMARY_BACKUP: AiRoute = { provider: 'anthropic', model: 'claude-haiku-5-5', effort: 'none', maxTokens: 600 }

/** Ціни моделей, $ за 1 млн токенів (вхід, вихід, читання з кешу, запис у кеш) */
export const MODEL_PRICES: Record<string, { in: number; out: number; cacheRead: number; cacheWrite: number }> = {
  'claude-opus-5-5':   { in: 4,   out: 20, cacheRead: 0.2,  cacheWrite: 5 },
  'claude-sonnet-5-5': { in: 2,   out: 10, cacheRead: 0.2,  cacheWrite: 2.5 },
  // Haiku 5.5 — ціни для промптів до 100 тис. токенів (platform.claude.com/docs/en/about-claude/pricing, жовтень 2026)
  'claude-haiku-5-5':  { in: 0.1, out: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
  'claude-haiku-4-5':  { in: 1,   out: 5,  cacheRead: 0.1,  cacheWrite: 1.25 },
  'qwen/qwen3.8-27b':  { in: 0.8, out: 4,  cacheRead: 0.8,  cacheWrite: 0.8 },
}

/** thinking — скільки з output припало на приховані міркування (вже в output, окремо не оплачується) */
export interface AiUsage { input: number; output: number; cacheRead: number; cacheWrite: number; thinking?: number }

export function aiCostUsd(model: string, u: AiUsage) {
  const p = MODEL_PRICES[model]
  if (!p) return 0
  return (u.input * p.in + u.output * p.out + u.cacheRead * p.cacheRead + u.cacheWrite * p.cacheWrite) / 1_000_000
}
