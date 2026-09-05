<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 20V13a6 6 0 0112 0v7"/><path d="M4 20h16"/><circle cx="12" cy="7" r="1"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">{{ isAgronomist ? 'Надіслані фермерам' : 'Нагадування' }}</h1>
        <p class="dash-subtitle">{{ isAgronomist ? 'Нагадування, надіслані вашим клієнтам' : 'Заплановані обробки та події' }}</p>
      </div>
      <button v-if="!isAgronomist && !(isTeamMember && isViewer)" @click="openAdd" class="dash-btn-primary shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати нагадування
      </button>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="card animate-pulse h-20"></div>
    </div>

    <template v-else>
      <!-- Агроном: тільки надіслані фермерам -->
      <template v-if="isAgronomist">
        <div v-if="sentReminders.length === 0" class="card text-center py-16">
          <div class="dash-empty-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 20V13a6 6 0 0112 0v7"/><path d="M4 20h16"/><circle cx="12" cy="7" r="1"/>
            </svg>
          </div>
          <p class="font-bold text-agro-dark text-lg mb-2">Нагадувань ще немає</p>
          <p class="text-agro-light">Надсилайте нагадування фермерам через чат або картку поля</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="r in sentReminders" :key="r.id"
            class="card flex items-start gap-4"
            :class="isPast(r.scheduled_date) ? 'opacity-60' : ''">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              :class="isPast(r.scheduled_date) ? 'bg-gray-100 text-gray-400' : 'bg-amber-50 text-amber-600'">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="TYPE_SVG[r.type] || BELL_SVG" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-agro-dark">{{ r.description }}</p>
              <p class="text-xs mt-1 flex items-center gap-1" :class="isPast(r.scheduled_date) ? 'text-gray-400' : 'text-amber-600'">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {{ formatDate(r.scheduled_date) }}
              </p>
            </div>
          </div>
        </div>
      </template>

      <!-- Фермер: звичайний список -->
      <template v-else>
        <div v-if="reminders.length === 0" class="card text-center py-16">
          <div class="dash-empty-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 20V13a6 6 0 0112 0v7"/><path d="M4 20h16"/><circle cx="12" cy="7" r="1"/>
            </svg>
          </div>
          <p class="font-bold text-agro-dark text-lg mb-2">Нагадувань поки немає</p>
          <p class="text-agro-light mb-6">Додайте нагадування про обробку або будь-яку подію</p>
          <button @click="openAdd" class="dash-btn-primary"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg> Додати нагадування</button>
        </div>
        <div v-else class="space-y-3">
          <div v-for="r in reminders" :key="r.id"
            class="card flex items-start gap-4"
            :class="isPast(r.scheduled_date) ? 'opacity-60' : ''">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              :class="isPast(r.scheduled_date) ? 'bg-gray-100 text-gray-400' : 'bg-agro-hover text-agro'">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="TYPE_SVG[r.type] || BELL_SVG" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="font-semibold text-agro-dark">{{ r.description }}</p>
                <span v-if="r.from_agronomist" class="text-xs bg-agro-hover text-agro px-2 py-0.5 rounded-full font-medium shrink-0 inline-flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg> від агронома
                </span>
              </div>
              <p class="text-xs mt-1 flex items-center gap-1" :class="isPast(r.scheduled_date) ? 'text-gray-400' : 'text-agro'">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {{ formatDate(r.scheduled_date) }}
              </p>
            </div>
            <button @click="deleteReminder(r.id)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition-colors shrink-0">
              <Trash2 :size="15" />
            </button>
          </div>
        </div>
      </template>
    </template>

    <!-- Модалка -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAdd" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAdd = false" />
          <div class="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md z-10 max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl px-6 pt-6 pb-4 border-b border-agro-border">
              <div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
              <h2 class="dash-card-title bitter">Нове нагадування</h2>
            </div>

            <div class="px-6 py-5 space-y-5">
              <div>
                <label class="block text-sm font-semibold text-agro-dark mb-2">Назва</label>
                <input v-model="newForm.title" class="input" placeholder="Наприклад: Обприскування пшениці" />
              </div>

              <div>
                <label class="block text-sm font-semibold text-agro-dark mb-2">Тип</label>
                <div class="grid grid-cols-3 gap-2">
                  <button v-for="t in TYPES" :key="t.value" @click="newForm.type = t.value"
                    class="flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 text-xs transition-colors"
                    :class="newForm.type === t.value ? 'border-agro bg-agro-hover text-agro font-semibold' : 'border-agro-border text-agro-light hover:border-agro/40'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="t.icon" />
                    <span>{{ t.label }}</span>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-agro-dark mb-3">Дата</label>
                <div class="bg-agro-bg rounded-2xl p-4">
                  <div class="flex items-center justify-between mb-4">
                    <button @click="prevMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-agro-dark font-bold">‹</button>
                    <span class="font-semibold text-agro-dark text-sm">{{ monthLabel }}</span>
                    <button @click="nextMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-agro-dark font-bold">›</button>
                  </div>
                  <div class="grid grid-cols-7 mb-1">
                    <div v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']" :key="d"
                      class="text-center text-xs font-medium text-agro-light py-1">{{ d }}</div>
                  </div>
                  <div class="grid grid-cols-7 gap-0.5">
                    <div v-for="blank in firstDayOffset" :key="'b'+blank" />
                    <button v-for="day in daysInMonth" :key="day"
                      @click="!isPastDay(day) && selectDay(day)" :disabled="isPastDay(day)"
                      class="aspect-square flex items-center justify-center text-sm rounded-xl transition-colors font-medium"
                      :class="[isPastDay(day) ? 'text-gray-300 cursor-not-allowed' : '', isSelectedDay(day) ? 'bg-agro text-white' : (!isPastDay(day) ? 'hover:bg-white text-agro-dark' : ''), isToday(day) && !isSelectedDay(day) ? 'text-agro font-bold' : '']"
                    >{{ day }}</button>
                  </div>
                </div>
                <p v-if="newForm.date" class="text-xs text-agro mt-2 font-medium text-center">📅 {{ formatSelectedDate }}</p>
              </div>

              <div>
                <label class="block text-sm font-semibold text-agro-dark mb-3">Час</label>
                <div class="flex items-center gap-3 bg-agro-bg rounded-2xl px-5 py-4">
                  <div class="flex-1">
                    <p class="text-xs text-agro-light text-center mb-2">Години</p>
                    <select v-model="newForm.hour" class="w-full bg-white border border-agro-border rounded-xl px-3 py-2.5 text-center text-agro-dark font-semibold text-lg appearance-none focus:outline-none focus:border-agro cursor-pointer">
                      <option v-for="h in 24" :key="h-1" :value="h-1">{{ String(h-1).padStart(2,'0') }}</option>
                    </select>
                  </div>
                  <span class="text-2xl font-bold text-agro-dark mt-5">:</span>
                  <div class="flex-1">
                    <p class="text-xs text-agro-light text-center mb-2">Хвилини</p>
                    <select v-model="newForm.minute" class="w-full bg-white border border-agro-border rounded-xl px-3 py-2.5 text-center text-agro-dark font-semibold text-lg appearance-none focus:outline-none focus:border-agro cursor-pointer">
                      <option v-for="m in MINUTES" :key="m" :value="m">{{ String(m).padStart(2,'0') }}</option>
                    </select>
                  </div>
                </div>
                <p class="text-center text-agro font-bold text-base mt-2">
                  🕐 {{ String(newForm.hour).padStart(2,'0') }}:{{ String(newForm.minute).padStart(2,'0') }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-semibold text-agro-dark mb-2">Нотатка (необов'язково)</label>
                <textarea v-model="newForm.note" class="input resize-none" rows="2" placeholder="Деталі..." />
              </div>
            </div>

            <div class="sticky bottom-0 bg-white border-t border-agro-border px-6 py-4 flex gap-3">
              <button @click="showAdd = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="addReminder" :disabled="!newForm.title || !newForm.date || saving" class="btn-primary flex-1 inline-flex items-center justify-center gap-1.5">
                <svg v-if="!saving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                {{ saving ? '...' : 'Додати' }}
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
useHead({ title: 'Нагадування' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)
const saving = ref(false)
const showAdd = ref(false)
const reminders = ref<any[]>([])
const sentReminders = ref<any[]>([])
const isAgronomist = ref(
  import.meta.client
    ? (localStorage.getItem('agro_active_profile') || localStorage.getItem('agro_user_role')) === 'agronomist'
    : false
)

const TYPES = [
  { value: 'обробка',     label: 'Обробка',     icon: '<path d="M9 3h6"/><path d="M10 3v5L5 17.5A1 1 0 006 19h12a1 1 0 00.87-1.5L14 8V3"/><line x1="8" y1="13" x2="16" y2="13"/>' },
  { value: 'підживлення', label: 'Підживлення', icon: '<path d="M12 22V12"/><path d="M5 3a7 7 0 0 0 7 7 7 7 0 0 0-7-7"/><path d="M19 3a7 7 0 0 1-7 7 7 7 0 0 1 7-7"/>' },
  { value: 'полив',       label: 'Полив',       icon: '<path d="M20 16.2A4.5 4.5 0 0018 8h-1.26a8 8 0 10-12.62 8"/><line x1="8" y1="16" x2="8" y2="21"/><line x1="16" y1="16" x2="16" y2="21"/><line x1="12" y1="19" x2="12" y2="23"/>' },
  { value: 'посів',       label: 'Посів',       icon: '<path d="M12 22V12"/><path d="M12 12C12 12 7 10 7 5a5 5 0 0110 0c0 5-5 7-5 7z"/>' },
  { value: 'збір',        label: 'Збір',        icon: '<path d="M3 17l4-8 4 4 4-6 4 10"/><path d="M3 21h18"/>' },
  { value: 'інше',        label: 'Інше',        icon: '<path d="M6 20V13a6 6 0 0112 0v7"/><path d="M4 20h16"/><circle cx="12" cy="7" r="1"/>' },
]
const TYPE_SVG: Record<string, string> = Object.fromEntries(TYPES.map(t => [t.value, t.icon]))
const BELL_SVG = '<path d="M6 20V13a6 6 0 0112 0v7"/><path d="M4 20h16"/><circle cx="12" cy="7" r="1"/>'
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

const newForm = reactive({ title: '', note: '', type: 'інше', date: '', hour: 9, minute: 0 })

const calMonth = ref(new Date().getMonth())
const calYear = ref(new Date().getFullYear())

const UK_MONTHS = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']
const UK_MONTHS_GEN = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']
const monthLabel = computed(() => `${UK_MONTHS[calMonth.value]} ${calYear.value}`)
const firstDayOffset = computed(() => { const d = new Date(calYear.value, calMonth.value, 1).getDay(); return d === 0 ? 6 : d - 1 })
const daysInMonth = computed(() => new Date(calYear.value, calMonth.value + 1, 0).getDate())
const prevMonth = () => { if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- } else calMonth.value-- }
const nextMonth = () => { if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ } else calMonth.value++ }
const selectDay = (day: number) => { const m = String(calMonth.value + 1).padStart(2,'0'); const d = String(day).padStart(2,'0'); newForm.date = `${calYear.value}-${m}-${d}` }
const isSelectedDay = (day: number) => { if (!newForm.date) return false; const [y,m,d] = newForm.date.split('-').map(Number); return y === calYear.value && m === calMonth.value + 1 && d === day }
const isToday = (day: number) => { const t = new Date(); return t.getFullYear() === calYear.value && t.getMonth() === calMonth.value && t.getDate() === day }
const isPastDay = (day: number) => { const t = new Date(); t.setHours(0,0,0,0); return new Date(calYear.value, calMonth.value, day) < t }
const formatSelectedDate = computed(() => { if (!newForm.date) return ''; const [y,m,d] = newForm.date.split('-').map(Number); return `${d} ${UK_MONTHS_GEN[m-1]} ${y}` })

