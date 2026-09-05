<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <div class="flex items-center gap-2 text-sm text-agro-light mb-8">
      <NuxtLink to="/agronomists" class="hover:text-agro transition-colors">Агрономи</NuxtLink>
      <span>/</span>
      <span class="text-agro-dark">{{ user?.name || '...' }}</span>
    </div>

    <div v-if="loading" class="space-y-5 animate-pulse">
      <div class="card h-44"></div>
      <div class="card h-32"></div>
      <div class="card h-24"></div>
    </div>

    <div v-else-if="!user" class="text-center py-20">
      <div class="w-16 h-16 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 8 10 6 7c3 0 5 1 6 5z"/><path d="M12 12c0 0 4-2 6-5-3 0-5 1-6 5z"/></svg>
      </div>
      <p class="font-bold text-agro-dark text-lg">Агронома не знайдено</p>
      <NuxtLink to="/agronomists" class="text-agro text-sm mt-2 inline-block hover:underline">← До списку агрономів</NuxtLink>
    </div>

    <div v-else class="space-y-5">
      <!-- Шапка -->
      <div class="card">
        <div class="flex items-start gap-5">
          <div class="w-20 h-20 rounded-2xl bg-agro-hover flex items-center justify-center font-bold text-agro text-3xl shrink-0 overflow-hidden">
            <img v-if="user.avatar_url" :src="user.avatar_url" :alt="user.name" class="w-full h-full object-cover" />
            <span v-else>{{ user.name?.[0]?.toUpperCase() || '?' }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-2xl font-extrabold text-agro-dark">{{ user.name }}</h1>
              <span v-if="user.is_verified_agronomist" class="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full font-semibold"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Перевірений агроном</span>
            </div>
            <p v-if="profile?.specialization" class="text-agro-light mt-1">{{ profile.specialization }}</p>
            <p v-if="profile?.region || user.city" class="text-sm text-agro-light mt-0.5 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgb(179,69,47)" stroke-width="1.7" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:2px"><path d="M12 22s7-7.4 7-12.5A7 7 0 005 9.5C5 14.6 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.3" stroke-width="1.5"/></svg> {{ [user.city, profile?.region || user.region].filter(Boolean).join(', ') }}
            </p>
            <div v-if="profile?.rating > 0" class="flex items-center gap-1 mt-1.5">
              <span class="text-yellow-500 text-sm">★</span>
              <span class="font-semibold text-agro-dark text-sm">{{ profile.rating.toFixed(1) }}</span>
              <span class="text-agro-light text-xs">({{ profile.reviews_count }} {{ pluralReview(profile.reviews_count) }})</span>
            </div>
          </div>
          <div v-if="uid !== agronomistId" class="flex flex-col gap-2 shrink-0 items-stretch min-w-[180px]">
            <button v-if="isFarmer && !existingAgreement" @click="showAgreementModal = true"
              class="btn-primary text-sm py-2.5 px-5 inline-flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z"/></svg>
              Запропонувати співпрацю
            </button>
            <div v-else-if="existingAgreement" class="text-sm text-center rounded-xl font-semibold px-4 py-2.5"
              :style="existingAgreement.status === 'active' ? 'background:rgb(234,240,222);color:rgb(47,82,51)' : 'background:rgb(248,250,244);color:rgb(122,138,114)'">
              {{ agreementStatusLabel }}
            </div>
            <button v-if="existingAgreement?.status === 'active'" @click="startChat" :disabled="starting"
              class="btn-outline text-sm py-2.5 px-5 inline-flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              {{ starting ? '...' : 'Написати' }}
            </button>
            <button v-else-if="!isFarmer" @click="startChat" :disabled="starting"
              class="btn-outline text-sm py-2.5 px-5 inline-flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              {{ starting ? '...' : 'Написати' }}
            </button>
          </div>
        </div>

        <!-- Статистика -->
        <div class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-agro-border text-center">
          <div>
            <p class="text-2xl font-extrabold text-agro-dark">{{ profile?.experience_years || '—' }}</p>
            <p class="text-xs text-agro-light mt-0.5">років досвіду</p>
          </div>
          <div>
            <p class="text-2xl font-extrabold text-agro-dark">{{ profile?.rate_per_hour ? `${profile.rate_per_hour}₴` : '—' }}</p>
            <p class="text-xs text-agro-light mt-0.5">за годину</p>
          </div>
          <div>
            <p class="text-2xl font-extrabold text-agro-dark">{{ profile?.crops_expertise?.length || '—' }}</p>
            <p class="text-xs text-agro-light mt-0.5">культур</p>
          </div>
        </div>
      </div>

      <!-- Про себе -->
      <div v-if="profile?.bio" class="card">
        <h2 class="font-bold text-agro-dark text-lg mb-3">Про себе</h2>
        <p class="text-agro-dark leading-relaxed text-sm">{{ profile.bio }}</p>
      </div>

      <!-- Спеціалізація -->
      <div v-if="profile?.crops_expertise?.length" class="card">
        <h2 class="font-bold text-agro-dark text-lg mb-4 flex items-center gap-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/><path d="M12 14c0 0-3-1-4-4M12 14c0 0 3-1 4-4"/></svg> Культури</h2>
        <div class="flex flex-wrap gap-2">
          <span v-for="c in profile.crops_expertise" :key="c"
            class="inline-flex items-center gap-1.5 text-sm bg-agro-bg border border-agro-border text-agro-dark px-3 py-1.5 rounded-xl">
            <img :src="`/crops/${cropToSlug(c)}.svg`" :alt="c" class="w-4 h-4 object-contain" @error="($event.target as HTMLImageElement).style.display='none'" />
            {{ c }}
          </span>
        </div>
      </div>

      <!-- Освіта -->
      <div v-if="profile?.institution" class="card">
        <h2 class="font-bold text-agro-dark text-lg mb-3 flex items-center gap-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> Освіта</h2>
        <p class="font-semibold text-agro-dark text-sm">{{ profile.institution }}</p>
        <p v-if="profile.education" class="text-agro-light text-sm mt-0.5">
          {{ profile.education }}<span v-if="profile.education_year"> · {{ profile.education_year }}</span>
        </p>
      </div>

      <!-- Відгуки -->
      <div v-if="reviews.length" class="card">
        <h2 class="font-bold text-agro-dark text-lg mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Відгуки
          <span class="text-sm font-normal text-agro-light">({{ reviews.length }})</span>
        </h2>
        <div class="space-y-4">
          <div v-for="r in reviews" :key="r.id" class="border-b border-agro-border pb-4 last:border-0 last:pb-0">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-agro-hover flex items-center justify-center font-bold text-agro text-sm shrink-0">
                  {{ r.farmer_name?.[0]?.toUpperCase() || '?' }}
                </div>
                <div>
                  <p class="font-semibold text-agro-dark text-sm">{{ r.farmer_name }}</p>
                  <p class="text-xs text-agro-light">{{ new Date(r.created_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
                </div>
              </div>
              <div class="flex gap-0.5 shrink-0">
                <svg v-for="s in 5" :key="s" width="13" height="13" viewBox="0 0 24 24" :fill="s <= r.rating ? 'rgb(180,130,40)' : 'rgb(220,220,220)'" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
            </div>
            <div class="bg-agro-bg rounded-xl px-3 py-2 mb-2">
              <p class="text-xs font-semibold text-agro-dark mb-0.5">Проблема:</p>
              <p class="text-sm text-agro-dark">{{ r.problem_solved }}</p>
            </div>
            <p v-if="r.text" class="text-sm text-agro-dark leading-relaxed">{{ r.text }}</p>
          </div>
        </div>
      </div>

      <!-- Кнопки (мобільні) -->
      <div v-if="uid !== agronomistId" class="flex gap-3 md:hidden">
        <button v-if="existingAgreement?.status === 'active' || !isFarmer" @click="startChat" :disabled="starting"
          class="btn-outline flex-1 py-3 text-sm inline-flex items-center justify-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          {{ starting ? '...' : 'Написати' }}
        </button>
        <button v-if="isFarmer && !existingAgreement" @click="showAgreementModal = true"
          class="btn-primary flex-1 py-3 text-sm inline-flex items-center justify-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z"/></svg>
          Співпраця
        </button>
        <div v-else-if="existingAgreement" class="flex-1 py-3 text-sm text-center rounded-xl font-semibold"
          :style="existingAgreement.status === 'active' ? 'background:rgb(234,240,222);color:rgb(47,82,51)' : 'background:rgb(248,250,244);color:rgb(122,138,114)'">
          {{ agreementStatusLabel }}
        </div>
      </div>
    </div>
  </div>

  <!-- Модалка угоди -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showAgreementModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAgreementModal = false"/>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
          <h2 class="font-bold text-agro-dark text-xl mb-1">Запит на співпрацю</h2>
          <p class="text-agro-light text-sm mb-5">Агроном отримає запит і зможе прийняти або відхилити</p>

          <!-- Вибір поля -->
          <div class="mb-4">
            <label class="block text-sm font-semibold text-agro-dark mb-1.5">Поле <span class="text-agro-light font-normal">(опційно)</span></label>
            <select v-model="agreementForm.farm_id" class="input">
              <option value="">— Не прив'язувати до поля —</option>
              <option v-for="f in farmerFarms" :key="f.id" :value="f.id">{{ f.name }} {{ f.hectares ? `(${f.hectares} га)` : '' }}</option>
            </select>
            <p v-if="farmerFarms.length === 0" class="text-xs text-agro-light mt-1">Спочатку додайте поле в розділі «Мої поля»</p>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-semibold text-agro-dark mb-1.5">Повідомлення агроному</label>
            <textarea v-model="agreementForm.message" rows="3" class="input resize-none"
              placeholder="Опишіть вашу ситуацію, культури, площу..."/>
          </div>
          <div class="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label class="block text-sm font-semibold text-agro-dark mb-1.5">Бюджет (грн, опційно)</label>
              <input v-model="agreementForm.price" type="number" class="input" placeholder="напр. 3000"/>
            </div>
            <div>
              <label class="block text-sm font-semibold text-agro-dark mb-1.5">Період</label>
              <select v-model="agreementForm.price_period" class="input">
                <option value="monthly">Щомісяця</option>
                <option value="seasonal">За сезон</option>
                <option value="one-time">Разово</option>
              </select>
            </div>
          </div>
          <div class="flex gap-3">
            <button @click="showAgreementModal = false" class="btn-outline flex-1">Скасувати</button>
            <button @click="sendAgreement" :disabled="sendingAgreement" class="btn-primary flex-1 flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z"/></svg>
              {{ sendingAgreement ? 'Надсилаємо...' : 'Надіслати запит' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

const { cropToSlug } = await import('~/utils/cropSlugs')
const agronomistId = route.params.id as string
const starting = ref(false)

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const pluralReview = (n: number) => {
  if (n % 10 === 1 && n % 100 !== 11) return 'відгук'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'відгуки'
  return 'відгуків'
}

const isFarmer = import.meta.client
  ? ['farmer', 'dacha'].includes(localStorage.getItem('agro_active_profile') || localStorage.getItem('agro_user_role') || '')
  : false

const existingAgreement = ref<any>(null)
const showAgreementModal = ref(false)
const sendingAgreement = ref(false)
const farmerFarms = ref<any[]>([])
const agreementForm = reactive({ message: '', price: '', price_period: 'monthly', farm_id: '' })

if (uid && isFarmer) {
  const { data: farms } = await supabase.from('farms').select('id, name, hectares').eq('user_id', uid).order('created_at')
  farmerFarms.value = farms || []
}

const AGREEMENT_STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Запит надіслано',
  active: '✓ Співпраця активна',
  cancelled: 'Скасовано',
  completed: 'Завершено',
}
const agreementStatusLabel = computed(() => AGREEMENT_STATUS_LABELS[existingAgreement.value?.status] || '')

if (uid && isFarmer) {
  const { data: ag } = await supabase.from('agreements')
    .select('id, status').eq('farmer_id', uid).eq('agronomist_id', agronomistId)
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  existingAgreement.value = ag || null
}

const sendAgreement = async () => {
  if (!uid) { navigateTo('/auth'); return }
  sendingAgreement.value = true
  const { data, error } = await supabase.from('agreements').insert({
    farmer_id: uid,
    agronomist_id: agronomistId,
    message: agreementForm.message || null,
    price: agreementForm.price ? Number(agreementForm.price) : null,
    price_period: agreementForm.price_period,
    farm_id: agreementForm.farm_id || null,
    status: 'pending',
  }).select().single()
  existingAgreement.value = data
  showAgreementModal.value = false
  sendingAgreement.value = false
}

const reviews = ref<any[]>([])

const { data: pageData, pending } = useLazyAsyncData(`agronomist-${agronomistId}`, async () => {
  const [userRes, profileRes, reviewsRes] = await Promise.all([
    supabase.from('users').select('id, name, avatar_url, region, city, created_at, is_verified_agronomist').eq('id', agronomistId).single(),
    supabase.from('agronomist_profiles').select('*').eq('user_id', agronomistId).single(),
    supabase.from('agronomist_reviews').select('id, farmer_id, rating, text, problem_solved, created_at').eq('agronomist_id', agronomistId).order('created_at', { ascending: false }),
  ])
  // Імена фермерів
  const revData = reviewsRes.data || []
  if (revData.length) {
    const fids = [...new Set(revData.map((r: any) => r.farmer_id))]
    const { data: fUsers } = await supabase.from('users').select('id, name').in('id', fids)
    const fMap = Object.fromEntries((fUsers || []).map((u: any) => [u.id, u.name]))
    reviews.value = revData.map((r: any) => ({ ...r, farmer_name: fMap[r.farmer_id] || 'Фермер' }))
  }
  return { user: userRes.data || null, profile: profileRes.data || null }
})

const user = computed(() => pageData.value?.user || null)
const profile = computed(() => pageData.value?.profile || null)
const loading = computed(() => pending.value)

const startChat = async () => {
  if (!uid) { navigateTo('/auth'); return }
  starting.value = true
  const { data: existing } = await supabase.from('chats').select('id')
    .eq('farmer_id', uid).eq('agronomist_id', agronomistId).eq('type', 'human').single()
  if (existing) { router.push(`/dashboard/chats/${existing.id}`); return }
  const { data: existing2 } = await supabase.from('chats').select('id')
    .eq('farmer_id', agronomistId).eq('agronomist_id', uid).eq('type', 'human').single()
  if (existing2) { router.push(`/dashboard/chats/${existing2.id}`); return }
  const { data: newChat } = await supabase.from('chats')
    .insert({ farmer_id: uid, agronomist_id: agronomistId, type: 'human', is_unlocked: true })
    .select().single()
  starting.value = false
  if (newChat) router.push(`/dashboard/chats/${newChat.id}`)
}

useHead({ title: computed(() => user.value ? `${user.value.name} — агроном | АгроПростір` : 'Агроном | АгроПростір') })
</script>
