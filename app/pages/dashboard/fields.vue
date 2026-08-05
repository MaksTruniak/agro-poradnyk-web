<template>
  <div class="fields-page">
    <div class="dash-head">
      <div class="flex items-center gap-2.5 mb-1.5">
        <div class="dash-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="dash-title bitter">{{ isDacha ? 'Мої культури' : 'Мої поля' }}</h1>
        <button v-if="!isDacha" @click="isPro ? showAddFarm = true : showPaywall = true" class="dash-btn-primary ml-auto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Додати поле
        </button>
        <button v-else @click="showAddCrop = true" class="dash-btn-primary ml-auto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Додати культуру
        </button>
      </div>
      <p class="dash-subtitle">{{ isDacha ? 'Культури та схеми обробки' : 'Поля, культури та технологічні карти' }}</p>
    </div>

    <div v-if="loading" class="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-7">
      <div v-for="i in 3" :key="i" class="fields-card animate-pulse">
        <div class="h-5 rounded w-1/2 mb-3" style="background:rgb(238,241,227);"></div>
        <div class="h-3 rounded w-full mb-2" style="background:rgb(238,241,227);"></div>
        <div class="h-3 rounded w-3/4" style="background:rgb(238,241,227);"></div>
      </div>
    </div>

    <!-- Фермер / Агроном -->
    <template v-if="!isDacha">
      <div v-if="farms.length === 0" class="card text-center py-16">
        <div class="dash-empty-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="font-bold text-agro-dark text-lg mb-2">Поки немає полів</p>
        <p class="text-agro-light mb-6">Додайте своє перше поле щоб почати</p>
        <button @click="showAddFarm = true" class="dash-btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Додати поле
        </button>
      </div>

      <div v-else class="fld-grid">
        <div v-for="(farm, index) in farms" :key="farm.id" class="fld-card relative" :class="{ 'opacity-60 select-none': !isPro && index < farms.length - 1 }">
          <!-- Замок для заблокованих -->
          <div v-if="!isPro && index < farms.length - 1" class="absolute inset-0 rounded-[18px] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-10 gap-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(76,90,70)" stroke-width="1.7"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>
            <p class="text-sm font-semibold" style="color:rgb(27,46,27)">Доступно в PRO</p>
            <NuxtLink to="/dashboard/subscription" class="text-xs underline" style="color:rgb(47,82,51)">Оновити план</NuxtLink>
          </div>

          <!-- Заголовок -->
          <div class="fld-card-head">
            <h3 class="fld-name">{{ farm.name }}</h3>
            <span class="fld-ha">{{ farm.hectares }} га</span>
          </div>

          <!-- Локація -->
          <div v-if="farm.region || farm.city" class="fld-location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s7-7.4 7-12.5A7 7 0 005 9.5C5 14.6 12 22 12 22z" stroke="#B3452F" stroke-width="1.7" stroke-linejoin="round"/>
              <circle cx="12" cy="9.5" r="2.3" stroke="#B3452F" stroke-width="1.5"/>
            </svg>
            {{ [farm.city, farm.region].filter(Boolean).join(', ') }}
          </div>

          <!-- Кнопки AI / Агроном -->
          <div class="fld-actions-top">
            <NuxtLink :to="`/dashboard/ai-chat?farmId=${farm.id}`" class="fld-soft-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 2.5l2.4 6.3 6.7.5-5.1 4.4 1.6 6.5L12 16.8 6.4 20.2 8 13.7 2.9 9.3l6.7-.5L12 2.5z" stroke="#2F5233" stroke-width="1.4" stroke-linejoin="round"/>
              </svg>
              AI агроном
            </NuxtLink>
            <NuxtLink to="/agronomists" class="fld-soft-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="10" cy="8.5" r="3.5" stroke="#2F5233" stroke-width="1.5"/>
                <path d="M17 18c0-2.8-3.1-4-6.5-4S4 15.2 4 18" stroke="#2F5233" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              Агроном
            </NuxtLink>
          </div>

          <!-- Кнопки дій -->
          <div class="fld-actions-bottom">
            <button @click="openFarm(farm)" class="fld-view-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="#2F5233" stroke-width="1.6" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="#2F5233" stroke-width="1.6"/>
              </svg>
              Переглянути
            </button>
            <NuxtLink :to="`/dashboard/farm/${farm.id}?share=1`" class="fld-icon-btn" style="border-color:rgb(221,230,204)">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3" stroke="#2F5233" stroke-width="1.6"/>
                <path d="M3 19c0-3 2.7-5 6-5" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M17 8v5M14.5 10.5H19.5" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </NuxtLink>
            <button @click="deleteFarm(farm)" class="fld-icon-btn" style="border-color:rgb(243,207,196)">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16l-1.5 12.5a1 1 0 01-1 .9H6.5a1 1 0 01-1-.9L4 7z" stroke="#B3452F" stroke-width="1.6" stroke-linejoin="round"/>
                <path d="M8 7a4 4 0 018 0" stroke="#B3452F" stroke-width="1.6"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Додати поле -->
        <button @click="isPro ? showAddFarm = true : showPaywall = true" class="fld-add-card">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="10" width="14" height="10" rx="2" stroke="#7A8A72" stroke-width="1.7"/>
            <path d="M8 10V7a4 4 0 018 0v3" stroke="#7A8A72" stroke-width="1.7"/>
          </svg>
          <span class="fld-add-label">{{ isPro ? 'Додати поле' : 'Додати поле' }}</span>
        </button>
      </div>
    </template>

    <!-- Дачник -->
    <template v-else>
      <div v-if="dachaCrops.length === 0" class="card text-center py-16">
        <div class="dash-empty-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="font-bold text-agro-dark text-lg mb-2">Поки немає культур</p>
        <p class="text-agro-light mb-6">Додайте що вирощуєте щоб отримувати схеми обробки</p>
        <button @click="showAddCrop = true" class="dash-btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Додати культуру
        </button>
      </div>

      <div v-else class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        <div v-for="crop in dachaCrops" :key="crop.id" class="card">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-4xl">{{ emojiFor(crop.crop_type) }}</span>
            <div>
              <h3 class="font-bold text-agro-dark">{{ crop.crop_type }}</h3>
              <p v-if="crop.variety" class="text-xs text-agro-light">Сорт: {{ crop.variety }}</p>
            </div>
          </div>
          <div class="flex gap-2 mb-2">
            <NuxtLink to="/dashboard/ai-chat" class="btn-primary text-sm py-2 flex-1 text-center inline-flex items-center justify-center gap-1.5"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M9 8V6a3 3 0 016 0v2"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/><path d="M9 18h6"/></svg> AI агроном</NuxtLink>
            <NuxtLink to="/dashboard/chats?type=human" class="btn-outline text-sm py-2 flex-1 text-center inline-flex items-center justify-center gap-1.5"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/><path d="M9 4c1.5-1.5 5.5-1.5 6 1"/></svg> Агроном</NuxtLink>
          </div>
          <div class="flex gap-2">
            <NuxtLink :to="`/dashboard/protection?farmCropId=${crop.id}&cropType=${crop.crop_type}`" class="btn-outline text-sm py-2 flex-1 text-center inline-flex items-center justify-center gap-1.5"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Схема обробки</NuxtLink>
            <button @click="deleteDachaCrop(crop)" class="w-10 h-10 border-2 border-red-200 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors text-red-400"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16l-1.5 12.5a1 1 0 01-1 .9H6.5a1 1 0 01-1-.9L4 7z"/><path d="M8 7a4 4 0 018 0"/></svg></button>
          </div>
        </div>

        <button @click="showAddCrop = true" class="card border-2 border-dashed border-agro-border hover:border-agro flex flex-col items-center justify-center py-10 transition-colors group">
          <span class="mb-2 group-hover:scale-110 transition-transform"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(122,138,114)" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
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
            <div class="mb-4 flex justify-center"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l3 6-9 12L3 9l3-6z"/><path d="M3 9h18M9 3l3 18M15 3l-3 18"/></svg></div>
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
            <h2 class="font-bold text-agro-dark text-xl mb-5">Нове поле</h2>
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
            <h2 class="font-bold text-agro-dark text-xl mb-5">Нова культура</h2>
            <div class="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto mb-4">
              <button
                v-for="c in allCropNames"
                :key="c"
                @click="newCropType = c"
                class="flex flex-col items-center p-3 rounded-xl border-2 transition-colors"
                :class="newCropType === c ? 'border-agro bg-agro-hover' : 'border-agro-border hover:border-agro'"
              >
                <span class="text-2xl mb-1">{{ emojiFor(c) }}</span>
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
import { Trash2 } from 'lucide-vue-next'
useHead({ title: 'Мої поля' })
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

