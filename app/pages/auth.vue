<template>
  <div class="auth-page min-h-screen flex items-center justify-center px-6 py-20">
    <div class="w-full max-w-[520px]">

      <!-- Лого + заголовок -->
      <div class="flex flex-col items-center mb-9">
        <NuxtLink to="/" class="w-16 h-16 rounded-[18px] bg-[#2F5233] flex items-center justify-center mb-5 shadow-[0_12px_24px_-10px_rgba(47,82,51,0.4)]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C7 6 4 10 4 14a8 8 0 0016 0c0-4-3-8-8-12z" fill="#FAF6EC"/>
            <path d="M12 22V10" stroke="#FAF6EC" stroke-width="1.4"/>
          </svg>
        </NuxtLink>
        <h1 class="bitter text-[28px] font-extrabold text-[rgb(27,46,27)] mb-2">АгроПростір</h1>
        <p class="text-[15.5px] text-[rgb(107,122,100)]">
          {{ mode === 'login' ? 'Увійдіть у свій акаунт' : step === 1 ? 'Хто ви?' : 'Заповніть дані' }}
        </p>
      </div>

      <!-- Картка -->
      <div class="bg-white rounded-[22px] px-8 py-8 shadow-[0_24px_60px_-30px_rgba(30,45,25,0.35)]">

        <!-- Таби -->
        <div class="flex bg-[rgb(241,239,227)] rounded-[14px] p-[5px] mb-7">
          <button
            v-for="tab in [['login','Вхід'],['register','Реєстрація']]"
            :key="tab[0]"
            :data-testid="`tab-${tab[0]}`"
            @click="switchMode(tab[0] as any)"
            class="flex-1 text-center py-[11px] rounded-[10px] font-bold text-[14.5px] transition-all"
            :class="mode === tab[0]
              ? 'bg-white text-[#2F5233] shadow-[0_4px_10px_-4px_rgba(30,45,25,0.2)]'
              : 'text-[rgb(107,122,100)]'"
          >{{ tab[1] }}</button>
        </div>

        <!-- ВХІД -->
        <form v-if="mode === 'login'" @submit.prevent="handleLogin" novalidate class="space-y-5">
          <div>
            <label class="auth-label">Email</label>
            <input data-testid="login-email" :value="email" @input="onEmailInput" type="text" inputmode="email"
              class="auth-input" :class="email && !isEmailValid ? 'border-red-400' : ''"
              placeholder="email@example.com" autocomplete="email" />
          </div>
          <div>
            <label class="auth-label">Пароль</label>
            <div class="relative">
              <input data-testid="login-password" v-model="password" :type="showPassword ? 'text' : 'password'"
                class="auth-input pr-12" placeholder="••••••••" />
              <button type="button" @click="showPassword = !showPassword"
                class="absolute right-[14px] top-1/2 -translate-y-1/2 flex text-[rgb(122,138,114)] hover:text-[rgb(47,82,51)] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>
                  <path v-if="showPassword" d="M3 3l18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="text-right -mt-2">
            <NuxtLink to="/reset-password" class="text-[13.5px] font-semibold text-[#2F5233] hover:underline">Забули пароль?</NuxtLink>
          </div>
          <button data-testid="login-submit" type="submit" :disabled="loading" class="auth-btn w-full">
            {{ loading ? 'Завантаження...' : 'Увійти' }}
          </button>
        </form>

        <!-- РЕЄСТРАЦІЯ КРОК 1: вибір ролі -->
        <div v-else-if="step === 1">
          <div class="flex flex-col gap-3.5 mb-6">
            <button
              v-for="r in ROLES"
              :key="r.value"
              :data-testid="`role-${r.value}`"
              type="button"
              @click="selectRole(r.value)"
              class="flex items-center gap-4 p-[18px] rounded-[14px] border-[1.5px] transition-all text-left"
              :class="role === r.value
                ? 'border-[#2F5233] bg-[rgb(238,241,227)]'
                : 'border-[rgb(225,219,198)] bg-white hover:border-[#2F5233]/40'"
            >
              <div class="shrink-0 w-11 h-11 rounded-[10px] bg-[rgb(238,241,227)] flex items-center justify-center">
                <svg v-if="r.value === 'farmer'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/><path d="M12 14c0 0-3-1-4-4M12 14c0 0 3-1 4-4"/>
                </svg>
                <svg v-else-if="r.value === 'agronomist'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/>
                </svg>
                <svg v-else-if="r.value === 'buyer'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 20h16M6 20V10l-2-4h16l-2 4v10M9 10V6M15 10V6"/>
                </svg>
                <span v-else class="text-lg">{{ r.emoji }}</span>
              </div>
              <div class="flex-1">
                <p class="font-bold text-[16px] text-[rgb(27,46,27)] mb-[3px]">{{ r.label }}</p>
                <p class="text-[13.5px] text-[rgb(107,122,100)] leading-[1.4]">{{ r.desc }}</p>
              </div>
              <div class="shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center transition-colors"
                :class="role === r.value ? 'bg-[#2F5233]' : 'border-[1.5px] border-[rgb(199,205,186)]'">
                <svg v-if="role === r.value" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12.5l5 5L20 6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </button>
          </div>
          <button data-testid="step1-next" @click="step = 2" :disabled="!role"
            class="auth-btn w-full flex items-center justify-center gap-2">
            Далі
            <svg width="15" height="11" viewBox="0 0 18 12" fill="none">
              <path d="M1 6h15M11 1l6 5-6 5" stroke="#FAF6EC" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- РЕЄСТРАЦІЯ КРОК 2: поля -->
        <form v-else @submit.prevent="handleRegister" novalidate class="space-y-5">
          <button type="button" @click="step = 1"
            class="flex items-center gap-1.5 text-[13.5px] font-semibold text-[rgb(107,122,100)] hover:text-[#2F5233] transition-colors mb-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ ROLES.find(r => r.value === role)?.emoji }} {{ ROLES.find(r => r.value === role)?.label }}
          </button>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="auth-label">Ім'я</label>
              <input data-testid="reg-first-name" v-model="firstName" class="auth-input" placeholder="Іван" />
            </div>
            <div>
              <label class="auth-label">Прізвище</label>
              <input data-testid="reg-last-name" v-model="lastName" class="auth-input" placeholder="Петренко" />
            </div>
          </div>

          <div v-if="hasCompany">
            <label class="auth-label">{{ companyLabel }}</label>
            <input data-testid="reg-company" v-model="companyName" class="auth-input" :placeholder="companyPlaceholder" />
          </div>

          <div v-if="role === 'agronomist'">
            <label class="auth-label">Регіон роботи</label>
            <select data-testid="reg-region" v-model="region" class="auth-input">
              <option value="" disabled>Виберіть регіон</option>
              <option v-for="r in REGIONS" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>

          <div>
            <label class="auth-label">Телефон</label>
            <input data-testid="reg-phone" :value="phone" @input="onPhoneInput" type="tel" inputmode="tel"
              class="auth-input" :class="phone && !isPhoneValid ? 'border-red-400' : ''"
              placeholder="+38 (0__) ___-__-__" autocomplete="tel" />
          </div>

          <div>
            <label class="auth-label">Email</label>
            <input data-testid="reg-email" :value="email" @input="onEmailInput" type="text" inputmode="email"
              class="auth-input" :class="email && !isEmailValid ? 'border-red-400' : ''"
              placeholder="email@example.com" autocomplete="email" />
          </div>

          <div>
            <label class="auth-label">Пароль</label>
            <div class="relative">
              <input data-testid="reg-password" v-model="password" :type="showPassword ? 'text' : 'password'"
                class="auth-input pr-12" placeholder="Мінімум 8 символів" minlength="8" />
              <button type="button" @click="showPassword = !showPassword"
                class="absolute right-[14px] top-1/2 -translate-y-1/2 flex text-[rgb(122,138,114)] hover:text-[rgb(47,82,51)] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>
                  <path v-if="showPassword" d="M3 3l18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div class="flex gap-1 mt-2" v-if="password">
              <div v-for="i in 4" :key="i" class="h-1 flex-1 rounded-full transition-colors"
                :class="passwordStrength >= i ? strengthColor : 'bg-[rgb(225,219,198)]'"></div>
            </div>
            <p v-if="password" class="text-xs mt-1" :class="strengthTextColor">{{ strengthLabel }}</p>
          </div>

          <div>
            <label class="auth-label">Підтвердіть пароль</label>
            <input data-testid="reg-confirm-password" v-model="confirmPassword" :type="showPassword ? 'text' : 'password'"
              class="auth-input"
              :class="confirmPassword && password !== confirmPassword ? 'border-red-400' : ''"
              placeholder="Повторіть пароль" />
          </div>

          <button data-testid="reg-submit" type="submit" :disabled="loading" class="auth-btn w-full">
            {{ loading ? 'Створюємо акаунт...' : 'Зареєструватись' }}
          </button>
        </form>

      </div>
    </div>
  </div>
