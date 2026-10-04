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
      <p class="text-agro-light mt-1">Кредити AI по тарифах, витрати на AI і налаштування для окремих користувачів</p>
    </div>

    <!-- Витрати на AI цього місяця (з журналу ai_requests) -->
    <div class="card mb-8">
      <p class="font-bold text-agro-dark mb-4">Витрати на AI цього місяця</p>
      <div v-if="spend" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="p-4 bg-agro-bg rounded-xl"><p class="text-xs text-agro-light">Собівартість</p><p class="text-2xl font-extrabold text-agro-dark">${{ spend.cost.toFixed(2) }}</p></div>
        <div class="p-4 bg-agro-bg rounded-xl"><p class="text-xs text-agro-light">Запитів</p><p class="text-2xl font-extrabold text-agro-dark">{{ spend.requests }}</p></div>
        <div class="p-4 bg-agro-bg rounded-xl"><p class="text-xs text-agro-light">Списано кредитів</p><p class="text-2xl font-extrabold text-agro-dark">{{ spend.credits }}</p></div>
        <div class="p-4 bg-agro-bg rounded-xl"><p class="text-xs text-agro-light">$ за кредит</p><p class="text-2xl font-extrabold text-agro-dark">{{ spend.credits ? (spend.cost / spend.credits).toFixed(4) : '—' }}</p></div>
      </div>
      <div v-if="spend?.byAction.length" class="text-sm space-y-1">
        <div v-for="a in spend.byAction" :key="a.action" class="flex justify-between text-agro-dark">
          <span>{{ a.action }} <span class="text-agro-light">· {{ a.requests }} запитів</span></span>
          <span class="font-semibold">${{ a.cost.toFixed(3) }}</span>
        </div>
      </div>
      <p v-if="spend && !spend.requests" class="text-sm text-agro-light">Цього місяця ще не було запитів.</p>
    </div>

    <!-- Дефолтні ліміти по планах -->
    <div class="card mb-8">
      <div class="flex items-center justify-between mb-5">
        <p class="font-bold text-agro-dark">Кредити AI по тарифах <span class="font-normal text-agro-light text-sm">· питання 1, фото 3, техкарта 5, звіт 5</span></p>
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
          class="grid grid-cols-[140px_1fr_1fr_1fr] gap-4 items-center p-4 bg-agro-bg rounded-xl">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" :class="planDot(row.plan)"></span>
            <span class="font-semibold text-agro-dark capitalize text-sm">{{ PLAN_LABELS[row.plan] }}</span>
          </div>
          <div>
            <label class="block text-xs text-agro-light mb-1">Базових кредитів / міс</label>
            <input v-model.number="row.credits_base" type="number" min="0" class="input text-sm py-1.5 w-full" />
          </div>
          <div>
            <label class="block text-xs text-agro-light mb-1">+ кредитів за гектар</label>
            <input v-model.number="row.credits_per_ha" type="number" min="0" step="0.1" class="input text-sm py-1.5 w-full" />
          </div>
          <div>
            <label class="block text-xs text-agro-light mb-1">Максимум гектарів</label>
            <input v-model.number="row.credits_ha_cap" type="number" min="0" class="input text-sm py-1.5 w-full" />
            <p class="text-[11px] text-agro-light mt-1">10 га: {{ creditsFor(row, 10) }} · 100 га: {{ creditsFor(row, 100) }}</p>
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

        <div class="flex gap-2 mb-3">
          <button v-for="pr in (['farmer', 'agronomist'] as const)" :key="pr" @click="switchUserProfile(pr)"
            class="flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors"
            :class="userForm.profile === pr ? 'bg-agro-dark text-white border-agro-dark' : 'bg-white text-agro-light border-agro-border hover:text-agro-dark'">
            {{ pr === 'farmer' ? 'Профіль фермера' : 'Профіль агронома' }}
          </button>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-agro-dark mb-1">Тариф</label>
          <select v-model="userForm.plan" class="input text-sm">
            <option value="basic">Basic (безкоштовний)</option>
            <template v-if="userForm.profile === 'farmer'">
              <option value="business">Business</option>
              <option value="business_pro">Business Pro</option>
            </template>
            <option v-else value="pro">PRO агронома</option>
          </select>
        </div>

        <div class="bg-white rounded-xl p-4 mb-4 border border-agro-border">
          <p class="text-xs font-bold uppercase tracking-wider text-agro-light mb-3">Індивідуальний ліміт кредитів</p>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Кредитів / міс</label>
              <input v-model.number="userForm.ai_text_limit" type="number" min="0" class="input text-sm"
                :placeholder="`За тарифом: ${defaultCredits}`" />
              <p class="text-xs text-agro-light mt-1">Порожнє — за тарифом (з урахуванням гектарів)</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Видати пакет кредитів (цей місяць)</label>
              <div class="flex gap-2">
                <input v-model.number="topupCredits" type="number" min="1" class="input text-sm" placeholder="напр. 50" />
                <button @click="grantTopup" :disabled="!topupCredits || grantingTopup" class="btn-outline text-sm px-3 disabled:opacity-50">Видати</button>
              </div>
              <p class="text-xs text-agro-light mt-1">Пакети цього місяця: {{ topupsThisMonth }}</p>
            </div>
          </div>
        </div>

        <!-- Поточне використання -->
        <div v-if="userUsage" class="bg-white rounded-xl p-4 mb-4 border border-agro-border">
          <p class="text-xs font-bold uppercase tracking-wider text-agro-light mb-3">Використання цього місяця</p>
          <div class="flex items-end gap-2">
            <span class="text-2xl font-bold text-agro-dark">{{ userUsage.credits_used }}</span>
            <span class="text-sm text-agro-light mb-0.5">/ {{ effectiveCredits }} кредитів</span>
          </div>
          <div class="h-1.5 bg-agro-bg rounded-full mt-2 overflow-hidden">
            <div class="h-full bg-agro rounded-full transition-all"
              :style="`width: ${Math.min(100, (userUsage.credits_used / Math.max(1, effectiveCredits)) * 100)}%`"></div>
          </div>
          <p class="text-xs text-agro-light mt-2">Собівартість цього місяця: ${{ (userUsage.cost || 0).toFixed(3) }}</p>
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
          <div v-for="o in overrides" :key="`${o.id}-${o.profile}`"
            class="flex items-center gap-3 px-4 py-3 hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0">
            <div class="w-8 h-8 rounded-full bg-agro-hover flex items-center justify-center text-agro font-bold text-xs shrink-0">
              {{ (o.email || '?')[0].toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-agro-dark truncate">{{ o.email }}</p>
              <p class="text-xs text-agro-light">
                {{ o.profile === 'agronomist' ? 'Агроном' : 'Фермер' }} · <span class="capitalize">{{ o.plan }}</span> ·
                <span v-if="o.ai_text_limit">кредитів: {{ o.ai_text_limit }}/міс</span>
                <span v-else>лише план змінено</span>
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
  basic: 'Basic', business: 'Business', business_pro: 'Business Pro', pro: 'Агроном PRO', agronomist_basic: 'Агроном Basic',
}

const planDot = (plan: string) => ({
  basic: 'bg-gray-400',
  business: 'bg-blue-500',
  business_pro: 'bg-amber-500',
}[plan] || 'bg-gray-400')

// ─── Дефолтні ліміти по планах ───────────────────────────────────────────────

const loadingPlans = ref(true)
const savingPlans  = ref(false)
const savedPlans   = ref(false)

interface PlanCredits { plan: string; credits_base: number; credits_per_ha: number; credits_ha_cap: number }
const PLAN_ORDER = ['basic', 'business', 'business_pro', 'agronomist_basic', 'pro']
const planLimits = ref<PlanCredits[]>([])

const creditsFor = (row: PlanCredits | undefined, ha: number) =>
  row ? Math.floor((row.credits_base || 0) + (Number(row.credits_per_ha) || 0) * Math.min(ha, row.credits_ha_cap || 0)) : 0

// Зведення витрат місяця з журналу ai_requests
const spend = ref<{ cost: number; requests: number; credits: number; byAction: { action: string; requests: number; cost: number }[] } | null>(null)
const loadSpend = async () => {
  const from = new Date(); from.setDate(1); from.setHours(0, 0, 0, 0)
  const { data } = await supabase.from('ai_requests').select('action, cost_usd, credits').gte('created_at', from.toISOString()).limit(10000)
  const rows = data || []
  const by: Record<string, { requests: number; cost: number }> = {}
  for (const r of rows) { (by[r.action] ||= { requests: 0, cost: 0 }); by[r.action].requests++; by[r.action].cost += Number(r.cost_usd) }
  spend.value = {
    cost: rows.reduce((a, r) => a + Number(r.cost_usd), 0),
    requests: rows.length,
    credits: rows.reduce((a, r) => a + (r.credits || 0), 0),
    byAction: Object.entries(by).map(([action, v]) => ({ action, ...v })).sort((a, b) => b.cost - a.cost),
  }
}

onMounted(async () => {
  const { data } = await supabase.from('ai_plan_limits').select('plan, credits_base, credits_per_ha, credits_ha_cap')
  planLimits.value = PLAN_ORDER.map(plan => data?.find(r => r.plan === plan) || { plan, credits_base: 0, credits_per_ha: 0, credits_ha_cap: 0 })
  loadingPlans.value = false
  await Promise.all([loadOverrides(), loadSpend()])
})

const savePlanLimits = async () => {
  savingPlans.value = true
  for (const row of planLimits.value) {
    await supabase.from('ai_plan_limits').upsert({
      plan: row.plan,
      credits_base: row.credits_base || 0,
      credits_per_ha: row.credits_per_ha || 0,
      credits_ha_cap: row.credits_ha_cap || 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'plan' })
  }
  savingPlans.value = false
  savedPlans.value = true
  setTimeout(() => savedPlans.value = false, 3000)
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
  profile: 'farmer' as SubscriptionProfile,
  plan: 'basic',
  ai_text_limit: null as number | null,  // індивідуальний ліміт кредитів
})
const userHectares = ref(0)
const topupsThisMonth = ref(0)
const topupCredits = ref<number | null>(null)
const grantingTopup = ref(false)

