<template>
  <div class="min-h-screen flex items-center justify-center bg-agro-bg px-4">
    <div class="w-full max-w-md">

      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-2">
          <span class="text-2xl font-extrabold text-agro-dark bitter">🌿 АгроПростір</span>
        </NuxtLink>
      </div>

      <div v-if="loading" class="card text-center py-12">
        <div class="w-10 h-10 border-2 border-agro border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-agro-light text-sm">Перевіряємо запрошення...</p>
      </div>

      <div v-else-if="!invite" class="card text-center py-12">
        <div class="text-4xl mb-4">❌</div>
        <p class="font-bold text-agro-dark text-lg mb-2">Запрошення недійсне</p>
        <p class="text-agro-light text-sm mb-6">Посилання вже використане або не існує</p>
        <NuxtLink to="/" class="btn-primary inline-flex">На головну</NuxtLink>
      </div>

      <div v-else-if="invite.status === 'active'" class="card text-center py-12">
        <div class="text-4xl mb-4">✅</div>
        <p class="font-bold text-agro-dark text-lg mb-2">Запрошення вже прийнято</p>
        <p class="text-agro-light text-sm mb-6">Увійдіть через звичайну форму</p>
        <NuxtLink to="/login" class="btn-primary inline-flex">Увійти</NuxtLink>
      </div>

      <div v-else class="card">
        <div class="text-center mb-6">
          <div class="w-16 h-16 rounded-2xl bg-agro-hover flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <h1 class="text-xl font-bold text-agro-dark bitter mb-1">Запрошення до команди</h1>
          <p class="text-agro-light text-sm">Роль: <strong class="text-agro-dark">{{ roleLabel }}</strong></p>
        </div>

        <div class="space-y-3 mb-4">
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Email</label>
            <input :value="invite.email" type="email" class="input opacity-70 cursor-not-allowed" disabled />
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">
              {{ isExistingUser ? 'Пароль' : 'Придумайте пароль' }}
            </label>
            <input v-model="password" type="password" class="input" placeholder="Мінімум 8 символів"
              @keydown.enter="submit" />
          </div>
        </div>

        <p v-if="authError" class="text-sm text-red-500 mb-3">{{ authError }}</p>

        <button @click="submit" :disabled="submitting || !password"
          class="btn-primary w-full justify-center disabled:opacity-50">
          {{ submitting ? 'Зачекайте...' : isExistingUser ? 'Увійти і прийняти запрошення' : 'Зареєструватись і прийняти запрошення' }}
        </button>

        <button @click="toggleMode" class="w-full mt-3 text-sm text-agro-light hover:text-agro-dark transition-colors py-2">
          {{ isExistingUser ? 'Немає акаунту? Зареєструватись' : 'Вже є акаунт? Увійти' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Запрошення до команди — АгроПростір' })

const route = useRoute()
const supabase = useSupabaseClient()
const token = route.query.token as string

const loading = ref(true)
const invite  = ref<any>(null)
const password = ref('')
const authError = ref('')
const submitting = ref(false)
const isExistingUser = ref(false)

const roleLabel = computed(() =>
  invite.value?.role === 'editor' ? 'Редактор' : 'Переглядач'
)

onMounted(async () => {
  if (!token) { loading.value = false; return }

  const { data } = await supabase
    .from('team_members')
    .select('id, email, role, status, owner_id')
    .eq('token', token)
    .maybeSingle()

  invite.value = data
  loading.value = false
})

const toggleMode = () => {
  isExistingUser.value = !isExistingUser.value
  authError.value = ''
}

const submit = async () => {
  if (!password.value || !invite.value) return
  if (password.value.length < 8) { authError.value = 'Пароль мінімум 8 символів'; return }

  authError.value = ''
  submitting.value = true

  let userId: string | null = null

  if (isExistingUser.value) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: invite.value.email,
      password: password.value,
    })
    if (error) { authError.value = 'Невірний пароль'; submitting.value = false; return }
    userId = data.user?.id ?? null
  } else {
    const { data, error } = await supabase.auth.signUp({
      email: invite.value.email,
      password: password.value,
    })
    if (error) {
      if (error.message.includes('already registered')) {
        authError.value = 'Email вже зареєстровано. Натисніть «Вже є акаунт»'
      } else {
        authError.value = error.message
      }
      submitting.value = false
      return
    }
    userId = data.user?.id ?? null
  }

  if (!userId) { authError.value = 'Помилка авторизації'; submitting.value = false; return }

  await supabase
    .from('team_members')
    .update({ member_id: userId, status: 'active' })
    .eq('token', token)

  submitting.value = false
  await navigateTo('/dashboard?team_accepted=1')
}
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
</style>
