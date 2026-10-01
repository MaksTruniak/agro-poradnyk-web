// Заголовки для серверних API, що перевіряють користувача: токен сесії й активний профіль (для тарифу)
export const useAuthHeader = () => {
  const supabase = useSupabaseClient()
  return async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return {}
    const role = import.meta.client
      ? localStorage.getItem('agro_active_profile') || localStorage.getItem('agro_user_role')
      : null
    return {
      Authorization: `Bearer ${session.access_token}`,
      'X-Agro-Profile': subscriptionProfileFor(role),
    }
  }
}
