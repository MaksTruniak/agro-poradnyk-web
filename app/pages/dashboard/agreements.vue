<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 12l2 2 4-4"/><path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">{{ isAgronomist ? 'Угоди з фермерами' : 'Угоди з агрономами' }}</h1>
        <p class="dash-subtitle">{{ isAgronomist ? 'Запити та активні домовленості' : 'Ваші домовленості про агрономічний супровід' }}</p>
      </div>
      <NuxtLink v-if="!isAgronomist" to="/agronomists" class="dash-btn-primary shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Знайти агронома
      </NuxtLink>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="card animate-pulse h-24"/>
    </div>

    <template v-else>
      <div v-if="!agreements.length" class="card text-center py-16">
        <div style="width:52px;height:52px;border-radius:14px;background:rgb(238,241,227);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 12l2 2 4-4"/><path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z"/>
          </svg>
        </div>
        <p class="font-bold text-agro-dark text-lg mb-2">Угод поки немає</p>
        <p class="text-agro-light mb-4">{{ isAgronomist ? 'Фермери надсилатимуть вам запити зі свого боку' : 'Знайдіть агронома і запропонуйте співпрацю' }}</p>
        <NuxtLink v-if="!isAgronomist" to="/agronomists" class="dash-btn-primary inline-flex">Знайти агронома →</NuxtLink>
      </div>

      <div v-else class="space-y-3">
        <div v-for="ag in agreements" :key="ag.id" class="card">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
              :style="STATUS_COLORS[ag.status]?.avatar">
              {{ ag.other_name?.[0]?.toUpperCase() || '?' }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="font-bold text-agro-dark">{{ ag.other_name }}</p>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium" :style="STATUS_COLORS[ag.status]?.badge">
                  {{ STATUS_LABELS[ag.status] || ag.status }}
                </span>
              </div>
              <p v-if="ag.farm_name" class="text-xs text-agro mt-0.5 flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z"/></svg>
                {{ ag.farm_name }}
              </p>
              <p v-if="ag.message" class="text-sm text-agro-dark mt-1 leading-relaxed line-clamp-2">{{ ag.message }}</p>
              <div class="flex items-center gap-3 mt-1 flex-wrap">
                <p v-if="ag.price" class="text-xs text-agro-light">{{ ag.price.toLocaleString('uk-UA') }} грн / {{ PERIOD_LABELS[ag.price_period] }}</p>
                <p class="text-xs text-agro-light">{{ formatDate(ag.created_at) }}</p>
                <p v-if="ag.started_at && ag.status === 'active'" class="text-xs text-agro">Активна з {{ formatDate(ag.started_at) }}</p>
              </div>
            </div>
            <div class="flex gap-2 shrink-0 flex-wrap justify-end items-center">
              <!-- Чат (тільки для активних) -->
              <button v-if="ag.status === 'active'" @click="goToChat(ag)"
                class="text-xs font-semibold px-3 py-1.5 rounded-xl border border-agro/30 bg-agro-hover hover:bg-agro/20 transition-colors text-agro flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                Чат
              </button>
              <!-- Агроном -->
              <template v-if="isAgronomist">
                <button v-if="ag.status === 'pending'" @click="accept(ag)" :disabled="respondingId === ag.id"
                  class="text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                  style="background:rgb(47,82,51);color:white;">✓ Прийняти</button>
                <button v-if="ag.status === 'pending'" @click="decline(ag)" :disabled="respondingId === ag.id"
                  class="text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors hover:bg-red-50"
                  style="color:rgb(220,38,38);border-color:rgb(254,202,202);">✕ Відхилити</button>
                <button v-if="ag.status === 'active'" @click="complete(ag)"
                  class="text-xs font-semibold px-3 py-1.5 rounded-xl border border-agro-border hover:bg-agro-hover transition-colors text-agro-dark">
                  Завершити
                </button>
              </template>
              <!-- Фермер -->
              <template v-else>
                <NuxtLink :to="`/agronomist/${ag.other_id}`" class="text-xs text-agro font-semibold hover:underline">Профіль →</NuxtLink>
                <button v-if="ag.status === 'active'" @click="complete(ag)"
                  class="text-xs font-semibold px-3 py-1.5 rounded-xl border border-agro-border hover:bg-agro-hover transition-colors text-agro-dark">
                  Завершити
                </button>
                <button v-if="ag.status === 'pending'" @click="cancel(ag)"
                  class="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors">
                  Скасувати
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Модалка відгуку (тільки для фермера після завершення) -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="reviewModal.show" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" @click.self="reviewModal.show = false">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-agro-dark text-lg flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Залишити відгук
              </h3>
              <button @click="reviewModal.show = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-agro-hover text-agro-light">✕</button>
            </div>
            <p class="text-sm text-agro-light mb-3">Оцініть роботу агронома <span class="font-semibold text-agro-dark">{{ reviewModal.agronomistName }}</span></p>
            <div v-if="reviewModal.startedAt" class="flex gap-2 text-xs text-agro-light mb-3 bg-agro-bg rounded-xl px-3 py-2">
              <span>Початок: <span class="font-medium text-agro-dark">{{ formatDate(reviewModal.startedAt) }}</span></span>
              <span>—</span>
              <span>Кінець: <span class="font-medium text-agro-dark">{{ formatDate(reviewModal.endedAt) }}</span></span>
            </div>
            <div class="flex justify-center gap-2 mb-4">
              <button v-for="s in 5" :key="s" @click="reviewModal.rating = s" class="transition-transform hover:scale-110" :class="s <= reviewModal.rating ? 'opacity-100' : 'opacity-30'">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </button>
            </div>
            <div class="mb-3">
              <label class="block text-xs font-semibold text-agro-dark mb-1">Яку проблему було вирішено <span class="text-red-500">*</span></label>
              <textarea v-model="reviewModal.problem" rows="2"
                class="w-full border border-agro-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-agro"
                placeholder="Опишіть проблему, яку вирішив агроном..."></textarea>
            </div>
            <textarea v-model="reviewModal.text" rows="2"
              class="w-full border border-agro-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-agro mb-4"
              placeholder="Загальний відгук (необов'язково)..."></textarea>
            <button @click="submitReview" :disabled="!reviewModal.rating || !reviewModal.problem.trim() || reviewModal.saving"
              class="btn-primary w-full flex items-center justify-center gap-2" :class="(!reviewModal.rating || !reviewModal.problem.trim() || reviewModal.saving) ? 'opacity-50 cursor-not-allowed' : ''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 19-7z"/></svg>
              {{ reviewModal.saving ? 'Збереження...' : 'Надіслати відгук' }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)
const agreements = ref<any[]>([])
const respondingId = ref('')

const isAgronomist = ref(
  import.meta.client
    ? (localStorage.getItem('agro_active_profile') || localStorage.getItem('agro_user_role')) === 'agronomist'
    : false
)

useHead({ title: computed(() => isAgronomist.value ? 'Угоди з фермерами' : 'Угоди з агрономами') })

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Очікує відповіді',
  active: '✓ Активна',
  cancelled: 'Скасовано',
  completed: 'Завершено',
}
const STATUS_COLORS: Record<string, { avatar: string; badge: string }> = {
  pending:   { avatar: 'background:rgb(255,251,235);color:rgb(180,130,40)', badge: 'background:rgb(255,251,235);color:rgb(146,100,26)' },
  active:    { avatar: 'background:rgb(234,240,222);color:rgb(47,82,51)',   badge: 'background:rgb(234,240,222);color:rgb(47,82,51)' },
  cancelled: { avatar: 'background:rgb(248,250,244);color:rgb(160,175,150)', badge: 'background:rgb(248,250,244);color:rgb(122,138,114)' },
  completed: { avatar: 'background:rgb(240,249,255);color:rgb(2,132,199)',  badge: 'background:rgb(240,249,255);color:rgb(2,132,199)' },
}
const PERIOD_LABELS: Record<string, string> = { monthly: 'місяць', seasonal: 'сезон', 'one-time': 'разово' }

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const { data: userData } = await supabase.from('users').select('role, roles').eq('id', uid).single()
if (userData?.role === 'agronomist' || userData?.roles?.includes('agronomist')) isAgronomist.value = true

