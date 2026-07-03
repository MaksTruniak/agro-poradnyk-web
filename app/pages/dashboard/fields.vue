<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-extrabold text-agro-dark">
          {{ isDacha ? '🌱 Мої культури' : '🌾 Мої поля' }}
        </h1>
        <p class="text-agro-light mt-1">{{ isDacha ? 'Культури та схеми обробки' : 'Поля, культури та програми захисту' }}</p>
      </div>
    </div>

    <div v-if="loading" class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="i in 3" :key="i" class="card animate-pulse">
        <div class="h-5 bg-agro-bg rounded w-1/2 mb-3"></div>
        <div class="h-3 bg-agro-bg rounded w-full mb-2"></div>
        <div class="h-3 bg-agro-bg rounded w-3/4"></div>
      </div>
    </div>

    <!-- Фермер / Агроном -->
    <template v-if="!isDacha">
      <div v-if="farms.length === 0" class="card text-center py-12">
        <p class="text-5xl mb-4">🌾</p>
        <p class="font-bold text-agro-dark text-lg mb-2">Поки немає полів</p>
        <p class="text-agro-light mb-6">Додайте своє перше поле щоб почати</p>
        <button @click="showAddFarm = true" class="btn-primary inline-block">➕ Додати поле</button>
      </div>

      <div v-else class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        <div v-for="(farm, index) in farms" :key="farm.id"
          :class="['card relative', !isPro && index < farms.length - 1 ? 'opacity-60 select-none' : '']">
          <!-- Замок для заблокованих -->
          <div v-if="!isPro && index < farms.length - 1" class="absolute inset-0 rounded-2xl flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-10 gap-2">
            <span class="text-3xl">🔒</span>
            <p class="text-sm font-semibold text-agro-dark">Доступно в PRO</p>
            <NuxtLink to="/dashboard/subscription" class="text-xs text-agro underline">Оновити план</NuxtLink>
          </div>

          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="font-bold text-agro-dark text-lg">{{ farm.name }}</h3>
              <p v-if="farm.region" class="text-xs text-agro-light">📍 {{ [farm.city, farm.region].filter(Boolean).join(', ') }}</p>
            </div>
            <span class="font-bold text-agro">{{ farm.hectares }} га</span>
          </div>

          <div class="flex flex-wrap gap-2 mb-4">
            <span v-for="crop in farm.farm_crops" :key="crop.id" class="text-xs bg-agro-hover text-agro px-2.5 py-1 rounded-full font-medium">
              {{ CROP_EMOJI[crop.crop_type] || '🌱' }} {{ crop.crop_type }}{{ crop.variety ? ` · ${crop.variety}` : '' }}
            </span>
          </div>

          <div class="flex gap-2 mb-2">
            <NuxtLink :to="`/dashboard/ai-chat?farmId=${farm.id}`" class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-agro-border text-sm font-medium text-agro-light hover:border-agro hover:text-agro transition-colors">
              🤖 AI агроном
            </NuxtLink>
            <NuxtLink to="/agronomists" class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-agro-border text-sm font-medium text-agro-light hover:border-agro hover:text-agro transition-colors">
              👨‍🌾 Агроном
            </NuxtLink>
          </div>
          <div class="flex gap-2">
            <button @click="openFarm(farm)" class="btn-outline text-sm py-2 flex-1 flex items-center justify-center gap-1.5">
              <Eye :size="15" /> Переглянути
            </button>
            <NuxtLink :to="`/dashboard/farm/${farm.id}?share=1`" class="w-10 h-10 border-2 border-agro-border rounded-xl flex items-center justify-center hover:bg-agro-hover hover:border-agro transition-colors text-agro hover:text-agro">
              <UserPlus :size="16" />
            </NuxtLink>
            <button @click="deleteFarm(farm)" class="w-10 h-10 border-2 border-red-200 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors text-red-400">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>

        <button @click="isPro ? showAddFarm = true : showPaywall = true" class="card border-2 border-dashed border-agro-border hover:border-agro flex flex-col items-center justify-center py-10 transition-colors group">
          <span class="text-3xl mb-2 group-hover:scale-110 transition-transform">{{ isPro ? '➕' : '🔒' }}</span>
          <span class="font-semibold text-agro-light group-hover:text-agro transition-colors">Додати поле</span>
        </button>
      </div>
    </template>

    <!-- Дачник -->
    <template v-else>
      <div v-if="dachaCrops.length === 0" class="card text-center py-12">
        <p class="text-5xl mb-4">🌱</p>
        <p class="font-bold text-agro-dark text-lg mb-2">Поки немає культур</p>
        <p class="text-agro-light mb-6">Додайте що вирощуєте щоб отримувати схеми обробки</p>
        <button @click="showAddCrop = true" class="btn-primary inline-block">➕ Додати культуру</button>
      </div>

      <div v-else class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        <div v-for="crop in dachaCrops" :key="crop.id" class="card">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-4xl">{{ CROP_EMOJI[crop.crop_type] || '🌱' }}</span>
            <div>
              <h3 class="font-bold text-agro-dark">{{ crop.crop_type }}</h3>
              <p v-if="crop.variety" class="text-xs text-agro-light">Сорт: {{ crop.variety }}</p>
            </div>
          </div>
          <div class="flex gap-2 mb-2">
            <NuxtLink to="/dashboard/ai-chat" class="btn-primary text-sm py-2 flex-1 text-center">🤖 AI агроном</NuxtLink>
            <NuxtLink to="/dashboard/chats?type=human" class="btn-outline text-sm py-2 flex-1 text-center">👨‍🌾 Агроном</NuxtLink>
          </div>
          <div class="flex gap-2">
            <NuxtLink :to="`/dashboard/protection?farmCropId=${crop.id}&cropType=${crop.crop_type}`" class="btn-outline text-sm py-2 flex-1 text-center">🛡 Схема обробки</NuxtLink>
            <button @click="deleteDachaCrop(crop)" class="w-10 h-10 border-2 border-red-200 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors text-red-400">🗑</button>
          </div>
        </div>

        <button @click="showAddCrop = true" class="card border-2 border-dashed border-agro-border hover:border-agro flex flex-col items-center justify-center py-10 transition-colors group">
          <span class="text-3xl mb-2 group-hover:scale-110 transition-transform">➕</span>
          <span class="font-semibold text-agro-light group-hover:text-agro transition-colors">Додати культуру</span>
        </button>
      </div>
    </template>

    <!-- Paywall модалка -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showPaywall" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showPaywall = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-8 text-center">
            <div class="text-5xl mb-4">💎</div>
            <h2 class="font-extrabold text-agro-dark text-xl mb-2">Потрібен PRO план</h2>
            <p class="text-agro-light text-sm mb-6">На безкоштовному плані доступне лише <strong>1 поле</strong> з <strong>1 культурою</strong>. Оновіть до PRO для необмеженого доступу.</p>
            <div class="space-y-3">
              <NuxtLink to="/dashboard/subscription" class="btn-primary w-full block">Оновити до PRO</NuxtLink>
              <button @click="showPaywall = false" class="btn-outline w-full">Залишитись на Basic</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модалка додавання поля -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddFarm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAddFarm = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-8">
            <h2 class="font-bold text-agro-dark text-xl mb-5">➕ Нове поле</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Назва поля</label>
                <input v-model="newFarm.name" class="input" placeholder="Наприклад: Поле №1" />
              </div>

              <!-- Область -->
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Область</label>
                <div class="relative">
                  <input
                    v-model="regionQuery"
                    @input="onRegionInput"
                    @focus="showRegionList = true"
                    @blur="() => setTimeout(() => showRegionList = false, 150)"
                    class="input"
                    placeholder="Почніть вводити область..."
                    autocomplete="off"
                  />
                  <div v-if="showRegionList && filteredAreas.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                    <button
                      v-for="area in filteredAreas"
                      :key="area.Ref"
                      type="button"
                      @mousedown.prevent="selectArea(area)"
                      class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0 text-agro-dark"
                    >
                      {{ area.name }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Населений пункт — з'являється після вибору області -->
              <div v-if="selectedAreaRef">
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Населений пункт</label>
                <div class="relative">
                  <input
                    v-model="settlementQuery"
                    @input="onSettlementInput"
                    @focus="showSettlementList = true"
                    @blur="() => setTimeout(() => showSettlementList = false, 150)"
                    class="input"
                    placeholder="Місто або село..."
                    autocomplete="off"
                  />
                  <div v-if="loadingSettlements" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-agro-light">...</div>
                  <div v-if="showSettlementList && settlements.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                    <button
                      v-for="s in settlements"
                      :key="s.DeliveryCity"
                      type="button"
                      @mousedown.prevent="selectSettlement(s)"
                      class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0 text-agro-dark"
                    >
                      {{ s.Present }}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Площа (га)</label>
                <input v-model="newFarm.hectares" class="input" type="number" placeholder="0.0" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Кадастровий номер <span class="text-agro-light font-normal">(необов'язково)</span></label>
                <input v-model="newFarm.cadastral_number" class="input" placeholder="Наприклад: 3222486601:03:002:0001" />
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button @click="showAddFarm = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="addFarm" :disabled="saving" class="btn-primary flex-1">{{ saving ? '...' : 'Додати' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модалка додавання культури (дачник) -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddCrop" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAddCrop = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-8">
            <h2 class="font-bold text-agro-dark text-xl mb-5">➕ Нова культура</h2>
            <div class="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto mb-4">
              <button
                v-for="c in DACHA_CROPS"
                :key="c"
                @click="newCropType = c"
                class="flex flex-col items-center p-3 rounded-xl border-2 transition-colors"
                :class="newCropType === c ? 'border-agro bg-agro-hover' : 'border-agro-border hover:border-agro'"
              >
                <span class="text-2xl mb-1">{{ CROP_EMOJI[c] || '🌱' }}</span>
                <span class="text-xs font-medium text-agro-dark text-center leading-tight">{{ c }}</span>
              </button>
            </div>
            <div v-if="newCropType">
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Сорт (необов'язково)</label>
              <input v-model="newVariety" class="input" :placeholder="`Наприклад: Черрі`" />
            </div>
            <div class="flex gap-3 mt-4">
              <button @click="showAddCrop = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="addDachaCrop" :disabled="!newCropType || saving" class="btn-primary flex-1">{{ saving ? '...' : 'Додати' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { Eye, Trash2, UserPlus } from 'lucide-vue-next'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()

const loading = ref(true)
const saving = ref(false)
const farms = ref<any[]>([])
const dachaCrops = ref<any[]>([])
const showAddFarm = ref(false)
const showAddCrop = ref(false)
const showPaywall = ref(false)
const newFarm = reactive({ name: '', region: '', city: '', hectares: '', cadastral_number: '' })
const newCropType = ref('')
const newVariety = ref('')

// Область + населений пункт
const { searchSettlements } = useNovaPost()

const UA_AREAS = [
  { name: 'Вінницька область', ref: 'Vinnytsia' },
  { name: 'Волинська область', ref: 'Volyn' },
  { name: 'Дніпропетровська область', ref: 'Dnipropetrovsk' },
  { name: 'Донецька область', ref: 'Donetsk' },
  { name: 'Житомирська область', ref: 'Zhytomyr' },
  { name: 'Закарпатська область', ref: 'Zakarpattia' },
  { name: 'Запорізька область', ref: 'Zaporizhzhia' },
  { name: 'Івано-Франківська область', ref: 'Ivano-Frankivsk' },
  { name: 'Київська область', ref: 'Kyiv' },
  { name: 'Кіровоградська область', ref: 'Kirovohrad' },
  { name: 'Луганська область', ref: 'Luhansk' },
  { name: 'Львівська область', ref: 'Lviv' },
  { name: 'Миколаївська область', ref: 'Mykolaiv' },
  { name: 'Одеська область', ref: 'Odesa' },
  { name: 'Полтавська область', ref: 'Poltava' },
  { name: 'Рівненська область', ref: 'Rivne' },
  { name: 'Сумська область', ref: 'Sumy' },
  { name: 'Тернопільська область', ref: 'Ternopil' },
  { name: 'Харківська область', ref: 'Kharkiv' },
  { name: 'Херсонська область', ref: 'Kherson' },
  { name: 'Хмельницька область', ref: 'Khmelnytskyi' },
  { name: 'Черкаська область', ref: 'Cherkasy' },
  { name: 'Чернівецька область', ref: 'Chernivtsi' },
  { name: 'Чернігівська область', ref: 'Chernihiv' },
  { name: 'м. Київ', ref: 'KyivCity' },
]

const regionQuery = ref('')
const showRegionList = ref(false)
const selectedAreaRef = ref('')
const settlementQuery = ref('')
const settlements = ref<any[]>([])
const showSettlementList = ref(false)
const loadingSettlements = ref(false)
let settlementTimer: any = null

const filteredAreas = computed(() => {
  const q = regionQuery.value.toLowerCase().trim()
  if (!q) return UA_AREAS
  return UA_AREAS.filter(a => a.name.toLowerCase().includes(q))
})

const onRegionInput = () => {
  selectedAreaRef.value = ''
  settlementQuery.value = ''
  newFarm.city = ''
  newFarm.region = regionQuery.value
  showRegionList.value = true
}

const selectArea = (area: any) => {
  regionQuery.value = area.name
  newFarm.region = area.name
  selectedAreaRef.value = area.ref
  showRegionList.value = false
  settlementQuery.value = ''
  newFarm.city = ''
}

const onSettlementInput = () => {
  clearTimeout(settlementTimer)
  newFarm.city = settlementQuery.value
  const q = settlementQuery.value.trim()
  if (q.length < 2) { settlements.value = []; return }
  loadingSettlements.value = true
  settlementTimer = setTimeout(async () => {
    settlements.value = await searchSettlements(q)
    loadingSettlements.value = false
  }, 350)
}

const selectSettlement = (s: any) => {
  const name = s.Present.split(',')[0].trim()
  settlementQuery.value = s.Present
  newFarm.city = name
  settlements.value = []
  showSettlementList.value = false
}

const CROP_EMOJI: Record<string, string> = {
  'Смородина': '🫐', 'Полуниця': '🍓', 'Томати': '🍅', 'Огірки': '🥒',
  'Картопля': '🥔', 'Яблука': '🍎', 'Груші': '🍐', 'Виноград': '🍇',
  'Малина': '🍒', 'Черешня': '🍒', 'Слива': '🍑', 'Абрикос': '🍑',
  'Морква': '🥕', 'Цибуля': '🧅', 'Часник': '🧄', 'Капуста': '🥬',
  'Перець': '🌶️', 'Баклажан': '🍆', 'Кабачок': '🥒', 'Кукурудза': '🌽',
  'Пшениця': '🌾', 'Кукурудза': '🌽', 'Соняшник': '🌻', 'Ріпак': '🌿',
  'Соя': '🫘', 'Ячмінь': '🌾', 'Жито': '🌾',
}

const DACHA_CROPS = [
  'Томати', 'Огірки', 'Картопля', 'Морква', 'Цибуля', 'Часник', 'Капуста',
  'Перець', 'Баклажан', 'Кабачок', 'Кукурудза', 'Полуниця', 'Смородина',
  'Малина', 'Виноград', 'Яблука', 'Груші', 'Черешня', 'Слива', 'Абрикос',
]

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const [profileRes, subRes] = await Promise.all([
  supabase.from('users').select('role').eq('id', uid).single(),
  supabase.from('subscriptions').select('plan, expires_at').eq('user_id', uid).maybeSingle(),
])
const profileData = profileRes.data
const isPro = computed(() => {
  const sub = subRes.data
  return sub?.plan === 'pro' && (!sub.expires_at || new Date(sub.expires_at) > new Date())
})
const isDacha = computed(() => profileData?.role === 'dacha')

const load = async () => {
  if (!uid) return

  if (isDacha.value) {
    const { data } = await supabase.from('dacha_crops').select('*').eq('user_id', uid).order('created_at')
    dachaCrops.value = data || []
  } else {
    const { data } = await supabase.from('farms').select('*, farm_crops(*)').eq('user_id', uid).order('created_at')
    farms.value = data || []
  }
  loading.value = false
}

await load()

const addFarm = async () => {
  if (!newFarm.name) return
  if (!isPro.value && farms.value.length >= 1) {
    showPaywall.value = true
    return
  }
  saving.value = true
  await supabase.from('farms').insert({ user_id: uid, name: newFarm.name, region: newFarm.region, city: newFarm.city || null, hectares: parseFloat(newFarm.hectares) || 0, cadastral_number: newFarm.cadastral_number || null })
  Object.assign(newFarm, { name: '', region: '', city: '', hectares: '', cadastral_number: '' })
  regionQuery.value = ''
  settlementQuery.value = ''
  selectedAreaRef.value = ''
  showAddFarm.value = false
  saving.value = false
  await load()
}

const deleteFarm = async (farm: any) => {
  if (!confirm(`Видалити поле "${farm.name}"?`)) return
  await supabase.from('farms').delete().eq('id', farm.id)
  await load()
}

const openFarm = (farm: any) => {
  navigateTo(`/dashboard/farm/${farm.id}`)
}

const addDachaCrop = async () => {
  if (!newCropType.value) return
  saving.value = true
  await supabase.from('dacha_crops').insert({ user_id: uid, crop_type: newCropType.value, variety: newVariety.value || null })
  newCropType.value = ''
  newVariety.value = ''
  showAddCrop.value = false
  saving.value = false
  await load()
}

const deleteDachaCrop = async (crop: any) => {
  if (!confirm(`Видалити "${crop.crop_type}"?`)) return
  await supabase.from('dacha_crops').delete().eq('id', crop.id)
  await load()
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