const openAdd = () => {
  const now = new Date()
  calMonth.value = now.getMonth()
  calYear.value = now.getFullYear()
  Object.assign(newForm, { title: '', note: '', type: 'інше', date: '', hour: 9, minute: 0 })
  showAdd.value = true
}

const { isTeamMember, isViewer, getQueryUserId } = useTeamContext()

const load = async () => {
  const queryUid = await getQueryUserId()  // uid власника в режимі команди
  if (!queryUid) { loading.value = false; return }

  const { data: own } = await supabase.from('reminders')
    .select('*')
    .eq('user_id', queryUid)
    .eq('from_agronomist', false)
    .order('scheduled_date', { ascending: true })
  reminders.value = own || []

  if (isAgronomist.value) {
    const { data: sent } = await supabase.from('reminders')
      .select('*')
      .eq('created_by', queryUid)
      .eq('from_agronomist', true)
      .order('scheduled_date', { ascending: true })
    sentReminders.value = sent || []
  }

  loading.value = false
}
onMounted(load)

const formatDate = (d: string) => d
  ? new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
  : ''

const isPast = (d: string) => d ? new Date(d) < new Date() : false

const addReminder = async () => {
  if (!newForm.title || !newForm.date) return
  if (isTeamMember.value && isViewer.value) return
  saving.value = true
  const queryUid = await getQueryUserId()
  const [y, m, d] = newForm.date.split('-').map(Number)
  const iso = new Date(y, m - 1, d, Number(newForm.hour), Number(newForm.minute), 0).toISOString()
  await supabase.from('reminders').insert({
    user_id: queryUid,
    description: newForm.title,
    scheduled_date: iso,
    type: newForm.type,
    from_agronomist: false,
  })
  showAdd.value = false
  saving.value = false
  await load()
}

const { confirm: confirmDialog } = useConfirm()

const deleteReminder = async (id: string) => {
  if (!await confirmDialog('Нагадування буде видалено назавжди.', { title: 'Видалити нагадування?' })) return
  await supabase.from('reminders').delete().eq('id', id)
  await load()
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-card-title { font-family: 'Bitter', Georgia, serif; font-size: 17px; font-weight: 800; color: rgb(27,46,27); margin: 0; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
</style>
