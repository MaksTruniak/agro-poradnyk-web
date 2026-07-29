<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark">👨‍🌾 Агрономи</h1>
      <p class="text-agro-light mt-1">Знайдіть фахового агронома для консультації</p>
    </div>

    <!-- Пошук + регіон -->
    <div class="flex flex-col sm:flex-row gap-3 mb-8">
      <div class="relative flex-1 max-w-xl">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-agro-light">🔍</span>
        <input v-model="search" class="input pl-11" placeholder="Пошук за ім'ям або спеціалізацією..." />
      </div>
      <div class="relative" v-if="regions.length" @click.stop>
        <button @click="regionOpen = !regionOpen"
          class="flex items-center gap-2 w-48 shrink-0 border border-agro-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-agro text-left"
          :class="regionFilter ? 'text-agro-dark' : 'text-agro-light'">
          <span class="flex-1 truncate">{{ regionFilter || 'Всі регіони' }}</span>
          <svg class="w-4 h-4 shrink-0 transition-transform" :class="regionOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div v-if="regionOpen" class="absolute right-0 top-full mt-1 z-20 bg-white border border-agro-border rounded-2xl shadow-xl py-1 w-56 max-h-64 overflow-y-auto">
          <button @click="regionFilter = ''; regionOpen = false"
            class="w-full text-left px-4 py-2 text-sm hover:bg-agro-bg transition-colors"
            :class="!regionFilter ? 'text-agro font-semibold' : 'text-agro-dark'">
            Всі регіони
          </button>
          <button v-for="r in regions" :key="r" @click="regionFilter = r; regionOpen = false"
            class="w-full text-left px-4 py-2 text-sm hover:bg-agro-bg transition-colors"
            :class="regionFilter === r ? 'text-agro font-semibold' : 'text-agro-dark'">
            {{ r }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="i in 6" :key="i" class="card animate-pulse h-40"></div>
    </div>

    <div v-else-if="filtered.length === 0" class="text-center py-20">
      <p class="text-5xl mb-4">🔍</p>
      <p class="font-bold text-agro-dark text-lg">Нічого не знайдено</p>
    </div>

    <div v-else class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="agro in filtered" :key="agro.id" class="card hover:shadow-md transition-all">
        <!-- Шапка -->
        <div class="flex items-start gap-4 mb-4">
          <div class="w-14 h-14 rounded-2xl bg-agro-hover flex items-center justify-center font-bold text-agro text-xl shrink-0">
            {{ agro.name?.[0]?.toUpperCase() || '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-bold text-agro-dark">{{ agro.name }}</h3>
              <span v-if="agro.promotion_plan === 'top'" class="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">⭐ Топ</span>
              <span v-if="agro.is_verified_agronomist" class="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full font-semibold">✅ Перевірений</span>
            </div>
            <p v-if="agro.specialization" class="text-sm text-agro-light mt-0.5">{{ agro.specialization }}</p>
          </div>
          <!-- Рейтинг -->
          <div v-if="agro.rating" class="text-right shrink-0">
            <p class="font-bold text-agro">{{ agro.rating.toFixed(1) }}</p>
            <p class="text-xs text-agro-light">⭐ рейтинг</p>
          </div>
        </div>

        <!-- Культури -->
        <div v-if="agro.crops?.length" class="flex flex-wrap gap-1.5 mb-4">
          <span v-for="c in agro.crops.slice(0,5)" :key="c" class="text-xs bg-agro-bg text-agro-dark px-2 py-0.5 rounded-full border border-agro-border">
            {{ c }}
          </span>
          <span v-if="agro.crops.length > 5" class="text-xs text-agro-light">+{{ agro.crops.length - 5 }}</span>
        </div>

        <!-- Статистика -->
        <div class="flex gap-4 text-xs text-agro-light mb-5">
          <span v-if="agro.region">📍 {{ agro.region }}</span>
        </div>

        <!-- Кнопки -->
        <div class="flex gap-2">
          <NuxtLink :to="`/agronomist/${agro.user_id}`" class="btn-outline flex-1 text-sm py-2.5 text-center">
            Детально
          </NuxtLink>
          <button @click="startChat(agro)" :disabled="starting === agro.id" class="btn-primary flex-1 text-sm py-2.5">
            {{ starting === agro.id ? '...' : '💬 Написати' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({ title: 'Агрономи' })

const supabase = useSupabaseClient()
const router = useRouter()

const loading = ref(true)
const agronomists = ref<any[]>([])
const search = ref('')
const regionFilter = ref('')
const regionOpen = ref(false)
const closeRegion = () => { regionOpen.value = false }
onMounted(() => document.addEventListener('click', closeRegion))
onUnmounted(() => document.removeEventListener('click', closeRegion))
const starting = ref('')

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

// Завантажуємо агрономів
const { data: profiles } = await supabase
  .from('agronomist_profiles')
  .select('*, users!inner(id, name, role, is_verified_agronomist)')
  .eq('users.role', 'agronomist')
  .order('promotion_plan', { ascending: false })

agronomists.value = (profiles || []).map((p: any) => ({
  id: p.id,
  user_id: p.users?.id,
  name: p.users?.name || 'Агроном',
  specialization: p.specialization,
  crops: p.crops || [],
  region: p.region,
  rating: p.rating,
  promotion_plan: p.promotion_plan,
  clients_count: p.clients_count || 0,
  is_verified_agronomist: p.users?.is_verified_agronomist || false,
}))

loading.value = false

const regions = computed(() => [...new Set(agronomists.value.map((a: any) => a.region).filter(Boolean))].sort())

const filtered = computed(() => agronomists.value.filter(a => {
  const q = search.value.toLowerCase()
  const matchSearch = !q || a.name?.toLowerCase().includes(q) || a.specialization?.toLowerCase().includes(q) || a.crops?.some((c: string) => c.toLowerCase().includes(q))
  const matchRegion = !regionFilter.value || a.region === regionFilter.value
  return matchSearch && matchRegion
}))

const startChat = async (agro: any) => {
  if (!uid) { navigateTo('/auth'); return }
  starting.value = agro.id

  // Перевіряємо чи є вже чат
  const { data: existing } = await supabase
    .from('chats')
    .select('id')
    .eq('farmer_id', uid)
    .eq('agronomist_id', agro.user_id)
    .eq('type', 'human')
    .single()

  if (existing) {
    router.push(`/dashboard/chats/${existing.id}`)
    return
  }

  // Створюємо новий чат
  const { data: newChat } = await supabase
    .from('chats')
    .insert({ farmer_id: uid, agronomist_id: agro.user_id, type: 'human', is_unlocked: false })
    .select().single()

  starting.value = ''
  if (newChat) router.push(`/dashboard/chats/${newChat.id}`)
}
</script>
