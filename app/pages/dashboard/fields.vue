<template>
  <div class="fields-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Мої поля</h1>
        <p class="dash-subtitle">Поля, культури та технологічні карти</p>
      </div>
      <div v-if="weatherChip" class="flex items-center gap-1.5 text-xs text-agro-light bg-agro-hover border border-agro-border rounded-xl px-3 py-1.5 shrink-0">
        <span>{{ weatherChip.icon }}</span>
        <span class="font-semibold text-agro-dark">{{ weatherChip.temp }}°</span>
        <span>{{ weatherChip.condition }}</span>
        <span class="opacity-60">· {{ weatherChip.region }}</span>
      </div>
      <button v-if="!isTeamMember || !isViewer" @click="openAddFarm()" class="dash-btn-primary shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати поле
      </button>
    </div>

    <div v-if="loading" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-7">
      <div v-for="i in 3" :key="i" class="fields-card animate-pulse">
        <div class="h-5 rounded w-1/2 mb-3" style="background:rgb(238,241,227);"></div>
        <div class="h-3 rounded w-full mb-2" style="background:rgb(238,241,227);"></div>
        <div class="h-3 rounded w-3/4" style="background:rgb(238,241,227);"></div>
      </div>
    </div>

    <div v-if="farms.length === 0" class="card text-center py-16">
        <div class="dash-empty-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="font-bold text-agro-dark text-lg mb-2">Поки немає полів</p>
        <p class="text-agro-light mb-6">Додайте своє перше поле щоб почати</p>
        <button @click="openAddFarm()" class="dash-btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Додати поле
        </button>
      </div>

      <div v-else class="fld-grid">
        <div v-for="farm in farms" :key="farm.id" class="fld-card relative"
          :class="{ 'fld-card--blocked': blockedFarmIds.has(farm.id) }">

          <!-- Заблоковано: перевищення ліміту -->
          <div v-if="blockedFarmIds.has(farm.id)"
            class="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-700">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>
            </svg>
            Понад ліміт
          </div>

          <!-- Заголовок -->
          <div class="fld-card-head">
            <h3 class="fld-name">{{ farm.name }}</h3>
            <span class="fld-ha">{{ farm.hectares }} га</span>
          </div>

          <!-- Культури -->
          <div v-if="farm.farm_crops?.length" class="flex flex-wrap gap-1.5 mb-3">
            <div v-for="crop in farm.farm_crops" :key="crop.id"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-agro-hover border border-agro-border text-xs font-medium text-agro-dark">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z"/>
              </svg>
              {{ crop.crop_type }}<span v-if="crop.variety" class="text-agro-light font-normal">· {{ crop.variety }}</span>
            </div>
          </div>
          <div v-else class="text-xs text-agro-light mb-3 flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Культур не додано
          </div>

          <!-- Локація + погода -->
          <div class="flex items-center justify-between gap-2 mb-1">
            <div v-if="farm.region || farm.city" class="fld-location" style="margin-bottom:0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s7-7.4 7-12.5A7 7 0 005 9.5C5 14.6 12 22 12 22z" stroke="#B3452F" stroke-width="1.7" stroke-linejoin="round"/>
                <circle cx="12" cy="9.5" r="2.3" stroke="#B3452F" stroke-width="1.5"/>
              </svg>
              {{ [farm.city, farm.region].filter(Boolean).join(', ') }}
            </div>
            <div v-if="farmWeather[farm.id]" class="flex items-center gap-1 text-xs text-agro-light bg-agro-hover border border-agro-border rounded-lg px-2 py-1 shrink-0">
              <span>{{ farmWeather[farm.id].icon }}</span>
              <span class="font-semibold text-agro-dark">{{ farmWeather[farm.id].temp }}°</span>
              <span>{{ farmWeather[farm.id].condition }}</span>
            </div>
          </div>

          <!-- Заблоковане поле: підказка з апгрейдом -->
          <div v-if="blockedFarmIds.has(farm.id)" class="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            Перевищує ліміт тарифу ({{ hectareLimit }} га).
            <NuxtLink to="/dashboard/subscription" class="underline font-semibold">Оновити план →</NuxtLink>
          </div>

          <!-- Кнопки дій — рядок 1 (тільки для незаблокованих) -->
          <div v-if="!blockedFarmIds.has(farm.id)" class="fld-actions-bottom mb-2">
            <NuxtLink v-if="!blockedFarmIds.has(farm.id)" :to="`/dashboard/ai-chat?farmId=${farm.id}`" class="fld-soft-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2.5l2.4 6.3 6.7.5-5.1 4.4 1.6 6.5L12 16.8 6.4 20.2 8 13.7 2.9 9.3l6.7-.5L12 2.5z" stroke="#2F5233" stroke-width="1.4" stroke-linejoin="round"/>
              </svg>
              AI агроном
            </NuxtLink>
            <NuxtLink :to="farmChatMap[farm.id] ? `/dashboard/chats/${farmChatMap[farm.id]}` : '/agronomists'" class="fld-soft-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="10" cy="8.5" r="3.5" stroke="#2F5233" stroke-width="1.5"/>
                <path d="M17 18c0-2.8-3.1-4-6.5-4S4 15.2 4 18" stroke="#2F5233" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              {{ farmChatMap[farm.id] ? 'Чат з агрономом' : 'Додати агронома' }}
            </NuxtLink>
          </div>

          <!-- Кнопки дій — рядок 2 -->
          <div class="fld-actions-bottom">
            <NuxtLink v-if="!blockedFarmIds.has(farm.id)" :to="`/dashboard/farm/${farm.id}`" class="fld-soft-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="#2F5233" stroke-width="1.5" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="#2F5233" stroke-width="1.5"/>
              </svg>
              Переглянути
            </NuxtLink>
            <button @click="openEditFarm(farm)" class="fld-soft-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#2F5233" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#2F5233" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Редагувати
            </button>
            <button @click="deleteFarm(farm)" class="fld-icon-btn" style="border-color:rgb(243,207,196)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16l-1.5 12.5a1 1 0 01-1 .9H6.5a1 1 0 01-1-.9L4 7z" stroke="#B3452F" stroke-width="1.6" stroke-linejoin="round"/>
                <path d="M8 7a4 4 0 018 0" stroke="#B3452F" stroke-width="1.6"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Додати поле -->
        <button @click="openAddFarm()" class="fld-add-card">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="10" width="14" height="10" rx="2" stroke="#7A8A72" stroke-width="1.7"/>
            <path d="M8 10V7a4 4 0 018 0v3" stroke="#7A8A72" stroke-width="1.7"/>
          </svg>
          <span class="fld-add-label">Додати поле</span>
        </button>
    </div>

    <!-- Paywall модалка -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showHectarePaywall" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showHectarePaywall = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-8 text-center">
            <div class="mb-4 flex justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <h2 class="font-extrabold text-agro-dark text-xl mb-2">Ліміт гектарів вичерпано</h2>
            <p class="text-agro-light text-sm mb-2">
              Ваш план <strong class="text-agro-dark capitalize">{{ currentPlan }}</strong>:
              ліміт <strong class="text-agro-dark">{{ hectareLimit }} га</strong>.
            </p>
            <p class="text-agro-light text-sm mb-6">
              Використано: <strong class="text-agro-dark">{{ totalHectares.toFixed(1) }} га</strong>.
              Залишилось: <strong class="text-agro-dark">{{ remainingHectares.toFixed(1) }} га</strong>.
            </p>
            <div class="space-y-3">
              <NuxtLink to="/dashboard/subscription" @click="showHectarePaywall = false" class="btn-primary w-full block">
                Переглянути тарифи →
              </NuxtLink>
              <button @click="showHectarePaywall = false" class="btn-outline w-full">Зрозуміло</button>
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
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Кадастрові номери <span class="text-agro-light font-normal">(необов'язково)</span></label>
                <div class="space-y-2">
                  <div v-for="(_, i) in newFarmCadastrals" :key="i" class="flex gap-2">
                    <input v-model="newFarmCadastrals[i]" class="input flex-1" placeholder="3222486601:03:002:0001" />
                    <button v-if="newFarmCadastrals.length > 1" @click="newFarmCadastrals.splice(i, 1)" type="button" class="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-agro-border text-agro-light hover:border-red-300 hover:text-red-400 transition-colors shrink-0">×</button>
                  </div>
                  <button @click="newFarmCadastrals.push('')" type="button" class="flex items-center gap-1.5 text-sm text-agro font-semibold hover:opacity-70 transition-opacity">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                    Додати номер
                  </button>
                </div>
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button @click="showAddFarm = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="addFarm" :disabled="saving" class="btn-primary flex-1 inline-flex items-center justify-center gap-1.5">
                <svg v-if="!saving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                {{ saving ? '...' : 'Додати' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модалка редагування поля -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="editingFarm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="editingFarm = null" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-8">
            <h2 class="font-bold text-agro-dark text-xl mb-5">Редагувати поле</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Назва поля</label>
                <input v-model="editFarmData.name" class="input" placeholder="Наприклад: Поле №1" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Область</label>
                <input v-model="editFarmData.region" class="input" placeholder="Наприклад: Київська область" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Площа (га)</label>
                <input v-model="editFarmData.hectares" class="input" type="number" placeholder="0.0" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Кадастрові номери <span class="text-agro-light font-normal">(необов'язково)</span></label>
                <div class="space-y-2">
                  <div v-for="(_, i) in editFarmCadastrals" :key="i" class="flex gap-2">
                    <input v-model="editFarmCadastrals[i]" class="input flex-1" placeholder="3222486601:03:002:0001" />
                    <button v-if="editFarmCadastrals.length > 1" @click="editFarmCadastrals.splice(i, 1)" type="button" class="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-agro-border text-agro-light hover:border-red-300 hover:text-red-400 transition-colors shrink-0">×</button>
                  </div>
                  <button @click="editFarmCadastrals.push('')" type="button" class="flex items-center gap-1.5 text-sm text-agro font-semibold hover:opacity-70 transition-opacity">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                    Додати номер
                  </button>
                </div>
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button @click="editingFarm = null" class="btn-outline flex-1">Скасувати</button>
              <button @click="saveFarm" :disabled="saving" class="btn-primary flex-1 inline-flex items-center justify-center gap-1.5">
                {{ saving ? '...' : 'Зберегти' }}
              </button>
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
const farmChatMap = ref<Record<string, string>>({})
const showAddFarm = ref(false)
const showHectarePaywall = ref(false)
const newFarm = reactive({ name: '', region: '', city: '', hectares: '' })
const newFarmCadastrals = ref<string[]>([''])

const editingFarm = ref<any>(null)
const editFarmData = reactive({ name: '', region: '', hectares: '' })
const editFarmCadastrals = ref<string[]>([''])

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

const { getQueryUserId, isTeamMember, isViewer } = useTeamContext()
const { data: { session } } = await supabase.auth.getSession()
const uid = await getQueryUserId()

const [, subRes] = await Promise.all([
  supabase.from('users').select('role').eq('id', uid).single(),
  supabase.from('subscriptions').select('plan, expires_at').eq('user_id', session?.user?.id).maybeSingle(),
])

const currentPlan = computed(() => {
  const sub = subRes.data
  if (!sub?.plan) return 'basic'
  const active = !sub.expires_at || new Date(sub.expires_at) > new Date()
  return active ? sub.plan : 'basic'
})

const HECTARE_LIMITS: Record<string, number> = {
  basic:      2,
  pro:        50,
  business:   200,
  enterprise: Infinity,
}

const hectareLimit = computed(() => HECTARE_LIMITS[currentPlan.value] ?? 2)
const totalHectares = computed(() =>
  farms.value.reduce((sum: number, f: any) => sum + (parseFloat(f.hectares) || 0), 0)
)
const remainingHectares = computed(() => Math.max(0, hectareLimit.value - totalHectares.value))

// Поля що виходять за ліміт (старіші мають пріоритет — входять в ліміт першими)
const blockedFarmIds = computed(() => {
  if (hectareLimit.value === Infinity) return new Set<string>()
  const sorted = [...farms.value].sort((a, b) =>
    new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  )
  const blocked = new Set<string>()
  let used = 0
  for (const f of sorted) {
    const ha = parseFloat(f.hectares) || 0
    if (used + ha > hectareLimit.value) {
      blocked.add(f.id)
    } else {
      used += ha
    }
  }
  return blocked
})

const weatherChip = ref<{ temp: number; condition: string; icon: string; region: string } | null>(null)
const farmWeather = ref<Record<string, { temp: number; condition: string; icon: string }>>({})

const loadFarmWeather = async (farmId: string, region: string) => {
  try {
    const coords = Object.entries(REGION_COORDS).find(([key]) => region.includes(key))?.[1]
    if (!coords) return
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&forecast_days=1&timezone=Europe%2FKyiv`)
    const data = await res.json()
    const code = data.current.weather_code
    const icon = code === 0 ? '☀️' : code <= 3 ? '⛅' : code <= 67 ? '🌧️' : code <= 77 ? '❄️' : code <= 99 ? '⛈️' : '🌤️'
    const condition = code === 0 ? 'Ясно' : code <= 3 ? 'Хмарно' : code <= 67 ? 'Дощ' : code <= 77 ? 'Сніг' : code <= 99 ? 'Гроза' : 'Мінлива'
    farmWeather.value[farmId] = { temp: Math.round(data.current.temperature_2m), condition, icon }
  } catch {}
}

const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  'Вінницька': { lat: 49.23, lon: 28.47 }, 'Волинська': { lat: 50.74, lon: 25.32 },
  'Дніпропетровська': { lat: 48.46, lon: 35.04 }, 'Донецька': { lat: 48.02, lon: 37.80 },
  'Житомирська': { lat: 50.25, lon: 28.66 }, 'Закарпатська': { lat: 48.62, lon: 22.30 },
  'Запорізька': { lat: 47.84, lon: 35.14 }, 'Івано-Франківська': { lat: 48.92, lon: 24.71 },
  'Київська': { lat: 50.40, lon: 30.52 }, 'Кіровоградська': { lat: 48.51, lon: 32.26 },
  'Львівська': { lat: 49.84, lon: 24.03 }, 'Миколаївська': { lat: 46.97, lon: 32.00 },
  'Одеська': { lat: 46.48, lon: 30.73 }, 'Полтавська': { lat: 49.59, lon: 34.55 },
  'Рівненська': { lat: 50.62, lon: 26.25 }, 'Сумська': { lat: 50.91, lon: 34.80 },
  'Тернопільська': { lat: 49.55, lon: 25.59 }, 'Харківська': { lat: 49.99, lon: 36.23 },
  'Херсонська': { lat: 46.64, lon: 32.62 }, 'Хмельницька': { lat: 49.42, lon: 26.99 },
  'Черкаська': { lat: 49.44, lon: 32.06 }, 'Чернівецька': { lat: 48.29, lon: 25.94 },
  'Чернігівська': { lat: 51.49, lon: 31.29 },
}

const loadWeather = async (region: string) => {
  try {
    const coords = Object.entries(REGION_COORDS).find(([key]) => region.includes(key))?.[1]
    if (!coords) return
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&forecast_days=1&timezone=Europe%2FKyiv`)
    const data = await res.json()
    const code = data.current.weather_code
    const icon = code === 0 ? '☀️' : code <= 3 ? '⛅' : code <= 67 ? '🌧️' : code <= 77 ? '❄️' : code <= 99 ? '⛈️' : '🌤️'
    const condition = code === 0 ? 'Ясно' : code <= 3 ? 'Хмарно' : code <= 67 ? 'Дощ' : code <= 77 ? 'Сніг' : code <= 99 ? 'Гроза' : 'Мінлива'
    const shortRegion = Object.keys(REGION_COORDS).find(k => region.includes(k)) || region
    weatherChip.value = { temp: Math.round(data.current.temperature_2m), condition, icon, region: shortRegion }
  } catch {}
}

const load = async () => {
  if (!uid) return
  const [farmsRes, agreementsRes, chatsRes] = await Promise.all([
    supabase.from('farms').select('*, farm_crops(*)').eq('user_id', uid).order('created_at'),
    supabase.from('agreements').select('agronomist_id').eq('farmer_id', uid).eq('status', 'active'),
    supabase.from('chats').select('id, agronomist_id').eq('farmer_id', uid).eq('type', 'human'),
  ])
  farms.value = farmsRes.data || []

  // Якщо є активна угода — знаходимо чат з цим агрономом
  const activeAgronomistIds = new Set((agreementsRes.data || []).map((a: any) => a.agronomist_id))
  const agronomistChatId = (chatsRes.data || []).find((c: any) => activeAgronomistIds.has(c.agronomist_id))?.id || null
  // farmChatMap тепер зберігає один чат з агрономом (для всіх полів однаковий)
  const chatMap: Record<string, string> = {}
  if (agronomistChatId) {
    for (const farm of (farmsRes.data || [])) chatMap[farm.id] = agronomistChatId
  }
  farmChatMap.value = chatMap

  const farmsWithRegion = (farmsRes.data || []).filter((f: any) => f.region)
  farmsWithRegion.forEach((f: any) => loadFarmWeather(f.id, f.region))
  const firstRegion = farmsWithRegion[0]?.region
  if (firstRegion) loadWeather(firstRegion)
  loading.value = false
}

await Promise.all([load(), loadCrops()])

const { error: showError } = useToast()

const openAddFarm = () => {
  if (hectareLimit.value !== Infinity && totalHectares.value >= hectareLimit.value) {
    showHectarePaywall.value = true
    return
  }
  showAddFarm.value = true
}

const addFarm = async () => {
  if (!newFarm.name) return

  // Перевірка ліміту гектарів
  const newHa = parseFloat(newFarm.hectares) || 0
  if (hectareLimit.value !== Infinity && totalHectares.value + newHa > hectareLimit.value) {
    showHectarePaywall.value = true
    return
  }

  saving.value = true
  const payload: any = {
    user_id: uid,
    name: newFarm.name,
    region: newFarm.region || null,
    hectares: parseFloat(newFarm.hectares) || 0,
    cadastral_number: newFarmCadastrals.value.map(s => s.trim()).filter(Boolean).join('\n') || null,
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

  Object.assign(newFarm, { name: '', region: '', city: '', hectares: '' })
  newFarmCadastrals.value = ['']
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

const openEditFarm = (farm: any) => {
  editingFarm.value = farm
  Object.assign(editFarmData, {
    name: farm.name || '',
    region: farm.region || '',
    hectares: farm.hectares || '',
  })
  const nums = (farm.cadastral_number || '').split('\n').map((s: string) => s.trim()).filter(Boolean)
  editFarmCadastrals.value = nums.length ? nums : ['']
}

const saveFarm = async () => {
  if (!editingFarm.value || !editFarmData.name) return
  saving.value = true
  const cadastral = editFarmCadastrals.value.map(s => s.trim()).filter(Boolean).join('\n') || null
  const { error } = await supabase.from('farms').update({
    name: editFarmData.name,
    region: editFarmData.region || null,
    hectares: parseFloat(editFarmData.hectares) || 0,
    cadastral_number: cadastral,
  }).eq('id', editingFarm.value.id)
  saving.value = false
  if (!error) {
    editingFarm.value = null
    await load()
  }
}

</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.bitter { font-family: 'Bitter', Georgia, serif; }
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
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
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
  gap: 5px;
  padding: 9px 8px;
  border-radius: 10px;
  border: 1px solid rgb(221,230,204);
  font-size: 12.5px;
  font-weight: 700;
  color: rgb(47,82,51);
  text-decoration: none;
  white-space: nowrap;
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
  .fld-grid { grid-template-columns: 1fr; }
}
</style>
