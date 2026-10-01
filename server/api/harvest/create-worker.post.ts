export default defineEventHandler(async (event) => {
  const { user, supabase } = await requireUser(event)
  const body = await readBody(event)
  const { first_name, last_name, phone, email, password } = body
  // Власник — сам користувач або власник команди, де він активний редактор
  let owner_id: string = user.id
  if (body.owner_id && body.owner_id !== user.id) {
    const { data: membership } = await supabase.from('team_members').select('id')
      .eq('owner_id', body.owner_id).eq('member_id', user.id).eq('status', 'active').eq('role', 'editor').maybeSingle()
    if (!membership) throw createError({ statusCode: 403, message: 'Немає доступу до цього господарства' })
    owner_id = body.owner_id
  }

  if (!first_name || !last_name || !phone || !password) {
    throw createError({ statusCode: 400, message: 'Заповніть всі обов\'язкові поля' })
  }
  const pwdError = validatePassword(String(password))
  if (pwdError) throw createError({ statusCode: 400, message: pwdError })

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
    .select('id, owner_id, first_name, last_name, phone, email, login, created_at, auth_user_id, email_login')
    .single()

  if (workerError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    throw createError({ statusCode: 500, message: workerError.message })
  }

  return { ok: true, worker }
})
