<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Підтримка</h1>
        <p class="dash-subtitle">Ваш менеджер і рівень обслуговування</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-5">
      <div class="card animate-pulse h-28"></div>
      <div class="card animate-pulse h-40"></div>
    </div>

    <template v-else>

      <!-- Custom plan: менеджер -->
      <template v-if="isCustom">
        <div class="card mb-5">
          <p class="text-xs font-bold uppercase tracking-wider text-agro-light mb-4">Ваш персональний менеджер</p>
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-agro-hover overflow-hidden flex items-center justify-center flex-shrink-0">
              <img v-if="manager?.avatar_url" :src="manager.avatar_url" class="w-full h-full object-cover" alt="">
              <svg v-else width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-agro-dark text-lg">{{ manager?.name || 'Менеджер призначається' }}</p>
              <p class="text-sm text-agro-light">{{ manager?.position || 'Персональна підтримка' }}</p>
              <div class="flex flex-wrap gap-3 mt-3">
                <a v-if="manager?.phone" :href="`tel:${manager.phone}`"
                  class="inline-flex items-center gap-1.5 text-sm font-medium text-agro hover:underline">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1.27h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.09a16 16 0 006.29 6.29l1.19-1.19a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  {{ manager.phone }}
                </a>
                <a v-if="manager?.telegram" :href="`https://t.me/${manager.telegram}`" target="_blank"
                  class="inline-flex items-center gap-1.5 text-sm font-medium text-agro hover:underline">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 4.5L2.5 10l7 2.5M21.5 4.5L14 19l-4.5-6.5M21.5 4.5L9.5 12.5"/></svg>
                  @{{ manager.telegram }}
                </a>
                <a v-if="manager?.email" :href="`mailto:${manager.email}`"
                  class="inline-flex items-center gap-1.5 text-sm font-medium text-agro hover:underline">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                  {{ manager.email }}
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- SLA -->
        <div class="card mb-5">
          <p class="text-xs font-bold uppercase tracking-wider text-agro-light mb-4">Рівень обслуговування (SLA)</p>
          <div class="grid sm:grid-cols-3 gap-4">
            <div class="rounded-xl bg-agro-hover p-4 text-center">
              <p class="text-2xl font-extrabold text-agro bitter">2 год</p>
              <p class="text-xs text-agro-light mt-1">Перша відповідь</p>
            </div>
            <div class="rounded-xl bg-agro-hover p-4 text-center">
              <p class="text-2xl font-extrabold text-agro bitter">24 год</p>
              <p class="text-xs text-agro-light mt-1">Вирішення проблеми</p>
            </div>
            <div class="rounded-xl bg-agro-hover p-4 text-center">
              <p class="text-2xl font-extrabold text-agro bitter">99.5%</p>
              <p class="text-xs text-agro-light mt-1">Uptime гарантія</p>
            </div>
          </div>
        </div>

        <!-- Форма звернення -->
        <div class="card">
          <p class="text-xs font-bold uppercase tracking-wider text-agro-light mb-4">Пріоритетне звернення</p>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Тема</label>
              <input v-model="ticketSubject" type="text" class="input" placeholder="Опишіть коротко проблему">
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Повідомлення</label>
              <textarea v-model="ticketBody" rows="4" class="input resize-none" placeholder="Деталі звернення..."></textarea>
            </div>
            <button @click="submitTicket" :disabled="submitting || !ticketSubject.trim()"
              class="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              <svg v-if="!submitting" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              <span>{{ submitting ? 'Надсилання...' : 'Надіслати звернення' }}</span>
            </button>
            <p v-if="submitted" class="text-sm text-agro text-center">✓ Звернення надіслано. Відповімо протягом 2 годин.</p>
          </div>
        </div>
      </template>

      <!-- Basic/PRO: заглушка -->
      <template v-else>
        <div class="card text-center py-16">
          <div class="dash-empty-icon mx-auto mb-5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <p class="font-bold text-agro-dark text-lg mb-2">Персональна підтримка</p>
          <p class="text-agro-light text-sm mb-6 max-w-sm mx-auto">Особистий менеджер, SLA і пріоритетні звернення доступні на тарифі <strong class="text-agro-dark">Custom</strong> (від 200 га)</p>
          <NuxtLink to="/dashboard/subscription" class="dash-btn-primary inline-flex">
            Переглянути тарифи →
          </NuxtLink>
        </div>

        <!-- Стандартна підтримка -->
        <div class="card mt-5">
          <p class="text-xs font-bold uppercase tracking-wider text-agro-light mb-4">Стандартна підтримка</p>
          <div class="space-y-3">
            <a href="mailto:support@agroporadnyk.ua" class="flex items-center gap-3 p-3 rounded-xl hover:bg-agro-hover transition-colors">
              <div class="w-9 h-9 rounded-full bg-agro-hover flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
              </div>
              <div>
                <p class="font-medium text-agro-dark text-sm">Email підтримка</p>
                <p class="text-xs text-agro-light">support@agroporadnyk.ua · відповідь до 24 год</p>
              </div>
            </a>
            <a href="https://t.me/agroporadnyk_support" target="_blank" class="flex items-center gap-3 p-3 rounded-xl hover:bg-agro-hover transition-colors">
              <div class="w-9 h-9 rounded-full bg-agro-hover flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 4.5L2.5 10l7 2.5M21.5 4.5L14 19l-4.5-6.5M21.5 4.5L9.5 12.5"/></svg>
              </div>
              <div>
                <p class="font-medium text-agro-dark text-sm">Telegram</p>
                <p class="text-xs text-agro-light">@agroporadnyk_support</p>
              </div>
            </a>
          </div>
        </div>
      </template>

    </template>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Підтримка' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)
const isCustom = ref(false)
const manager = ref<any>(null)

const ticketSubject = ref('')
const ticketBody = ref('')
const submitting = ref(false)
const submitted = ref(false)

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, manager_id')
    .eq('user_id', user.id)
    .maybeSingle()

  isCustom.value = sub?.plan === 'custom'

  if (isCustom.value && sub?.manager_id) {
    const { data: mgr } = await supabase
      .from('account_managers')
      .select('name, position, phone, telegram, email, avatar_url')
      .eq('id', sub.manager_id)
      .maybeSingle()
    manager.value = mgr
  }

  loading.value = false
})

async function submitTicket() {
  if (!ticketSubject.value.trim()) return
  submitting.value = true
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('support_tickets').insert({
    user_id: user?.id,
    subject: ticketSubject.value.trim(),
    body: ticketBody.value.trim(),
    priority: 'high',
  })
  submitting.value = false
  submitted.value = true
  ticketSubject.value = ''
  ticketBody.value = ''
}
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; }
</style>
