<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark flex items-center gap-2"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg> Заготівельники</h1>
      <p class="text-agro-light mt-1">Компанії та підприємці що закуповують сільськогосподарську продукцію</p>
    </div>

    <!-- Фільтри -->
    <div class="grid grid-cols-2 gap-3 mb-8 sm:flex sm:flex-row">
      <!-- Фільтр по культурі -->
      <div class="relative flex-1" ref="cropWrapperRef">
        <button @click="cropOpen = !cropOpen"
          class="flex items-center gap-2 w-full border border-agro-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-agro text-left"
          :class="cropFilter ? 'text-agro-dark' : 'text-agro-light'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M5 3a7 7 0 0 0 7 7 7 7 0 0 0-7-7"/><path d="M19 3a7 7 0 0 1-7 7 7 7 0 0 1 7-7"/></svg>
          <span class="flex-1 truncate">{{ cropFilter || 'Всі культури' }}</span>
          <svg class="w-4 h-4 shrink-0 transition-transform" :class="cropOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div v-if="cropOpen" class="absolute left-0 top-full mt-1 z-20 bg-white border border-agro-border rounded-2xl shadow-xl py-1 w-56 max-h-64 overflow-y-auto">
          <button @click="cropFilter = ''; cropOpen = false"
            class="w-full text-left px-4 py-2 text-sm hover:bg-agro-bg transition-colors"
            :class="!cropFilter ? 'text-agro font-semibold' : 'text-agro-dark'">Всі культури</button>
          <button v-for="c in allCropsFromDb" :key="c" @click="cropFilter = c; cropOpen = false"
            class="w-full text-left px-4 py-2 text-sm hover:bg-agro-bg transition-colors"
            :class="cropFilter === c ? 'text-agro font-semibold' : 'text-agro-dark'">{{ c }}</button>
        </div>
      </div>
      <!-- Фільтр по регіону -->
      <div class="relative flex-1" ref="regionWrapperRef">
        <button @click="regionOpen = !regionOpen"
          class="flex items-center gap-2 w-full border border-agro-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-agro text-left"
          :class="regionFilter ? 'text-agro-dark' : 'text-agro-light'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-7.4 7-12.5A7 7 0 005 9.5C5 14.6 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.3" stroke-width="1.5"/></svg>
          <span class="flex-1 truncate">{{ regionFilter || 'Всі регіони' }}</span>
          <svg class="w-4 h-4 shrink-0 transition-transform" :class="regionOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div v-if="regionOpen" class="absolute left-0 top-full mt-1 z-20 bg-white border border-agro-border rounded-2xl shadow-xl py-1 w-56 max-h-64 overflow-y-auto">
          <button @click="regionFilter = ''; regionOpen = false"
            class="w-full text-left px-4 py-2 text-sm hover:bg-agro-bg transition-colors"
            :class="!regionFilter ? 'text-agro font-semibold' : 'text-agro-dark'">Всі регіони</button>
          <button v-for="r in UA_REGIONS" :key="r" @click="regionFilter = r; regionOpen = false"
            class="w-full text-left px-4 py-2 text-sm hover:bg-agro-bg transition-colors"
            :class="regionFilter === r ? 'text-agro font-semibold' : 'text-agro-dark'">{{ r }}</button>
        </div>
      </div>
      <!-- Скинути -->
      <button v-if="cropFilter || regionFilter" @click="cropFilter = ''; regionFilter = ''" class="text-sm text-agro-light hover:text-agro-dark transition-colors flex items-center gap-1 col-span-2 sm:col-span-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        Скинути
      </button>
    </div>

    <div v-if="loading" class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="i in 6" :key="i" class="card animate-pulse h-36"></div>
    </div>

    <div v-else-if="filtered.length === 0" class="text-center py-20">
      <div class="w-16 h-16 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-4"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg></div>
      <template v-if="cropFilter || regionFilter">
        <p class="font-bold text-agro-dark text-lg">Нічого не знайдено</p>
        <p class="text-agro-light mt-1">Спробуйте змінити фільтри</p>
      </template>
      <template v-else>
        <p class="font-bold text-agro-dark text-lg mb-2">Поки що немає заготівельників</p>
        <p class="text-agro-light mb-6">Зареєструйтесь і розміщуйте закупівлі — фермери знайдуть вас самі</p>
        <NuxtLink to="/auth" class="inline-block bg-[rgb(47,82,51)] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">Зареєструватись</NuxtLink>
      </template>
    </div>

    <div v-else class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="buyer in filtered" :key="buyer.id" class="card hover:shadow-md transition-all flex flex-col text-left">
        <!-- Role badge -->
        <div class="flex items-center justify-between mb-3">
          <span class="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg>
            Заготівельник
          </span>
          <div class="flex items-center gap-1.5">
            <span v-if="buyer.buyer_rating > 0" class="inline-flex items-center gap-1 text-xs font-semibold text-amber-600"><svg width="11" height="11" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> {{ buyer.buyer_rating }}</span>
            <span v-if="buyer.is_verified_buyer" class="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full font-semibold"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Перевірений</span>
          </div>
        </div>

        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-2xl bg-agro-hover flex items-center justify-center font-bold text-agro text-xl shrink-0">
            {{ buyer.name?.[0]?.toUpperCase() || '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <NuxtLink :to="`/buyers/${buyer.id}`" class="font-bold text-agro-dark hover:text-agro transition-colors block truncate">{{ buyer.name }}</NuxtLink>
            <p class="text-sm text-agro-light truncate">
              <template v-if="buyer.city || buyer.region"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgb(179,69,47)" stroke-width="1.7" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:2px"><path d="M12 22s7-7.4 7-12.5A7 7 0 005 9.5C5 14.6 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.3" stroke-width="1.5"/></svg>{{ [buyer.city, buyer.region].filter(Boolean).join(', ') }}</template><template v-else>&nbsp;</template>
            </p>
          </div>
        </div>

        <div class="flex-1 mb-4">
          <p class="text-xs text-agro-light uppercase tracking-wide mb-2">Закуповує</p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="c in buyer.crops" :key="c.id"
              class="text-xs px-2 py-0.5 rounded-full border bg-agro-bg text-agro-dark border-agro-border">
              {{ c.crop_type }}<span v-if="c.min_qty || c.max_qty" class="text-agro-light"> · {{ c.min_qty || '—' }}–{{ c.max_qty || '—' }} {{ c.unit }}</span>
            </span>
          </div>
        </div>

        <div class="flex gap-2 mt-auto">
          <NuxtLink :to="`/buyers/${buyer.id}`" class="btn-outline flex-1 text-sm py-2.5 text-center inline-flex items-center justify-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>
            Детально
          </NuxtLink>
          <button @click="startChat(buyer)" :disabled="starting === buyer.id" class="btn-primary flex-1 text-sm py-2.5 inline-flex items-center justify-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            {{ starting === buyer.id ? '...' : 'Написати' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Заготівельники — АгроПростір' })

const supabase = useSupabaseClient()
const router = useRouter()

const UA_REGIONS = [
  'Вінницька область','Волинська область','Дніпропетровська область','Донецька область',
  'Житомирська область','Закарпатська область','Запорізька область','Івано-Франківська область',
  'Київська область','Кіровоградська область','Луганська область','Львівська область',
  'Миколаївська область','Одеська область','Полтавська область','Рівненська область',
  'Сумська область','Тернопільська область','Харківська область','Херсонська область',
  'Хмельницька область','Черкаська область','Чернівецька область','Чернігівська область','м. Київ',
]

const cropFilter = ref('')
const cropOpen = ref(false)
const regionFilter = ref('')
const regionOpen = ref(false)
const allCropsFromDb = ref<string[]>([])
const cropWrapperRef = ref<HTMLElement | null>(null)
const regionWrapperRef = ref<HTMLElement | null>(null)
onClickOutside(cropWrapperRef, () => { cropOpen.value = false })
onClickOutside(regionWrapperRef, () => { regionOpen.value = false })
const buyers = ref<any[]>([])
const loading = ref(true)
const starting = ref('')

const startChat = async (buyer: any) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { navigateTo('/auth'); return }
  const uid = session.user.id
  if (uid === buyer.id) return
  starting.value = buyer.id
  const { data: existing } = await supabase.from('chats').select('id')
    .eq('farmer_id', uid).eq('agronomist_id', buyer.id).eq('type', 'human').single()
  if (existing) { router.push(`/dashboard/chats/${existing.id}`); return }
  const { data: existing2 } = await supabase.from('chats').select('id')
    .eq('farmer_id', buyer.id).eq('agronomist_id', uid).eq('type', 'human').single()
  if (existing2) { router.push(`/dashboard/chats/${existing2.id}`); return }
  const { data: newChat } = await supabase.from('chats')
    .insert({ farmer_id: uid, agronomist_id: buyer.id, type: 'human', is_unlocked: true })
    .select().single()
  starting.value = ''
  if (newChat) router.push(`/dashboard/chats/${newChat.id}`)
}

const { data } = await supabase
  .from('users')
  .select('id, name, region, city, buyer_rating, buyer_reviews_count, is_verified_buyer, buyer_crops(id, crop_type, min_qty, max_qty, unit)')
  .eq('role', 'buyer')
  .order('name')

buyers.value = (data || [])
  .map((b: any) => ({ ...b, crops: b.buyer_crops || [] }))
  .filter((b: any) => b.crops.length > 0)

// Культури з crop_catalog
const { data: cropCatalog } = await supabase.from('crop_catalog').select('name').order('name')
allCropsFromDb.value = (cropCatalog || []).map((c: any) => c.name)

loading.value = false

const filtered = computed(() => buyers.value.filter(b => {
  const matchRegion = !regionFilter.value || b.region === regionFilter.value
  const matchCrop = !cropFilter.value || b.crops.some((c: any) => c.crop_type === cropFilter.value)
  return matchRegion && matchCrop
}))
</script>
