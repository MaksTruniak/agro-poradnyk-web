import { createClient } from '@supabase/supabase-js'

// Звіт сезону за консультаціями користувача. Консультації й пам'ять сервер бере з БД сам —
// довільний текст з браузера не приймається (інакше ендпоінт був би безкоштовним універсальним чат-ботом).
export default defineEventHandler(async (event) => {
  const access = await requireAiAccess(event)
  const body = await readBody(event).catch(() => ({}))
  const farmName = clampText(body?.farmName, 100)

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const [{ data: chats }, { data: mem }] = await Promise.all([
    supabase.from('ai_chats').select('id, created_at, updated_at').eq('user_id', access.userId)
      .order('updated_at', { ascending: false }).limit(50),
    supabase.from('ai_memory').select('summary').eq('user_id', access.userId).maybeSingle(),
  ])
  const chatIds = (chats || []).map(c => c.id)
  const { data: msgs } = chatIds.length
    ? await supabase.from('ai_messages').select('chat_id, role, content, created_at').in('chat_id', chatIds).order('created_at', { ascending: true })
    : { data: [] as any[] }

  const lines: string[] = []
  for (const chat of [...(chats || [])].reverse()) {
    const chatMsgs = (msgs || []).filter(m => m.chat_id === chat.id)
    if (!chatMsgs.length) continue
    const date = new Date(chat.updated_at || chat.created_at).toLocaleDateString('uk-UA')
    const title = (chatMsgs.find(m => m.role === 'user')?.content || 'Розмова').slice(0, 60).replace(/\n/g, ' ')
    lines.push(`--- Розмова "${title}" (${date}) ---`)
    for (const m of chatMsgs) {
      const text = String(m.content || '').replace(/SCHEME_DETECTED/g, '').replace(/REMINDER:[^\n]+/g, '').trim()
      lines.push(`${m.role === 'user' ? 'Фермер' : 'AI'}: ${text}`)
    }
  }
  // Найновіші консультації важливіші — обрізаємо початок
  const conversations = lines.join('\n').slice(-AI_LIMITS.reportChars)
  if (!conversations) throw createError({ statusCode: 400, message: 'Немає консультацій для звіту' })
  const memory = clampText(mem?.summary, AI_LIMITS.contextChars)

  const year = new Date().getFullYear()
  const prompt = `Ти агроном-аналітик платформи АгроПростір. На основі консультацій сезону ${year} склади детальний агрономічний звіт українською мовою.

${farmName ? `ГОСПОДАРСТВО: ${farmName}` : ''}
${memory ? `КОНТЕКСТ ГОСПОДАРСТВА:\n${memory}\n` : ''}

КОНСУЛЬТАЦІЇ СЕЗОНУ:
${conversations}

Сформуй стислий звіт (до 500 слів). У кожному розділі — конкретні факти з консультацій, не загальні слова. Якщо даних недостатньо — "Недостатньо даних за сезон".

## Загальна ситуація сезону
Коротко: які культури вирощувались, які головні виклики були, загальна оцінка сезону.

## Виявлені проблеми
Перелік: хвороби, шкідники, дефіцити живлення — з назвами культур і датами якщо відомі.

## Застосовані заходи та препарати
Що реально рекомендувалось: назви препаратів, дози, фази внесення. Згрупуй по культурах.

## Ефективність та спостереження
Що спрацювало добре, що виявилось недостатнім або потребує корекції.

## Рекомендації на сезон ${year + 1}
Конкретні агрономічні поради: що змінити у сівозміні, захисті, живленні на основі досвіду цього сезону.`

  const report = await groqText('ai-season-report', { messages: [{ role: 'user', content: prompt }], max_tokens: 1000 })
  return { report }
})
