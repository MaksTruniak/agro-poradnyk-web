<template>
  <div class="min-h-screen flex items-center justify-center bg-agro-bg px-4">
    <div class="w-full max-w-md">

      <!-- Логотип -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-2">
          <span class="text-2xl font-extrabold text-agro-dark bitter">🌿 АгроПростір</span>
        </NuxtLink>
      </div>

      <!-- Завантаження -->
      <div v-if="loading" class="card text-center py-12">
        <div class="w-10 h-10 border-2 border-agro border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-agro-light text-sm">Перевіряємо запрошення...</p>
      </div>

      <!-- Помилка токену -->
      <div v-else-if="!invite" class="card text-center py-12">
        <div class="text-4xl mb-4">❌</div>
        <p class="font-bold text-agro-dark text-lg mb-2">Запрошення недійсне</p>
        <p class="text-agro-light text-sm mb-6">Посилання вже використане або не існує</p>
        <NuxtLink to="/" class="btn-primary inline-flex">На головну</NuxtLink>
      </div>

      <!-- Вже прийнято -->
      <div v-else-if="invite.status === 'active'" class="card text-center py-12">
        <div class="text-4xl mb-4">✅</div>
        <p class="font-bold text-agro-dark text-lg mb-2">Запрошення вже прийнято</p>
        <p class="text-agro-light text-sm mb-6">Ви вже є членом цієї команди</p>
        <NuxtLink to="/dashboard" class="btn-primary inline-flex">Перейти в дашборд</NuxtLink>
      </div>

      <!-- Форма прийняття -->
      <div v-else class="card">
        <div class="text-center mb-6">
          <div class="w-16 h-16 rounded-2xl bg-agro-hover flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <h1 class="text-xl font-bold text-agro-dark bitter mb-1">Запрошення до команди</h1>
          <p class="text-agro-light text-sm">
            Роль: <strong class="text-agro-dark">{{ roleLabel }}</strong>
          </p>
        </div>

        <!-- Не залогінений -->
        <template v-if="!currentUser">
          <p class="text-sm text-agro-light text-center mb-5">
            Увійдіть або зареєструйтесь на email <strong class="text-agro-dark">{{ invite.email }}</strong>
          </p>

          <div class="space-y-3 mb-4">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Email</label>
              <input v-model="authForm.email" type="email" class="input" :placeholder="invite.email" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Пароль</label>
              <input v-model="authForm.password" type="password" class="input" placeholder="Мінімум 8 символів" />
            </div>
          </div>

          <div class="flex gap-2 mb-3">
            <button @click="doLogin" :disabled="authing"
              class="btn-outline flex-1 justify-center disabled:opacity-50">
              {{ authing === 'login' ? 'Вхід...' : 'Увійти' }}
            </button>
            <button @click="doRegister" :disabled="!!authing"
              class="btn-primary flex-1 justify-center disabled:opacity-50">
              {{ authing === 'register' ? 'Реєстрація...' : 'Зареєструватись' }}
            </button>
          </div>

          <p v-if="authError" class="text-sm text-red-500 text-center">{{ authError }}</p>
        </template>

        <!-- Залогінений — підтвердження -->
        <template v-else>
          <div class="bg-agro-bg rounded-xl p-4 mb-5 text-sm text-agro-light text-center">
            Ви увійшли як <strong class="text-agro-dark">{{ currentUser.email }}</strong>
          </div>

          <p v-if="currentUser.email !== invite.email" class="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            ⚠️ Запрошення надіслано на <strong>{{ invite.email }}</strong>, але ви увійшли як <strong>{{ currentUser.email }}</strong>. Рекомендуємо увійти з потрібного email.
          </p>

          <button @click="acceptInvite" :disabled="accepting"
            class="btn-primary w-full justify-center disabled:opacity-50">
            {{ accepting ? 'Приймаємо...' : '✓ Прийняти запрошення' }}
          </button>

          <button @click="doLogout" class="w-full mt-2 text-sm text-agro-light hover:text-agro-dark transition-colors py-2">
            Увійти з іншого акаунту
          </button>
        </template>
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

const loading   = ref(true)
const invite    = ref<any>(null)
const currentUser = ref<any>(null)
const accepting = ref(false)
const authing   = ref<'login' | 'register' | false>(false)
const authError = ref('')
const authForm  = reactive({ email: '', password: '' })

const roleLabel = computed(() =>
  invite.value?.role === 'editor' ? 'Редактор' : 'Переглядач'
)

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  currentUser.value = user

  if (!token) { loading.value = false; return }

  const { data } = await supabase
    .from('team_members')
    .select('id, email, role, status, owner_id')
    .eq('token', token)
    .maybeSingle()

  invite.value = data
  if (data && authForm.email === '') authForm.email = data.email
  loading.value = false
})

const doLogin = async () => {
  authError.value = ''
  authing.value = 'login'
  const { data, error } = await supabase.auth.signInWithPassword({
    email: authForm.email,
    password: authForm.password,
  })
  authing.value = false
  if (error) { authError.value = 'Невірний email або пароль'; return }
  currentUser.value = data.user
}

const doRegister = async () => {
  authError.value = ''
  if (authForm.password.length < 8) { authError.value = 'Пароль мінімум 8 символів'; return }
  authing.value = 'register'
  const { data, error } = await supabase.auth.signUp({
    email: authForm.email,
    password: authForm.password,
  })
  authing.value = false
  if (error) { authError.value = error.message; return }
  currentUser.value = data.user
}

const doLogout = async () => {
  await supabase.auth.signOut()
  currentUser.value = null
}

const acceptInvite = async () => {
  if (!currentUser.value || !invite.value) return
  accepting.value = true

  await supabase
    .from('team_members')
    .update({
      member_id: currentUser.value.id,
      name: currentUser.value.user_metadata?.full_name || currentUser.value.email,
      status: 'active',
    })
    .eq('token', token)

  await navigateTo('/dashboard?team_accepted=1')
}
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
</style>