// Кредити за тарифом (з гектарами господарства) і з урахуванням індивідуального ліміту та пакетів
const defaultCredits = computed(() => creditsFor(planLimits.value.find(r => r.plan === aiLimitKey(userForm.plan as PlanId, userForm.profile)), userForm.profile === 'farmer' ? userHectares.value : 0))
const effectiveCredits = computed(() => (userForm.ai_text_limit ?? defaultCredits.value) + topupsThisMonth.value)

const currentMonth = new Date().toISOString().slice(0, 7)

// Підписка й використання AI — окремо для профілю фермера і агронома
const loadUserProfileData = async () => {
  const uid = selectedUser.value?.id
  if (!uid) return
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const [{ data: sub }, { data: usage }, { data: farms }, { data: topups }, { data: reqs }] = await Promise.all([
    supabase.from('subscriptions').select('plan, ai_text_limit')
      .eq('user_id', uid).eq('profile', userForm.profile).maybeSingle(),
    supabase.from('ai_usage').select('credits_used')
      .eq('user_id', uid).eq('profile', userForm.profile).eq('month', currentMonth).maybeSingle(),
    supabase.from('farms').select('hectares').eq('user_id', uid),
    supabase.from('ai_credit_topups').select('credits').eq('owner_id', uid).eq('profile', userForm.profile).eq('month', currentMonth),
    supabase.from('ai_requests').select('cost_usd').eq('owner_id', uid).gte('created_at', monthStart.toISOString()),
  ])
  userForm.plan          = sub?.plan || 'basic'
  userForm.ai_text_limit = sub?.ai_text_limit ?? null
  userHectares.value = (farms || []).reduce((a: number, f: any) => a + (Number(f.hectares) || 0), 0)
  topupsThisMonth.value = (topups || []).reduce((a: number, t: any) => a + (t.credits || 0), 0)
  userUsage.value = { credits_used: usage?.credits_used || 0, cost: (reqs || []).reduce((a: number, r: any) => a + Number(r.cost_usd), 0) }
}

