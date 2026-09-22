export default defineNuxtRouteMiddleware(async (to) => {
  // Публічні сторінки без авторизації
  const publicPaths = ['/harvest-worker', '/onboarding', '/auth', '/invite']
  if (publicPaths.some(p => to.path.startsWith(p))) return

  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return navigateTo('/auth')

  // Працівники збору — редиректимо на їх кабінет
  if (session.user.user_metadata?.role === 'harvest_worker') {
    if (!to.path.startsWith('/harvest-worker')) return navigateTo('/harvest-worker')
    return
  }

  // Перевіряємо онбординг (тільки для dashboard сторінок)
  if (to.path.startsWith('/dashboard')) {
    const { data: user } = await supabase.from('users').select('onboarded_at').eq('id', session.user.id).single()
    if (!user?.onboarded_at) {
      // Співробітники команди не проходять onboarding
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('member_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle()
      if (!teamMember) return navigateTo('/onboarding')
    }
  }
})
