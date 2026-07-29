<template>
  <div class="min-h-screen bg-agro-bg flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block">
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <clipPath id="logo-clip-auth"><rect width="32" height="32" rx="8"/></clipPath>
            <g clip-path="url(#logo-clip-auth)">
              <rect width="32" height="32" fill="#B5D4F4"/>
              <ellipse cx="8" cy="8" rx="5" ry="2.5" fill="white" opacity="0.8"/>
              <ellipse cx="22" cy="6" rx="4" ry="2" fill="white" opacity="0.7"/>
              <rect x="0" y="16" width="32" height="3" fill="#3B6D11"/>
              <rect x="0" y="19" width="32" height="13" fill="#A0622A"/>
              <rect x="0" y="25" width="32" height="7" fill="#7A4620"/>
              <line x1="0" y1="19" x2="32" y2="19" stroke="#5C3310" stroke-width="0.5"/>
            </g>
          </svg>
        </NuxtLink>
        <h1 class="text-2xl font-extrabold text-agro-dark mt-2">АгроПростір</h1>
        <p class="text-agro-light mt-1">{{ mode === 'login' ? 'Увійдіть у свій акаунт' : step === 1 ? 'Хто ви?' : 'Заповніть дані' }}</p>
      </div>

      <div class="card">
        <!-- Таби -->
        <div class="flex rounded-xl bg-agro-bg p-1 mb-6">
          <button
            v-for="tab in [['login','Вхід'],['register','Реєстрація']]"
            :key="tab[0]"
            :data-testid="`tab-${tab[0]}`"
            @click="switchMode(tab[0] as any)"
            class="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
            :class="mode === tab[0] ? 'bg-white text-agro shadow-sm' : 'text-agro-light'"
          >{{ tab[1] }}</button>
        </div>

        <!-- ВХІД -->
        <form v-if="mode === 'login'" @submit.prevent="handleLogin" novalidate class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Email</label>
            <input data-testid="login-email" :value="email" @input="onEmailInput" type="text" inputmode="email" class="input" :class="email && !isEmailValid ? 'border-red-400' : ''" placeholder="email@example.com" autocomplete="email" />
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Пароль</label>
            <div class="relative">
              <input data-testid="login-password" v-model="password" :type="showPassword ? 'text' : 'password'" class="input pr-11" placeholder="••••••••" />
              <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light hover:text-agro-dark transition-colors">
                <span class="text-lg">{{ showPassword ? '🙈' : '👁' }}</span>
              </button>
            </div>
          </div>
          <button data-testid="login-submit" type="submit" :disabled="loading" class="btn-primary w-full py-3">
            {{ loading ? 'Завантаження...' : 'Увійти' }}
          </button>
        </form>

        <!-- РЕЄСТРАЦІЯ КРОК 1: вибір ролі -->
        <div v-else-if="step === 1" class="space-y-3">
          <button
            v-for="r in ROLES"
            :key="r.value"
            :data-testid="`role-${r.value}`"
            type="button"
            @click="selectRole(r.value)"
            class="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left"
            :class="role === r.value ? 'border-agro bg-agro-hover' : 'border-agro-border bg-white hover:border-agro/40'"
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
          <button data-testid="step1-next" @click="step = 2" :disabled="!role" class="btn-primary w-full py-3 mt-2">
            Далі →
          </button>
        </div>

        <!-- РЕЄСТРАЦІЯ КРОК 2: поля -->
        <form v-else @submit.prevent="handleRegister" novalidate class="space-y-4">
          <!-- Назад -->
          <button type="button" @click="step = 1" class="flex items-center gap-1.5 text-sm text-agro-light hover:text-agro transition-colors mb-2">
            <span>←</span>
            <span>{{ ROLES.find(r => r.value === role)?.emoji }} {{ ROLES.find(r => r.value === role)?.label }}</span>
          </button>

          <!-- Ім'я + Прізвище -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Ім'я</label>
              <input data-testid="reg-first-name" v-model="firstName" class="input" placeholder="Іван" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Прізвище</label>
              <input data-testid="reg-last-name" v-model="lastName" class="input" placeholder="Петренко" />
            </div>
          </div>

          <!-- Назва господарства / підприємства / магазину -->
          <div v-if="hasCompany">
            <label class="block text-sm font-medium text-agro-dark mb-1">{{ companyLabel }}</label>
            <input data-testid="reg-company" v-model="companyName" class="input" :placeholder="companyPlaceholder" />
          </div>

          <!-- Регіон (тільки для агронома) -->
          <div v-if="role === 'agronomist'">
            <label class="block text-sm font-medium text-agro-dark mb-1">Регіон роботи</label>
            <select data-testid="reg-region" v-model="region" class="input">
              <option value="" disabled>Виберіть регіон</option>
              <option v-for="r in REGIONS" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>

          <!-- Телефон -->
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Телефон</label>
            <input data-testid="reg-phone" :value="phone" @input="onPhoneInput" type="tel" inputmode="tel" class="input" :class="phone && !isPhoneValid ? 'border-red-400' : ''" placeholder="+38 (0__) ___-__-__" autocomplete="tel" />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Email</label>
            <input data-testid="reg-email" :value="email" @input="onEmailInput" type="text" inputmode="email" class="input" :class="email && !isEmailValid ? 'border-red-400' : ''" placeholder="email@example.com" autocomplete="email" />
          </div>

          <!-- Пароль -->
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Пароль</label>
            <div class="relative">
              <input data-testid="reg-password" v-model="password" :type="showPassword ? 'text' : 'password'" class="input pr-11" placeholder="Мінімум 8 символів" minlength="8" />
              <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light hover:text-agro-dark transition-colors">
                <span class="text-lg">{{ showPassword ? '🙈' : '👁' }}</span>
              </button>
            </div>
            <!-- Індикатор сили пароля -->
            <div class="flex gap-1 mt-1.5" v-if="password">
              <div v-for="i in 4" :key="i" class="h-1 flex-1 rounded-full transition-colors"
                :class="passwordStrength >= i ? strengthColor : 'bg-agro-border'"></div>
            </div>
            <p v-if="password" class="text-xs mt-1" :class="strengthTextColor">{{ strengthLabel }}</p>
          </div>

          <!-- Підтвердження пароля -->
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1">Підтвердіть пароль</label>
            <div class="relative">
              <input data-testid="reg-confirm-password" v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" class="input pr-11"
                :class="confirmPassword && password !== confirmPassword ? 'border-red-400' : ''"
                placeholder="Повторіть пароль" />
            </div>
          </div>

          <button data-testid="reg-submit" type="submit" :disabled="loading" class="btn-primary w-full py-3">
            {{ loading ? 'Створюємо акаунт...' : 'Зареєструватись' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Вхід — АгроПростір' })

const MARKETPLACE = false

const supabase = useSupabaseClient()
const router = useRouter()
const route = useRoute()

const mode = ref<'login' | 'register'>(route.query.mode === 'register' ? 'register' : 'login')
const step = ref(1)

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const firstName = ref('')
const lastName = ref('')
const companyName = ref('')
const phone = ref('')
const region = ref('')
const role = ref('farmer')
const loading = ref(false)
const showPassword = ref(false)
const { error: showError, success: showSuccess } = useToast()

const ROLES = [
  { value: 'farmer', label: 'Фермер', emoji: '🌾', desc: 'Веду поля, слідкую за культурами і програмами захисту' },
  { value: 'agronomist', label: 'Агроном', emoji: '🔬', desc: 'Консультую фермерів і веду власні поля та культури' },
  { value: 'buyer', label: 'Заготівельник', emoji: '🏭', desc: 'Купую зерно та продукцію безпосередньо у фермерів' },
  ...(MARKETPLACE ? [{ value: 'seller', label: 'Продавець добрив', emoji: '🏪', desc: 'Продаю препарати і добрива фермерам' }] : []),
]

const REGIONS = [
  'Вінницька', 'Волинська', 'Дніпропетровська', 'Донецька', 'Житомирська',
  'Закарпатська', 'Запорізька', 'Івано-Франківська', 'Київська', 'Кіровоградська',
  'Луганська', 'Львівська', 'Миколаївська', 'Одеська', 'Полтавська',
  'Рівненська', 'Сумська', 'Тернопільська', 'Харківська', 'Херсонська',
  'Хмельницька', 'Черкаська', 'Чернівецька', 'Чернігівська',
]

const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const isPhoneValid = computed(() => /^\+38 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(phone.value))

const onEmailInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  email.value = val.toLowerCase().replace(/\s/g, '')
  ;(e.target as HTMLInputElement).value = email.value
}

const onPhoneInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  // Витягуємо тільки цифри
  let digits = input.value.replace(/\D/g, '')
  // Прибираємо префікс 380 якщо юзер вставив повний номер
  if (digits.startsWith('38')) digits = digits.slice(2)
  // Обмежуємо до 10 цифр (0XX XXX XX XX)
  digits = digits.slice(0, 10)

  if (!digits) { phone.value = ''; input.value = ''; return }

  // Форматуємо: +38 (0d1d2) d3d4d5-d6d7-d8d9
  let masked = '+38 (' + digits.slice(0, 3)
  if (digits.length > 3) masked += ') ' + digits.slice(3, 6)
  if (digits.length > 6) masked += '-' + digits.slice(6, 8)
  if (digits.length > 8) masked += '-' + digits.slice(8, 10)

  phone.value = masked
  input.value = masked
}