const selectUser = async (u: any, profile: SubscriptionProfile = 'farmer') => {
  selectedUser.value = u
  searchResults.value = []
  userSearch.value = ''
  userForm.profile = profile
  await loadUserProfileData()
}

const switchUserProfile = async (profile: SubscriptionProfile) => {
  userForm.profile = profile
  await loadUserProfileData()
}

const selectUserById = (o: any) => selectUser(o, o.profile === 'agronomist' ? 'agronomist' : 'farmer')

const grantTopup = async () => {
  if (!selectedUser.value || !topupCredits.value) return
  grantingTopup.value = true
  await supabase.from('ai_credit_topups').insert({
    owner_id: selectedUser.value.id, profile: userForm.profile, credits: topupCredits.value, month: currentMonth, source: 'admin',
  })
  topupCredits.value = null
  grantingTopup.value = false
  await loadUserProfileData()
}

const saveUserLimits = async () => {
  if (!selectedUser.value) return
  savingUser.value = true

  await supabase.from('subscriptions').upsert({
    user_id:        selectedUser.value.id,
    profile:        userForm.profile,
    plan:           userForm.plan,
    ai_text_limit:  userForm.ai_text_limit ?? null,
  }, { onConflict: 'user_id,profile' })

  savingUser.value = false
  savedUser.value  = true
  setTimeout(() => savedUser.value = false, 3000)
  await loadOverrides()
}

const resetUsage = async () => {
  if (!selectedUser.value || !confirm('Скинути використання цього місяця для цього користувача?')) return
  resettingUsage.value = true
  await supabase.from('ai_usage')
    .update({ credits_used: 0 })
    .eq('user_id', selectedUser.value.id)
    .eq('profile', userForm.profile)
    .eq('month', currentMonth)
  if (userUsage.value) userUsage.value.credits_used = 0
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
