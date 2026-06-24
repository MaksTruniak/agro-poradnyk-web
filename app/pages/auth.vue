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
            <input v-model="password" type="password" class="input" placeholder="••••••••" required />
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

          <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

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

const supabase = useSupabaseClient()
const router = useRouter()
const route = useRoute()

const mode = ref<'login' | 'register'>(route.query.mode === 'register' ? 'register' : 'login')
const email = ref('')
const password = ref('')
const name = ref('')
const role = ref('farmer')
const loading = ref(false)
const error = ref('')

const ROLES = [
  { value: 'farmer', label: 'Фермер', emoji: '🌾', desc: 'Веду поля, слідкую за культурами і програмами захисту' },
  { value: 'dacha', label: 'Дачник', emoji: '🏡', desc: 'Доглядаю сад і город, підбираю схеми обробки' },
  { value: 'agronomist', label: 'Агроном', emoji: '🔬', desc: 'Консультую фермерів і веду власні поля та культури' },
  { value: 'seller', label: 'Продавець', emoji: '🏪', desc: 'Продаю препарати і добрива фермерам' },
]

const handleSubmit = async () => {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      const { error: e } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
      if (e) throw e
    } else {
      const { data, error: e } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: { data: { name: name.value, role: role.value } },
      })
      if (e) throw e
      if (data.user) {
        await supabase.from('users').insert({ id: data.user.id, email: email.value, name: name.value, role: role.value })
      }
    }
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
