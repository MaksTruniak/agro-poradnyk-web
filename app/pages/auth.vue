<template>
  <div class="min-h-screen bg-agro-bg flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <NuxtLink to="/" class="text-3xl">🌾</NuxtLink>
        <h1 class="text-2xl font-extrabold text-agro-dark mt-2">АгроПорадник</h1>
        <p class="text-agro-light mt-1">{{ mode === 'login' ? 'Увійдіть у свій акаунт' : 'Створіть акаунт' }}</p>
      </div>

      <div class="card">
        <!-- Таби -->
        <div class="flex rounded-xl bg-agro-bg p-1 mb-6">
          <button
            v-for="tab in [['login','Вхід'],['register','Реєстрація']]"
            :key="tab[0]"
            @click="mode = tab[0] as any"
            class="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
            :class="mode === tab[0] ? 'bg-white text-agro shadow-sm' : 'text-agro-light'"
          >{{ tab[1] }}</button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div v-if="mode === 'register'">
            <label class="block text-sm font-medium text-agro-dark mb-1">Ім'я</label>
            <input v-model="name" class="input" placeholder="Ваше ім'я" required />
          </div>

          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Email</label>
            <input v-model="email" type="email" class="input" placeholder="email@example.com" required />
          </div>

          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Пароль</label>
            <div class="relative">
              <input v-model="password" :type="showPassword ? 'text' : 'password'" class="input pr-11" placeholder="••••••••" required />
              <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light hover:text-agro-dark transition-colors">
                <span class="text-lg">{{ showPassword ? '🙈' : '👁' }}</span>
              </button>
            </div>
          </div>

          <!-- Вибір ролі при реєстрації -->
          <div v-if="mode === 'register'">
            <label class="block text-sm font-medium text-agro-dark mb-2">Я є...</label>
            <div class="space-y-2">
              <button
                v-for="r in ROLES"
                :key="r.value"
                type="button"
                @click="role = r.value"
                class="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left"
                :class="role === r.value ? 'border-agro bg-agro-hover' : 'border-agro-border bg-white'"
              >
                <span class="text-2xl">{{ r.emoji }}</span>
                <div class="flex-1">
                  <p class="font-semibold text-sm text-agro-dark">{{ r.label }}</p>
                  <p class="text-xs text-agro-light">{{ r.desc }}</p>
                </div>
                <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  :class="role === r.value ? 'border-agro bg-agro' : 'border-agro-border'">
                  <span v-if="role === r.value" class="text-white text-xs">✓</span>
                </div>
              </button>
            </div>
          </div>

          <button type="submit" :disabled="loading" class="btn-primary w-full py-3">
            {{ loading ? 'Завантаження...' : mode === 'login' ? 'Увійти' : 'Зареєструватись' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const MARKETPLACE = false

const supabase = useSupabaseClient()
const router = useRouter()
const route = useRoute()

const mode = ref<'login' | 'register'>(route.query.mode === 'register' ? 'register' : 'login')
const email = ref('')
const password = ref('')
const name = ref('')
const role = ref('farmer')
const loading = ref(false)
const showPassword = ref(false)
const { error: showError, success: showSuccess } = useToast()

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Невірний email або пароль',
  'Email not confirmed': 'Підтвердіть email перед входом',
  'User already registered': 'Акаунт з таким email вже існує',
  'Password should be at least 6 characters': 'Пароль має бути не менше 6 символів',
  'Unable to validate email address: invalid format': 'Невірний формат email',
}

const ROLES = [
  { value: 'farmer', label: 'Фермер', emoji: '🌾', desc: 'Веду поля, слідкую за культурами і програмами захисту' },
  { value: 'agronomist', label: 'Агроном', emoji: '🔬', desc: 'Консультую фермерів і веду власні поля та культури' },
  ...(MARKETPLACE ? [{ value: 'seller', label: 'Продавець', emoji: '🏪', desc: 'Продаю препарати і добрива фермерам' }] : []),
]

const handleSubmit = async () => {
  loading.value = true
  try {
    if (mode.value === 'login') {
      const { error: e } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
      if (e) throw e
      await supabase.auth.getSession()
    } else {
      const { data, error: e } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: { data: { name: name.value, role: role.value } },
      })
      if (e) throw e
      if (data.user) {
        await supabase.from('users').insert({ id: data.user.id, email: email.value, name: name.value, role: role.value })
        showSuccess('Акаунт створено! Ласкаво просимо 🌾')
      }
    }
    router.push('/dashboard')
  } catch (e: any) {
    const msg = AUTH_ERRORS[e.message] || e.message
    showError(msg)
  } finally {
    loading.value = false
  }
}
</script>