const { load: loadCrops, allCropNames, emojiFor } = useCropCatalog()

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

await Promise.all([load(), loadCrops()])

const { error: showError } = useToast()

const addFarm = async () => {
  if (!newFarm.name) return
  if (!isPro.value && farms.value.length >= 1) {
    showPaywall.value = true
    return
  }
  saving.value = true
  const payload: any = {
    user_id: uid,
    name: newFarm.name,
    region: newFarm.region || null,
    hectares: parseFloat(newFarm.hectares) || 0,
    cadastral_number: newFarm.cadastral_number || null,
  }
  if (newFarm.city) payload.city = newFarm.city

  const { error } = await supabase.from('farms').insert(payload)
  if (error) {
    console.error('addFarm error:', error)
    if (error.message.includes('city')) {
      // колонка city ще не існує — вставляємо без неї
      const { error: e2 } = await supabase.from('farms').insert({ ...payload, city: undefined })
      if (e2) { showError('Помилка збереження: ' + e2.message); saving.value = false; return }
    } else {
      showError('Помилка збереження: ' + error.message)
      saving.value = false
      return
    }
  }

  Object.assign(newFarm, { name: '', region: '', city: '', hectares: '', cadastral_number: '' })
  regionQuery.value = ''
  settlementQuery.value = ''
  selectedAreaRef.value = ''
  showAddFarm.value = false
  saving.value = false
  await load()
}

