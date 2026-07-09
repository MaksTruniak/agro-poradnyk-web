<template>
  <div class="p-4 sm:p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-extrabold text-agro-dark">🔔 Нагадування</h1>
        <p class="text-agro-light mt-1">Заплановані обробки та події</p>
      </div>
      <button @click="openAdd" class="btn-primary">➕ Додати</button>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="card animate-pulse h-20"></div>
    </div>

    <div v-else-if="reminders.length === 0" class="card text-center py-16">
      <p class="text-5xl mb-4">🔔</p>
      <p class="font-bold text-agro-dark text-lg mb-2">Нагадувань поки немає</p>
      <p class="text-agro-light mb-6">Додайте нагадування про обробку або будь-яку подію</p>
      <button @click="openAdd" class="btn-primary inline-block">➕ Додати нагадування</button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="r in reminders" :key="r.id"
        class="card flex items-start gap-4"
        :class="isPast(r.scheduled_date) ? 'opacity-60' : ''"
      >
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          :class="isPast(r.scheduled_date) ? 'bg-gray-100' : 'bg-agro-hover'">
          {{ TYPE_EMOJI[r.type] || r.type || '🔔' }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-semibold text-agro-dark">{{ r.description }}</p>
            <span v-if="r.from_agronomist" class="text-xs bg-agro-hover text-agro px-2 py-0.5 rounded-full font-medium shrink-0">
              👨‍🌾 від агронома
            </span>
          </div>
          <p class="text-xs mt-1" :class="isPast(r.scheduled_date) ? 'text-gray-400' : 'text-agro'">
            📅 {{ formatDate(r.scheduled_date) }}
          </p>
        </div>
        <button @click="deleteReminder(r.id)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition-colors shrink-0">
          <Trash2 :size="15" />
        </button>
      </div>
    </div>

    <!-- Модалка -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAdd" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAdd = false" />
          <div class="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md z-10 max-h-[90vh] overflow-y-auto">
            <!-- Хедер -->
            <div class="sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl px-6 pt-6 pb-4 border-b border-agro-border">
              <div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
              <h2 class="font-bold text-agro-dark text-lg">🔔 Нове нагадування</h2>
            </div>

            <div class="px-6 py-5 space-y-5">
              <!-- Назва -->
              <div>
                <label class="block text-sm font-semibold text-agro-dark mb-2">Назва</label>
                <input v-model="newForm.title" class="input" placeholder="Наприклад: Обприскування пшениці" />
              </div>

              <!-- Тип -->
              <div>
                <label class="block text-sm font-semibold text-agro-dark mb-2">Тип</label>
                <div class="grid grid-cols-3 gap-2">
                  <button v-for="t in TYPES" :key="t.value" @click="newForm.type = t.value"
                    class="flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 text-xs transition-colors"
                    :class="newForm.type === t.value ? 'border-agro bg-agro-hover text-agro font-semibold' : 'border-agro-border text-agro-light hover:border-agro/40'">
                    <span class="text-lg">{{ t.emoji }}</span>
                    <span>{{ t.label }}</span>
                  </button>
                </div>
              </div>

              <!-- Календар -->
              <div>
                <label class="block text-sm font-semibold text-agro-dark mb-3">Дата</label>
                <div class="bg-agro-bg rounded-2xl p-4">
                  <!-- Навігація місяця -->
                  <div class="flex items-center justify-between mb-4">
                    <button @click="prevMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-agro-dark font-bold">‹</button>
                    <span class="font-semibold text-agro-dark text-sm">{{ monthLabel }}</span>
                    <button @click="nextMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-agro-dark font-bold">›</button>
                  </div>
                  <!-- Дні тижня -->
                  <div class="grid grid-cols-7 mb-1">
                    <div v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']" :key="d"
                      class="text-center text-xs font-medium text-agro-light py-1">{{ d }}</div>
                  </div>
                  <!-- Дні -->
                  <div class="grid grid-cols-7 gap-0.5">
                    <div v-for="blank in firstDayOffset" :key="'b'+blank" />
                    <button
                      v-for="day in daysInMonth" :key="day"
                      @click="!isPastDay(day) && selectDay(day)"
                      :disabled="isPastDay(day)"
                      class="aspect-square flex items-center justify-center text-sm rounded-xl transition-colors font-medium"
                      :class="[
                        isPastDay(day) ? 'text-gray-300 cursor-not-allowed' : '',
                        isSelectedDay(day) ? 'bg-agro text-white' : (!isPastDay(day) ? 'hover:bg-white text-agro-dark' : ''),
                        isToday(day) && !isSelectedDay(day) ? 'text-agro font-bold' : ''
                      ]"
                    >{{ day }}</button>
                  </div>
                </div>
                <p v-if="newForm.date" class="text-xs text-agro mt-2 font-medium text-center">
                  📅 {{ formatSelectedDate }}
                </p>
              </div>

              <!-- Час -->
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

              <!-- Нотатка -->
              <div>
                <label class="block text-sm font-semibold text-agro-dark mb-2">Нотатка (необов'язково)</label>
                <textarea v-model="newForm.note" class="input resize-none" rows="2" placeholder="Деталі..." />
              </div>
            </div>

            <!-- Кнопки -->
            <div class="sticky bottom-0 bg-white border-t border-agro-border px-6 py-4 flex gap-3">
              <button @click="showAdd = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="addReminder" :disabled="!newForm.title || !newForm.date || saving" class="btn-primary flex-1">
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
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)
const saving = ref(false)
const showAdd = ref(false)
const reminders = ref<any[]>([])

