<template>
  <div class="min-h-screen flex items-center justify-center px-6 py-20" style="background: linear-gradient(135deg, #f0f4ec 0%, #faf6ec 100%)">
    <div class="w-full max-w-[440px]">

      <!-- Лого -->
      <div class="flex flex-col items-center mb-9">
        <NuxtLink to="/" class="w-16 h-16 rounded-[18px] bg-[#2F5233] flex items-center justify-center mb-5 shadow-[0_12px_24px_-10px_rgba(47,82,51,0.4)]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C7 6 4 10 4 14a8 8 0 0016 0c0-4-3-8-8-12z" fill="#FAF6EC"/>
            <path d="M12 22V10" stroke="#2F5233" stroke-width="1.4"/>
          </svg>
        </NuxtLink>
        <h1 class="text-[28px] font-extrabold text-[rgb(27,46,27)] mb-2" style="font-family:'Bitter',Georgia,serif">АгроПростір</h1>
        <p class="text-[15px] text-[rgb(107,122,100)]">{{ newPasswordMode ? 'Новий пароль' : 'Відновлення пароля' }}</p>
      </div>

      <div class="bg-white rounded-[22px] px-8 py-8 shadow-[0_24px_60px_-30px_rgba(30,45,25,0.35)]">

        <!-- Крок 1: Email -->
        <template v-if="!sent && !newPasswordMode">
          <p class="rp-hint">Введіть email — надішлемо код для скидання пароля</p>
          <div class="mb-4">
            <label class="rp-label">Email</label>
            <input v-model="email" type="email" class="rp-input" placeholder="your@email.com" @keyup.enter="sendReset" />
          </div>
          <p v-if="error" class="text-xs text-red-500 mb-3">{{ error }}</p>
          <button @click="sendReset" :disabled="loading || !email" class="rp-btn w-full">
            {{ loading ? 'Надсилаємо...' : 'Надіслати код' }}
          </button>
          <div class="mt-5 text-center">
            <NuxtLink to="/auth" class="text-sm text-[#2F5233] font-semibold hover:underline">← Назад до входу</NuxtLink>
          </div>
        </template>

        <!-- Крок 2: Код + новий пароль -->
        <template v-else-if="sent && !newPasswordMode">
          <p class="rp-hint">Введіть код з листа і новий пароль</p>
          <div class="mb-4">
            <label class="rp-label">Код з листа</label>
            <input v-model="otpCode" type="text" inputmode="numeric" maxlength="8"
              class="rp-input text-center font-mono tracking-widest text-lg"
              placeholder="00000000" />
          </div>
          <div class="mb-4">
            <label class="rp-label">Новий пароль</label>
            <div class="relative">
              <input v-model="newPassword" :type="showNewPassword ? 'text' : 'password'" class="rp-input pr-12" placeholder="Мінімум 8 символів" />
              <button type="button" @click="showNewPassword = !showNewPassword"
                class="absolute right-[14px] top-1/2 -translate-y-1/2 text-[rgb(122,138,114)] hover:text-[rgb(47,82,51)] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>
                  <path v-if="showNewPassword" d="M3 3l18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="mb-5">
            <label class="rp-label">Повторіть пароль</label>
            <input v-model="confirmPassword" type="password" class="rp-input" placeholder="Повторіть пароль" @keyup.enter="verifyAndUpdate" />
          </div>
          <p v-if="error" class="text-xs text-red-500 mb-3">{{ error }}</p>
          <p v-if="successMsg" class="text-xs text-green-600 font-semibold mb-3 text-center">{{ successMsg }}</p>
          <button @click="verifyAndUpdate" :disabled="loading || !otpCode || !newPassword || !confirmPassword" class="rp-btn w-full">
            {{ loading ? 'Зберігаємо...' : 'Зберегти пароль' }}
          </button>
          <div class="mt-4 text-center">
            <button @click="sent = false" class="text-xs text-[rgb(107,122,100)] hover:underline">Надіслати код ще раз</button>
          </div>
        </template>

        <!-- Форма нового пароля (після переходу з посилання) -->
        <template v-else-if="newPasswordMode">
          <p class="rp-hint">Введіть новий пароль для вашого акаунту</p>
          <div class="mb-4">
            <label class="rp-label">Новий пароль</label>
            <div class="relative">
              <input v-model="newPassword" :type="showNewPassword ? 'text' : 'password'" class="rp-input pr-12" placeholder="Мінімум 8 символів" />
              <button type="button" @click="showNewPassword = !showNewPassword"
                class="absolute right-[14px] top-1/2 -translate-y-1/2 text-[rgb(122,138,114)] hover:text-[rgb(47,82,51)] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>
                  <path v-if="showNewPassword" d="M3 3l18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="mb-5">
            <label class="rp-label">Повторіть пароль</label>
            <input v-model="confirmPassword" type="password" class="rp-input" placeholder="Повторіть пароль" @keyup.enter="updatePassword" />
          </div>
          <p v-if="error" class="text-xs text-red-500 mb-3">{{ error }}</p>
          <p v-if="successMsg" class="text-xs text-green-600 font-semibold mb-3 text-center">{{ successMsg }}</p>
          <button @click="updatePassword" :disabled="loading || !newPassword || !confirmPassword" class="rp-btn w-full">
            {{ loading ? 'Зберігаємо...' : 'Зберегти пароль' }}
          </button>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Відновлення пароля — АгроПростір' })
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const route = useRoute()
const router = useRouter()

