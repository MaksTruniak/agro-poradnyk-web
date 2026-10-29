import type { H3Event } from 'h3'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

export const serviceClient = (): SupabaseClient =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * Користувач із заголовка Authorization: Bearer <access_token> або null.
 * Перевіряється один раз на запит: лімітер і обробник беруть результат з event.context.
 */
export async function userFromRequest(event: H3Event): Promise<User | null> {
  if (event.context.authUser !== undefined) return event.context.authUser
  const token = (getHeader(event, 'Authorization') || '').replace(/^Bearer\s+/i, '')
  let user: User | null = null
  if (token) {
    const { data, error } = await serviceClient().auth.getUser(token)
    if (!error && data.user) user = data.user
  }
  event.context.authUser = user
  return user
}

/** Користувач із заголовка Authorization: Bearer <access_token>. Кидає 401. */
export async function requireUser(event: H3Event): Promise<{ user: User; supabase: SupabaseClient }> {
  const user = await userFromRequest(event)
  if (!user) throw createError({ statusCode: 401, message: 'Потрібно увійти в акаунт' })
  return { user, supabase: serviceClient() }
}

/** Лише адмін (users.role = 'admin'). Кидає 401 / 403. */
export async function requireAdmin(event: H3Event) {
  const ctx = await requireUser(event)
  const { data } = await ctx.supabase.from('users').select('role').eq('id', ctx.user.id).maybeSingle()
  if (data?.role !== 'admin') throw createError({ statusCode: 403, message: 'Доступ лише для адміністратора' })
  return ctx
}
