<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6" style="background: rgb(238,241,227); font-family: Manrope, sans-serif;">

    <!-- Лого -->
    <div class="flex items-center gap-2.5 mb-10">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C7 6 4 10 4 14a8 8 0 0016 0c0-4-3-8-8-12z" fill="#2F5233"/>
        <path d="M12 22V10" stroke="#FAF6EC" stroke-width="1.4"/>
      </svg>
      <span style="font-family: 'Bitter', Georgia, serif; font-weight:800; font-size:22px; color:rgb(27,46,27);">АгроПростір</span>
    </div>

    <!-- Заголовок -->
    <div class="text-center mb-8 max-w-sm">
      <h1 style="font-size:26px; font-weight:800; color:rgb(27,46,27); margin-bottom:8px;">Оберіть профіль</h1>
      <p style="font-size:15px; color:rgb(122,138,114);">Ви можете переключатись між профілями в будь-який момент</p>
    </div>

    <!-- Картки профілів -->
    <div class="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
      <button
        v-for="r in roles"
        :key="r"
        @click="selectProfile(r)"
        class="flex-1 flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left"
        :class="selected === r
          ? 'border-agro bg-white shadow-lg scale-[1.02]'
          : 'border-agro-border bg-white hover:border-agro hover:shadow-md'"
        style="background: #fff;"
      >
        <!-- Іконка -->
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center" :style="selected === r ? 'background:rgb(234,240,222)' : 'background:rgb(248,250,244)'">
          <svg v-if="r === 'farmer'" width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z" :stroke="selected === r ? '#2F5233' : '#7A8A72'" stroke-width="1.7" stroke-linejoin="round"/>
          </svg>
          <svg v-else-if="r === 'agronomist'" width="30" height="30" viewBox="0 0 24 24" fill="none">
            <circle cx="10" cy="9" r="4.5" :stroke="selected === r ? '#2F5233' : '#7A8A72'" stroke-width="1.7"/>
            <path d="M20 20c0-3.3-4-5-6-5M4 20c0-3.9 2.7-6 6-6" :stroke="selected === r ? '#2F5233' : '#7A8A72'" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Текст -->
        <div class="text-center">
          <div style="font-size:18px; font-weight:800; color:rgb(27,46,27); margin-bottom:4px;">{{ LABELS[r] }}</div>
          <div style="font-size:13px; color:rgb(122,138,114); line-height:1.5;">{{ DESCRIPTIONS[r] }}</div>
        </div>

        <!-- Чекбокс -->
        <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1" :class="selected === r ? 'border-agro bg-agro' : 'border-agro-border'">
          <svg v-if="selected === r" width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </button>
    </div>

    <!-- Кнопка -->
    <button
      @click="confirm"
      :disabled="!selected"
      class="mt-8 px-10 py-4 rounded-2xl font-bold text-white text-base transition-all duration-200"
      :style="selected ? 'background:#2F5233; cursor:pointer;' : 'background:rgb(199,205,186); cursor:not-allowed;'"
    >
      Увійти як {{ selected ? LABELS[selected] : '...' }} →
    </button>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const router = useRouter()

const roles = ref<string[]>([])
const selected = ref('')

const LABELS: Record<string, string> = {
  farmer: 'Фермер',
  agronomist: 'Агроном',
  seller: 'Продавець',
  buyer: 'Заготівельник',
}
const DESCRIPTIONS: Record<string, string> = {
  farmer: 'Управління полями, технічна карта, AI агроном, консультації',
  agronomist: 'Клієнти, технічні карти клієнтів, кабінет агронома',
  seller: 'Товари, замовлення, аналітика магазину',
  buyer: 'Пошук фермерів, угоди, закупівлі',
}

onMounted(() => {
  if (!import.meta.client) return
  const raw = localStorage.getItem('agro_pending_roles')
  if (!raw) { router.push('/dashboard'); return }
  try {
    roles.value = JSON.parse(raw)
    if (roles.value.length === 0) { router.push('/dashboard'); return }
    if (roles.value.length === 1) { selectProfile(roles.value[0]); confirm(); return }
  } catch { router.push('/dashboard') }
})

const selectProfile = (r: string) => { selected.value = r }

const confirm = () => {
  if (!selected.value) return
  localStorage.setItem('agro_active_profile', selected.value)
  localStorage.setItem('agro_user_role', selected.value)
  localStorage.removeItem('agro_pending_roles')
  router.push('/dashboard')
}
</script>
