export const useCurrentUserId = async () => {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id || null
}
