import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { owner_id, first_name, last_name, phone, email, password } = body

  if (!owner_id || !first_name || !last_name || !phone || !password) {
    throw createError({ statusCode: 400, message: 'Заповніть всі обов\'язкові поля' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Перевіряємо чи вже існує у цього власника
  const { data: existing } = await supabase
    .from('harvest_workers')
    .select('id')
    .eq('owner_id', owner_id)
    .eq('phone', phone.trim())
    .maybeSingle()

  if (existing) {
    throw createError({ statusCode: 409, message: 'Збирач з таким телефоном вже існує' })
  }

  const phoneDigits = phone.replace(/\D/g, '')
  const syntheticEmail = `${phoneDigits}@harvest.agroprostir.local`

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: syntheticEmail,
    password,
    email_confirm: true,
    user_metadata: { role: 'harvest_worker', first_name, last_name, phone },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      throw createError({ statusCode: 409, message: 'Збирач з таким телефоном вже зареєстрований' })
    }
    throw createError({ statusCode: 500, message: authError.message })
  }

  const { data: worker, error: workerError } = await supabase
    .from('harvest_workers')
    .insert({
      owner_id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone.trim(),
      email: email?.trim().toLowerCase() || null,
      auth_user_id: authData.user.id,
      email_login: syntheticEmail,
    })
    .select()
    .single()

  if (workerError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    throw createError({ statusCode: 500, message: workerError.message })
  }

  return { ok: true, worker }
})
