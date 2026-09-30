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

        <!-- Форма запиту листа -->
        <template v-if="!newPasswordMode && !sent">
          <p class="text-sm text-[rgb(107,122,100)] mb-5 text-center">Введіть email — надішлемо посилання для скидання пароля</p>
          <div class="mb-4">
            <label class="block text-sm font-medium text-[rgb(27,46,27)] mb-1.5">Email</label>
            <input v-model="email" type="email" class="w-full px-4 py-3 rounded-xl border border-[#d4dbc8] text-sm outline-none focus:border-[#2F5233] transition-colors" placeholder="your@email.com" @keyup.enter="sendReset" />
          </div>
          <p v-if="error" class="text-xs text-red-500 mb-3">{{ error }}</p>
          <button @click="sendReset" :disabled="loading || !email"
            class="w-full py-3 rounded-xl bg-[#2F5233] text-white font-semibold text-sm hover:bg-[#3a6640] transition-colors disabled:opacity-50">
            {{ loading ? 'Надсилаємо...' : 'Надіслати посилання' }}
          </button>
          <div class="mt-5 text-center">
            <NuxtLink to="/auth" class="text-sm text-[#2F5233] font-semibold hover:underline">← Назад до входу</NuxtLink>
          </div>
        </template>

        <!-- Успішно надіслано -->
        <template v-else-if="sent && !newPasswordMode">
          <div class="text-center py-4">
            <div class="w-14 h-14 rounded-2xl bg-[#eef1e3] flex items-center justify-center mx-auto mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2F5233" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <p class="font-bold text-[rgb(27,46,27)] mb-2">Лист надіслано!</p>
            <p class="text-sm text-[rgb(107,122,100)]">Перевірте пошту <strong>{{ email }}</strong> і перейдіть за посиланням</p>
            <NuxtLink to="/auth" class="inline-block mt-5 text-sm text-[#2F5233] font-semibold hover:underline">← Назад до входу</NuxtLink>
          </div>
        </template>

        <!-- Форма нового пароля (після переходу з листа) -->
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
