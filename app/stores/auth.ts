export const useAuthStore = defineStore('auth', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const profile = ref<{ name: string; role: string } | null>(null)

  const role = computed(() => profile.value?.role || 'farmer')
  const isFarmer = computed(() => role.value === 'farmer' || role.value === 'dacha')
  const isAgronomist = computed(() => role.value === 'agronomist')
  const isSeller = computed(() => role.value === 'seller')

  const loadProfile = async () => {
    if (!user.value) return
    const { data } = await supabase.from('users').select('name, role').eq('id', user.value.id).single()
    profile.value = data
  }

  return { user, profile, role, isFarmer, isAgronomist, isSeller, loadProfile }
})
