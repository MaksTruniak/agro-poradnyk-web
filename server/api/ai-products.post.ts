// Звірка @препаратів зі збережених відповідей AI агронома (історія чату) — ті самі посилання, що й у новій відповіді.
// Без моделі й кредитів: лише кеш каталогу.
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const body = await readBody(event)
  const texts: unknown[] = Array.isArray(body?.texts) ? body.texts.slice(0, 100) : []
  const catalog = await getCatalog()
  return { products: texts.map(t => (typeof t === 'string' ? matchMentions(catalog, t.slice(0, 20000)) : [])) }
})
