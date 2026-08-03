<template>
  <div class="dash-page">
    <NuxtLink to="/dashboard/agronomist-fields" class="inline-flex items-center gap-2 text-agro-light hover:text-agro mb-8 text-sm font-medium transition-colors">
      ← Назад до полів
    </NuxtLink>

    <div class="dash-head">
      <div class="flex items-center gap-2.5 mb-1.5">
        <div class="dash-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z"/>
          </svg>
        </div>
        <h1 class="dash-title bitter">Схема захисту</h1>
      </div>
      <p class="dash-subtitle">{{ farmName || 'Програми захисту культур' }}</p>
    </div>

    <!-- Перемикач культур -->
    <div v-if="crops.length > 1" class="flex gap-2 flex-wrap mb-6">
      <button
        v-for="crop in crops" :key="crop.id"
        @click="selectCrop(crop)"
        class="px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors"
        :class="selectedCrop?.id === crop.id ? 'border-agro bg-agro-hover text-agro' : 'border-agro-border text-agro-light hover:border-agro'"
      >
        {{ crop.crop_type }}{{ crop.variety ? ` · ${crop.variety}` : '' }}
      </button>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="card animate-pulse h-28" v-for="i in 3" :key="i"></div>
    </div>

    <div v-else-if="!selectedCrop" class="card text-center py-12">
      <div class="dash-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z"/>
        </svg>
      </div>
      <p class="font-bold text-agro-dark text-lg">Немає культур</p>
      <p class="text-agro-light mt-1">На цьому полі ще не додано культур</p>
    </div>

    <div v-else>
      <div v-if="!program" class="card text-center py-12">
        <div class="dash-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z"/>
        </svg>
      </div>
        <p class="font-bold text-agro-dark text-lg">Програму ще не створено</p>
        <p class="text-agro-light mt-1 mb-6">Створіть технологічну карту для цієї культури</p>
        <button v-if="!readOnly" @click="createProgram" :disabled="saving" class="btn-primary inline-block">
          {{ saving ? '...' : '➕ Створити програму' }}
        </button>
      </div>

      <template v-else>
        <!-- Блоки активних фаз -->
        <div class="space-y-4 mb-4">
          <div v-for="phase in activePhases" :key="phase.key" class="card p-0 overflow-hidden">
            <div class="flex items-center gap-2 px-5 py-3 bg-agro-hover border-b border-agro-border">
              <span class="text-base">{{ phase.emoji }}</span>
              <span class="font-bold text-agro-dark">{{ phase.key }}</span>
              <span class="ml-auto text-xs text-agro-light mr-2">{{ treatmentsByPhase[phase.key]?.length || 0 }} обробок</span>
              <button v-if="!readOnly" @click="removePhase(phase)" class="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-agro-light hover:text-red-400">
                <X :size="13" />
              </button>
            </div>

            <div class="divide-y divide-agro-border">
              <div v-if="!treatmentsByPhase[phase.key]?.length" class="px-5 py-5 text-center text-sm text-agro-light">
                Обробок ще немає — додайте першу нижче
              </div>
              <div v-for="t in treatmentsByPhase[phase.key] || []" :key="t.id" class="flex items-start gap-3 px-5 py-3.5">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" :class="TYPE_BG[t.type] || 'bg-agro-bg'">
                  <span class="text-sm">{{ TYPE_ICONS[t.type] || '🌿' }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-xs font-medium px-2 py-0.5 rounded-full border" :class="TYPE_BADGE[t.type] || 'bg-agro-bg border-agro-border text-agro-light'">
                    {{ t.type }}
                  </span>
                  <p class="font-semibold text-agro-dark mt-1 text-sm">{{ t.product_name }}</p>
                  <p v-if="t.dosage" class="text-xs text-agro-light mt-0.5">📏 {{ t.dosage }}</p>
                  <p v-if="t.notes" class="text-xs text-agro-light mt-0.5 italic">{{ t.notes }}</p>
                </div>
                <div class="relative shrink-0 reminder-info-wrap">
                  <button @click="toggleReminderInfo(t)" class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                    :class="treatmentReminders[t.product_name]?.length ? 'bg-agro/10 text-agro hover:bg-agro/20' : 'hover:bg-agro-hover text-agro-light hover:text-agro'"
                    title="Нагадування">
                    <Bell :size="14" />
                    <span v-if="treatmentReminders[t.product_name]?.length"
                      class="absolute -top-1 -right-1 w-4 h-4 bg-agro text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                      {{ treatmentReminders[t.product_name].length }}
                    </span>
                  </button>
                  <div v-if="activeReminderInfo === t.id"
                    class="absolute right-0 top-9 z-30 w-64 bg-white rounded-2xl shadow-xl border border-agro-border p-3">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-xs font-bold text-agro-dark">🔔 Нагадування фермеру</p>
                      <button @click="openReminderFor(t); activeReminderInfo = null"
                        class="text-xs text-agro font-medium hover:underline">+ Додати</button>
                    </div>
                    <div v-if="!treatmentReminders[t.product_name]?.length" class="text-xs text-agro-light py-2 text-center">
                      Немає нагадувань
                    </div>
                    <div v-else class="space-y-1.5">
                      <div v-for="r in treatmentReminders[t.product_name]" :key="r.id"
                        class="flex items-center gap-2 text-xs py-1 px-2 rounded-lg"
                        :class="new Date(r.scheduled_date) < new Date() ? 'bg-gray-50 text-gray-400' : 'bg-amber-50 text-amber-800'">
                        <span>📅</span>
                        <span>{{ formatReminderDate(r.scheduled_date) }}</span>
                        <span v-if="new Date(r.scheduled_date) < new Date()" class="ml-auto text-gray-300 text-[10px]">минуло</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button v-if="!readOnly" @click="deleteTreatment(t)" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-red-400 shrink-0">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>

            <div v-if="!readOnly" class="px-5 py-4 border-t border-agro-border bg-[#FAFDF7] space-y-3">
              <select v-model="inlineT[phase.key].type" class="input text-sm py-2">
                <option value="підживлення">🌿 підживлення</option>
                <option value="захист">🛡 захист</option>
                <option value="гербіцид">🌾 гербіцид</option>
                <option value="фунгіцид">🍄 фунгіцид</option>
                <option value="інсектицид">🐛 інсектицид</option>
              </select>
              <div class="relative">
                <input
                  v-model="inlineT[phase.key].product_name"
                  @input="searchProducts(phase.key)"
                  @focus="showSuggestionsFor = phase.key"
                  @blur="hideSuggestions"
                  class="input text-sm py-2"
                  placeholder="Назва препарату або добрива..."
                  autocomplete="off"
                />
                <div v-if="showSuggestionsFor === phase.key && productSuggestions.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-30 max-h-44 overflow-y-auto">
                  <button
                    v-for="p in productSuggestions" :key="p.id" type="button"
                    @mousedown.prevent="selectProduct(phase.key, p)"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0"
                  >
                    <p class="font-medium text-agro-dark">{{ p.product_name }}</p>
                  </button>
                </div>
              </div>
              <input v-model="inlineT[phase.key].dosage" class="input text-sm py-2" placeholder="Доза (необов'язково)" />
              <input v-model="inlineT[phase.key].notes" class="input text-sm py-2" placeholder="Коментар (необов'язково)" />
              <button
                @click="saveTreatment(phase)"
                :disabled="!inlineT[phase.key].product_name || savingPhase === phase.key"
                class="btn-primary w-full py-2.5 text-sm"
              >
                {{ savingPhase === phase.key ? '...' : '✓ Додати обробку' }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="!readOnly" class="relative" ref="phasePickerRef">
          <button @click="showPhasePicker = !showPhasePicker" class="btn-outline w-full text-sm py-3">
            ➕ Додати фазу
          </button>
          <div v-if="showPhasePicker" class="card mt-2 p-0 overflow-hidden">
            <div v-if="availablePhases.length" class="divide-y divide-agro-border">
              <button v-for="phase in availablePhases" :key="phase.key"
                @click="addActivePhase(phase)"
                class="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-agro-hover transition-colors text-left">
                <span class="text-base">{{ phase.emoji }}</span>
                <span class="font-medium text-agro-dark">{{ phase.key }}</span>
              </button>
            </div>
            <p v-else class="px-4 py-3 text-sm text-agro-light">Всі фази вже додано</p>
            <div class="border-t border-agro-border">
              <div v-if="!showAddPhaseInline" class="px-4 py-3">
                <button @click="showAddPhaseInline = true" class="text-sm text-agro font-medium hover:underline">+ Додати свою фазу</button>
              </div>
              <div v-else class="px-4 py-3 space-y-2">
                <div class="flex gap-2">
                  <input v-model="newPhaseEmoji" class="input w-12 text-center text-base px-1 py-1.5 shrink-0" placeholder="🌱" maxlength="2" />
                  <input v-model="newPhaseName" @keyup.enter="addCustomPhase" class="input flex-1 text-sm py-1.5" placeholder="Назва фази..." />
                </div>
                <div class="flex gap-2">
                  <button @click="showAddPhaseInline = false; newPhaseName = ''" class="btn-outline flex-1 py-1.5 text-sm">Скасувати</button>
                  <button @click="addCustomPhase" :disabled="!newPhaseName.trim()" class="btn-primary flex-1 py-1.5 text-sm">Додати</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- Модал нагадування -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="reminderTreatment" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="reminderTreatment = null" />
        <div class="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md z-10 max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl px-6 pt-6 pb-4 border-b border-agro-border">
            <div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
            <h2 class="font-bold text-agro-dark text-lg">Нагадування для фермера</h2>
            <p class="text-sm text-agro-light mt-0.5 truncate">{{ reminderTreatment.product_name }}</p>
          </div>
          <div class="px-6 py-5 space-y-5">
            <div>
              <label class="block text-sm font-semibold text-agro-dark mb-3">Дата</label>
              <div class="bg-agro-bg rounded-2xl p-4">
                <div class="flex items-center justify-between mb-4">
                  <button @click="rPrevMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-agro-dark font-bold">‹</button>
                  <span class="font-semibold text-agro-dark text-sm">{{ rMonthLabel }}</span>
                  <button @click="rNextMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-agro-dark font-bold">›</button>
                </div>
                <div class="grid grid-cols-7 mb-1">
                  <div v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']" :key="d" class="text-center text-xs font-medium text-agro-light py-1">{{ d }}</div>
                </div>
                <div class="grid grid-cols-7 gap-0.5">
                  <div v-for="blank in rFirstDayOffset" :key="'b'+blank" />
                  <button v-for="day in rDaysInMonth" :key="day"
                    @click="!rIsPastDay(day) && rSelectDay(day)" :disabled="rIsPastDay(day)"
                    class="aspect-square flex items-center justify-center text-sm rounded-xl transition-colors font-medium"
                    :class="[rIsPastDay(day) ? 'text-gray-300 cursor-not-allowed' : '', rIsSelectedDay(day) ? 'bg-agro text-white' : (!rIsPastDay(day) ? 'hover:bg-white text-agro-dark' : ''), rIsToday(day) && !rIsSelectedDay(day) ? 'text-agro font-bold' : '']">
                    {{ day }}
                  </button>
                </div>
              </div>
              <p v-if="rDate" class="text-xs text-agro mt-2 font-medium text-center">📅 {{ rFormatDate }}</p>
            </div>
            <div>
              <label class="block text-sm font-semibold text-agro-dark mb-3">Час</label>
              <div class="flex items-center gap-3 bg-agro-bg rounded-2xl px-5 py-4">
                <div class="flex-1">
                  <p class="text-xs text-agro-light text-center mb-2">Години</p>
                  <select v-model="rHour" class="w-full bg-white border border-agro-border rounded-xl px-3 py-2.5 text-center text-agro-dark font-semibold text-lg appearance-none focus:outline-none focus:border-agro cursor-pointer">
                    <option v-for="h in 24" :key="h-1" :value="h-1">{{ String(h-1).padStart(2,'0') }}</option>
                  </select>
                </div>
                <span class="text-2xl font-bold text-agro-dark mt-5">:</span>
                <div class="flex-1">
                  <p class="text-xs text-agro-light text-center mb-2">Хвилини</p>
                  <select v-model="rMinute" class="w-full bg-white border border-agro-border rounded-xl px-3 py-2.5 text-center text-agro-dark font-semibold text-lg appearance-none focus:outline-none focus:border-agro cursor-pointer">
                    <option v-for="m in [0,5,10,15,20,25,30,35,40,45,50,55]" :key="m" :value="m">{{ String(m).padStart(2,'0') }}</option>
                  </select>
                </div>
              </div>
              <p class="text-center text-agro font-bold text-base mt-2">🕐 {{ String(rHour).padStart(2,'0') }}:{{ String(rMinute).padStart(2,'0') }}</p>
            </div>
          </div>
          <div class="sticky bottom-0 bg-white border-t border-agro-border px-6 py-4 flex gap-3">
            <button @click="reminderTreatment = null" class="btn-outline flex-1">Скасувати</button>
            <button @click="saveReminder" :disabled="!rDate || rSaving" class="btn-primary flex-1">
              {{ rSaving ? '...' : 'Надіслати нагадування' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Trash2, X, Bell } from 'lucide-vue-next'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const farmId = route.params.farmId as string
const readOnly = route.query.readOnly === '1'
const supabase = useSupabaseClient()

const loading = ref(true)
const saving = ref(false)
const savingPhase = ref<string | null>(null)
const farmName = ref('')
const crops = ref<any[]>([])
const selectedCrop = ref<any>(null)
const program = ref<any>(null)
const treatments = ref<any[]>([])
const allPhases = ref<any[]>([])
const phases = ref<any[]>([])
const activePhasesKeys = ref<string[]>([])

const showPhasePicker = ref(false)
const showAddPhaseInline = ref(false)
const newPhaseName = ref('')
const newPhaseEmoji = ref('🌱')
const productSuggestions = ref<any[]>([])
const showSuggestionsFor = ref<string | null>(null)
const inlineT = ref<Record<string, { product_name: string; type: string; dosage: string; notes: string }>>({})
let searchTimer: any = null

const TYPE_ICONS: Record<string, string> = { підживлення: '🌿', захист: '🛡', гербіцид: '🌾', фунгіцид: '🍄', інсектицид: '🐛' }
const TYPE_BG: Record<string, string> = { підживлення: 'bg-amber-50', захист: 'bg-blue-50', гербіцид: 'bg-orange-50', фунгіцид: 'bg-purple-50', інсектицид: 'bg-red-50' }
const TYPE_BADGE: Record<string, string> = {
  підживлення: 'bg-amber-50 border-amber-200 text-amber-700',
  захист: 'bg-blue-50 border-blue-200 text-blue-700',
  гербіцид: 'bg-orange-50 border-orange-200 text-orange-700',
  фунгіцид: 'bg-purple-50 border-purple-200 text-purple-700',
  інсектицид: 'bg-red-50 border-red-200 text-red-700',
}

const CROP_GROUPS: Record<string, string> = {
  'пшениця': 'grain', 'ячмінь': 'grain', 'жито': 'grain', 'овес': 'grain', 'кукурудза': 'corn',
  'соняшник': 'oilseed', 'ріпак': 'oilseed', 'соя': 'legume', 'горох': 'legume',
  'томат': 'veg_nightshade', 'помідор': 'veg_nightshade', 'перець': 'veg_nightshade', 'картопля': 'veg_nightshade',
  'огірок': 'veg_cucurbit', 'кабачок': 'veg_cucurbit', 'гарбуз': 'veg_cucurbit',
  'капуста': 'veg_brassica', 'цибуля': 'veg_allium', 'часник': 'veg_allium',
  'морква': 'veg_root', 'буряк': 'veg_root', 'цукровий буряк': 'technical',
  'смородина': 'berry_shrub', 'малина': 'berry_shrub', 'виноград': 'berry_shrub',
  'полуниця': 'berry_herb', 'суниця': 'berry_herb', 'лохина': 'berry_herb',
  'яблуня': 'fruit_pome', 'яблука': 'fruit_pome', 'груша': 'fruit_pome',
  'вишня': 'fruit_stone', 'черешня': 'fruit_stone', 'слива': 'fruit_stone', 'персик': 'fruit_stone',
}

const getCropGroup = (crop: string) => {
  const lower = crop?.toLowerCase().trim() || ''
  for (const [key, group] of Object.entries(CROP_GROUPS)) {
    if (lower === key) return group
  }
  for (const [key, group] of Object.entries(CROP_GROUPS)) {
    if (lower.includes(key)) return group
  }
  return null
}

const treatmentsByPhase = computed(() => {
  const map: Record<string, any[]> = {}
  for (const t of treatments.value) {
    const key = t.phase || '__none__'
    if (!map[key]) map[key] = []
    map[key].push(t)
  }
  return map
})

const activePhases = computed(() =>
  activePhasesKeys.value.map(key => phases.value.find(p => p.key === key)).filter(Boolean)
)
const availablePhases = computed(() => phases.value.filter(p => !activePhasesKeys.value.includes(p.key)))

const ensureInlineT = (key: string) => {
  if (!inlineT.value[key]) inlineT.value[key] = { product_name: '', type: 'підживлення', dosage: '', notes: '' }
}

const { data: { session } } = await supabase.auth.getSession()

onMounted(async () => {
  const { data: phasesData } = await supabase.from('growth_phases').select('*').order('order_num', { ascending: true })
  allPhases.value = (phasesData || []).map((p: any) => ({ key: p.key, emoji: p.emoji, order: p.order_num, crop_groups: p.crop_groups }))

  const { data: farmData } = await supabase.from('farms').select('name, farm_crops(id, crop_type, variety)').eq('id', farmId).single()
  farmName.value = farmData?.name || ''
  crops.value = farmData?.farm_crops || []
  if (crops.value.length > 0) await selectCrop(crops.value[0])
  loading.value = false
})

const selectCrop = async (crop: any) => {
  selectedCrop.value = crop
  program.value = null
  treatments.value = []
  activePhasesKeys.value = []

  const cropGroup = getCropGroup(crop.crop_type)
  phases.value = allPhases.value.filter(
    (p: any) => !p.crop_groups || !cropGroup || p.crop_groups.includes(cropGroup)
  )

  const { data: programData } = await supabase
    .from('protection_programs').select('*').eq('farm_crop_id', crop.id).maybeSingle()
  program.value = programData
  if (programData) {
    const { data: treatmentsData } = await supabase
      .from('program_treatments').select('*').eq('program_id', programData.id).order('phase_order', { ascending: true })
    treatments.value = treatmentsData || []
    await loadTreatmentReminders(treatmentsData || [])
    const usedPhaseKeys = [...new Set(treatmentsData?.map((t: any) => t.phase).filter(Boolean) || [])]
    const orderedKeys = phases.value.map(p => p.key).filter(k => usedPhaseKeys.includes(k))
    activePhasesKeys.value = orderedKeys
    orderedKeys.forEach(ensureInlineT)
  }
}

const createProgram = async () => {
  if (!selectedCrop.value) return
  saving.value = true
  const { data } = await supabase.from('protection_programs').upsert({
    farm_crop_id: selectedCrop.value.id,
    name: `Програма для ${selectedCrop.value.crop_type}`,
    description: `Календар живлення та захисту для ${selectedCrop.value.crop_type}`,
  }, { onConflict: 'farm_crop_id' }).select().single()
  program.value = data
  saving.value = false
}

const removePhase = async (phase: any) => {
  const count = treatmentsByPhase.value[phase.key]?.length || 0
  if (count > 0 && !await confirmDialog(`Фаза "${phase.key}" та ${count} обробок у ній будуть видалені.`, { title: 'Видалити фазу?' })) return
  if (count > 0 && program.value) {
    const ids = treatmentsByPhase.value[phase.key].map((t: any) => t.id)
    await supabase.from('program_treatments').delete().in('id', ids)
    treatments.value = treatments.value.filter(t => t.phase !== phase.key)
  }
  activePhasesKeys.value = activePhasesKeys.value.filter(k => k !== phase.key)
}

const addActivePhase = (phase: any) => {
  if (!activePhasesKeys.value.includes(phase.key)) {
    activePhasesKeys.value.push(phase.key)
    ensureInlineT(phase.key)
  }
  showPhasePicker.value = false
  showAddPhaseInline.value = false
}

const saveTreatment = async (phase: any) => {
  const t = inlineT.value[phase.key]
  if (!t?.product_name || !program.value) return
  savingPhase.value = phase.key
  const payload = {
    program_id: program.value.id,
    phase: phase.key,
    phase_order: phase.order ?? 99,
    type: t.type,
    product_name: t.product_name,
    dosage: t.dosage || null,
    notes: t.notes || null,
  }
  const { data: inserted } = await supabase.from('program_treatments').insert(payload).select().single()
  if (inserted) treatments.value = [...treatments.value, inserted]
  else {
    const { data } = await supabase.from('program_treatments').select('*').eq('program_id', program.value.id).order('phase_order', { ascending: true })
    treatments.value = data || []
  }
  t.product_name = ''
  t.dosage = ''
  t.notes = ''
  savingPhase.value = null
}

const addCustomPhase = async () => {
  if (!newPhaseName.value.trim()) return
  const newOrderNum = phases.value.length + 1
  const { data: inserted } = await supabase.from('growth_phases').insert({
    key: newPhaseName.value.trim(),
    emoji: newPhaseEmoji.value || '🌱',
    order_num: newOrderNum,
    is_default: false,
    created_by: session?.user?.id,
  }).select().single()
  const newPhase = inserted || { key: newPhaseName.value.trim(), emoji: newPhaseEmoji.value || '🌱', order: newOrderNum }
  phases.value = [...phases.value, newPhase]
  newPhaseName.value = ''
  newPhaseEmoji.value = '🌱'
  showAddPhaseInline.value = false
  addActivePhase(newPhase)
}

const { confirm: confirmDialog } = useConfirm()

const deleteTreatment = async (t: any) => {
  if (!await confirmDialog(`"${t.product_name}" буде видалено з програми.`, { title: 'Видалити обробку?' })) return
  await supabase.from('program_treatments').delete().eq('id', t.id)
  treatments.value = treatments.value.filter(tr => tr.id !== t.id)
}

const searchProducts = (phaseKey: string) => {
  clearTimeout(searchTimer)
  const q = inlineT.value[phaseKey]?.product_name.trim()
  if (!q || q.length < 2) { productSuggestions.value = []; return }
  searchTimer = setTimeout(async () => {
    const { data } = await supabase.from('seller_offers')
      .select('id, product_name, price, seller_profiles(company_name)')
      .ilike('product_name', `%${q}%`).eq('in_stock', true).limit(8)
    productSuggestions.value = data || []
  }, 300)
}

const selectProduct = (phaseKey: string, p: any) => {
  inlineT.value[phaseKey].product_name = p.product_name
  productSuggestions.value = []
  showSuggestionsFor.value = null
}

const hideSuggestions = () => {
  setTimeout(() => { showSuggestionsFor.value = null }, 200)
}

// Reminder info tooltip
const treatmentReminders = ref<Record<string, any[]>>({})
const activeReminderInfo = ref<string | null>(null)

const toggleReminderInfo = (t: any) => {
  activeReminderInfo.value = activeReminderInfo.value === t.id ? null : t.id
}

const loadTreatmentReminders = async (ts: any[]) => {
  if (!ts.length) return
  const names = [...new Set(ts.map((t: any) => t.product_name).filter(Boolean))]
  const { data } = await supabase.from('reminders')
    .select('id, description, scheduled_date')
    .eq('created_by', session?.user?.id)
    .eq('from_agronomist', true)
    .in('description', names)
    .order('scheduled_date', { ascending: true })
  const map: Record<string, any[]> = {}
  for (const r of data || []) {
    if (!map[r.description]) map[r.description] = []
    map[r.description].push(r)
  }
  treatmentReminders.value = map
}

const formatReminderDate = (d: string) => new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })

// Reminder from treatment (creates reminder for the farmer)
const reminderTreatment = ref<any>(null)
const rDate = ref('')
const rHour = ref(9)
const rMinute = ref(0)
const rSaving = ref(false)
const rCalMonth = ref(new Date().getMonth())
const rCalYear = ref(new Date().getFullYear())

const UK_MONTHS_R = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']
const UK_MONTHS_GEN_R = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']
const rMonthLabel = computed(() => `${UK_MONTHS_R[rCalMonth.value]} ${rCalYear.value}`)
const rFirstDayOffset = computed(() => { const d = new Date(rCalYear.value, rCalMonth.value, 1).getDay(); return d === 0 ? 6 : d - 1 })
const rDaysInMonth = computed(() => new Date(rCalYear.value, rCalMonth.value + 1, 0).getDate())
const rPrevMonth = () => { if (rCalMonth.value === 0) { rCalMonth.value = 11; rCalYear.value-- } else rCalMonth.value-- }
const rNextMonth = () => { if (rCalMonth.value === 11) { rCalMonth.value = 0; rCalYear.value++ } else rCalMonth.value++ }
const rSelectDay = (day: number) => { const m = String(rCalMonth.value + 1).padStart(2,'0'); const d = String(day).padStart(2,'0'); rDate.value = `${rCalYear.value}-${m}-${d}` }
const rIsSelectedDay = (day: number) => { if (!rDate.value) return false; const [y,m,d] = rDate.value.split('-').map(Number); return y === rCalYear.value && m === rCalMonth.value + 1 && d === day }
const rIsToday = (day: number) => { const t = new Date(); return t.getFullYear() === rCalYear.value && t.getMonth() === rCalMonth.value && t.getDate() === day }
const rIsPastDay = (day: number) => { const t = new Date(); t.setHours(0,0,0,0); return new Date(rCalYear.value, rCalMonth.value, day) < t }
const rFormatDate = computed(() => { if (!rDate.value) return ''; const [y,m,d] = rDate.value.split('-').map(Number); return `${d} ${UK_MONTHS_GEN_R[m-1]} ${y}` })

const openReminderFor = (t: any) => {
  reminderTreatment.value = t
  rDate.value = ''
  rHour.value = 9
  rMinute.value = 0
  const now = new Date()
  rCalMonth.value = now.getMonth()
  rCalYear.value = now.getFullYear()
}

const saveReminder = async () => {
  if (!rDate.value || !reminderTreatment.value) return
  rSaving.value = true
  // Find farmer_id from field_shares
  const { data: shareData } = await supabase.from('field_shares')
    .select('farmer_id')
    .eq('farm_id', farmId)
    .eq('agronomist_id', session?.user?.id)
    .eq('status', 'accepted')
    .maybeSingle()
  const farmerId = shareData?.farmer_id
  if (!farmerId) { rSaving.value = false; return }
  const [y,m,d] = rDate.value.split('-').map(Number)
  const iso = new Date(y, m-1, d, Number(rHour.value), Number(rMinute.value), 0).toISOString()
  await supabase.from('reminders').insert({
    user_id: farmerId,
    description: reminderTreatment.value.product_name,
    scheduled_date: iso,
    type: 'обробка',
    from_agronomist: true,
    created_by: session?.user?.id,
  })
  rSaving.value = false
  reminderTreatment.value = null
  await loadTreatmentReminders(treatments.value)
}

onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.reminder-info-wrap')) activeReminderInfo.value = null
  })
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.dash-page { padding: 44px 56px; font-family: Manrope, sans-serif; max-width: 1196px; }
.dash-head { margin-bottom: 28px; }
.dash-title { font-family: 'Bitter', Georgia, serif; font-weight: 800; font-size: 28px; color: rgb(27,46,27); margin: 0; }
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-subtitle { font-size: 15.5px; color: rgb(107,122,100); margin: 4px 0 0; }
.dash-icon-box { width: 40px; height: 40px; border-radius: 10px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
@media (max-width: 640px) { .dash-page { padding: 24px 20px; } }
</style>
