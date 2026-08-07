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
          <button v-if="uid !== agronomistId" @click="startChat" :disabled="starting"
            class="btn-primary shrink-0 text-sm py-2.5 px-5 inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            {{ starting ? '...' : 'Написати' }}
          </button>
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

      <!-- Кнопка написати (внизу для мобільних) -->
      <button v-if="uid !== agronomistId" @click="startChat" :disabled="starting"
        class="btn-primary w-full py-3 text-sm md:hidden inline-flex items-center justify-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        {{ starting ? '...' : 'Написати агроному' }}
      </button>
    </div>
  </div>
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

const { data: pageData, pending } = useLazyAsyncData(`agronomist-${agronomistId}`, async () => {
  const [userRes, profileRes] = await Promise.all([
    supabase.from('users').select('id, name, avatar_url, region, city, created_at, is_verified_agronomist').eq('id', agronomistId).single(),
    supabase.from('agronomist_profiles').select('*').eq('user_id', agronomistId).single(),
  ])
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
