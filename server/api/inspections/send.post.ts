// Надіслати фермеру акт огляду: сповіщення в кабінет, Telegram і повідомлення в консультаційний чат.
// Лише автор акта з активною співпрацею; повторне надсилання оновлює sent_at.
const CONDITION: Record<string, string> = { good: 'у доброму стані', attention: 'потребує уваги', bad: 'потрібні термінові дії' }

export default defineEventHandler(async (event) => {
  const { user, supabase } = await requireUser(event)
  const body = await readBody(event).catch(() => null)
  const id = typeof body?.id === 'string' && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : null
  if (!id) throw createError({ statusCode: 400, message: 'id required' })

  const { data: insp } = await supabase.from('planting_inspections')
    .select('id, farm_crop_id, visited_at, condition, summary, created_by, farm_crops(crop_type, variety, farm_id, farms(id, name, user_id))')
    .eq('id', id).maybeSingle()
  const crop: any = insp?.farm_crops
  const farmerId: string | undefined = crop?.farms?.user_id
  if (!insp || insp.created_by !== user.id || !farmerId) throw createError({ statusCode: 404, message: 'Акт не знайдено' })
  const { data: active } = await supabase.from('agreements').select('id')
    .eq('agronomist_id', user.id).eq('farmer_id', farmerId).eq('status', 'active').limit(1).maybeSingle()
  if (!active) throw createError({ statusCode: 403, message: 'Немає активної співпраці з цим фермером' })

  const [{ data: findings }, { data: recs }, { data: me }] = await Promise.all([
    supabase.from('inspection_findings').select('name, severity').eq('inspection_id', id).order('sort_order'),
    supabase.from('inspection_recommendations').select('type, product_name, dosage').eq('inspection_id', id).order('sort_order'),
    supabase.from('public_profiles').select('name').eq('id', user.id).maybeSingle(),
  ])
  const date = `${insp.visited_at.slice(8, 10)}.${insp.visited_at.slice(5, 7)}`
  const what = `${crop.crop_type}${crop.variety ? ` (${crop.variety})` : ''} · ${crop.farms.name}`
  const url = `${SITE_URL}/dashboard/inspection/${id}`
  const agronomist = me?.name || 'Агроном'
  const lines = [
    `Стан: ${CONDITION[insp.condition] ?? insp.condition}`,
    ...(findings || []).slice(0, 5).map((f: any) => `• ${f.name}${f.severity === 'high' ? ' — сильно' : f.severity === 'medium' ? ' — помірно' : ''}`),
    ...(recs || []).slice(0, 5).map((r: any) => `→ ${r.type}: ${r.product_name}${r.dosage ? `, ${r.dosage}` : ''}`),
  ]

  await notifyUser(supabase, farmerId, {
    type: 'inspection',
    title: `Акт огляду від ${date}: ${crop.crop_type}`,
    body: `${agronomist} · ${crop.farms.name}\n${lines.join('\n')}`,
    data: { inspectionId: id },
  }).catch(e => console.error('[inspection send] notification', e))

  await notifyTelegram(supabase, farmerId, null,
    `📝 <b>Акт огляду від ${date}</b>\n${tgEscape(what)}\n<i>${tgEscape(agronomist)}</i>\n\n${lines.map(tgEscape).join('\n')}`,
    { text: 'Відкрити акт', url })

  // Повідомлення в консультаційному чаті з посиланням на акт
  try {
    const { data: chat } = await supabase.from('chats').select('id')
      .eq('farmer_id', farmerId).eq('agronomist_id', user.id).eq('type', 'human').is('title', null).limit(1).maybeSingle()
    const chatId = chat?.id ?? (await supabase.from('chats')
      .insert({ farmer_id: farmerId, agronomist_id: user.id, type: 'human', is_unlocked: true }).select('id').single()).data?.id
    if (chatId) {
      await supabase.from('messages').insert({
        chat_id: chatId, role: 'assistant', is_read: false,
        content: `📝 Акт огляду від ${date}: ${what}\n${lines.join('\n')}\n\nПовністю: ${url}`,
      })
    }
  } catch (e) {
    console.error('[inspection send] chat', e)
  }

  const sentAt = new Date().toISOString()
  await supabase.from('planting_inspections').update({ sent_at: sentAt }).eq('id', id)
  return { ok: true, sentAt }
})
