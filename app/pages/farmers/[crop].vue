<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <div class="flex items-center gap-2 text-sm text-agro-light mb-3">
        <NuxtLink to="/farmers" class="hover:text-agro transition-colors">Фермери</NuxtLink>
        <span>/</span>
        <span class="text-agro-dark">{{ cropName }}</span>
      </div>
      <h1 class="text-3xl font-extrabold text-agro-dark">{{ cropEmoji }} Фермери — {{ cropName }}</h1>
      <p class="text-agro-light mt-1">{{ filtered.length }} фермерів вирощують цю культуру</p>
    </div>

    <!-- Пошук + фільтр -->
    <div class="flex flex-col sm:flex-row gap-3 mb-8">
      <div class="relative flex-1 max-w-xl">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-agro-light">🔍</span>
        <input v-model="search" class="input pl-11" placeholder="Пошук за ім'ям або регіоном..." />
      </div>
      <select v-model="regionFilter" class="input max-w-xs">
        <option value="">Всі регіони</option>
        <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
      </select>
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
            <h3 class="font-bold text-agro-dark">{{ farmer.name }}</h3>
            <p v-if="farmer.city || farmer.region" class="text-sm text-agro-light mt-0.5">
              📍 {{ [farmer.city, farmer.region].filter(Boolean).join(', ') }}
            </p>
          </div>
        </div>
        <div class="mb-4">
          <p class="text-xs text-agro-light uppercase tracking-wide mb-2">Вирощує</p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="c in farmer.crops" :key="c"
              class="text-xs px-2 py-0.5 rounded-full border"
              :class="c === cropName ? 'bg-agro text-white border-agro' : 'bg-agro-bg text-agro-dark border-agro-border'">
              {{ c }}
            </span>
          </div>
        </div>
        <button @click="startChat(farmer)" :disabled="starting === farmer.id" class="btn-primary w-full text-sm py-2.5">
          {{ starting === farmer.id ? '...' : '💬 Написати' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

const { slugToCrop, cropEmoji: getCropEmoji } = await import('~/utils/cropSlugs')

const cropSlug = route.params.crop as string
const cropName = slugToCrop(cropSlug)
const cropEmoji = getCropEmoji(cropName)

useHead({ title: `Фермери — ${cropName} | АгроПорадник` })

const search = ref('')
const regionFilter = ref('')
const loading = ref(true)
const starting = ref('')
const farmers = ref<any[]>([])

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

onMounted(async () => {
  const { data: usersData } = await supabase
    .from('users').select('id, name, region, city').eq('role', 'farmer').order('name')
  if (!usersData?.length) { loading.value = false; return }

  const ids = usersData.map((u: any) => u.id)
  const { data: farmsData } = await supabase
    .from('farms').select('user_id, farm_crops(crop_type)').in('user_id', ids)

  const result: any[] = []
  for (const u of usersData) {
    const userFarms = (farmsData || []).filter((f: any) => f.user_id === u.id)
    const crops = [...new Set(userFarms.flatMap((f: any) => (f.farm_crops || []).map((c: any) => c.crop_type)))]
    if (!crops.includes(cropName)) continue
    result.push({ ...u, crops })
  }
  farmers.value = result
  loading.value = false
})
</script>
