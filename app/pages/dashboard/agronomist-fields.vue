<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-extrabold text-agro-dark">🗺 Поля клієнтів</h1>
      <p class="text-agro-light mt-1">Поля фермерів які поділились з вами</p>
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
      <div v-if="showReminder" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeReminder" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-8">
          <h2 class="font-bold text-agro-dark text-xl mb-1">🔔 Нагадування для фермера</h2>
          <p class="text-sm text-agro-light mb-5">
            👨‍🌾 {{ reminderTarget.farmerName }} · 🌾 {{ reminderTarget.farmName }}
          </p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Що потрібно зробити</label>
              <input v-model="reminderForm.title" class="input" placeholder="Наприклад: Обробити фунгіцидом Фалькон" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Дата та час</label>
              <input v-model="reminderForm.remind_at" type="datetime-local" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Деталі (необов'язково)</label>
              <textarea v-model="reminderForm.note" class="input resize-none" rows="2"
                placeholder="Препарат, доза, норма витрат, умови..." />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-2">Іконка</label>
              <div class="flex gap-2 flex-wrap">
                <button v-for="e in EMOJIS" :key="e" @click="reminderForm.emoji = e"
                  class="w-10 h-10 rounded-xl border-2 text-xl flex items-center justify-center transition-colors"
                  :class="reminderForm.emoji === e ? 'border-agro bg-agro-hover' : 'border-agro-border'">
                  {{ e }}
                </button>
              </div>
            </div>
          </div>
          <p v-if="reminderSaved" class="text-agro text-sm mt-3 font-medium">✅ Нагадування надіслано фермеру!</p>
          <div class="flex gap-3 mt-6">
            <button @click="closeReminder" class="btn-outline flex-1">Скасувати</button>
            <button @click="saveReminder" :disabled="!reminderForm.title || !reminderForm.remind_at || saving" class="btn-primary flex-1">
              {{ saving ? '...' : 'Надіслати' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const loading = ref(true)
const saving = ref(false)
const groups = ref<any[]>([])
const showReminder = ref(false)
const reminderSaved = ref(false)

const EMOJIS = ['🛡', '💊', '🌿', '💧', '🌾', '🚜', '⚠️', '🔔', '✅', '📋']

const reminderTarget = reactive({ farmerId: '', farmerName: '', farmId: '', farmName: '' })
const reminderForm = reactive({ title: '', remind_at: '', note: '', emoji: '🛡' })

let currentUser: any = null

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }
  currentUser = user

  const { data: shares } = await supabase
    .from('field_shares')
    .select('farm_id, farmer_id')
    .eq('agronomist_id', user.id)
    .eq('status', 'accepted')

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

const openReminderModal = (farm: any, group: any) => {
  Object.assign(reminderTarget, {
    farmerId: group.farmer_id,
    farmerName: group.farmer_name,
    farmId: farm.id,
    farmName: farm.name,
  })
  Object.assign(reminderForm, { title: '', remind_at: '', note: '', emoji: '🛡' })
  reminderSaved.value = false
  showReminder.value = true
}

const closeReminder = () => {
  showReminder.value = false
  reminderSaved.value = false
}

const saveReminder = async () => {
  if (!reminderForm.title || !reminderForm.remind_at) return
  saving.value = true
  await supabase.from('reminders').insert({
    user_id: reminderTarget.farmerId,
    created_by: currentUser.id,
    farm_id: reminderTarget.farmId,
    from_agronomist: true,
    description: reminderForm.title,
    scheduled_date: reminderForm.remind_at,
    type: reminderForm.emoji,
    note: reminderForm.note || null,
  })
  saving.value = false
  reminderSaved.value = true
  setTimeout(() => closeReminder(), 1500)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