const TYPES = [
  { value: 'обробка', label: 'Обробка', emoji: '🛡' },
  { value: 'підживлення', label: 'Підживлення', emoji: '🌿' },
  { value: 'полив', label: 'Полив', emoji: '💧' },
  { value: 'посів', label: 'Посів', emoji: '🌱' },
  { value: 'збір', label: 'Збір', emoji: '🌾' },
  { value: 'інше', label: 'Інше', emoji: '🔔' },
]
const TYPE_EMOJI: Record<string, string> = Object.fromEntries(TYPES.map(t => [t.value, t.emoji]))
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

// Форма
const newForm = reactive({ title: '', note: '', type: 'інше', date: '', hour: 9, minute: 0 })

// Календар
const calMonth = ref(new Date().getMonth())
const calYear = ref(new Date().getFullYear())

const UK_MONTHS = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']
const monthLabel = computed(() => `${UK_MONTHS[calMonth.value]} ${calYear.value}`)

const firstDayOffset = computed(() => {
  const d = new Date(calYear.value, calMonth.value, 1).getDay()
  return d === 0 ? 6 : d - 1 // Пн=0
})

const daysInMonth = computed(() => new Date(calYear.value, calMonth.value + 1, 0).getDate())

const prevMonth = () => {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- }
  else calMonth.value--
}
const nextMonth = () => {
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ }
  else calMonth.value++
}

const selectDay = (day: number) => {
  const m = String(calMonth.value + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  newForm.date = `${calYear.value}-${m}-${d}`
}

const isSelectedDay = (day: number) => {
  if (!newForm.date) return false
  const [y, m, d] = newForm.date.split('-').map(Number)
  return y === calYear.value && m === calMonth.value + 1 && d === day
}

const isToday = (day: number) => {
  const t = new Date()
  return t.getFullYear() === calYear.value && t.getMonth() === calMonth.value && t.getDate() === day
}

const isPastDay = (day: number) => {
  const t = new Date(); t.setHours(0, 0, 0, 0)
  const d = new Date(calYear.value, calMonth.value, day)
  return d < t
}

const UK_MONTHS_GEN = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']
const formatSelectedDate = computed(() => {
  if (!newForm.date) return ''
  const [y, m, d] = newForm.date.split('-').map(Number)
  return `${d} ${UK_MONTHS_GEN[m - 1]} ${y}`
})

const openAdd = () => {
  const now = new Date()
  calMonth.value = now.getMonth()
  calYear.value = now.getFullYear()
  Object.assign(newForm, { title: '', note: '', type: 'інше', date: '', hour: 9, minute: 0 })
  showAdd.value = true
}

// Auth
const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const load = async () => {
  const { data } = await supabase.from('reminders')
    .select('*')
    .eq('user_id', uid)
    .order('scheduled_date', { ascending: true })
  reminders.value = data || []
  loading.value = false
}
onMounted(load)

const formatDate = (d: string) => d
  ? new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
  : ''

const isPast = (d: string) => d ? new Date(d) < new Date() : false

const addReminder = async () => {
  if (!newForm.title || !newForm.date) return
  saving.value = true

  // Number() гарантує числовий тип (select v-model може повертати string)
  const [y, m, d] = newForm.date.split('-').map(Number)
  const localDate = new Date(y, m - 1, d, Number(newForm.hour), Number(newForm.minute), 0)
  const isoString = localDate.toISOString()

  await supabase.from('reminders').insert({
    user_id: uid,
    description: newForm.title,
    scheduled_date: isoString,
    type: newForm.type,
    from_agronomist: false,
  })
  showAdd.value = false
  saving.value = false
  await load()
}

const deleteReminder = async (id: string) => {
  if (!confirm('Видалити нагадування?')) return
  await supabase.from('reminders').delete().eq('id', id)
  await load()
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
