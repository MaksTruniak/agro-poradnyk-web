/**
 * Повертає userId для запитів до БД.
 * Якщо юзер є членом команди — повертає ownerId власника.
 * Інакше — id поточного юзера.
 */
export const useTeamContext = () => {
  const supabase = useSupabaseClient()
  const teamOwnerId = inject<Ref<string | null>>('teamOwnerId', ref(null))
  const teamRole    = inject<Ref<string | null>>('teamRole',    ref(null))

  const isTeamMember = computed(() => !!teamOwnerId.value)
  const isEditor = computed(() => teamRole.value === 'Редактор')
  const isViewer = computed(() => teamRole.value === 'Переглядач')

  // Повертає userId для SELECT-запитів
  const getQueryUserId = async (): Promise<string | null> => {
    if (teamOwnerId.value) return teamOwnerId.value
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  }

  return { teamOwnerId, teamRole, isTeamMember, isEditor, isViewer, getQueryUserId }
}
