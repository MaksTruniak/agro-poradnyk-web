<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Адмін-панель</h1>
      <p class="text-agro-light mt-1">Верифікація агрономів</p>
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

    <!-- Запити Enterprise -->
    <div v-else-if="activeTab === 'contacts'">
      <div v-if="!contacts.length" class="card text-center py-16">
        <p class="font-bold text-agro-dark">Немає запитів</p>
        <p class="text-agro-light text-sm mt-1">Форма Enterprise ще не заповнювалась</p>
      </div>
      <div v-else class="space-y-3">
        <div v-for="c in contacts" :key="c.id" class="card flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center font-bold text-agro shrink-0">
              {{ c.name?.[0]?.toUpperCase() || '?' }}
            </div>
            <div>
              <p class="font-semibold text-agro-dark">{{ c.name }}</p>
              <p class="text-sm text-agro-light">{{ c.email }} · {{ c.phone }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <span class="text-xs text-agro-light">{{ formatDate(c.created_at) }}</span>
            <span class="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold capitalize">{{ c.type || 'enterprise' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- placeholder -->
    <div v-else>
      <div class="flex items-center justify-between mb-4">
        <div class="relative flex-1 max-w-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input v-model="brandSearch" class="input pl-9 text-sm" placeholder="Пошук бренду..." />
        </div>
        <button @click="openBrandModal(null)" class="btn-primary text-sm py-2 px-4 inline-flex items-center gap-1.5 ml-3 shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Додати бренд
        </button>
      </div>

      <div v-if="brandsLoading" class="space-y-2">
        <div v-for="i in 6" :key="i" class="card animate-pulse h-16 p-0"></div>
      </div>

      <div v-else class="card overflow-hidden p-0">
        <div class="divide-y divide-agro-border">
          <div v-for="b in filteredBrands" :key="b.id" class="flex items-center gap-4 px-5 py-3.5 hover:bg-agro-bg transition-colors">
            <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center shrink-0 overflow-hidden">
              <img v-if="b.logo_url" :src="b.logo_url" :alt="b.name" class="w-full h-full object-contain p-1" />
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-agro-dark truncate">{{ b.name }}</p>
              <p class="text-xs text-agro-light truncate">{{ [b.country, b.slug].filter(Boolean).join(' · ') }}</p>
            </div>
            <a v-if="b.website_url" :href="b.website_url" target="_blank" class="text-xs text-agro-light hover:text-agro transition-colors shrink-0 hidden sm:block truncate max-w-[160px]">{{ b.website_url }}</a>
            <button @click="openBrandModal(b)" class="shrink-0 text-xs text-agro border border-agro-border hover:bg-agro-hover rounded-xl px-3 py-1.5 transition-colors inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Редагувати
            </button>
          </div>
        </div>
        <div v-if="!filteredBrands.length" class="text-center py-12 text-agro-light text-sm">Нічого не знайдено</div>
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
const pendingBuyers = computed(() => buyers.value.filter(b => b.verification_requested && !b.is_verified))

const tabs = computed(() => [
  { key: 'pending', label: 'Очікують', count: pending.value.length || null },
  { key: 'verified', label: 'Верифіковані', count: null },
  { key: 'buyers', label: 'Заготівельники', count: pendingBuyers.value.length || null },
  { key: 'contacts', label: 'Запити', count: contacts.value.length || null },
])

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const verify = async (agronomist: any, approve: boolean) => {
  agronomist.saving = approve ? 'approve' : 'reject'
  const { error } = await supabase.from('agronomist_profiles')
    .update({ is_verified: approve })
    .eq('id', agronomist.id)
  if (error) {
    alert('Помилка: ' + error.message)
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
  await supabase.from('users').update({
    is_verified: approve,
    verification_requested: approve ? true : false,
  }).eq('id', buyer.id)
  buyer.is_verified = approve
  buyer.saving = false
}
</script>
