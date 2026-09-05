<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="3" width="7" height="7" rx="1"/>
          <rect x="2" y="14" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/>
          <path d="M9 6.5h6M9 17.5h6M12 10v4"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Інтеграції</h1>
        <p class="dash-subtitle">Підключення зовнішніх систем</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="card animate-pulse h-24"></div>
      <div class="card animate-pulse h-24"></div>
    </div>

    <template v-else>

      <template v-if="isCustom">

        <div class="space-y-4">

          <!-- ERP / 1С -->
          <div class="card">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-agro-hover flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                  </svg>
                </div>
                <div>
                  <p class="font-bold text-agro-dark">1С: Підприємство</p>
                  <p class="text-xs text-agro-light">Синхронізація складу, обробок, витрат</p>
                </div>
              </div>
              <span class="badge-coming">В розробці</span>
            </div>
          </div>

          <!-- Agri ERP -->
          <div class="card">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-agro-hover flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 3h18v4H3zM3 11h18v4H3zM3 19h18v2H3z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-bold text-agro-dark">Agri ERP / Farmix</p>
                  <p class="text-xs text-agro-light">Експорт даних полів і культур</p>
                </div>
              </div>
              <span class="badge-coming">В розробці</span>
            </div>
          </div>

          <!-- API доступ -->
          <div class="card">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-agro-hover flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M12 6l-2 12"/>
                  </svg>
                </div>
                <div>
                  <p class="font-bold text-agro-dark">REST API доступ</p>
                  <p class="text-xs text-agro-light">Читання ваших даних для власних систем</p>
                </div>
              </div>
              <span class="badge-coming">В розробці</span>
            </div>
          </div>

          <!-- Заявка -->
          <div class="card bg-agro-hover border-0 mt-2">
            <p class="font-bold text-agro-dark mb-1">Потрібна конкретна інтеграція?</p>
            <p class="text-sm text-agro-light mb-4">Напишіть нам — розглянемо пріоритетно для вашого плану</p>
            <div class="flex gap-2">
              <input v-model="requestText" type="text" class="input flex-1" placeholder="Назва системи або опис потреби">
              <button @click="submitRequest" :disabled="submitting || !requestText.trim()"
                class="btn-primary px-5 disabled:opacity-50 flex-shrink-0">
                {{ submitting ? '...' : 'Надіслати' }}
              </button>
            </div>
            <p v-if="sent" class="text-sm text-agro mt-2">✓ Запит отримано, зв'яжемося з вами.</p>
          </div>

        </div>
      </template>

      <!-- Non-custom -->
      <template v-else>
        <div class="card text-center py-16">
          <div class="dash-empty-icon mx-auto mb-5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="3" width="7" height="7" rx="1"/>
              <rect x="2" y="14" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/>
              <path d="M9 6.5h6M9 17.5h6M12 10v4"/>
            </svg>
          </div>
          <p class="font-bold text-agro-dark text-lg mb-2">Інтеграції з ERP і API</p>
          <p class="text-agro-light text-sm mb-6 max-w-sm mx-auto">Підключення 1С, Agri ERP та REST API доступне на тарифі <strong class="text-agro-dark">Custom</strong> (від 200 га)</p>
          <NuxtLink to="/dashboard/subscription" class="dash-btn-primary inline-flex">
            Переглянути тарифи →
          </NuxtLink>
        </div>
      </template>

    </template>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Інтеграції' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)
const isCustom = ref(false)
const requestText = ref('')
const submitting = ref(false)
const sent = ref(false)

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }
  const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', user.id).maybeSingle()
  isCustom.value = sub?.plan === 'custom'
  loading.value = false
})

async function submitRequest() {
  if (!requestText.value.trim()) return
  submitting.value = true
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('support_tickets').insert({
    user_id: user?.id,
    subject: `Запит на інтеграцію: ${requestText.value.trim()}`,
    priority: 'high',
  })
  submitting.value = false
  sent.value = true
  requestText.value = ''
}
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; }
.badge-coming {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgb(238,241,227);
  color: rgb(122,142,116);
  white-space: nowrap;
}
</style>
