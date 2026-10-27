import { paymentMessage, weighMessage } from '~~/shared/utils/harvestBot'

// Повідомити збирача в Telegram про щойно записане зважування або виплату.
// Кличе сторінка сезону після запису. Лише фермер-власник або член його команди; кожен запис — один раз
// (tg_notified_at ставиться атомарно), і лише свіжий (до години), щоб не розсилати старе.
const UUID = /^[0-9a-f-]{36}$/
export default defineEventHandler(async (event) => {
  const { user, supabase } = await requireUser(event)
  const body = await readBody(event).catch(() => ({}))
  const recordId = UUID.test(body?.recordId ?? '') ? body.recordId as string : null
  const paymentId = UUID.test(body?.paymentId ?? '') ? body.paymentId as string : null
  if (!recordId === !paymentId) throw createError({ statusCode: 400, message: 'recordId або paymentId' })
  if (!telegramEnabled()) return { sent: false }

  const table = recordId ? 'harvest_records' : 'harvest_payments'
  const { data: row } = await supabase.from(table)
    .select(recordId ? 'id, worker_id, season_id, weight_kg, amount, recorded_at, tg_notified_at' : 'id, worker_id, season_id, amount, status, tg_notified_at')
    .eq('id', recordId ?? paymentId).maybeSingle() as { data: any }
  if (!row) throw createError({ statusCode: 404, message: 'Запис не знайдено' })
  const { data: worker } = await supabase.from('harvest_workers').select('id, owner_id, auth_user_id').eq('id', row.worker_id).maybeSingle()
  if (!worker || !(await canManageWorkers(supabase, user.id, worker.owner_id))) throw createError({ statusCode: 404, message: 'Запис не знайдено' })
  if (recordId && Date.now() - new Date(row.recorded_at).getTime() > 3600_000) return { sent: false }
  if (!worker.auth_user_id || row.tg_notified_at) return { sent: false }

  // Один раз: хто перший поставив позначку, той і надсилає
  const { data: claimed } = await supabase.from(table).update({ tg_notified_at: new Date().toISOString() })
    .eq('id', row.id).is('tg_notified_at', null).select('id').maybeSingle()
  if (!claimed) return { sent: false }

  const season = (await workerSeasons(supabase, worker.id)).find(s => s.seasonId === row.season_id)
  if (!season) return { sent: false }
  const sent = recordId
    ? await sendToWorker(supabase, worker.auth_user_id, weighMessage(season, Number(row.weight_kg), Number(row.amount)))
    : await sendToWorker(supabase, worker.auth_user_id, paymentMessage(season, Number(row.amount)),
      row.status === 'pending' ? inlineKeyboard([[{ text: '✅ Отримав', callback_data: `pay:${row.id}` }]]) : undefined)
  return { sent }
})