const email = ref('')
const otpCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const sent = ref(false)
const error = ref('')
const successMsg = ref('')
const newPasswordMode = ref(false)
const showNewPassword = ref(false)

// Перехід за посиланням з листа. Сайт працює в PKCE: посилання приходить як ?code=…, клієнт Supabase
// сам обмінює код на сесію (detectSessionInUrl) і повідомляє PASSWORD_RECOVERY. Старий формат — #type=recovery.
onMounted(async () => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') newPasswordMode.value = true
  })
  onBeforeUnmount(() => subscription.unsubscribe())

  if (window.location.hash.includes('type=recovery')) { newPasswordMode.value = true; return }
  if (!route.query.code) return
  // Даємо клієнту обміняти код; якщо сесії немає — посилання відкрите в іншому браузері або прострочене
  for (let i = 0; i < 20 && !newPasswordMode.value; i++) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) { newPasswordMode.value = true; break }
    await new Promise(r => setTimeout(r, 250))
  }
  if (!newPasswordMode.value) {
    error.value = 'Посилання не спрацювало (відкрите в іншому браузері або застаріле). Введіть email — надішлемо код.'
  }
  router.replace({ query: {} })
})

async function sendReset() {
  email.value = email.value.trim().toLowerCase()
  if (!email.value) return
  loading.value = true
  error.value = ''
  const { error: e } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  loading.value = false
  if (e) { error.value = 'Помилка. Перевірте email і спробуйте знову.'; return }
  sent.value = true
}

async function verifyAndUpdate() {
  if (!otpCode.value || !newPassword.value) return
  const pwdError = validatePassword(newPassword.value)
  if (pwdError) { error.value = pwdError; return }
  if (newPassword.value !== confirmPassword.value) { error.value = 'Паролі не співпадають'; return }
  loading.value = true
  error.value = ''
  // Верифікуємо OTP код
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    email: email.value,
    token: otpCode.value,
    type: 'recovery',
  })
  if (verifyErr) { error.value = 'Невірний або прострочений код'; loading.value = false; return }
  // Оновлюємо пароль
  const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword.value })
  loading.value = false
  if (updateErr) { error.value = 'Помилка зміни пароля. Спробуйте знову.'; return }
  successMsg.value = 'Пароль змінено! Перенаправляємо...'
  setTimeout(() => router.push('/dashboard'), 1500)
}

async function updatePassword() {
  if (!newPassword.value) return
  const pwdError = validatePassword(newPassword.value)
  if (pwdError) { error.value = pwdError; return }
  if (newPassword.value !== confirmPassword.value) { error.value = 'Паролі не співпадають'; return }
  loading.value = true
  error.value = ''
  const { error: e } = await supabase.auth.updateUser({ password: newPassword.value })
  loading.value = false
  if (e) { error.value = 'Помилка зміни пароля. Спробуйте знову.'; return }
  successMsg.value = 'Пароль змінено! Перенаправляємо...'
  setTimeout(() => router.push('/dashboard'), 1500)
}
</script>

<style scoped>
.rp-hint { font-size: 14px; color: rgb(107,122,100); margin-bottom: 20px; text-align: center; }
.rp-label { display: block; font-size: 14px; font-weight: 700; color: rgb(27,46,27); margin-bottom: 8px; }
.rp-input {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1.5px solid rgb(225,219,198);
  font-size: 15px;
  font-family: Manrope, sans-serif;
  color: rgb(32,48,31);
  outline: none;
  transition: border-color 0.15s;
  background: #fff;
  appearance: none;
}
.rp-input:focus { border-color: #2F5233; }
.rp-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  border-radius: 12px;
  background: rgb(47,82,51);
  color: rgb(250,246,236);
  font-weight: 700;
  font-size: 15.5px;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.rp-btn:hover:not(:disabled) { background: rgb(61,107,66); }
.rp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
