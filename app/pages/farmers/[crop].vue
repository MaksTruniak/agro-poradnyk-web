<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <div class="flex items-center gap-2 text-sm text-agro-light mb-3">
        <NuxtLink to="/farmers" class="hover:text-agro transition-colors">Фермери</NuxtLink>
        <span>/</span>
        <span class="text-agro-dark">{{ cropName }}</span>
      </div>
      <h1 class="text-3xl font-extrabold text-agro-dark">{{ cropEmoji }} Фермери — {{ cropName }}</h1>
      <p class="text-agro-light mt-1">{{ filtered.length }} {{ pluralFarmer(filtered.length) }} вирощують цю культуру</p>
    </div>

    <!-- Пошук + фільтр -->
    <div class="flex flex-col sm:flex-row gap-3 mb-8">
      <div class="relative flex-1 max-w-xl">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-agro-light">🔍</span>
        <input v-model="search" class="input pl-11" placeholder="Пошук за ім'ям або регіоном..." />
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
      <div v-for="i in 6" :key="i" class="card animate-pulse h-32"></div>
    </div>

    <div v-else-if="filtered.length === 0" class="text-center py-20">
      <p class="text-5xl mb-4">🌾</p>
      <p class="font-bold text-agro-dark text-lg">Нічого не знайдено</p>
      <p class="text-agro-light mt-2">Спробуйте інший пошук або регіон</p>
    </div>

    <div v-else class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="farmer in filtered" :key="farmer.id" class="card hover:shadow-md transition-all">
        <div class="flex items-start gap-4 mb-4">
          <div class="w-12 h-12 rounded-2xl bg-agro-hover flex items-center justify-center font-bold text-agro text-xl shrink-0">
            {{ farmer.name?.[0]?.toUpperCase() || '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <NuxtLink :to="`/farmer/${farmer.id}`" class="font-bold text-agro-dark hover:text-agro transition-colors">{{ farmer.name }}</NuxtLink>
            <p v-if="farmer.city || farmer.region" class="text-sm text-agro-light mt-0.5">
              📍 {{ [farmer.city, farmer.region].filter(Boolean).join(', ') }}
            </p>
          </div>
        </div>
        <div class="mb-4">
          <p class="text-xs text-agro-light uppercase tracking-wide mb-2">Вирощує</p>
          <div class="flex flex-wrap gap-1.5">
            <NuxtLink v-for="c in farmer.crops" :key="c"
              :to="`/farmers/${cropToSlug(c)}`"
              class="text-xs px-2 py-0.5 rounded-full border transition-colors"
              :class="matchesCrop(c) ? 'bg-agro text-white border-agro' : 'bg-agro-bg text-agro-dark border-agro-border hover:border-agro'">
              {{ c }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

const { slugToCrop, cropToSlug, cropEmoji: getCropEmoji } = await import('~/utils/cropSlugs')

const cropSlug = route.params.crop as string
const cropName = slugToCrop(cropSlug)
const cropEmoji = getCropEmoji(cropName)

// Перевірка за слагом — враховує всі аліаси ("Смородина чорна" і "Чорна смородина" → "black-currant")
const matchesCrop = (crop: string) => cropToSlug(crop) === cropSlug
const { pluralFarmer } = await import('~/utils/plural')

useHead({ title: `Фермери — ${cropName} | АгроПорадник` })

const search = ref('')
const regionFilter = ref('')
const regionOpen = ref(false)
const closeRegion = () => { regionOpen.value = false }
onMounted(() => document.addEventListener('click', closeRegion))
onUnmounted(() => document.removeEventListener('click', closeRegion))
const starting = ref('')

const regions = computed(() => [...new Set(farmers.value.map((f: any) => f.region).filter(Boolean))].sort())

const filtered = computed(() => farmers.value.filter(f => {
  const q = search.value.toLowerCase()
  const matchSearch = !q || f.name?.toLowerCase().includes(q) || f.region?.toLowerCase().includes(q)
  const matchRegion = !regionFilter.value || f.region === regionFilter.value
  return matchSearch && matchRegion
}))

const startChat = async (farmer: any) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { navigateTo('/auth'); return }
  const uid = session.user.id
  if (uid === farmer.id) return
  starting.value = farmer.id

  const { data: existing } = await supabase.from('chats').select('id')
    .eq('farmer_id', farmer.id).eq('agronomist_id', uid).eq('type', 'human').single()
  if (existing) { router.push(`/dashboard/chats/${existing.id}`); return }

  const { data: existing2 } = await supabase.from('chats').select('id')
    .eq('farmer_id', uid).eq('agronomist_id', farmer.id).eq('type', 'human').single()
  if (existing2) { router.push(`/dashboard/chats/${existing2.id}`); return }

  const { data: newChat } = await supabase.from('chats')
    .insert({ farmer_id: uid, agronomist_id: farmer.id, type: 'human', is_unlocked: true })
    .select().single()
  starting.value = ''
  if (newChat) router.push(`/dashboard/chats/${newChat.id}`)
}

const { data: farmersData, pending } = useLazyAsyncData(`farmers-crop-${cropSlug}`, async () => {
  const { data } = await supabase.rpc('get_farmers_with_crops')
  return (data || []).filter((f: any) => f.crops?.some(matchesCrop))
})

const farmers = ref<any[]>([])
const loading = computed(() => pending.value && !farmers.value.length)

watch(farmersData, (val) => {
  if (val && !farmers.value.length) farmers.value = val
}, { immediate: true })
</script>
