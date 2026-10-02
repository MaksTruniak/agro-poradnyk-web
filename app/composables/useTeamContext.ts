/**
 * Режим співробітника команди.
 * getQueryUserId() — userId для запитів до БД: якщо юзер активний член команди — ownerId власника, інакше свій id.
 * Членство визначається з БД (team_members) і кешується для поточного юзера: сторінка монтується раніше
 * за layout, тож не можна покладатися лише на значення, яке layout передає через provide.
 */
interface TeamMembership { userId: string; ownerId: string | null; role: string | null }

export const useTeamContext = () => {
  const supabase = useSupabaseClient()
  const teamOwnerId = inject<Ref<string | null>>('teamOwnerId', ref(null))
  const teamRole    = inject<Ref<string | null>>('teamRole',    ref(null))
  const membership  = useState<TeamMembership | null>('team-membership', () => null)

  const isTeamMember = computed(() => !!(teamOwnerId.value || membership.value?.ownerId))
  const roleLabel = computed(() => teamRole.value
    || (membership.value?.role === 'editor' ? 'Редактор' : membership.value?.role ? 'Переглядач' : null))
  const isEditor = computed(() => roleLabel.value === 'Редактор')
  const isViewer = computed(() => roleLabel.value === 'Переглядач')

  // Членство поточного юзера (з кешем; інший юзер у тій самій вкладці — перечитуємо)
  const resolveMembership = async (): Promise<TeamMembership | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    if (membership.value?.userId === session.user.id) return membership.value
    const { data } = await supabase
      .from('team_members')
      .select('owner_id, role')
      .eq('member_id', session.user.id)
      .eq('status', 'active')
      .maybeSingle()
    // Співробітник вийшов з режиму команди в цій вкладці — працює зі своїми даними
    const exited = import.meta.client && sessionStorage.getItem('agro_team_exit') === '1'
    membership.value = exited
      ? { userId: session.user.id, ownerId: null, role: null }
      : { userId: session.user.id, ownerId: data?.owner_id ?? null, role: data?.role ?? null }
    return membership.value
  }

  // Повертає userId для запитів до даних господарства
  const getQueryUserId = async (): Promise<string | null> => {
    const m = await resolveMembership()
    if (!m) return null
    return m.ownerId ?? m.userId
  }

  // Скинути кеш членства (вихід з режиму команди)
  const resetTeamMembership = () => { membership.value = null }

  // Вихід з акаунта: прибрати все про команду, щоб наступний юзер цього браузера не бачив чужий режим
  const clearTeamCache = () => {
    resetTeamMembership()
    if (!import.meta.client) return
    for (const k of ['agro_team_owner_id', 'agro_team_owner_name', 'agro_team_role_label', 'agro_team_position']) localStorage.removeItem(k)
    sessionStorage.removeItem('agro_team_exit')
  }

  return { teamOwnerId, teamRole, isTeamMember, isEditor, isViewer, getQueryUserId, resolveMembership, resetTeamMembership, clearTeamCache }
}
