<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Адмін-панель</h1>
      <p class="text-agro-light mt-1">Верифікація, звернення і запити</p>
    </div>

    <!-- Таби -->
    <div class="flex bg-agro-hover rounded-2xl p-1 mb-6 w-fit gap-1">
      <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
        class="px-5 py-2 rounded-xl text-sm font-medium transition-colors"
        :class="activeTab === tab.key ? 'bg-agro text-white' : 'text-agro-light hover:text-agro-dark'">
        {{ tab.label }}
        <span v-if="tab.count" class="ml-1.5 bg-white/30 rounded-full px-1.5 py-0.5 text-xs font-bold">{{ tab.count }}</span>
      </button>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="card animate-pulse h-32"></div>
    </div>

    <!-- Очікують верифікації -->
    <div v-else-if="activeTab === 'pending'">
      <div v-if="!pending.length" class="card text-center py-16">
        <div class="mb-3 flex justify-center"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <p class="font-bold text-agro-dark">Немає агрономів на перевірку</p>
        <p class="text-agro-light text-sm mt-1">Всі заявки опрацьовано</p>
      </div>
      <div v-else class="space-y-6">
        <div v-for="a in pending" :key="a.id" class="card space-y-5">

          <!-- Шапка -->
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-agro-hover flex items-center justify-center text-2xl font-bold text-agro shrink-0">
                {{ a.user?.name?.[0]?.toUpperCase() || '?' }}
              </div>
              <div>
                <p class="font-bold text-agro-dark text-lg">{{ a.user?.name || 'Без імені' }}</p>
                <p class="text-sm text-agro-light">{{ a.user?.email }}</p>
                <p class="text-xs text-agro-light mt-0.5">Зареєстрований {{ formatDate(a.user?.created_at) }}</p>
              </div>
            </div>
            <span class="shrink-0 inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full font-medium"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Очікує</span>
          </div>

          <!-- Основні дані -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-agro-bg rounded-xl px-3 py-2.5">
              <p class="text-xs text-agro-light">Регіон</p>
              <p class="text-sm font-semibold text-agro-dark mt-0.5">{{ a.region || '—' }}</p>
            </div>
            <div class="bg-agro-bg rounded-xl px-3 py-2.5">
              <p class="text-xs text-agro-light">Досвід</p>
              <p class="text-sm font-semibold text-agro-dark mt-0.5">{{ a.experience_years ? `${a.experience_years} р.` : '—' }}</p>
            </div>
            <div class="bg-agro-bg rounded-xl px-3 py-2.5">
              <p class="text-xs text-agro-light">Ставка</p>
              <p class="text-sm font-semibold text-agro-dark mt-0.5">{{ a.rate_per_hour ? `${a.rate_per_hour} грн/год` : '—' }}</p>
            </div>
            <div class="bg-agro-bg rounded-xl px-3 py-2.5">
              <p class="text-xs text-agro-light">Доступний</p>
              <p class="text-sm font-semibold mt-0.5" :class="a.is_available ? 'text-agro' : 'text-agro-light'">
                <span class="inline-flex items-center gap-1" v-if="a.is_available"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Так</span>
                <span class="inline-flex items-center gap-1" v-else><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(179,69,47)" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg> Ні</span>
              </p>
            </div>
          </div>

          <!-- Про себе -->
          <div v-if="a.bio" class="bg-agro-bg rounded-xl px-4 py-3">
            <p class="text-xs text-agro-light mb-1">💬 Про себе</p>
            <p class="text-sm text-agro-dark leading-relaxed">{{ a.bio }}</p>
          </div>

          <!-- Освіта -->
          <div v-if="a.has_degree" class="bg-agro-bg rounded-xl px-4 py-3">
            <p class="text-xs text-agro-light mb-2">🎓 Освіта</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div v-if="a.institution">
                <p class="text-xs text-agro-light">Заклад</p>
                <p class="text-sm font-medium text-agro-dark">{{ a.institution }}</p>
              </div>
              <div v-if="a.education">
                <p class="text-xs text-agro-light">Спеціальність</p>
                <p class="text-sm font-medium text-agro-dark">{{ a.education }}</p>
              </div>
              <div v-if="a.education_year">
                <p class="text-xs text-agro-light">Рік випуску</p>
                <p class="text-sm font-medium text-agro-dark">{{ a.education_year }}</p>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-agro-light px-1">🎓 Освіта не вказана</div>

          <!-- Досвід роботи -->
          <div v-if="a.has_experience && a.experience_description" class="bg-agro-bg rounded-xl px-4 py-3">
            <p class="text-xs text-agro-light mb-1">💼 Досвід роботи</p>
            <p class="text-sm text-agro-dark leading-relaxed">{{ a.experience_description }}</p>
          </div>
          <div v-else class="text-xs text-agro-light px-1">💼 Досвід роботи не описано</div>

          <!-- Спеціалізації та культури -->
          <div v-if="a.specializations?.length || a.crops_expertise?.length" class="space-y-2">
            <div v-if="a.specializations?.length">
              <p class="text-xs text-agro-light mb-1.5">🔬 Спеціалізації</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="s in a.specializations" :key="s"
                  class="text-xs px-2.5 py-1 bg-agro-hover text-agro rounded-full font-medium">{{ s }}</span>
              </div>
            </div>
            <div v-if="a.crops_expertise?.length">
              <p class="text-xs text-agro-light mb-1.5 mt-2">🌱 Культури</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="c in a.crops_expertise" :key="c"
                  class="text-xs px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full">{{ c }}</span>
              </div>
            </div>
          </div>

          <!-- Кнопки -->
          <div class="flex gap-3 pt-2 border-t border-agro-border">
            <button @click="verify(a, true)" :disabled="a.saving"
              class="btn-primary text-sm flex-1 md:flex-none md:px-8">
              <span v-if="a.saving === 'approve'">...</span>
              <span v-else class="inline-flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Верифікувати</span>
            </button>
            <button @click="verify(a, false)" :disabled="a.saving"
              class="btn-outline text-sm text-red-500 border-red-200 hover:bg-red-50 flex-1 md:flex-none md:px-8">
              <span v-if="a.saving === 'reject'">...</span>
              <span v-else class="inline-flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(179,69,47)" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg> Відхилити</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Верифіковані -->
    <div v-else-if="activeTab === 'verified'">
      <div v-if="!verified.length" class="card text-center py-16">
        <div class="w-16 h-16 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-3"/><rect x="9" y="1" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>
        </div>
        <p class="font-bold text-agro-dark">Немає верифікованих агрономів</p>
      </div>
      <div v-else class="card overflow-hidden p-0">
        <div class="divide-y divide-agro-border">
          <div v-for="a in verified" :key="a.id" class="flex items-center gap-4 px-5 py-4">
            <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center font-bold text-agro shrink-0">
              {{ a.user?.name?.[0]?.toUpperCase() || '?' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-agro-dark">{{ a.user?.name }}</p>
              <p class="text-xs text-agro-light">{{ a.region || 'Регіон не вказано' }}{{ a.experience_years ? ` · ${a.experience_years} р. досвіду` : '' }}</p>
            </div>
            <span class="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-agro-hover text-agro rounded-full font-medium shrink-0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Верифікований</span>
            <button @click="verify(a, false)" :disabled="a.saving"
              class="shrink-0 text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 rounded-xl px-3 py-1.5 transition-colors">
              Скасувати
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Заготівельники -->
    <div v-else-if="activeTab === 'buyers'">
      <div v-if="!buyers.length" class="card text-center py-16">
        <p class="font-bold text-agro-dark">Заготівельників ще немає</p>
      </div>
      <div v-else class="space-y-3">
        <!-- Очікують верифікації -->
        <div v-if="pendingBuyers.length" class="mb-2">
          <p class="text-xs text-agro-light uppercase tracking-wide font-semibold mb-2">Очікують верифікації ({{ pendingBuyers.length }})</p>
          <div class="card overflow-hidden p-0">
            <div class="divide-y divide-agro-border">
              <div v-for="b in pendingBuyers" :key="b.id" class="flex items-center gap-4 px-5 py-4">
                <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center font-bold text-amber-600 shrink-0">
                  {{ b.name?.[0]?.toUpperCase() || '?' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-agro-dark">{{ b.company_name || b.name }}</p>
                  <p class="text-xs text-agro-light">{{ b.email }} · ЄДРПОУ: <strong class="text-agro-dark">{{ b.edrpou || '—' }}</strong></p>
                  <p class="text-xs text-agro-light mt-0.5">{{ b.region || '' }} · {{ formatDate(b.created_at) }}</p>
                </div>
                <div class="flex gap-2 shrink-0">
                  <button @click="verifyBuyer(b, true)" :disabled="b.saving"
                    class="text-xs bg-agro text-white font-semibold px-3 py-1.5 rounded-xl hover:bg-agro-dark transition-colors disabled:opacity-50">
                    {{ b.saving === 'approve' ? '...' : 'Верифікувати' }}
                  </button>
                  <button @click="verifyBuyer(b, false)" :disabled="b.saving"
                    class="text-xs text-red-400 border border-red-100 hover:border-red-300 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50">
                    {{ b.saving === 'reject' ? '...' : 'Відхилити' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Всі заготівельники -->
        <p class="text-xs text-agro-light uppercase tracking-wide font-semibold mb-2">Всі заготівельники ({{ buyers.length }})</p>
        <div class="card overflow-hidden p-0">
          <div class="divide-y divide-agro-border">
            <div v-for="b in buyers" :key="b.id" class="flex items-center gap-4 px-5 py-4">
              <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center font-bold text-agro shrink-0">
                {{ b.name?.[0]?.toUpperCase() || '?' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-agro-dark">{{ b.company_name || b.name }}</p>
                <p class="text-xs text-agro-light">{{ b.email }}{{ b.edrpou ? ` · ЄДРПОУ: ${b.edrpou}` : '' }}</p>
              </div>
              <span v-if="b.is_verified" class="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-agro-hover text-agro rounded-full font-medium shrink-0">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Верифікований
              </span>
              <span v-else-if="b.verification_requested" class="text-xs px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full font-medium shrink-0">На розгляді</span>
              <span v-else class="text-xs text-agro-light shrink-0">Не верифікований</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Звернення в підтримку (з кабінету: «Підтримка», «Інтеграції») -->
    <div v-else-if="activeTab === 'tickets'">
      <div class="flex gap-2 mb-4">
        <button v-for="f in [{ k: 'open', l: 'Відкриті' }, { k: 'closed', l: 'Закриті' }]" :key="f.k" @click="ticketFilter = f.k"
          class="text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors"
          :class="ticketFilter === f.k ? 'bg-agro-dark text-white border-agro-dark' : 'text-agro-light border-agro-border hover:text-agro-dark'">
          {{ f.l }}
        </button>
      </div>
      <div v-if="!shownTickets.length" class="card text-center py-16">
        <p class="font-bold text-agro-dark">{{ ticketFilter === 'open' ? 'Відкритих звернень немає' : 'Закритих звернень немає' }}</p>
      </div>
      <div v-else class="space-y-3">
        <div v-for="t in shownTickets" :key="t.id" class="card">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="font-semibold text-agro-dark">
                {{ t.subject }}
                <span v-if="t.priority === 'high'" class="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 align-middle">Пріоритет</span>
              </p>
              <p class="text-xs text-agro-light mt-0.5">
                {{ t.user?.name || '—' }} · <a v-if="t.user?.email" :href="`mailto:${t.user.email}?subject=${encodeURIComponent('Re: ' + t.subject)}`" class="text-agro hover:underline">{{ t.user.email }}</a>
                · {{ formatDate(t.created_at) }}
              </p>
              <p v-if="t.body" class="text-sm text-agro-dark mt-2 whitespace-pre-line break-words">{{ t.body }}</p>
            </div>
            <button @click="setTicketStatus(t, t.status === 'closed' ? 'open' : 'closed')" :disabled="t.saving"
              class="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-50"
              :class="t.status === 'closed' ? 'text-agro-light border-agro-border hover:text-agro-dark' : 'bg-agro text-white border-agro hover:bg-agro-dark'">
              {{ t.status === 'closed' ? 'Відкрити знову' : 'Закрити' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Запити Enterprise -->
    <div v-else-if="activeTab === 'contacts'">
      <div v-if="!contacts.length" class="card text-center py-16">
        <p class="font-bold text-agro-dark">Немає запитів</p>
        <p class="text-agro-light text-sm mt-1">Форма Enterprise ще не заповнювалась</p>
      </div>
      <div v-else class="space-y-3">
        <div v-for="c in contacts" :key="c.id" class="card flex items-center justify-between gap-4" :class="c.status === 'done' ? 'opacity-60' : ''">
          <div class="flex items-center gap-4 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center font-bold text-agro shrink-0">
              {{ c.name?.[0]?.toUpperCase() || '?' }}
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-agro-dark">{{ c.name }}</p>
              <p class="text-sm text-agro-light">
                <a v-if="c.email" :href="`mailto:${c.email}`" class="text-agro hover:underline">{{ c.email }}</a>
                <template v-if="c.phone"> · <a :href="`tel:${c.phone}`" class="hover:underline">{{ c.phone }}</a></template>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <span class="text-xs text-agro-light">{{ formatDate(c.created_at) }}</span>
            <span class="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold capitalize">{{ c.type || 'enterprise' }}</span>
            <button @click="setContactStatus(c, c.status === 'done' ? 'new' : 'done')" :disabled="c.saving"
              class="text-xs font-semibold px-3 py-1.5 rounded-xl border border-agro-border text-agro hover:bg-agro-hover transition-colors disabled:opacity-50">
              {{ c.status === 'done' ? 'Повернути' : 'Опрацьовано' }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>

</template>

<script setup lang="ts">
useHead({ title: 'Адмін-панель' })
definePageMeta({ layout: 'admin', middleware: 'admin' })

const supabase = useSupabaseClient()
const loading = ref(true)
const activeTab = ref('pending')
const agronomists = ref<any[]>([])

const pending = computed(() => agronomists.value.filter(a => !a.is_verified))
const verified = computed(() => agronomists.value.filter(a => a.is_verified))

const contacts = ref<any[]>([])
const buyers = ref<any[]>([])
const tickets = ref<any[]>([])
const ticketFilter = ref('open')
const shownTickets = computed(() => tickets.value.filter(t => (t.status === 'closed') === (ticketFilter.value === 'closed')))

const setTicketStatus = async (t: any, status: 'open' | 'closed') => {
  t.saving = true
  const res = await supabase.from('support_tickets').update({ status }).eq('id', t.id).select('id')
  t.saving = false
  if (adminWriteOk(res, 'Не вдалося змінити звернення')) t.status = status
}

const setContactStatus = async (c: any, status: 'new' | 'done') => {
  c.saving = true
  const res = await supabase.from('contact_requests').update({ status }).eq('id', c.id).select('id')
  c.saving = false
  if (adminWriteOk(res, 'Не вдалося змінити запит')) c.status = status
}
const pendingBuyers = computed(() => buyers.value.filter(b => b.verification_requested && !b.is_verified))

const tabs = computed(() => [
  { key: 'pending', label: 'Очікують', count: pending.value.length || null },
  { key: 'verified', label: 'Верифіковані', count: null },
  { key: 'buyers', label: 'Заготівельники', count: pendingBuyers.value.length || null },
  { key: 'tickets', label: 'Звернення', count: tickets.value.filter(t => t.status !== 'closed').length || null },
  { key: 'contacts', label: 'Запити', count: contacts.value.filter(c => c.status !== 'done').length || null },
])

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const verify = async (agronomist: any, approve: boolean) => {
  agronomist.saving = approve ? 'approve' : 'reject'
  // Значок «Перевірений агроном» на сайті читає users.is_verified_agronomist (public_profiles) — оновлюємо обидва
  const [{ error }, { error: userErr }] = await Promise.all([
    supabase.from('agronomist_profiles').update({ is_verified: approve }).eq('id', agronomist.id),
    supabase.from('users').update({ is_verified_agronomist: approve }).eq('id', agronomist.user_id),
  ])
  if (error || userErr) {
    useToast().error('Помилка: ' + (error || userErr)!.message)
    agronomist.saving = false
    return
  }
  agronomist.is_verified = approve
  agronomist.saving = false
}

onMounted(async () => {
  const { data } = await supabase
    .from('agronomist_profiles')
    .select('*, user:user_id(id, name, email, created_at)')
    .order('created_at', { ascending: false })

  agronomists.value = (data || []).map(a => ({ ...a, saving: false }))

  const { data: contactData } = await supabase
    .from('contact_requests')
    .select('*')
    .order('created_at', { ascending: false })
  contacts.value = contactData || []

  // Звернення: автора підтягуємо окремо (зв'язку з users у схемі немає)
  const { data: ticketData } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(300)
  const authorIds = [...new Set((ticketData || []).map((t: any) => t.user_id).filter(Boolean))]
  const { data: authors } = authorIds.length
    ? await supabase.from('users').select('id, name, email').in('id', authorIds)
    : { data: [] as any[] }
  tickets.value = (ticketData || []).map((t: any) => ({ ...t, user: authors?.find((u: any) => u.id === t.user_id), saving: false }))

  const { data: buyerData } = await supabase
    .from('users')
    .select('id, name, email, company_name, edrpou, phone, region, is_verified, verification_requested, created_at')
    .eq('role', 'buyer')
    .order('created_at', { ascending: false })
  buyers.value = (buyerData || []).map(b => ({ ...b, saving: false }))

  loading.value = false
})

const verifyBuyer = async (buyer: any, approve: boolean) => {
  buyer.saving = approve ? 'approve' : 'reject'
  const { error } = await supabase.from('users').update({
    is_verified: approve,
    is_verified_buyer: approve,
    verification_requested: approve ? true : false,
  }).eq('id', buyer.id)
  if (error) { useToast().error('Помилка: ' + error.message); buyer.saving = false; return }
  buyer.is_verified = approve
  buyer.verification_requested = approve
  buyer.saving = false
}
</script>