const hasCompany = computed(() => ['farmer', 'buyer', 'seller'].includes(role.value))

const companyLabel = computed(() => {
  if (role.value === 'farmer') return 'Назва фермерського господарства'
  if (role.value === 'buyer') return 'Назва підприємства або ФОП'
  if (role.value === 'seller') return 'Назва магазину'
  return ''
})

const companyPlaceholder = computed(() => {
  if (role.value === 'farmer') return 'ФГ "Зоря"'
  if (role.value === 'buyer') return 'ТОВ "АгроТрейд" або ФОП Петренко'
  if (role.value === 'seller') return 'АгроМаркет'
  return ''
})

// Індикатор сили пароля
const passwordStrength = computed(() => {
  const p = password.value
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score++
  if (/[a-z]/.test(p)) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p) && /[!@#$%^&*()_+\-=\[\]{};':"\\|<>?,./`~]/.test(p)) score++
  return score
})

const strengthColor = computed(() => {
  if (passwordStrength.value <= 1) return 'bg-red-400'
  if (passwordStrength.value === 2) return 'bg-yellow-400'
  if (passwordStrength.value === 3) return 'bg-blue-400'
  return 'bg-green-500'
})

const strengthTextColor = computed(() => {
  if (passwordStrength.value <= 1) return 'text-red-500'
  if (passwordStrength.value === 2) return 'text-yellow-600'
  if (passwordStrength.value === 3) return 'text-blue-500'
  return 'text-green-600'
})