if (isAgronomist.value) {
  const { data } = await supabase.from('agreements')
    .select('id, farmer_id, farm_id, message, price, price_period, status, created_at, started_at')
    .eq('agronomist_id', uid).not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false })
  if (data?.length) {
    const ids = [...new Set(data.map((a: any) => a.farmer_id))]
    const farmIds = data.filter((a: any) => a.farm_id).map((a: any) => a.farm_id)
    const [usersRes, farmsRes] = await Promise.all([
      supabase.from('users').select('id, name').in('id', ids),
      farmIds.length ? supabase.from('farms').select('id, name').in('id', farmIds) : Promise.resolve({ data: [] }),
    ])
    const map = Object.fromEntries((usersRes.data || []).map((u: any) => [u.id, u.name]))
    const farmMap = Object.fromEntries((farmsRes.data || []).map((f: any) => [f.id, f.name]))
    agreements.value = data.map((a: any) => ({ ...a, other_id: a.farmer_id, other_name: map[a.farmer_id] || 'Фермер', farm_name: farmMap[a.farm_id] || null }))
  }
} else {
  const { data } = await supabase.from('agreements')
    .select('id, agronomist_id, farm_id, message, price, price_period, status, created_at, started_at, ended_at')
    .eq('farmer_id', uid).order('created_at', { ascending: false })
  if (data?.length) {
    const ids = [...new Set(data.map((a: any) => a.agronomist_id))]
    const farmIds = data.filter((a: any) => a.farm_id).map((a: any) => a.farm_id)
    const [usersRes, farmsRes] = await Promise.all([
      supabase.from('users').select('id, name').in('id', ids),
      farmIds.length ? supabase.from('farms').select('id, name').in('id', farmIds) : Promise.resolve({ data: [] }),
    ])
    const map = Object.fromEntries((usersRes.data || []).map((u: any) => [u.id, u.name]))
    const farmMap = Object.fromEntries((farmsRes.data || []).map((f: any) => [f.id, f.name]))
    agreements.value = data.map((a: any) => ({ ...a, other_id: a.agronomist_id, other_name: map[a.agronomist_id] || 'Агроном', farm_name: farmMap[a.farm_id] || null }))
  }
}
loading.value = false

