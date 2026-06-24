<template>
  <div class="p-8">
    <NuxtLink to="/dashboard/fields" class="inline-flex items-center gap-2 text-agro-light hover:text-agro mb-8 text-sm font-medium transition-colors">
      ← Назад до полів
    </NuxtLink>

    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-agro-dark">🛡 Програма захисту</h1>
      <p v-if="farmName" class="text-agro-light mt-1">{{ farmName }}</p>
    </div>

    <!-- Перемикач культур -->
    <div v-if="crops.length > 1" class="flex gap-2 flex-wrap mb-6">
      <button
        v-for="crop in crops"
        :key="crop.id"
        @click="selectedCropId = crop.id"
        class="px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors"
        :class="selectedCropId === crop.id
          ? 'border-agro bg-agro-hover text-agro'
          : 'border-agro-border text-agro-light hover:border-agro'"
      >
        {{ crop.crop_type }}{{ crop.variety ? ` · ${crop.variety}` : '' }}
      </button>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="card animate-pulse h-28" v-for="i in 3" :key="i"></div>
    </div>

    <div v-else-if="!selectedCropId" class="card text-center py-12">
      <p class="text-5xl mb-4">🌱</p>
      <p class="font-bold text-agro-dark text-lg">Немає культур</p>
      <p class="text-agro-light mt-1">На цьому полі ще не додано культур</p>
    </div>

    <div v-else>
      <!-- Схеми обробки -->
      <div v-if="programs.length === 0" class="card text-center py-12">
        <p class="text-5xl mb-4">🛡</p>
        <p class="font-bold text-agro-dark text-lg">Схем ще немає</p>
        <p class="text-agro-light mt-1 mb-6">Додайте першу схему обробки для цієї культури</p>
        <button v-if="!readOnly" @click="showAdd = true" class="btn-primary inline-block">➕ Додати схему</button>
      </div>

      <div v-else class="space-y-4 mb-6">
        <div
          v-for="prog in programs"
          :key="prog.id"
          class="card"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="text-sm font-semibold text-agro-dark">{{ prog.product_name }}</span>
                <span v-if="prog.stage" class="text-xs bg-agro-bg text-agro-light px-2 py-0.5 rounded-full border border-agro-border">{{ prog.stage }}</span>
              </div>
              <p v-if="prog.dose" class="text-sm text-agro-light">Доза: {{ prog.dose }}</p>
              <p v-if="prog.notes" class="text-sm text-agro-light mt-1">{{ prog.notes }}</p>
            </div>
            <div class="text-right shrink-0 ml-4">
              <p v-if="prog.date" class="text-xs text-agro-light">📅 {{ formatDate(prog.date) }}</p>
              <button
                v-if="!readOnly"
                @click="deleteProgram(prog)"
                class="mt-2 text-red-400 hover:text-red-600 text-xs"
              >🗑 Видалити</button>
            </div>
          </div>
        </div>
      </div>

      <button v-if="!readOnly && programs.length > 0" @click="showAdd = true" class="btn-outline">
        ➕ Додати схему
      </button>
    </div>

    <!-- Модалка додавання -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAdd" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAdd = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-8">
            <h2 class="font-bold text-agro-dark text-xl mb-5">➕ Нова схема обробки</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Препарат / добриво</label>
                <input v-model="newProg.product_name" class="input" placeholder="Наприклад: Раундап" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-agro-dark mb-1.5">Фаза</label>
                  <input v-model="newProg.stage" class="input" placeholder="Наприклад: Сходи" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-agro-dark mb-1.5">Доза</label>
                  <input v-model="newProg.dose" class="input" placeholder="2 л/га" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Дата обробки</label>
                <input v-model="newProg.date" class="input" type="date" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Нотатки</label>
                <textarea v-model="newProg.notes" class="input resize-none" rows="2" placeholder="Додаткові відомості..." />
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button @click="showAdd = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="addProgram" :disabled="!newProg.product_name || saving" class="btn-primary flex-1">
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
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const farmId = route.params.farmId as string
const readOnly = route.query.readOnly === '1'
const supabase = useSupabaseClient()

const loading = ref(true)
const saving = ref(false)
const showAdd = ref(false)
const farmName = ref('')
const crops = ref<any[]>([])
const selectedCropId = ref<string | null>(null)
const programs = ref<any[]>([])

const newProg = reactive({ product_name: '', stage: '', dose: '', date: '', notes: '' })

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

// Дані поля
const { data: farmData } = await supabase.from('farms').select('name, farm_crops(id, crop_type, variety)').eq('id', farmId).single()
farmName.value = farmData?.name || ''
crops.value = farmData?.farm_crops || []
if (crops.value.length > 0) selectedCropId.value = crops.value[0].id

loading.value = false

// Завантаження програм при зміні культури
const loadPrograms = async () => {
  if (!selectedCropId.value) return
  const { data } = await supabase
    .from('protection_programs')
    .select('*')
    .eq('farm_crop_id', selectedCropId.value)
    .order('date', { ascending: true })
  programs.value = data || []
}

watch(selectedCropId, loadPrograms, { immediate: true })

const formatDate = (d: string) => new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })

const addProgram = async () => {
  if (!newProg.product_name || !selectedCropId.value) return
  saving.value = true
  await supabase.from('protection_programs').insert({
    farm_crop_id: selectedCropId.value,
    product_name: newProg.product_name,
    stage: newProg.stage || null,
    dose: newProg.dose || null,
    date: newProg.date || null,
    notes: newProg.notes || null,
  })
  Object.assign(newProg, { product_name: '', stage: '', dose: '', date: '', notes: '' })
  showAdd.value = false
  saving.value = false
  await loadPrograms()
}

const deleteProgram = async (prog: any) => {
  if (!confirm(`Видалити "${prog.product_name}"?`)) return
  await supabase.from('protection_programs').delete().eq('id', prog.id)
  await loadPrograms()
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