</template>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.auth-page { background: rgb(241, 239, 227); font-family: Manrope, sans-serif; }
.auth-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: rgb(27, 46, 27);
  margin-bottom: 8px;
}
.auth-input {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1.5px solid rgb(225, 219, 198);
  font-size: 15px;
  font-family: Manrope, sans-serif;
  color: rgb(32, 48, 31);
  outline: none;
  transition: border-color 0.15s;
  background: #fff;
  appearance: none;
}
.auth-input:focus { border-color: #2F5233; }
.auth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 15px;
  border-radius: 12px;
  background: rgb(47, 82, 51);
  color: rgb(250, 246, 236);
  font-weight: 700;
  font-size: 15.5px;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.auth-btn:hover:not(:disabled) { background: rgb(61, 107, 66); }
.auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>

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
    const { data, error: e } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
    if (e) throw e
    const uid = data.user?.id
    if (uid) {
      const { data: userData } = await supabase.from('users').select('name, role, roles').eq('id', uid).single()
      const roles: string[] = (userData?.roles?.length ? userData.roles : [userData?.role || 'farmer'])
      localStorage.setItem('agro_user_name', userData?.name || '')
      if (roles.length > 1) {
        localStorage.setItem('agro_pending_roles', JSON.stringify(roles))
        router.push('/role-select')
        return
      }
      localStorage.setItem('agro_active_profile', roles[0])
      localStorage.setItem('agro_user_role', roles[0])
    }
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
      const proExpires = new Date()
      proExpires.setMonth(proExpires.getMonth() + 6)

      await Promise.all([
        supabase.from('users').upsert({
          id: data.user.id,
          email: email.value,
          name: fullName,
          first_name: firstName.value,
          last_name: lastName.value,
          company_name: companyName.value || null,
          phone: phone.value,
          region: region.value || null,
          role: role.value,
        } as any),
        supabase.from('subscriptions').upsert({
          user_id: data.user.id,
          plan: 'pro',
          expires_at: proExpires.toISOString(),
        }, { onConflict: 'user_id' }),
      ])
      showSuccess('Акаунт створено! Перші 6 місяців PRO безкоштовно 🌾')
    }
    router.push('/dashboard')
  } catch (e: any) {
    showError(AUTH_ERRORS[e.message] || e.message)
  } finally {
    loading.value = false
  }
}
</script>