// Модалка відгуку
const reviewModal = reactive({
  show: false, rating: 0, text: '', problem: '', saving: false,
  agronomistId: '', agronomistName: '', startedAt: '', endedAt: ''
})

const openReviewModal = async (ag: any) => {
  reviewModal.rating = 0
  reviewModal.text = ''
  reviewModal.problem = ''
  reviewModal.agronomistId = ag.other_id
  reviewModal.agronomistName = ag.other_name
  reviewModal.startedAt = ag.started_at || ''
  reviewModal.endedAt = ag.ended_at || new Date().toISOString()
  // Перевіримо чи вже є відгук
  const { data: existing } = await supabase.from('agronomist_reviews')
    .select('id').eq('farmer_id', uid).eq('agronomist_id', ag.other_id).maybeSingle()
  if (existing) {
    alert('Ви вже залишили відгук цьому агроному')
    return
  }
  reviewModal.show = true
}

const submitReview = async () => {
  if (!reviewModal.rating || !reviewModal.problem.trim()) return
  reviewModal.saving = true
  await supabase.from('agronomist_reviews').insert({
    farmer_id: uid,
    agronomist_id: reviewModal.agronomistId,
    rating: reviewModal.rating,
    text: reviewModal.text || null,
    problem_solved: reviewModal.problem.trim(),
  })
  const { data: revs } = await supabase.from('agronomist_reviews').select('rating').eq('agronomist_id', reviewModal.agronomistId)
  if (revs?.length) {
    const avg = revs.reduce((s: number, r: any) => s + r.rating, 0) / revs.length
    await supabase.from('agronomist_profiles').update({ rating: Math.round(avg * 10) / 10, reviews_count: revs.length }).eq('user_id', reviewModal.agronomistId)
  }
  reviewModal.saving = false
  reviewModal.show = false
}

const router = useRouter()
const goToChat = async (ag: any) => {
  const farmerId = isAgronomist.value ? ag.other_id : uid
  const agronomistId = isAgronomist.value ? uid : ag.other_id
  const { data } = await supabase.from('chats').select('id')
    .eq('farmer_id', farmerId).eq('agronomist_id', agronomistId).eq('type', 'human').maybeSingle()
  if (data?.id) {
    router.push(`/dashboard/chats/${data.id}`)
  } else {
    // Створити чат якщо немає
    const { data: newChat } = await supabase.from('chats')
      .insert({ farmer_id: farmerId, agronomist_id: agronomistId, type: 'human', is_unlocked: true })
      .select().single()
    if (newChat) router.push(`/dashboard/chats/${newChat.id}`)
  }
}

// Дії агронома
const accept = async (ag: any) => {
  respondingId.value = ag.id
  await supabase.from('agreements').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', ag.id)
  ag.status = 'active'
  ag.started_at = new Date().toISOString()
  respondingId.value = ''
}
const decline = async (ag: any) => {
  respondingId.value = ag.id
  await supabase.from('agreements').update({ status: 'cancelled' }).eq('id', ag.id)
  agreements.value = agreements.value.filter(a => a.id !== ag.id)
  respondingId.value = ''
}

// Дії фермера
const cancel = async (ag: any) => {
  await supabase.from('agreements').update({ status: 'cancelled' }).eq('id', ag.id)
  ag.status = 'cancelled'
}
const complete = async (ag: any) => {
  await supabase.from('agreements').update({ status: 'completed', ended_at: new Date().toISOString() }).eq('id', ag.id)
  ag.status = 'completed'
  // Показати відгук тільки фермеру
  if (!isAgronomist.value) openReviewModal(ag)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
