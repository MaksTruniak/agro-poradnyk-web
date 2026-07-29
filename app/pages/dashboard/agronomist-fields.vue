<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-extrabold text-agro-dark">🗺 Поля клієнтів</h1>
      <p class="text-agro-light mt-1">Поля фермерів які поділились з вами</p>
    </div>

    <!-- Запити на доступ -->
    <div v-if="pendingRequests.length" class="mb-8">
      <h2 class="font-bold text-agro-dark text-lg mb-4">📬 Запити на доступ</h2>
      <div class="space-y-3">
        <div v-for="req in pendingRequests" :key="req.id"
          class="card flex items-center gap-4 border-l-4 border-yellow-400">
          <div class="w-11 h-11 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 font-bold text-lg shrink-0">
            {{ req.farmer_name?.[0]?.toUpperCase() || '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-agro-dark">{{ req.farmer_name }}</p>
            <p class="text-sm text-agro-light">хоче поділитись полем <span class="font-medium text-agro-dark">{{ req.farm_name }}</span></p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button @click="declineRequest(req.id)" :disabled="respondingId === req.id"
              class="btn-outline text-sm py-2 px-4 text-red-500 border-red-200 hover:bg-red-50">
              Відхилити
            </button>
            <button @click="acceptRequest(req.id)" :disabled="respondingId === req.id"
              class="btn-primary text-sm py-2 px-4">
              {{ respondingId === req.id ? '...' : 'Прийняти' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="i in 3" :key="i" class="card animate-pulse">
        <div class="h-5 bg-agro-bg rounded w-1/2 mb-3"></div>
        <div class="h-3 bg-agro-bg rounded w-full mb-2"></div>
        <div class="h-3 bg-agro-bg rounded w-3/4"></div>
      </div>
    </div>

    <div v-else-if="groups.length === 0" class="card text-center py-12">
      <p class="text-5xl mb-4">🌾</p>
      <p class="font-bold text-agro-dark text-lg mb-2">Поки немає полів клієнтів</p>
      <p class="text-agro-light">Фермери можуть поділитись полями з вами через мобільний додаток</p>
    </div>

    <div v-else class="space-y-6">
      <div v-for="group in groups" :key="group.farmer_id">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-full bg-agro-hover flex items-center justify-center font-bold text-agro text-sm">
            {{ group.farmer_name?.[0]?.toUpperCase() || '?' }}
          </div>
          <p class="font-bold text-agro-dark">{{ group.farmer_name }}</p>
          <span class="text-xs text-agro-light">{{ group.farms.length }} {{ group.farms.length === 1 ? 'поле' : 'поля' }}</span>
        </div>
        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="farm in group.farms" :key="farm.id" class="card hover:shadow-md transition-all">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="font-bold text-agro-dark">{{ farm.name }}</h3>
                <p v-if="farm.region" class="text-xs text-agro-light">📍 {{ farm.region }}</p>
              </div>
              <span class="font-bold text-agro text-sm">{{ farm.hectares }} га</span>
            </div>
            <div class="flex flex-wrap gap-1.5 mb-4">
              <span v-for="crop in farm.farm_crops" :key="crop.id" class="text-xs bg-agro-hover text-agro px-2 py-0.5 rounded-full">
                {{ crop.crop_type }}
              </span>
            </div>
            <div class="flex gap-2">
              <NuxtLink :to="`/dashboard/farm/${farm.id}?readOnly=1`" class="btn-outline text-sm py-2 flex-1 text-center block">
                👁 Переглянути
              </NuxtLink>
              <NuxtLink :to="`/dashboard/protection/${farm.id}`" class="btn-primary text-sm py-2 flex-1 text-center block">
                🛡 Програма
              </NuxtLink>
            </div>
            <button @click="openReminderModal(farm, group)" class="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-agro-border text-sm font-medium text-agro-light hover:border-agro hover:text-agro transition-colors">
              🔔 Нагадати фермеру
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Модалка нагадування -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showReminder" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeReminder" />
        <div class="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md z-10 max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl px-6 pt-6 pb-4 border-b border-agro-border">
            <div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
            <h2 class="font-bold text-agro-dark text-lg">🔔 Нагадування для фермера</h2>
            <p class="text-sm text-agro-light mt-0.5">{{ reminderTarget.farmerName }} · {{ reminderTarget.farmName }}</p>
          </div>

          <div class="px-6 py-5 space-y-5">
            <!-- Назва -->
            <div>
              <label class="block text-sm font-semibold text-agro-dark mb-2">Назва</label>
              <input v-model="reminderForm.title" class="input" placeholder="Наприклад: Обробити фунгіцидом Фалькон" />
            </div>

            <!-- Тип -->
            <div>
              <label class="block text-sm font-semibold text-agro-dark mb-2">Тип</label>
              <div class="grid grid-cols-3 gap-2">
                <button v-for="t in TYPES" :key="t.value" @click="reminderForm.type = t.value"
                  class="flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 text-xs transition-colors"
                  :class="reminderForm.type === t.value ? 'border-agro bg-agro-hover text-agro font-semibold' : 'border-agro-border text-agro-light hover:border-agro/40'">
                  <span class="text-lg">{{ t.emoji }}</span>
                  <span>{{ t.label }}</span>
                </button>
              </div>
            </div>

            <!-- Календар -->
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
                    :class="[
                      isPastDay(day) ? 'text-gray-300 cursor-not-allowed' : '',
                      isSelectedDay(day) ? 'bg-agro text-white' : (!isPastDay(day) ? 'hover:bg-white text-agro-dark' : ''),
                      isToday(day) && !isSelectedDay(day) ? 'text-agro font-bold' : ''
                    ]">{{ day }}</button>
                </div>
              </div>
              <p v-if="reminderForm.date" class="text-xs text-agro mt-2 font-medium text-center">📅 {{ formatSelectedDate }}</p>
            </div>

            <!-- Час -->
            <div>
              <label class="block text-sm font-semibold text-agro-dark mb-3">Час</label>
              <div class="flex items-center gap-3 bg-agro-bg rounded-2xl px-5 py-4">
                <div class="flex-1">
                  <p class="text-xs text-agro-light text-center mb-2">Години</p>
                  <select v-model="reminderForm.hour" class="w-full bg-white border border-agro-border rounded-xl px-3 py-2.5 text-center text-agro-dark font-semibold text-lg appearance-none focus:outline-none focus:border-agro cursor-pointer">
                    <option v-for="h in 24" :key="h-1" :value="h-1">{{ String(h-1).padStart(2,'0') }}</option>
                  </select>
                </div>
                <span class="text-2xl font-bold text-agro-dark mt-5">:</span>
                <div class="flex-1">
                  <p class="text-xs text-agro-light text-center mb-2">Хвилини</p>
                  <select v-model="reminderForm.minute" class="w-full bg-white border border-agro-border rounded-xl px-3 py-2.5 text-center text-agro-dark font-semibold text-lg appearance-none focus:outline-none focus:border-agro cursor-pointer">
                    <option v-for="m in MINUTES" :key="m" :value="m">{{ String(m).padStart(2,'0') }}</option>
                  </select>
                </div>
              </div>
              <p class="text-center text-agro font-bold text-base mt-2">
                🕐 {{ String(reminderForm.hour).padStart(2,'0') }}:{{ String(reminderForm.minute).padStart(2,'0') }}
              </p>
            </div>

            <!-- Нотатка -->
            <div>
              <label class="block text-sm font-semibold text-agro-dark mb-2">Нотатка (необов'язково)</label>
              <textarea v-model="reminderForm.note" class="input resize-none" rows="2" placeholder="Препарат, доза, норма витрат, умови..." />
            </div>
          </div>

          <div class="sticky bottom-0 bg-white border-t border-agro-border px-6 py-4 flex gap-3">
            <button @click="closeReminder" class="btn-outline flex-1">Скасувати</button>
            <button @click="saveReminder" :disabled="!reminderForm.title || !reminderForm.date || saving" class="btn-primary flex-1">
              {{ saving ? '...' : 'Надіслати' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
useHead({ title: 'Поля клієнтів' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)
const saving = ref(false)
const groups = ref<any[]>([])
const pendingRequests = ref<any[]>([])
const respondingId = ref<string | null>(null)
const showReminder = ref(false)

const TYPES = [
  { value: 'обробка', label: 'Обробка', emoji: '🛡' },
  { value: 'підживлення', label: 'Підживлення', emoji: '🌿' },
  { value: 'полив', label: 'Полив', emoji: '💧' },
  { value: 'посів', label: 'Посів', emoji: '🌱' },
  { value: 'збір', label: 'Збір', emoji: '🌾' },
  { value: 'інше', label: 'Інше', emoji: '🔔' },
]
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

const reminderTarget = reactive({ farmerId: '', farmerName: '', farmId: '', farmName: '' })
const reminderForm = reactive({ title: '', note: '', type: 'інше', date: '', hour: 9, minute: 0 })

const calMonth = ref(new Date().getMonth())
const calYear = ref(new Date().getFullYear())

const UK_MONTHS = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']
const UK_MONTHS_GEN = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']
const monthLabel = computed(() => `${UK_MONTHS[calMonth.value]} ${calYear.value}`)
const firstDayOffset = computed(() => { const d = new Date(calYear.value, calMonth.value, 1).getDay(); return d === 0 ? 6 : d - 1 })
const daysInMonth = computed(() => new Date(calYear.value, calMonth.value + 1, 0).getDate())
const prevMonth = () => { if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- } else calMonth.value-- }
const nextMonth = () => { if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ } else calMonth.value++ }
const selectDay = (day: number) => { const m = String(calMonth.value + 1).padStart(2,'0'); const d = String(day).padStart(2,'0'); reminderForm.date = `${calYear.value}-${m}-${d}` }
const isSelectedDay = (day: number) => { if (!reminderForm.date) return false; const [y,m,d] = reminderForm.date.split('-').map(Number); return y === calYear.value && m === calMonth.value + 1 && d === day }
const isToday = (day: number) => { const t = new Date(); return t.getFullYear() === calYear.value && t.getMonth() === calMonth.value && t.getDate() === day }
const isPastDay = (day: number) => { const t = new Date(); t.setHours(0,0,0,0); return new Date(calYear.value, calMonth.value, day) < t }
const formatSelectedDate = computed(() => { if (!reminderForm.date) return ''; const [y,m,d] = reminderForm.date.split('-').map(Number); return `${d} ${UK_MONTHS_GEN[m-1]} ${y}` })

let currentUser: any = null

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }
  currentUser = user

  const [{ data: shares }, { data: pending }] = await Promise.all([
    supabase.from('field_shares').select('id, farm_id, farmer_id').eq('agronomist_id', user.id).eq('status', 'accepted'),
    supabase.from('field_shares').select('id, farm_id, farmer_id').eq('agronomist_id', user.id).eq('status', 'pending'),
  ])

  if (pending?.length) {
    const farmIds = pending.map(p => p.farm_id)
    const farmerIds = [...new Set(pending.map(p => p.farmer_id))]
    const [farmsRes, farmersRes] = await Promise.all([
      supabase.from('farms').select('id, name').in('id', farmIds),
      supabase.from('users').select('id, name').in('id', farmerIds),
    ])
    const farmMap = Object.fromEntries((farmsRes.data || []).map((f: any) => [f.id, f.name]))
    const farmerMap = Object.fromEntries((farmersRes.data || []).map((f: any) => [f.id, f.name]))
    pendingRequests.value = pending.map(p => ({
      id: p.id,
      farm_name: farmMap[p.farm_id] || 'Поле',
      farmer_name: farmerMap[p.farmer_id] || 'Фермер',
    }))
  }

  if (!shares?.length) { loading.value = false; return }

  const farmIds = shares.map(s => s.farm_id)
  const farmerIds = [...new Set(shares.map(s => s.farmer_id))]

  const [farmsRes, farmersRes] = await Promise.all([
    supabase.from('farms').select('*, farm_crops(id, crop_type, area_ha)').in('id', farmIds),
    supabase.from('users').select('id, name').in('id', farmerIds),
  ])

  const farmerMap = Object.fromEntries((farmersRes.data || []).map((f: any) => [f.id, f.name]))
  const shareMap = Object.fromEntries(shares.map(s => [s.farm_id, s.farmer_id]))

  const grouped: Record<string, any> = {}
  for (const farm of farmsRes.data || []) {
    const fid = shareMap[farm.id]
    if (!grouped[fid]) grouped[fid] = { farmer_id: fid, farmer_name: farmerMap[fid] || 'Фермер', farms: [] }
    grouped[fid].farms.push(farm)
  }
  groups.value = Object.values(grouped)
  loading.value = false
})

const acceptRequest = async (shareId: string) => {
  respondingId.value = shareId
  await supabase.from('field_shares').update({ status: 'accepted' }).eq('id', shareId)
  pendingRequests.value = pendingRequests.value.filter(r => r.id !== shareId)
  respondingId.value = null
  // Перезавантажуємо список полів
  loading.value = true
  const { data: newShares } = await supabase.from('field_shares').select('id, farm_id, farmer_id').eq('agronomist_id', currentUser.id).eq('status', 'accepted')
  if (newShares?.length) {
    const farmIds = newShares.map(s => s.farm_id)
    const farmerIds = [...new Set(newShares.map(s => s.farmer_id))]
    const [farmsRes, farmersRes] = await Promise.all([
      supabase.from('farms').select('*, farm_crops(id, crop_type, area_ha)').in('id', farmIds),
      supabase.from('users').select('id, name').in('id', farmerIds),
    ])
    const farmerMap = Object.fromEntries((farmersRes.data || []).map((f: any) => [f.id, f.name]))
    const shareMap = Object.fromEntries(newShares.map(s => [s.farm_id, s.farmer_id]))
    const grouped: Record<string, any> = {}
    for (const farm of farmsRes.data || []) {
      const fid = shareMap[farm.id]
      if (!grouped[fid]) grouped[fid] = { farmer_id: fid, farmer_name: farmerMap[fid] || 'Фермер', farms: [] }
      grouped[fid].farms.push(farm)
    }
    groups.value = Object.values(grouped)
  }
  loading.value = false
}

const { confirm: confirmDialog } = useConfirm()

const declineRequest = async (shareId: string) => {
  if (!await confirmDialog('Запит на доступ до поля буде відхилено.', { title: 'Відхилити запит?', confirmLabel: 'Відхилити' })) return
  respondingId.value = shareId
  await supabase.from('field_shares').delete().eq('id', shareId)
  pendingRequests.value = pendingRequests.value.filter(r => r.id !== shareId)
  respondingId.value = null
}

const openReminderModal = (farm: any, group: any) => {
  const now = new Date()
  calMonth.value = now.getMonth()
  calYear.value = now.getFullYear()
  Object.assign(reminderTarget, { farmerId: group.farmer_id, farmerName: group.farmer_name, farmId: farm.id, farmName: farm.name })
  Object.assign(reminderForm, { title: '', note: '', type: 'інше', date: '', hour: 9, minute: 0 })
  showReminder.value = true
}

const closeReminder = () => { showReminder.value = false }

const saveReminder = async () => {
  if (!reminderForm.title || !reminderForm.date) return
  saving.value = true
  const [y, m, d] = reminderForm.date.split('-').map(Number)
  const localDate = new Date(y, m - 1, d, Number(reminderForm.hour), Number(reminderForm.minute), 0)
  await supabase.from('reminders').insert({
    user_id: reminderTarget.farmerId,
    created_by: currentUser.id,
    farm_id: reminderTarget.farmId,
    from_agronomist: true,
    description: reminderForm.title,
    scheduled_date: localDate.toISOString(),
    type: reminderForm.type,
    note: reminderForm.note || null,
  })
  saving.value = false
  closeReminder()
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
