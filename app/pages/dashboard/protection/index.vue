<template>
  <div class="p-4 sm:p-8">
    <NuxtLink to="/dashboard/fields" class="inline-flex items-center gap-2 text-agro-light hover:text-agro mb-8 text-sm font-medium transition-colors">
      ← Назад до полів
    </NuxtLink>

    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-agro-dark">🛡 Програма захисту</h1>
      <p v-if="cropType" class="text-agro-light mt-1">{{ cropType }}</p>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="card animate-pulse h-28" v-for="i in 3" :key="i"></div>
    </div>

    <div v-else>
      <!-- Програми ще нема — створити -->
      <div v-if="!program" class="card text-center py-12">
        <p class="text-5xl mb-4">🛡</p>
        <p class="font-bold text-agro-dark text-lg">Програму ще не створено</p>
        <p class="text-agro-light mt-1 mb-6">Створіть програму захисту для цієї культури</p>
        <button @click="createProgram" :disabled="saving" class="btn-primary inline-block">
          {{ saving ? '...' : '➕ Створити програму' }}
        </button>
      </div>

      <template v-else>
        <!-- Фільтр по фазах -->
        <div class="flex gap-2 flex-wrap mb-5">
          <button
            @click="selectedPhase = ''"
            class="px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-colors"
            :class="selectedPhase === '' ? 'border-agro bg-agro text-white' : 'border-agro-border text-agro-light hover:border-agro'"
          >Всі</button>
          <button
            v-for="phase in phases"
            :key="phase.key"
            @click="selectedPhase = phase.key"
            class="px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-colors"
            :class="selectedPhase === phase.key ? 'border-agro bg-agro text-white' : 'border-agro-border text-agro-light hover:border-agro'"
          >
            {{ phase.emoji }} {{ phase.key }}
          </button>
        </div>

        <!-- Список обробок згруповано по фазах -->
        <div v-if="groupedPhases.length === 0" class="card text-center py-10">
          <p class="text-3xl mb-3">🌱</p>
          <p class="text-agro-light">Обробок ще немає. Додайте першу!</p>
        </div>

        <div v-else class="space-y-4 mb-5">
          <div v-for="group in groupedPhases" :key="group.phase" class="card p-0 overflow-hidden">
            <!-- Заголовок фази -->
            <div class="flex items-center gap-2 px-5 py-3 bg-agro-hover border-b border-agro-border">
              <span class="text-base">{{ group.emoji }}</span>
              <span class="font-bold text-agro-dark text-sm">{{ group.phase || 'Без фази' }}</span>
              <span class="ml-auto text-xs text-agro-light">
                {{ group.items.length }} {{ group.items.length === 1 ? 'обробка' : group.items.length <= 4 ? 'обробки' : 'обробок' }}
              </span>
            </div>
            <!-- Список препаратів у фазі -->
            <div class="divide-y divide-agro-border">
              <div v-for="t in group.items" :key="t.id" class="flex items-start gap-3 px-5 py-3.5">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  :class="TYPE_BG[t.type] || 'bg-agro-bg'">
                  <span class="text-sm">{{ TYPE_ICONS[t.type] || '🌿' }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-xs font-medium px-2 py-0.5 rounded-full border"
                    :class="TYPE_BADGE[t.type] || 'bg-agro-bg border-agro-border text-agro-light'">
                    {{ t.type }}
                  </span>
                  <p class="font-semibold text-agro-dark mt-1 text-sm">{{ t.product_name }}</p>
                  <p v-if="t.dosage" class="text-xs text-agro-light mt-0.5">📏 {{ t.dosage }}</p>
                  <p v-if="t.notes" class="text-xs text-agro-light mt-0.5 italic">{{ t.notes }}</p>
                </div>
                <button @click="deleteTreatment(t)" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-red-400 shrink-0">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <button @click="showAdd = true" class="btn-outline mt-6">➕ Додати обробку</button>
      </template>
    </div>

    <!-- Модалка додавання -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAdd" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAdd = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-8">
            <h2 class="font-bold text-agro-dark text-xl mb-5">➕ Нова обробка</h2>
            <div class="space-y-4">
              <div class="relative">
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Препарат / добриво</label>
                <input
                  v-model="newT.product_name"
                  @input="searchProducts"
                  @focus="showSuggestions = true"
                  @blur="hideProductSuggestions"
                  class="input"
                  placeholder="Почніть вводити назву..."
                  autocomplete="off"
                />
                <div v-if="showSuggestions && productSuggestions.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                  <button
                    v-for="p in productSuggestions"
                    :key="p.id"
                    type="button"
                    @mousedown.prevent="selectProduct(p)"
                    class="w-full text-left px-4 py-3 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0"
                  >
                    <p class="font-medium text-agro-dark">{{ p.product_name }}</p>
                    <p class="text-xs text-agro-light">{{ p.price }} грн · {{ p.seller_profiles?.company_name }}</p>
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Фаза росту</label>
                <select v-model="newT.phase" class="input mb-2">
                  <option value="">Оберіть фазу...</option>
                  <option v-for="p in phases" :key="p.key" :value="p.key">{{ p.emoji }} {{ p.key }}</option>
                </select>
                <button
                  type="button"
                  @click="showAddPhase = !showAddPhase"
                  class="text-xs text-agro hover:underline"
                >{{ showAddPhase ? '✕ Скасувати' : '➕ Додати свою фазу' }}</button>
                <div v-if="showAddPhase" class="mt-2 flex gap-2">
                  <input v-model="newPhaseEmoji" class="input w-16 text-center text-lg px-2" placeholder="🌱" maxlength="2" />
                  <input v-model="newPhaseName" class="input flex-1" placeholder="Назва фази..." />
                  <button
                    type="button"
                    @click="addCustomPhase"
                    :disabled="!newPhaseName.trim()"
                    class="btn-primary px-3 py-2 text-sm shrink-0"
                  >Додати</button>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Тип обробки</label>
                <select v-model="newT.type" class="input">
                  <option value="підживлення">підживлення</option>
                  <option value="захист">захист</option>
                  <option value="гербіцид">гербіцид</option>
                  <option value="фунгіцид">фунгіцид</option>
                  <option value="інсектицид">інсектицид</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Доза</label>
                <input v-model="newT.dosage" class="input" placeholder="Наприклад: 10 мл на 10 л" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Нотатки</label>
                <textarea v-model="newT.notes" class="input resize-none" rows="2" placeholder="Додаткові відомості..." />
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button @click="showAdd = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="addTreatment" :disabled="!newT.product_name || saving" class="btn-primary flex-1">
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

const route = useRoute()
const farmCropId = route.query.farmCropId as string
const cropType = route.query.cropType as string
const supabase = useSupabaseClient()

const loading = ref(true)
const saving = ref(false)
const showAdd = ref(false)
const program = ref<any>(null)
const treatments = ref<any[]>([])
const phases = ref<any[]>([])
const selectedPhase = ref('')

const newT = reactive({ product_name: '', phase: '', type: 'підживлення', dosage: '', notes: '' })
const showAddPhase = ref(false)
const newPhaseName = ref('')
const newPhaseEmoji = ref('🌱')
const productSuggestions = ref<any[]>([])
const showSuggestions = ref(false)
let searchTimer: any = null

const TYPE_ICONS: Record<string, string> = {
  підживлення: '🌿',
  захист: '🛡',
  гербіцид: '🌾',
  фунгіцид: '🍄',
  інсектицид: '🐛',
}
const TYPE_BG: Record<string, string> = {
  підживлення: 'bg-amber-50',
  захист: 'bg-blue-50',
  гербіцид: 'bg-orange-50',
  фунгіцид: 'bg-purple-50',
  інсектицид: 'bg-red-50',
}
const TYPE_BADGE: Record<string, string> = {
  підживлення: 'bg-amber-50 border-amber-200 text-amber-700',
  захист: 'bg-blue-50 border-blue-200 text-blue-700',
  гербіцид: 'bg-orange-50 border-orange-200 text-orange-700',
  фунгіцид: 'bg-purple-50 border-purple-200 text-purple-700',
  інсектицид: 'bg-red-50 border-red-200 text-red-700',
}

const searchProducts = () => {
  clearTimeout(searchTimer)
  const q = newT.product_name.trim()
  if (q.length < 2) { productSuggestions.value = []; return }
  searchTimer = setTimeout(async () => {
    const { data } = await supabase
      .from('seller_offers')
      .select('id, product_name, price, seller_profiles(company_name)')
      .ilike('product_name', `%${q}%`)
      .eq('in_stock', true)
      .limit(8)
    productSuggestions.value = data || []
  }, 300)
}

const selectProduct = (p: any) => {
  newT.product_name = p.product_name
  productSuggestions.value = []
  showSuggestions.value = false
}

const hideProductSuggestions = () => {
  setTimeout(() => { showSuggestions.value = false }, 200)
}

const filteredTreatments = computed(() =>
  selectedPhase.value
    ? treatments.value.filter(t => t.phase === selectedPhase.value)
    : treatments.value
)

const groupedPhases = computed(() => {
  const phaseOrder = Object.fromEntries(phases.value.map((p, i) => [p.key, i]))
  const phaseEmoji = Object.fromEntries(phases.value.map(p => [p.key, p.emoji]))

  const map = new Map<string, any[]>()
  for (const t of filteredTreatments.value) {
    const key = t.phase || ''
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }

  return [...map.entries()]
    .sort(([a], [b]) => {
      const oa = phaseOrder[a] ?? 999
      const ob = phaseOrder[b] ?? 999
      return oa - ob
    })
    .map(([phase, items]) => ({
      phase,
      emoji: phaseEmoji[phase] || '🌱',
      items,
    }))
})

const load = async () => {
  loading.value = true

  const { data: phasesData } = await supabase.from('growth_phases').select('*').order('order_num', { ascending: true })
  phases.value = (phasesData || []).map((p: any) => ({ key: p.key, emoji: p.emoji, order: p.order_num }))

  if (farmCropId) {
    const { data: programData } = await supabase
      .from('protection_programs')
      .select('*')
      .eq('farm_crop_id', farmCropId)
      .maybeSingle()

    program.value = programData

    if (programData) {
      const { data: treatmentsData } = await supabase
        .from('program_treatments')
        .select('*')
        .eq('program_id', programData.id)
        .order('phase_order', { ascending: true })
      treatments.value = treatmentsData || []
    }
  }

  loading.value = false
}

onMounted(load)

const addCustomPhase = async () => {
  if (!newPhaseName.value.trim()) return
  const { data: { session } } = await supabase.auth.getSession()
  const newOrderNum = phases.value.length + 1
  await supabase.from('growth_phases').insert({
    key: newPhaseName.value.trim(),
    emoji: newPhaseEmoji.value || '🌱',
    order_num: newOrderNum,
    is_default: false,
    created_by: session?.user?.id,
  })
  const newPhase = { key: newPhaseName.value.trim(), emoji: newPhaseEmoji.value || '🌱', order: newOrderNum }
  phases.value = [...phases.value, newPhase]
  newT.phase = newPhase.key
  newPhaseName.value = ''
  newPhaseEmoji.value = '🌱'
  showAddPhase.value = false
}

const createProgram = async () => {
  saving.value = true
  const { data } = await supabase.from('protection_programs').upsert({
    farm_crop_id: farmCropId,
    name: `Програма для ${cropType}`,
    description: `Календар живлення та захисту для ${cropType}`,
  }, { onConflict: 'farm_crop_id' }).select().single()
  program.value = data
  saving.value = false
}

const addTreatment = async () => {
  if (!newT.product_name || !program.value) return
  saving.value = true
  const phase = phases.value.find(p => p.key === newT.phase)
  await supabase.from('program_treatments').insert({
    program_id: program.value.id,
    phase: newT.phase || null,
    phase_order: phase?.order || 99,
    type: newT.type,
    product_name: newT.product_name,
    dosage: newT.dosage || null,
    notes: newT.notes || null,
  })
  Object.assign(newT, { product_name: '', phase: '', type: 'підживлення', dosage: '', notes: '' })
  showAdd.value = false
  saving.value = false

  const { data } = await supabase.from('program_treatments').select('*').eq('program_id', program.value.id).order('phase_order', { ascending: true })
  treatments.value = data || []
}

const deleteTreatment = async (t: any) => {
  if (!confirm(`Видалити "${t.product_name}"?`)) return
  await supabase.from('program_treatments').delete().eq('id', t.id)
  treatments.value = treatments.value.filter(tr => tr.id !== t.id)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
