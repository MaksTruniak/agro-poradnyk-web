<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Співробітники</h1>
        <p class="dash-subtitle">Доступ до акаунту для вашої команди</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="card animate-pulse h-16"></div>
      <div class="card animate-pulse h-16"></div>
      <div class="card animate-pulse h-16"></div>
    </div>

    <template v-else>

      <template v-if="canInvite">

        <!-- Список членів команди -->
        <div class="card mb-5">
          <div class="flex items-center justify-between mb-4">
            <p class="text-xs font-bold uppercase tracking-wider text-agro-light">Доступ до акаунту</p>
            <span class="text-xs text-agro-light">{{ memberLimitLabel }}</span>
          </div>

          <div v-if="!members.length" class="text-center py-8">
            <p class="text-agro-light text-sm">Поки нікого не запрошено</p>
          </div>

          <div v-else class="space-y-2">
            <div v-for="m in members" :key="m.id"
              class="flex items-center gap-3 p-3 rounded-xl hover:bg-agro-hover transition-colors">
              <div class="w-9 h-9 rounded-full bg-agro-hover flex items-center justify-center font-bold text-agro text-sm flex-shrink-0">
                {{ m.name?.[0]?.toUpperCase() || m.email?.[0]?.toUpperCase() || '?' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-agro-dark text-sm truncate">{{ m.name || m.email }}</p>
                <p class="text-xs text-agro-light">
                  <span v-if="m.position" class="font-medium text-agro-dark">{{ m.position }} · </span>{{ ROLE_LABELS[m.role] || m.role }} · {{ m.email }}
                </p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="text-xs px-2 py-0.5 rounded-full"
                  :class="m.status === 'active' ? 'bg-agro-hover text-agro' : 'bg-agro-bg text-agro-light'">
                  {{ m.status === 'active' ? 'Активний' : 'Запрошення надіслано' }}
                </span>
                <button v-if="m.role !== 'owner'" @click="confirmRemove(m)"
                  class="p-1.5 rounded-lg hover:bg-red-50 text-agro-light hover:text-red-500 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Форма запрошення -->
        <div class="card">
          <p class="text-xs font-bold uppercase tracking-wider text-agro-light mb-4">Запросити співробітника</p>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Email</label>
              <input v-model="inviteEmail" type="email" class="input" placeholder="name@example.com">
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Посада</label>
              <input v-model="invitePosition" type="text" class="input" placeholder="Агроном, Комбайнер, Бухгалтер...">
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Роль доступу</label>
              <select v-model="inviteRole" class="input">
                <option value="editor">Редактор — може змінювати дані полів і складу</option>
                <option value="viewer">Переглядач — тільки читання</option>
              </select>
            </div>
            <div v-if="limitReached" class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              Досягнуто ліміт співробітників для тарифу <strong>{{ currentPlan === 'pro' ? 'PRO' : 'Business' }}</strong>.
              <NuxtLink to="/dashboard/subscription" class="underline ml-1">Оновити план →</NuxtLink>
            </div>
            <button @click="sendInvite" :disabled="inviting || !inviteEmail.trim() || limitReached"
              class="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              <svg v-if="!inviting" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              {{ inviting ? 'Надсилання...' : 'Надіслати запрошення' }}
            </button>
            <div v-if="invited">
              <p class="text-sm text-agro text-center">✓ Запрошення для {{ lastInvited }}</p>
              <div v-if="manualLink" class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p class="text-xs font-semibold text-amber-800 mb-1">📋 Email не відправлено — надішліть посилання вручну:</p>
                <div class="flex gap-2">
                  <input :value="manualLink" readonly class="input text-xs flex-1 bg-white" />
                  <button @click="copyLink" class="btn-outline text-xs px-3 shrink-0">Копіювати</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Підтвердження видалення -->
        <div v-if="removeTarget" class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div class="card w-full max-w-sm">
            <p class="font-bold text-agro-dark mb-2">Видалити доступ?</p>
            <p class="text-sm text-agro-light mb-5">{{ removeTarget.name || removeTarget.email }} більше не матиме доступу до акаунту.</p>
            <div class="flex gap-3">
              <button @click="removeTarget = null" class="btn-outline flex-1">Скасувати</button>
              <button @click="removeMember" class="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors">Видалити</button>
            </div>
          </div>
        </div>

      </template>

      <!-- Basic — немає доступу -->
      <template v-else>
        <div class="card text-center py-16">
          <div class="dash-empty-icon mx-auto mb-5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <p class="font-bold text-agro-dark text-lg mb-2">Співробітники</p>
          <p class="text-agro-light text-sm mb-5 max-w-sm mx-auto">Запросіть команду для спільного доступу до акаунту</p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6 text-sm">
            <div class="flex items-center gap-2 px-4 py-2 bg-agro-bg rounded-xl">
              <span class="font-semibold text-agro-dark">PRO</span>
              <span class="text-agro-light">— до 2 співробітників</span>
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-agro-bg rounded-xl">
              <span class="font-semibold text-agro-dark">Business</span>
              <span class="text-agro-light">— до 5 співробітників</span>
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-agro-bg rounded-xl">
              <span class="font-semibold text-agro-dark">Enterprise</span>
              <span class="text-agro-light">— необмежено</span>
            </div>
          </div>
          <NuxtLink to="/dashboard/subscription" class="dash-btn-primary inline-flex">
            Переглянути тарифи →
          </NuxtLink>
        </div>
      </template>

    </template>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Співробітники' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)
const currentPlan = ref<'basic' | 'pro' | 'business' | 'enterprise'>('basic')
const members = ref<any[]>([])

const inviteEmail    = ref('')
const inviteRole     = ref('editor')
const invitePosition = ref('')
const inviting = ref(false)
const invited = ref(false)
const lastInvited = ref('')
const manualLink = ref('')

const removeTarget = ref<any>(null)
const currentUser = ref<any>(null)

const ROLE_LABELS: Record<string, string> = {
  owner:  'Власник',
  editor: 'Редактор',
  viewer: 'Переглядач',
}

const MEMBER_LIMITS: Record<string, number> = {
  basic:      0,
  pro:        2,
  business:   5,
  enterprise: Infinity,
}

const memberLimit = computed(() => MEMBER_LIMITS[currentPlan.value] ?? 0)
const canInvite   = computed(() => memberLimit.value > 0)
const limitReached = computed(() => memberLimit.value !== Infinity && members.value.length >= memberLimit.value)
const memberLimitLabel = computed(() =>
  memberLimit.value === Infinity ? 'необмежено' : `${members.value.length} / ${memberLimit.value}`
)

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }
  currentUser.value = user

  const { data: sub } = await supabase.from('subscriptions').select('plan, expires_at').eq('user_id', user.id).maybeSingle()
  const plan = sub?.plan ?? 'basic'
  const active = !sub?.expires_at || new Date(sub.expires_at) > new Date()
  currentPlan.value = (active ? plan : 'basic') as typeof currentPlan.value

  if (canInvite.value) {
    const { data } = await supabase
      .from('team_members')
      .select('id, email, name, role, position, status')
      .eq('owner_id', user.id)
      .order('created_at')
    members.value = data || []
  }

  loading.value = false
})