const { confirm: confirmDialog } = useConfirm()

const deleteFarm = async (farm: any) => {
  if (!await confirmDialog(`Поле "${farm.name}" та всі пов'язані культури будуть видалені.`, { title: `Видалити поле?` })) return
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
  if (!await confirmDialog(`"${crop.crop_type}" буде видалено з вашого списку.`, { title: 'Видалити культуру?' })) return
  await supabase.from('dacha_crops').delete().eq('id', crop.id)
  await load()
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.fields-page { padding: 44px 56px; font-family: Manrope, sans-serif; max-width: 1196px; }
.dash-head { margin-bottom: 28px; }
.dash-title { font-family: 'Bitter', Georgia, serif; font-weight: 800; font-size: 28px; color: rgb(27,46,27); margin: 0; }
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-subtitle { font-size: 15.5px; color: rgb(107,122,100); margin: 4px 0 0; }
.dash-icon-box { width: 40px; height: 40px; border-radius: 10px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dash-btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: 10px; background: rgb(47,82,51); color: rgb(250,246,236); font-weight: 700; font-size: 14px; border: none; cursor: pointer; transition: background 0.15s; }
.dash-btn-primary:hover { background: rgb(61,107,66); }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
.fields-empty {
  background: #fff;
  border-radius: 18px;
  padding: 80px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 900px;
  box-shadow: 0 8px 24px -16px rgba(30,45,25,0.2);
}
.fields-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 12px;
  background: rgb(47,82,51);
  color: rgb(250,246,236);
  font-weight: 700;
  font-size: 15px;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.fields-add-btn:hover { background: rgb(61,107,66); }

/* ---- Field grid cards ---- */
.fld-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  max-width: 900px;
}

.fld-card {
  background: #fff;
  border-radius: 18px;
  padding: 26px;
  box-shadow: 0 8px 24px -16px rgba(30,45,25,0.2);
}

.fld-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
}

.fld-name {
  font-size: 19px;
  font-weight: 700;
  color: rgb(27,46,27);
  margin: 0;
}

.fld-ha {
  font-weight: 700;
  font-size: 16px;
  color: rgb(27,46,27);
  white-space: nowrap;
  flex-shrink: 0;
}

.fld-location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  color: rgb(107,122,100);
  margin-bottom: 20px;
}

.fld-actions-top {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.fld-soft-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgb(221,230,204);
  font-size: 13.5px;
  font-weight: 700;
  color: rgb(47,82,51);
  text-decoration: none;
  transition: background 0.15s;
}
.fld-soft-btn:hover { background: rgb(238,241,227); }

.fld-actions-bottom {
  display: flex;
  gap: 10px;
}

.fld-view-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px;
  border-radius: 10px;
  border: 1.5px solid rgb(47,82,51);
  font-size: 14px;
  font-weight: 700;
  color: rgb(47,82,51);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s;
}
.fld-view-btn:hover { background: rgb(238,241,227); }

.fld-icon-btn {
  flex: 0 0 auto;
  width: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s;
}
.fld-icon-btn:hover { background: rgb(248,245,240); }

.fld-add-card {
  border: 2px dashed rgb(199,210,179);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  gap: 14px;
  background: transparent;
  cursor: pointer;
  transition: border-color 0.15s;
}
.fld-add-card:hover { border-color: rgb(47,82,51); }

.fld-add-label {
  font-weight: 700;
  font-size: 16px;
  color: rgb(76,90,70);
}

@media (max-width: 640px) {
  .fields-page { padding: 24px 20px; }
  .fld-grid { grid-template-columns: 1fr; }
}
</style>
