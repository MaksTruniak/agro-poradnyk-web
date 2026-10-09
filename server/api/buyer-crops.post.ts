// Культура, яку закуповує заготівельник (показується на /buyers і його сторінці)
const MAX_CROPS = 50

const qty = (v: unknown) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) throw createError({ statusCode: 400, message: 'Обсяг має бути додатним числом' })
  return n
}

export default defineEventHandler(async (event) => {
  const { user, supabase } = await requireUser(event)

  const { data: me } = await supabase.from('users').select('role, roles').eq('id', user.id).maybeSingle()
  if (me?.role !== 'buyer' && !(me?.roles || []).includes('buyer')) {
    throw createError({ statusCode: 403, message: 'Додавати культури для закупівлі може лише заготівельник' })
  }

  const body = await readBody(event)
  const cropType = typeof body?.crop_type === 'string' ? body.crop_type.trim() : ''
  if (!cropType || cropType.length > 100) throw createError({ statusCode: 400, message: 'Вкажіть культуру' })
  const minQty = qty(body.min_qty)
  const maxQty = qty(body.max_qty)
  if (minQty !== null && maxQty !== null && minQty > maxQty) {
    throw createError({ statusCode: 400, message: 'Обсяг «від» більший за «до»' })
  }
  const unit = body.unit === 'кг' ? 'кг' : 'т'
  const notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim().slice(0, 500) : null

  const { count } = await supabase.from('buyer_crops').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  if ((count || 0) >= MAX_CROPS) throw createError({ statusCode: 400, message: `Не більше ${MAX_CROPS} культур` })

  const { data, error } = await supabase.from('buyer_crops').insert({
    user_id: user.id, crop_type: cropType, min_qty: minQty, max_qty: maxQty, unit, notes,
  }).select().single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return data
})
