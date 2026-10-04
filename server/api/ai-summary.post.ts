import { createClient } from '@supabase/supabase-js'

// Підсумок розмови для «пам'яті» AI. Повідомлення й попередній підсумок сервер бере з БД
// (чат має належати користувачу) — довільний текст з браузера не приймається.
export default defineEventHandler(async (event) => {
  const access = await requireAiAccess(event, 'summary')
  const body = await readBody(event).catch(() => ({}))
  const chatId = clampText(body?.chatId, 64)
  if (!chatId) throw createError({ statusCode: 400, message: 'chatId required' })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: chat } = await supabase.from('ai_chats').select('id').eq('id', chatId).eq('user_id', access.userId).maybeSingle()
  if (!chat) throw createError({ statusCode: 404, message: 'Розмову не знайдено' })
  const [{ data: msgs }, { data: mem }] = await Promise.all([
    supabase.from('ai_messages').select('role, content').eq('chat_id', chatId).order('created_at', { ascending: true }).limit(100),
    supabase.from('ai_memory').select('summary').eq('user_id', access.userId).maybeSingle(),
  ])
  if (!msgs?.length) return { summary: clampText(mem?.summary, AI_LIMITS.contextChars) }
  const prevSummary = clampText(mem?.summary, AI_LIMITS.contextChars)

  const now = new Date()
  const monthNames = ['січень','лютий','березень','квітень','травень','червень','липень','серпень','вересень','жовтень','листопад','грудень']
  const sessionDate = `${monthNames[now.getMonth()]} ${now.getFullYear()}`
  const dialog = msgs.map(m => `${m.role === 'user' ? 'Фермер' : 'AI агроном'}: ${String(m.content || '').slice(0, AI_LIMITS.messageChars)}`)
    .join('\n').slice(-AI_LIMITS.reportChars)

  const prompt = `Ти агрономічний асистент. Проаналізуй розмову між фермером і AI агрономом і склади структурований агрономічний підсумок для використання в наступних консультаціях.

${prevSummary ? `ПОПЕРЕДНІЙ КОНТЕКСТ ПРО ГОСПОДАРСТВО:\n${prevSummary}\n\nДоповни або онови цей контекст новою інформацією з розмови нижче.` : ''}

РОЗМОВА (${sessionDate}):
${dialog}

Склади підсумок у такому форматі (якщо інформації по пункту немає — пропусти пункт):
Культури: [які культури фермера згадувались]
Проблеми: [хвороби, шкідники, дефіцити що виявлені]
Препарати: [що рекомендувалось із дозами]
Господарство: [регіон, площа, особливості якщо згадувались]
Нотатки: [важливі деталі для наступних консультацій]

Відповідай тільки підсумком без зайвих слів і вступу.`

  const res = await aiComplete(access.route!, { system: 'Ти агрономічний асистент. Відповідаєш українською.', messages: [{ role: 'user', content: prompt }] }, 'ai-summary')
  await recordAiRequest(access, res.usage, res.refused ? 'refused' : 'ok')
  return { summary: res.text }
})