const strengthLabel = computed(() => {
  if (passwordStrength.value <= 1) return 'Слабкий пароль'
  if (passwordStrength.value === 2) return 'Середній пароль'
  if (passwordStrength.value === 3) return 'Хороший пароль'
  return 'Надійний пароль'
})

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Невірний email або пароль',
  'Email not confirmed': 'Підтвердіть email перед входом',
  'User already registered': 'Акаунт з таким email вже існує',
  'Password should be at least 6 characters': 'Пароль має бути не менше 8 символів',
  'Unable to validate email address: invalid format': 'Невірний формат email',
  'Password should contain at least one character of each': 'Пароль має містити великі, малі літери, цифру та спеціальний символ',
}

const switchMode = (m: 'login' | 'register') => {
  mode.value = m
  step.value = 1
}

const selectRole = (r: string) => {
  role.value = r
}

const handleLogin = async () => {
  if (!isEmailValid.value) { showError('Введіть коректний email'); return }
  loading.value = true
  try {
    const { error: e } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
    if (e) throw e
    await supabase.auth.getSession()
    router.push('/dashboard')
  } catch (e: any) {
    showError(AUTH_ERRORS[e.message] || e.message)
  } finally {
    loading.value = false
  }
}

const validatePassword = (p: string) => {
  if (p.length < 8) return 'Пароль має бути не менше 8 символів'
  if (!/[a-z]/.test(p)) return 'Пароль має містити хоча б одну малу латинську літеру'
  if (!/[A-Z]/.test(p)) return 'Пароль має містити хоча б одну велику латинську літеру'
  if (!/[0-9]/.test(p)) return 'Пароль має містити хоча б одну цифру'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|<>?,./`~]/.test(p)) return 'Пароль має містити хоча б один спеціальний символ'
  return null
}

const handleRegister = async () => {
  if (!isEmailValid.value) { showError('Введіть коректний email'); return }
  if (!isPhoneValid.value) { showError('Введіть коректний номер телефону'); return }
  const pwdError = validatePassword(password.value)
  if (pwdError) { showError(pwdError); return }
  if (password.value !== confirmPassword.value) { showError('Паролі не співпадають'); return }
  loading.value = true
  const fullName = `${firstName.value} ${lastName.value}`.trim()
  try {
    const { data, error: e } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: { data: { name: fullName, role: role.value } },
    })
    if (e) throw e
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email: email.value,
        name: fullName,
        first_name: firstName.value,
        last_name: lastName.value,
        company_name: companyName.value || null,
        phone: phone.value,
        region: region.value || null,
        role: role.value,
      } as any)
      showSuccess('Акаунт створено! Ласкаво просимо 🌾')
    }
    router.push('/dashboard')
  } catch (e: any) {
    showError(AUTH_ERRORS[e.message] || e.message)
  } finally {
    loading.value = false
  }
}
</script>
