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
          <p class="text-sm text-[rgb(107,122,100)] mb-5 text-center">Введіть email — надішлемо код для скидання пароля</p>
          <div class="mb-4">
            <label class="block text-sm font-medium text-[rgb(27,46,27)] mb-1.5">Email</label>
            <input v-model="email" type="email" class="w-full px-4 py-3 rounded-xl border border-[#d4dbc8] text-sm outline-none focus:border-[#2F5233] transition-colors" placeholder="your@email.com" @keyup.enter="sendReset" />
          </div>
          <p v-if="error" class="text-xs text-red-500 mb-3">{{ error }}</p>
          <button @click="sendReset" :disabled="loading || !email"
            class="w-full py-3 rounded-xl bg-[#2F5233] text-white font-semibold text-sm hover:bg-[#3a6640] transition-colors disabled:opacity-50">
            {{ loading ? 'Надсилаємо...' : 'Надіслати код' }}
          </button>
          <div class="mt-5 text-center">
            <NuxtLink to="/auth" class="text-sm text-[#2F5233] font-semibold hover:underline">← Назад до входу</NuxtLink>
          </div>
        </template>

        <!-- Крок 2: Код + новий пароль -->
        <template v-else-if="sent && !newPasswordMode">
          <p class="text-sm text-[rgb(107,122,100)] mb-5 text-center">Введіть код з листа і новий пароль</p>
          <div class="mb-4">
            <label class="block text-sm font-medium text-[rgb(27,46,27)] mb-1.5">Код з листа</label>
            <input v-model="otpCode" type="text" inputmode="numeric" maxlength="8"
              class="w-full px-4 py-3 rounded-xl border border-[#d4dbc8] text-sm outline-none focus:border-[#2F5233] transition-colors font-mono tracking-widest text-center text-lg"
              placeholder="00000000" />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-[rgb(27,46,27)] mb-1.5">Новий пароль</label>
            <input v-model="newPassword" type="password" class="w-full px-4 py-3 rounded-xl border border-[#d4dbc8] text-sm outline-none focus:border-[#2F5233] transition-colors" placeholder="Мінімум 6 символів" />
          </div>
          <div class="mb-5">
            <label class="block text-sm font-medium text-[rgb(27,46,27)] mb-1.5">Повторіть пароль</label>
            <input v-model="confirmPassword" type="password" class="w-full px-4 py-3 rounded-xl border border-[#d4dbc8] text-sm outline-none focus:border-[#2F5233] transition-colors" placeholder="Повторіть пароль" @keyup.enter="verifyAndUpdate" />
          </div>
          <p v-if="error" class="text-xs text-red-500 mb-3">{{ error }}</p>
          <p v-if="successMsg" class="text-xs text-green-600 font-semibold mb-3 text-center">{{ successMsg }}</p>
          <button @click="verifyAndUpdate" :disabled="loading || !otpCode || !newPassword || !confirmPassword"
            class="w-full py-3 rounded-xl bg-[#2F5233] text-white font-semibold text-sm hover:bg-[#3a6640] transition-colors disabled:opacity-50">
            {{ loading ? 'Зберігаємо...' : 'Зберегти пароль' }}
          </button>
          <div class="mt-4 text-center">
            <button @click="sent = false" class="text-xs text-[rgb(107,122,100)] hover:underline">Надіслати код ще раз</button>
          </div>
        </template>

        <!-- Форма нового пароля (після переходу з посилання) -->
        <template v-else-if="newPasswordMode">
          <p class="text-sm text-[rgb(107,122,100)] mb-5 text-center">Введіть новий пароль для вашого акаунту</p>
          <div class="mb-4">
            <label class="block text-sm font-medium text-[rgb(27,46,27)] mb-1.5">Новий пароль</label>
            <input v-model="newPassword" type="password" class="w-full px-4 py-3 rounded-xl border border-[#d4dbc8] text-sm outline-none focus:border-[#2F5233] transition-colors" placeholder="Мінімум 6 символів" />
          </div>
          <div class="mb-5">
            <label class="block text-sm font-medium text-[rgb(27,46,27)] mb-1.5">Повторіть пароль</label>
            <input v-model="confirmPassword" type="password" class="w-full px-4 py-3 rounded-xl border border-[#d4dbc8] text-sm outline-none focus:border-[#2F5233] transition-colors" placeholder="Повторіть пароль" @keyup.enter="updatePassword" />
          </div>
          <p v-if="error" class="text-xs text-red-500 mb-3">{{ error }}</p>
          <p v-if="successMsg" class="text-xs text-green-600 font-semibold mb-3 text-center">{{ successMsg }}</p>
          <button @click="updatePassword" :disabled="loading || !newPassword || !confirmPassword"
            class="w-full py-3 rounded-xl bg-[#2F5233] text-white font-semibold text-sm hover:bg-[#3a6640] transition-colors disabled:opacity-50">
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

// Якщо є токен в URL — режим зміни пароля
onMounted(() => {
  const hash = window.location.hash
  if (hash.includes('type=recovery')) {
    newPasswordMode.value = true
  }
})

async function sendReset() {
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
  if (newPassword.value.length < 6) { error.value = 'Пароль має бути мінімум 6 символів'; return }
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
  if (newPassword.value.length < 6) { error.value = 'Пароль має бути мінімум 6 символів'; return }
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
