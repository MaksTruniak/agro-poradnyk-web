<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Журнал обробок</h1>
        <p class="dash-subtitle">Що, коли і скільки внесено на кожне поле</p>
      </div>
      <div class="flex gap-2 shrink-0">
        <button v-if="hasPaidPlan && items.length" @click="exportCsv" class="btn-outline inline-flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          CSV
        </button>
        <button v-if="hasPaidPlan" @click="openAdd" class="btn-primary inline-flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Додати
        </button>
      </div>
    </div>

    <!-- Завантаження плану -->
    <div v-if="planLoading" class="space-y-3">
      <div class="card animate-pulse h-16" />
      <div class="card animate-pulse h-16" />
      <div class="card animate-pulse h-16" />
    </div>

    <!-- Upgrade для Basic -->
    <div v-else-if="!hasPaidPlan" class="card text-center py-16">
      <div class="w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-5">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
        </svg>
      </div>
      <p class="font-bold text-agro-dark text-lg mb-2">Журнал обробок поля</p>
      <p class="text-agro-light text-sm mb-5 max-w-sm mx-auto">Ведіть детальний облік усіх обробок — необхідно для сертифікації GlobalG.A.P, органіки та загального порядку в господарстві. Доступно на тарифі Бізнес.</p>
      <NuxtLink to="/dashboard/subscription" class="dash-btn-primary inline-flex">Перейти на Бізнес →</NuxtLink>
    </div>

    <template v-else-if="hasPaidPlan">
      <!-- Фільтри -->
      <div v-if="items.length" class="flex flex-wrap gap-3 mb-5">
        <UiAppSelect v-model="filterFarm" :options="[{ value: '', label: 'Всі поля' }, ...farms.map(f => ({ value: f.id, label: f.name }))]" class="w-44" />
        <UiAppSelect v-model="filterType" :options="[{ value: '', label: 'Всі типи' }, ...Object.entries(TYPES).map(([k, t]) => ({ value: k, label: t.label }))]" class="w-44" />
        <UiAppSelect v-model="filterMonth" :options="[{ value: '', label: 'Всі місяці' }, ...MONTHS.map((m, i) => ({ value: i + 1, label: m }))]" class="w-40" />
        <span class="text-sm text-agro-light self-center ml-auto">{{ filtered.length }} записів</span>
      </div>

      <!-- Підсумки -->
      <div v-if="filtered.length" class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div class="card">
          <p class="text-xs text-agro-light uppercase tracking-wide mb-1 font-semibold">Обробок</p>
          <p class="text-2xl font-bold text-agro-dark">{{ filtered.length }}</p>
        </div>
        <div class="card">
          <p class="text-xs text-agro-light uppercase tracking-wide mb-1 font-semibold">Площа (га)</p>
          <p class="text-2xl font-bold text-agro-dark">{{ totalArea.toLocaleString('uk-UA', {maximumFractionDigits:1}) }}</p>
        </div>
        <div class="card col-span-2">
          <p class="text-xs text-agro-light uppercase tracking-wide mb-1 font-semibold">Препаратів витрачено</p>
          <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            <span v-for="u in unitTotals" :key="u.unit" class="text-lg font-bold text-agro-dark">
              {{ u.total.toLocaleString('uk-UA', {maximumFractionDigits:1}) }} <span class="text-sm font-normal text-agro-light">{{ u.unit }}</span>
            </span>
            <span v-if="!unitTotals.length" class="text-agro-light text-sm">—</span>
          </div>
        </div>
      </div>

      <!-- Список -->
      <div v-if="loading" class="space-y-2">
        <div v-for="i in 6" :key="i" class="card animate-pulse h-16" />
      </div>

      <div v-else-if="filtered.length === 0" class="card text-center py-16 text-agro-light">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" class="mx-auto mb-3 opacity-40">
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
        </svg>
        <p class="font-semibold text-agro-dark mb-1">Записів поки немає</p>
        <p class="text-sm">Додайте першу обробку, щоб почати вести журнал</p>
      </div>

      <div v-else class="space-y-2">
        <div v-for="item in filtered" :key="item.id" class="card flex items-start gap-4 py-3.5 px-4">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            :class="getTypeInfo(item.product_type).bgClass || ''"
            :style="!getTypeInfo(item.product_type).bgClass ? { background: '#eef1e3' } : {}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              :stroke="getTypeInfo(item.product_type).color"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
              v-html="getTypeInfo(item.product_type).icon" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="font-semibold text-agro-dark text-sm">{{ item.product_name }}</p>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="getTypeInfo(item.product_type).bgClass ? TREATMENT_TYPES.find(t=>t.value===item.product_type)?.badge : ''"
                :style="!getTypeInfo(item.product_type).bgClass ? { background: '#eef1e3', color: '#2F5233' } : {}">
                {{ getTypeInfo(item.product_type).label }}
              </span>
              <span v-if="item.crop_type" class="text-xs text-agro-light bg-agro-hover px-2 py-0.5 rounded-full">{{ item.crop_type }}</span>
            </div>
            <div class="flex items-center gap-3 mt-1 flex-wrap">
              <span class="text-xs text-agro-light">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="inline mr-0.5 -mt-0.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {{ formatDate(item.treatment_date) }}
              </span>
              <span v-if="item.farm_name" class="text-xs text-agro-light">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="inline mr-0.5 -mt-0.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                {{ item.farm_name }}
              </span>
              <span v-if="item.area_ha" class="text-xs text-agro-light">{{ item.area_ha }} га</span>
              <span v-if="item.total_amount" class="text-xs font-semibold text-agro-dark">{{ item.total_amount }} {{ item.unit }}</span>
            </div>
            <p v-if="item.notes" class="text-xs text-agro-light mt-1 italic">{{ item.notes }}</p>
          </div>
          <div class="flex gap-1 shrink-0">
            <button @click="openEdit(item)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-agro-hover text-agro transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button @click="deleteItem(item)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Модалка -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="modal.open = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
            <div class="px-6 pt-6 pb-4 border-b border-agro-border flex items-center justify-between">
              <h2 class="font-extrabold text-agro-dark text-lg">{{ modal.id ? 'Редагувати запис' : 'Нова обробка' }}</h2>
              <button @click="modal.open = false" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-agro-bg text-agro-light">✕</button>
            </div>
            <div class="px-6 py-5 space-y-4">
              <div>
                <label class="modal-label">Поле / Господарство</label>
                <UiAppSelect v-model="modal.farm_id" :options="[{ value: '', label: 'Без прив\'язки' }, ...farms.map(f => ({ value: f.id, label: f.name }))]" @update:modelValue="onFarmChange" />
              </div>
              <div>
                <label class="modal-label">Дата обробки</label>
                <div class="bg-agro-bg rounded-2xl p-3">
                  <div class="flex items-center justify-between mb-3">
                    <button type="button" @click="tPrevMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-agro-dark font-bold">‹</button>
                    <span class="font-semibold text-agro-dark text-sm">{{ tMonthLabel }}</span>
                    <button type="button" @click="tNextMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-agro-dark font-bold">›</button>
                  </div>
                  <div class="grid grid-cols-7 mb-1">
                    <div v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']" :key="d" class="text-center text-xs font-medium text-agro-light py-1">{{ d }}</div>
                  </div>
                  <div class="grid grid-cols-7 gap-0.5">
                    <div v-for="blank in tFirstDayOffset" :key="'b'+blank" />
                    <button v-for="day in tDaysInMonth" :key="day" type="button"
                      @click="tSelectDay(day)"
                      class="aspect-square flex items-center justify-center text-sm rounded-xl transition-colors font-medium"
                      :class="[tIsSelectedDay(day) ? 'bg-agro text-white' : 'hover:bg-white text-agro-dark', tIsToday(day) && !tIsSelectedDay(day) ? 'text-agro font-bold' : '']"
                    >{{ day }}</button>
                  </div>
                  <p v-if="tFormatDate" class="text-xs text-agro mt-2 font-medium text-center">📅 {{ tFormatDate }}</p>
                </div>
              </div>
              <div>
                <label class="modal-label">Культура</label>
                <UiAppSelect v-if="farmCrops.length" v-model="modal.crop_type"
                  :options="[{ value: '', label: 'Оберіть культуру' }, ...farmCrops.map(c => ({ value: c, label: c }))]" />
                <input v-else v-model="modal.crop_type" class="modal-input" placeholder="смородина" />
              </div>
              <div>
                <label class="modal-label">Тип обробки</label>
                <div class="grid grid-cols-3 gap-2">
                  <button v-for="t in TREATMENT_TYPES" :key="t.value" type="button" @click="modal.product_type = t.value"
                    class="flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 text-xs transition-colors"
                    :class="modal.product_type === t.value ? 'border-agro bg-agro-hover text-agro font-semibold' : 'border-agro-border text-agro-light hover:border-agro/40'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="t.icon" />
                    <span>{{ t.label }}</span>
                  </button>
                </div>
              </div>
              <div>
                <label class="modal-label">Назва препарату / заходу</label>
                <input v-model="modal.product_name" class="modal-input" placeholder="Актара 25 WG, Нітроамофоска..." />
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="modal-label">Норма / га</label>
                  <input type="number" v-model.number="modal.dose_per_ha" class="modal-input" placeholder="0.5" step="0.01" min="0" @input="calcTotal" />
                </div>
                <div>
                  <label class="modal-label">Площа (га)</label>
                  <input type="number" v-model.number="modal.area_ha" class="modal-input" :placeholder="farmArea || '0'" step="0.1" min="0" @input="calcTotal" />
                </div>
                <div>
                  <label class="modal-label">Одиниця</label>
                  <UiAppSelect v-model="modal.unit" :options="['л','мл','кг','г','т'].map(u => ({ value: u, label: u }))" />
                </div>
              </div>
              <div v-if="modal.total_amount !== null && modal.total_amount !== undefined && modal.total_amount > 0"
                class="bg-agro-hover rounded-xl px-4 py-3 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span class="text-sm text-agro-dark">Всього: <strong>{{ modal.total_amount }} {{ modal.unit }}</strong></span>
              </div>
              <div>
                <label class="modal-label">Примітки</label>
                <textarea v-model="modal.notes" class="modal-input resize-none" rows="2" placeholder="Погода, умови, фаза розвитку..." />
              </div>

              <!-- Нагадування -->
              <div v-if="!modal.id" class="rounded-2xl border border-agro-border bg-agro-bg p-4">
                <label class="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" v-model="modal.addReminder" class="w-4 h-4 rounded accent-agro" @change="onAddReminderToggle" />
                  <span class="text-sm font-semibold text-agro-dark">Додати нагадування</span>
                </label>
                <div v-if="modal.addReminder" class="mt-3 space-y-3">
                  <!-- Календар -->
                  <div class="bg-white rounded-2xl p-3">
                    <div class="flex items-center justify-between mb-3">
                      <button type="button" @click="rPrevMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-agro-bg transition-colors text-agro-dark font-bold">‹</button>
                      <span class="font-semibold text-agro-dark text-sm">{{ rMonthLabel }}</span>
                      <button type="button" @click="rNextMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-agro-bg transition-colors text-agro-dark font-bold">›</button>
                    </div>
                    <div class="grid grid-cols-7 mb-1">
                      <div v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']" :key="d" class="text-center text-xs font-medium text-agro-light py-1">{{ d }}</div>
                    </div>
                    <div class="grid grid-cols-7 gap-0.5">
                      <div v-for="blank in rFirstDayOffset" :key="'b'+blank" />
                      <button v-for="day in rDaysInMonth" :key="day" type="button"
                        @click="!rIsPastDay(day) && rSelectDay(day)" :disabled="rIsPastDay(day)"
                        class="aspect-square flex items-center justify-center text-sm rounded-xl transition-colors font-medium"
                        :class="[rIsPastDay(day) ? 'text-gray-300 cursor-not-allowed' : '', rIsSelectedDay(day) ? 'bg-agro text-white' : (!rIsPastDay(day) ? 'hover:bg-agro-bg text-agro-dark' : ''), rIsToday(day) && !rIsSelectedDay(day) ? 'text-agro font-bold' : '']"
                      >{{ day }}</button>
                    </div>
                    <p v-if="modal.reminderDate" class="text-xs text-agro mt-2 font-medium text-center">📅 {{ rFormatDate }}</p>
                  </div>
                  <!-- Час -->
                  <div class="flex items-center gap-3 bg-white rounded-2xl px-4 py-3">
                    <div class="flex-1">
                      <p class="text-xs text-agro-light text-center mb-1.5">Години</p>
                      <select v-model="modal.reminderHour" class="w-full bg-agro-bg border border-agro-border rounded-xl px-3 py-2 text-center text-agro-dark font-semibold text-base appearance-none focus:outline-none focus:border-agro cursor-pointer">
                        <option v-for="h in 24" :key="h-1" :value="h-1">{{ String(h-1).padStart(2,'0') }}</option>
                      </select>
                    </div>
                    <span class="text-xl font-bold text-agro-dark mt-4">:</span>
                    <div class="flex-1">
                      <p class="text-xs text-agro-light text-center mb-1.5">Хвилини</p>
                      <select v-model="modal.reminderMinute" class="w-full bg-agro-bg border border-agro-border rounded-xl px-3 py-2 text-center text-agro-dark font-semibold text-base appearance-none focus:outline-none focus:border-agro cursor-pointer">
                        <option v-for="m in [0,5,10,15,20,25,30,35,40,45,50,55]" :key="m" :value="m">{{ String(m).padStart(2,'0') }}</option>
                      </select>
                    </div>
                  </div>
                  <p class="text-center text-agro font-bold text-sm">🕐 {{ String(modal.reminderHour).padStart(2,'0') }}:{{ String(modal.reminderMinute).padStart(2,'0') }}</p>
                </div>
              </div>
            </div>
            <div class="flex gap-3 mt-6 px-6 pb-6">
              <button @click="modal.open = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="save" :disabled="saving || !modal.product_name || !modal.treatment_date"
                class="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center">
                {{ saving ? 'Збереження...' : 'Зберегти' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Журнал обробок — АгроПростір' })

const supabase = useSupabaseClient()
const { confirm: confirmDialog } = useConfirm()

const loading = ref(true)
const planLoading = ref(true)
const saving = ref(false)
const items = ref<any[]>([])
const farms = ref<any[]>([])
const hasPaidPlan = ref(false)

const filterFarm = ref('')
const filterType = ref('')
const filterMonth = ref<number | ''>('')

const MONTHS = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']

import { TREATMENT_TYPES } from '~/utils/treatmentTypes'
// Для відображення іконок і кольорів у списку (підтримка старих англ. ключів і нових укр.)
const LEGACY_TYPES: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  fungicide:   { label: 'Обробка',     bg: '#fef2f2', color: '#dc2626', icon: '<path d="M9 3h6"/><path d="M10 3v5L5 17.5A1 1 0 006 19h12a1 1 0 00.87-1.5L14 8V3"/><line x1="8" y1="13" x2="16" y2="13"/>' },
  insecticide: { label: 'Інсектицид', bg: '#fff7ed', color: '#ea580c', icon: '<ellipse cx="12" cy="13" rx="5" ry="6"/><path d="M12 7V3"/>' },
  herbicide:   { label: 'Гербіцид',   bg: '#f0fdf4', color: '#16a34a', icon: '<path d="M12 22V12"/><path d="M12 12C12 12 7 9 5 5c4 0 6 2 7 7z"/>' },
  fertilizer:  { label: 'Підживлення',bg: '#fefce8', color: '#ca8a04', icon: '<path d="M12 22V12"/><path d="M5 3a7 7 0 0 0 7 7 7 7 0 0 0-7-7"/>' },
  irrigation:  { label: 'Полив',      bg: '#eff6ff', color: '#2563eb', icon: '<path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>' },
  tillage:     { label: 'Обробіток',  bg: '#f5f3ff', color: '#7c3aed', icon: '<path d="M3 12h18M3 6h18M3 18h18"/>' },
  harvest:     { label: 'Збір',       bg: '#fff7ed', color: '#c2410c', icon: '<path d="M3 17l4-8 4 4 4-6 4 10"/><path d="M3 21h18"/>' },
  sowing:      { label: 'Посів',      bg: '#f0fdf4', color: '#15803d', icon: '<path d="M12 22V12"/><path d="M12 12C12 12 7 10 7 5a5 5 0 0110 0c0 5-5 7-5 7z"/>' },
  other:       { label: 'Інше',       bg: '#f1f5f9', color: '#64748b', icon: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>' },
}
const getTypeInfo = (val: string) => {
  const ut = TREATMENT_TYPES.find(t => t.value === val)
  if (ut) return { label: ut.label, bg: ut.bg.replace('bg-','').replace('-50',''), color: '#2F5233', icon: ut.icon, bgClass: ut.bg }
  const lt = LEGACY_TYPES[val]
  if (lt) return { ...lt, bgClass: '' }
  return { label: val, bg: '#eef1e3', color: '#2F5233', icon: '', bgClass: '' }
}
// TYPES залишається для CSV export і фільтру
const TYPES: Record<string, { label: string }> = Object.fromEntries(
  [...TREATMENT_TYPES.map(t => [t.value, { label: t.label }]),
   ...Object.entries(LEGACY_TYPES).map(([k, v]) => [k, { label: v.label }])]
)

const modal = reactive({
  open: false, id: '', farm_id: '', farm_name: '', crop_type: '',
  treatment_date: new Date().toISOString().slice(0,10),
  product_name: '', product_type: 'захист',
  dose_per_ha: null as number | null, area_ha: null as number | null,
  total_amount: null as number | null, unit: 'л', notes: '',
  addReminder: false,
  reminderDate: '',
  reminderHour: 9 as number,
  reminderMinute: 0 as number,
})

const farmArea = computed(() => {
  const f = farms.value.find(f => f.id === modal.farm_id)
  return f?.hectares || null
})

const farmCrops = computed(() => {
  if (!modal.farm_id) return []
  const f = farms.value.find(f => f.id === modal.farm_id)
  return f?.farm_crops?.map((c: any) => c.crop_type) || []
})

const filtered = computed(() => items.value.filter(i => {
  if (filterFarm.value && i.farm_id !== filterFarm.value) return false
  if (filterType.value && i.product_type !== filterType.value) return false
  if (filterMonth.value) {
    const m = new Date(i.treatment_date).getMonth() + 1
    if (m !== Number(filterMonth.value)) return false
  }
  return true
}))

const totalArea = computed(() => filtered.value.reduce((s, i) => s + (i.area_ha || 0), 0))

const unitTotals = computed(() => {
  const map: Record<string, number> = {}
  for (const i of filtered.value) {
    if (i.total_amount && i.unit) {
      map[i.unit] = (map[i.unit] || 0) + Number(i.total_amount)
    }
  }
  return Object.entries(map).map(([unit, total]) => ({ unit, total }))
})

const UK_MONTHS = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']
const UK_MONTHS_GEN = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']

// Календар для дати обробки
const tCalMonth = ref(new Date().getMonth())
const tCalYear = ref(new Date().getFullYear())
const tMonthLabel = computed(() => `${UK_MONTHS[tCalMonth.value]} ${tCalYear.value} р.`)
const tFirstDayOffset = computed(() => { const d = new Date(tCalYear.value, tCalMonth.value, 1).getDay(); return d === 0 ? 6 : d - 1 })
const tDaysInMonth = computed(() => new Date(tCalYear.value, tCalMonth.value + 1, 0).getDate())
const tPrevMonth = () => { if (tCalMonth.value === 0) { tCalMonth.value = 11; tCalYear.value-- } else tCalMonth.value-- }
const tNextMonth = () => { if (tCalMonth.value === 11) { tCalMonth.value = 0; tCalYear.value++ } else tCalMonth.value++ }
const tSelectDay = (day: number) => { const m = String(tCalMonth.value + 1).padStart(2,'0'); const d = String(day).padStart(2,'0'); modal.treatment_date = `${tCalYear.value}-${m}-${d}` }
const tIsSelectedDay = (day: number) => { if (!modal.treatment_date) return false; const [y,m,d] = modal.treatment_date.split('-').map(Number); return y === tCalYear.value && m === tCalMonth.value + 1 && d === day }
const tIsToday = (day: number) => { const t = new Date(); return t.getFullYear() === tCalYear.value && t.getMonth() === tCalMonth.value && t.getDate() === day }
const tFormatDate = computed(() => { if (!modal.treatment_date) return ''; const [y,m,d] = modal.treatment_date.split('-').map(Number); return `${d} ${UK_MONTHS_GEN[m-1]} ${y}` })

const rCalMonth = ref(new Date().getMonth())
const rCalYear = ref(new Date().getFullYear())
const rMonthLabel = computed(() => `${UK_MONTHS[rCalMonth.value]} ${rCalYear.value} р.`)
const rFirstDayOffset = computed(() => { const d = new Date(rCalYear.value, rCalMonth.value, 1).getDay(); return d === 0 ? 6 : d - 1 })
const rDaysInMonth = computed(() => new Date(rCalYear.value, rCalMonth.value + 1, 0).getDate())
const rPrevMonth = () => { if (rCalMonth.value === 0) { rCalMonth.value = 11; rCalYear.value-- } else rCalMonth.value-- }
const rNextMonth = () => { if (rCalMonth.value === 11) { rCalMonth.value = 0; rCalYear.value++ } else rCalMonth.value++ }
const rSelectDay = (day: number) => { const m = String(rCalMonth.value + 1).padStart(2,'0'); const d = String(day).padStart(2,'0'); modal.reminderDate = `${rCalYear.value}-${m}-${d}` }
const rIsSelectedDay = (day: number) => { if (!modal.reminderDate) return false; const [y,m,d] = modal.reminderDate.split('-').map(Number); return y === rCalYear.value && m === rCalMonth.value + 1 && d === day }
const rIsToday = (day: number) => { const t = new Date(); return t.getFullYear() === rCalYear.value && t.getMonth() === rCalMonth.value && t.getDate() === day }
const rIsPastDay = (day: number) => { const t = new Date(); t.setHours(0,0,0,0); return new Date(rCalYear.value, rCalMonth.value, day) < t }
const rFormatDate = computed(() => { if (!modal.reminderDate) return ''; const [y,m,d] = modal.reminderDate.split('-').map(Number); return `${d} ${UK_MONTHS_GEN[m-1]} ${y}` })

const onAddReminderToggle = () => {
  if (!modal.addReminder) return
  // Дефолтна дата — 2 тижні від дати обробки
  const base = modal.treatment_date ? new Date(modal.treatment_date) : new Date()
  base.setDate(base.getDate() + 14)
  const y = base.getFullYear()
  const m = String(base.getMonth() + 1).padStart(2, '0')
  const d = String(base.getDate()).padStart(2, '0')
  modal.reminderDate = `${y}-${m}-${d}`
  rCalMonth.value = base.getMonth()
  rCalYear.value = base.getFullYear()
}

const calcTotal = () => {
  if (modal.dose_per_ha && modal.area_ha) {
    modal.total_amount = Math.round(modal.dose_per_ha * modal.area_ha * 100) / 100
  } else {
    modal.total_amount = null
  }
}

const onFarmChange = () => {
  const f = farms.value.find(f => f.id === modal.farm_id)
  modal.farm_name = f?.name || ''
  if (f?.hectares && !modal.area_ha) modal.area_ha = parseFloat(f.hectares)
  const crops = f?.farm_crops?.map((c: any) => c.crop_type) || []
  if (crops.length === 1) modal.crop_type = crops[0]
  else modal.crop_type = ''
  calcTotal()
}

const formatDate = (d: string) => {
  return new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
}

const load = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  loading.value = true

  const uid = session.user.id
  const [{ data: sub }, { data: farmsData }, { data: treatmentsData }] = await Promise.all([
    supabase.from('subscriptions').select('plan').eq('user_id', uid).eq('status', 'active').maybeSingle(),
    supabase.from('farms').select('*, farm_crops(*)').eq('user_id', uid).order('name'),
    supabase.from('field_treatments').select('*').eq('user_id', uid).order('treatment_date', { ascending: false }),
  ])

  hasPaidPlan.value = ['business', 'business_pro'].includes(sub?.plan || '')
  farms.value = farmsData || []
  items.value = treatmentsData || []
  loading.value = false
  planLoading.value = false
}

const openAdd = () => {
  Object.assign(modal, {
    open: true, id: '', farm_id: '', farm_name: '', crop_type: '',
    treatment_date: new Date().toISOString().slice(0,10),
    product_name: '', product_type: 'захист',
    dose_per_ha: null, area_ha: null, total_amount: null, unit: 'л', notes: '',
    addReminder: false, reminderDate: '', reminderHour: 9, reminderMinute: 0,
  })
}

const openEdit = (item: any) => {
  Object.assign(modal, { open: true, ...item, addReminder: false, reminderDate: '', reminderHour: 9, reminderMinute: 0 })
  if (item.treatment_date) {
    const d = new Date(item.treatment_date)
    tCalMonth.value = d.getMonth()
    tCalYear.value = d.getFullYear()
  }
}

const save = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  saving.value = true
  const payload = {
    user_id: session.user.id,
    farm_id: modal.farm_id || null,
    farm_name: modal.farm_name || null,
    crop_type: modal.crop_type || null,
    treatment_date: modal.treatment_date,
    product_name: modal.product_name.trim(),
    product_type: modal.product_type,
    dose_per_ha: modal.dose_per_ha || null,
    area_ha: modal.area_ha || null,
    total_amount: modal.total_amount || null,
    unit: modal.unit,
    notes: modal.notes?.trim() || null,
  }
  const shouldAddReminder = !modal.id && modal.addReminder && modal.reminderDate
  const reminderPayload = shouldAddReminder ? {
    title: modal.product_name,
    type: modal.product_type === 'fertilizer' ? 'підживлення'
      : modal.product_type === 'irrigation' ? 'полив'
      : modal.product_type === 'sowing' ? 'посів'
      : modal.product_type === 'harvest' ? 'збір'
      : 'обробка',
    reminderDate: modal.reminderDate,
    reminderHour: modal.reminderHour,
    reminderMinute: modal.reminderMinute,
  } : null

  if (modal.id) {
    await supabase.from('field_treatments').update(payload).eq('id', modal.id)
  } else {
    await supabase.from('field_treatments').insert(payload)
  }

  if (shouldAddReminder && reminderPayload) {
    const d = new Date(`${reminderPayload.reminderDate}T${String(reminderPayload.reminderHour).padStart(2,'0')}:${String(reminderPayload.reminderMinute).padStart(2,'0')}:00`)
    await supabase.from('reminders').insert({
      user_id: session.user.id,
      title: reminderPayload.title,
      type: reminderPayload.type,
      scheduled_date: d.toISOString(),
      from_agronomist: false,
    })
  }

  saving.value = false
  modal.open = false
  await load()
}

const deleteItem = async (item: any) => {
  if (!await confirmDialog(`Запис "${item.product_name}" буде видалено назавжди.`, { title: 'Видалити запис?' })) return
  await supabase.from('field_treatments').delete().eq('id', item.id)
  await load()
}

const exportCsv = () => {
  const headers = ['Дата','Поле','Культура','Препарат','Тип','Норма/га','Площа га','Всього','Одиниця','Примітки']
  const rows = filtered.value.map(i => [
    i.treatment_date, i.farm_name || '', i.crop_type || '',
    i.product_name, TYPES[i.product_type]?.label || i.product_type,
    i.dose_per_ha || '', i.area_ha || '', i.total_amount || '', i.unit || '', i.notes || '',
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `journal-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(load)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.modal-label { display: block; font-size: 13px; font-weight: 600; color: rgb(27,46,27); margin-bottom: 6px; }
.modal-input { width: 100%; padding: 9px 12px; border: 1px solid #dde6d5; border-radius: 10px; font-size: 14px; color: #1B2E1B; background: white; outline: none; }
.modal-input:focus { border-color: #2F5233; box-shadow: 0 0 0 3px rgba(47,82,51,0.08); }
</style>
