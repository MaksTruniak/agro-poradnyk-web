export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return navigateTo('/auth')
  const { data } = await supabase.from('users').select('role').eq('id', session.user.id).single()
  if (data?.role !== 'admin') return navigateTo('/dashboard')
})
