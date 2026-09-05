<template>
  <div class="p-8 max-w-4xl">
    <div class="mb-7">
      <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/>
          <path d="M19 17l.9 2.1L22 20l-2.1.9L19 23l-.9-2.1L16 20l2.1-.9L19 17z"/>
        </svg>
        AI Ліміти
      </h1>
      <p class="text-agro-light mt-1">Дефолтні ліміти по тарифах і кастомні налаштування для окремих користувачів</p>
    </div>

    <!-- Дефолтні ліміти по планах -->
    <div class="card mb-8">
      <div class="flex items-center justify-between mb-5">
        <p class="font-bold text-agro-dark">Дефолтні ліміти по тарифах</p>
        <button @click="savePlanLimits" :disabled="savingPlans"
          class="btn-primary text-sm py-2 px-4 disabled:opacity-50">
          {{ savingPlans ? 'Збереження...' : 'Зберегти' }}
        </button>
      </div>

      <div v-if="loadingPlans" class="space-y-3">
        <div v-for="i in 4" :key="i" class="h-14 bg-agro-bg rounded-xl animate-pulse"></div>
      </div>

      <div v-else class="space-y-3">
        <div v-for="row in planLimits" :key="row.plan"
          class="grid grid-cols-[120px_1fr_1fr] gap-4 items-center p-4 bg-agro-bg rounded-xl">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" :class="planDot(row.plan)"></span>
            <span class="font-semibold text-agro-dark capitalize text-sm">{{ PLAN_LABELS[row.plan] }}</span>
          </div>
          <div>
            <label class="block text-xs text-agro-light mb-1">Текстових запитів / міс</label>
            <input v-model.number="row.text_limit" type="number" min="0" class="input text-sm py-1.5 w-full" />
          </div>
          <div>
            <label class="block text-xs text-agro-light mb-1">Фото / міс</label>
            <input v-model.number="row.photo_limit" type="number" min="0" class="input text-sm py-1.5 w-full" />
          </div>
        </div>
      </div>

      <p v-if="savedPlans" class="text-sm text-agro mt-4 flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Збережено
      </p>
    </div>

    <!-- Per-user override -->
    <div class="card">
      <p class="font-bold text-agro-dark mb-5">Кастомні ліміти для користувачів</p>

      <!-- Пошук -->
      <div class="relative mb-4">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input v-model="userSearch" @input="searchUsers" type="text" class="input pl-9 text-sm" placeholder="Пошук за email..." />
      </div>

      <!-- Результати пошуку -->
      <div v-if="searchResults.length" class="border border-agro-border rounded-xl overflow-hidden mb-4">
        <div v-for="u in searchResults" :key="u.id"
          class="flex items-center gap-3 px-4 py-3 hover:bg-agro-hover transition-colors cursor-pointer border-b border-agro-border last:border-0"
          @click="selectUser(u)">
          <div class="w-8 h-8 rounded-full bg-agro-hover flex items-center justify-center text-agro font-bold text-xs shrink-0">
            {{ (u.email || '?')[0].toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-agro-dark truncate">{{ u.email }}</p>
            <p class="text-xs text-agro-light">{{ u.plan || 'basic' }} · {{ u.full_name || '' }}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="text-agro-light shrink-0"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>

      <!-- Форма для обраного користувача -->
      <div v-if="selectedUser" class="border border-agro rounded-xl p-5 bg-agro-bg">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-agro flex items-center justify-center text-white font-bold text-sm">
              {{ (selectedUser.email || '?')[0].toUpperCase() }}
            </div>
            <div>
              <p class="font-semibold text-agro-dark">{{ selectedUser.email }}</p>
              <p class="text-xs text-agro-light">Поточний план: <strong class="capitalize">{{ selectedUser.plan || 'basic' }}</strong></p>
            </div>
          </div>
          <button @click="selectedUser = null" class="text-agro-light hover:text-agro-dark transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-agro-dark mb-1">Тариф</label>
          <select v-model="userForm.plan" class="input text-sm">
            <option value="basic">Basic (безкоштовний)</option>
            <option value="pro">PRO</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div class="bg-white rounded-xl p-4 mb-4 border border-agro-border">
          <p class="text-xs font-bold uppercase tracking-wider text-agro-light mb-3">Кастомні AI ліміти (override)</p>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Текстових запитів / міс</label>
              <input v-model.number="userForm.ai_text_limit" type="number" min="0" class="input text-sm"
                :placeholder="`Дефолт: ${defaultForPlan(userForm.plan).text}`" />
              <p class="text-xs text-agro-light mt-1">Залиш порожнім — буде дефолт плану</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Фото / міс</label>
              <input v-model.number="userForm.ai_photo_limit" type="number" min="0" class="input text-sm"
                :placeholder="`Дефолт: ${defaultForPlan(userForm.plan).photo}`" />
              <p class="text-xs text-agro-light mt-1">Залиш порожнім — буде дефолт плану</p>
            </div>
          </div>
        </div>

        <!-- Поточне використання -->
        <div v-if="userUsage" class="bg-white rounded-xl p-4 mb-4 border border-agro-border">
          <p class="text-xs font-bold uppercase tracking-wider text-agro-light mb-3">Використання цього місяця</p>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-agro-light mb-1">Текстові запити</p>
              <div class="flex items-end gap-2">
                <span class="text-2xl font-bold text-agro-dark">{{ userUsage.text_count }}</span>
                <span class="text-sm text-agro-light mb-0.5">/ {{ effectiveLimit(userForm.plan, 'text') }}</span>
              </div>
              <div class="h-1.5 bg-agro-bg rounded-full mt-2 overflow-hidden">
                <div class="h-full bg-agro rounded-full transition-all"
                  :style="`width: ${Math.min(100, (userUsage.text_count / effectiveLimit(userForm.plan, 'text')) * 100)}%`"></div>
              </div>
            </div>
            <div>
              <p class="text-xs text-agro-light mb-1">Фото</p>
              <div class="flex items-end gap-2">
                <span class="text-2xl font-bold text-agro-dark">{{ userUsage.photo_count }}</span>
                <span class="text-sm text-agro-light mb-0.5">/ {{ effectiveLimit(userForm.plan, 'photo') }}</span>
              </div>
              <div class="h-1.5 bg-agro-bg rounded-full mt-2 overflow-hidden">
                <div class="h-full bg-agro rounded-full transition-all"
                  :style="`width: ${Math.min(100, (userUsage.photo_count / effectiveLimit(userForm.plan, 'photo')) * 100)}%`"></div>
              </div>
            </div>
          </div>
          <button @click="resetUsage" :disabled="resettingUsage"
            class="mt-3 text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50">
            {{ resettingUsage ? 'Скидання...' : '↺ Скинути використання цього місяця' }}
          </button>
        </div>

        <div class="flex gap-3">
          <button @click="saveUserLimits" :disabled="savingUser"
            class="btn-primary flex-1 justify-center disabled:opacity-50">
            {{ savingUser ? 'Збереження...' : 'Зберегти налаштування' }}
          </button>
        </div>
        <p v-if="savedUser" class="text-sm text-agro mt-3 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Збережено
        </p>
      </div>

      <!-- Список користувачів з override -->
      <div class="mt-6">
        <p class="text-xs font-bold uppercase tracking-wider text-agro-light mb-3">Користувачі з кастомними лімітами</p>
        <div v-if="loadingOverrides" class="space-y-2">
          <div v-for="i in 3" :key="i" class="h-12 bg-agro-bg rounded-xl animate-pulse"></div>
        </div>
        <div v-else-if="!overrides.length" class="text-center py-6 text-agro-light text-sm">
          Немає кастомних налаштувань
        </div>
        <div v-else class="border border-agro-border rounded-xl overflow-hidden">
          <div v-for="o in overrides" :key="o.user_id"
            class="flex items-center gap-3 px-4 py-3 hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0">
            <div class="w-8 h-8 rounded-full bg-agro-hover flex items-center justify-center text-agro font-bold text-xs shrink-0">
              {{ (o.email || '?')[0].toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-agro-dark truncate">{{ o.email }}</p>
              <p class="text-xs text-agro-light">
                <span class="capitalize">{{ o.plan }}</span> ·
                <span v-if="o.ai_text_limit">текст: {{ o.ai_text_limit }}/міс</span>
                <span v-if="o.ai_photo_limit"> · фото: {{ o.ai_photo_limit }}/міс</span>
                <span v-if="!o.ai_text_limit && !o.ai_photo_limit">лише план змінено</span>
              </p>
            </div>
            <button @click="selectUserById(o)" class="text-xs text-agro hover:underline shrink-0">Редагувати</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useHead({ title: 'AI Ліміти — Адмін' })

const supabase = useSupabaseClient()

const PLAN_LABELS: Record<string, string> = {
  basic: 'Basic', pro: 'PRO', business: 'Business', enterprise: 'Enterprise',
}

const planDot = (plan: string) => ({
  basic: 'bg-gray-400',
  pro: 'bg-agro',
  business: 'bg-blue-500',
  enterprise: 'bg-amber-500',
}[plan] || 'bg-gray-400')

// ─── Дефолтні ліміти по планах ───────────────────────────────────────────────

const loadingPlans = ref(true)
const savingPlans  = ref(false)
const savedPlans   = ref(false)

const planLimits = ref([
  { plan: 'basic',      text_limit: 10,   photo_limit: 2   },
  { plan: 'pro',        text_limit: 500,  photo_limit: 60  },
  { plan: 'business',   text_limit: 3000, photo_limit: 300 },
  { plan: 'enterprise', text_limit: 9999, photo_limit: 9999 },
])

onMounted(async () => {
  const { data } = await supabase.from('ai_plan_limits').select('*')
  if (data?.length) planLimits.value = data
  loadingPlans.value = false
  await loadOverrides()
})

const savePlanLimits = async () => {
  savingPlans.value = true
  for (const row of planLimits.value) {
    await supabase.from('ai_plan_limits').upsert({
      plan: row.plan,
      text_limit: row.text_limit,
      photo_limit: row.photo_limit,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'plan' })
  }
  savingPlans.value = false
  savedPlans.value = true
  setTimeout(() => savedPlans.value = false, 3000)
}

const defaultForPlan = (plan: string) => {
  const row = planLimits.value.find(r => r.plan === plan)
  return { text: row?.text_limit ?? 10, photo: row?.photo_limit ?? 2 }
}

// ─── Пошук користувачів ──────────────────────────────────────────────────────

const userSearch = ref('')
const searchResults = ref<any[]>([])
let searchTimer: any = null

const searchUsers = () => {
  clearTimeout(searchTimer)
  if (!userSearch.value.trim()) { searchResults.value = []; return }
  searchTimer = setTimeout(async () => {
    const { data } = await supabase.rpc('admin_search_users_with_sub', {
      q: userSearch.value.trim().toLowerCase(),
    })
    searchResults.value = data || []
  }, 300)
}

// ─── Обраний користувач ──────────────────────────────────────────────────────

const selectedUser = ref<any>(null)
const userUsage    = ref<any>(null)
const savingUser   = ref(false)
const savedUser    = ref(false)
const resettingUsage = ref(false)

const userForm = reactive({
  plan: 'basic',
  ai_text_limit: null as number | null,
  ai_photo_limit: null as number | null,
})

const currentMonth = new Date().toISOString().slice(0, 7)

const selectUser = async (u: any) => {
  selectedUser.value = u
  searchResults.value = []
  userSearch.value = ''

  userForm.plan           = u.plan || 'basic'
  userForm.ai_text_limit  = u.ai_text_limit  ?? null
  userForm.ai_photo_limit = u.ai_photo_limit ?? null

  const { data: usage } = await supabase
    .from('ai_usage')
    .select('text_count, photo_count')
    .eq('user_id', u.id)
    .eq('month', currentMonth)
    .maybeSingle()
  userUsage.value = usage || { text_count: 0, photo_count: 0 }
}

const selectUserById = (o: any) => selectUser(o)

const effectiveLimit = (plan: string, type: 'text' | 'photo') => {
  if (type === 'text' && userForm.ai_text_limit)  return userForm.ai_text_limit
  if (type === 'photo' && userForm.ai_photo_limit) return userForm.ai_photo_limit
  return type === 'text' ? defaultForPlan(plan).text : defaultForPlan(plan).photo
}

const saveUserLimits = async () => {
  if (!selectedUser.value) return
  savingUser.value = true

  await supabase.from('subscriptions').upsert({
    user_id:        selectedUser.value.id,
    plan:           userForm.plan,
    ai_text_limit:  userForm.ai_text_limit  || null,
    ai_photo_limit: userForm.ai_photo_limit || null,
    updated_at:     new Date().toISOString(),
  }, { onConflict: 'user_id' })

  savingUser.value = false
  savedUser.value  = true
  setTimeout(() => savedUser.value = false, 3000)
  await loadOverrides()
}

const resetUsage = async () => {
  if (!selectedUser.value || !confirm('Скинути використання цього місяця для цього користувача?')) return
  resettingUsage.value = true
  await supabase.from('ai_usage')
    .update({ text_count: 0, photo_count: 0 })
    .eq('user_id', selectedUser.value.id)
    .eq('month', currentMonth)
  if (userUsage.value) { userUsage.value.text_count = 0; userUsage.value.photo_count = 0 }
  resettingUsage.value = false
}

// ─── Список overrides ─────────────────────────────────────────────────────────

const overrides = ref<any[]>([])
const loadingOverrides = ref(false)

const loadOverrides = async () => {
  loadingOverrides.value = true
  const { data } = await supabase.rpc('admin_users_with_custom_ai_limits')
  overrides.value = data || []
  loadingOverrides.value = false
}
</script>