async function sendInvite() {
  if (!inviteEmail.value.trim() || limitReached.value) return
  inviting.value = true
  manualLink.value = ''

  const email = inviteEmail.value.trim()

  // Вставляємо запис (токен генерується автоматично в БД)
  const { error: insertErr } = await supabase.from('team_members').upsert({
    owner_id: currentUser.value?.id,
    email,
    role:     inviteRole.value,
    position: invitePosition.value.trim() || null,
    status:   'pending',
  }, { onConflict: 'owner_id,email' })

  if (!insertErr) {
    // Відправляємо email через API
    const ownerName = currentUser.value?.user_metadata?.full_name || currentUser.value?.email || ''
    const res = await $fetch('/api/team/invite', {
      method: 'POST',
      body: { email, role: inviteRole.value, ownerName, memberId: currentUser.value?.id },
    }).catch(() => null) as any

    if (res?.manual) {
      // Resend не налаштований — показуємо посилання
      manualLink.value = res.inviteUrl
    }

    lastInvited.value = email
    // Оновлюємо список
    const { data } = await supabase
      .from('team_members')
      .select('id, email, name, role, position, status')
      .eq('owner_id', currentUser.value?.id)
      .order('created_at')
    members.value = data || []
  }

  inviteEmail.value    = ''
  invitePosition.value = ''
  inviting.value = false
  invited.value = true
  setTimeout(() => { invited.value = false; manualLink.value = '' }, 30000)
}

const copyLink = async () => {
  await navigator.clipboard.writeText(manualLink.value)
}

function confirmRemove(m: any) {
  removeTarget.value = m
}

async function removeMember() {
  if (!removeTarget.value) return
  await supabase.from('team_members').delete().eq('id', removeTarget.value.id)
  members.value = members.value.filter(m => m.id !== removeTarget.value.id)
  removeTarget.value = null
}
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; }
</style>
