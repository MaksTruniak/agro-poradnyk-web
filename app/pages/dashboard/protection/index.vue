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
      <div v-if="!program" class="card text-center py-12">
        <p class="text-5xl mb-4">🛡</p>
        <p class="font-bold text-agro-dark text-lg">Програму ще не створено</p>
        <p class="text-agro-light mt-1 mb-6">Створіть програму захисту для цієї культури</p>
        <button @click="createProgram" :disabled="saving" class="btn-primary inline-block">
          {{ saving ? '...' : '➕ Створити програму' }}
        </button>
      </div>

      <template v-else>
        <div class="space-y-4 mb-4">
          <!-- Блок кожної фази -->
          <div v-for="phase in phases" :key="phase.key" class="card p-0 overflow-hidden">
            <!-- Заголовок фази -->
            <div class="flex items-center gap-2 px-5 py-3 bg-agro-hover border-b border-agro-border">
              <span class="text-base">{{ phase.emoji }}</span>
              <span class="font-bold text-agro-dark text-sm">{{ phase.key }}</span>
              <span class="ml-auto text-xs text-agro-light">
                {{ treatmentsByPhase[phase.key]?.length || 0 }} обробок
              </span>
            </div>

            <!-- Список обробок -->
            <div class="divide-y divide-agro-border">
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
                <button @click="deleteTreatment(t)" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-red-400 shrink-0">
                  <Trash2 :size="14" />
                </button>
              </div>

              <!-- Інлайн-форма додавання -->
              <div v-if="addingToPhase === phase.key" class="px-5 py-4 bg-[#FAFDF7] space-y-3">
                <div class="flex gap-2">
                  <select v-model="inlineT.type" class="input text-sm py-2">
                    <option value="підживлення">🌿 підживлення</option>
                    <option value="захист">🛡 захист</option>
                    <option value="гербіцид">🌾 гербіцид</option>
                    <option value="фунгіцид">🍄 фунгіцид</option>
                    <option value="інсектицид">🐛 інсектицид</option>
                  </select>
                </div>
                <div class="relative">
                  <input
                    v-model="inlineT.product_name"
                    @input="searchProducts(phase.key)"
                    @focus="showSuggestionsFor = phase.key"
                    @blur="hideSuggestions"
                    class="input text-sm py-2"
                    placeholder="Назва препарату..."
                    autocomplete="off"
                  />
                  <div v-if="showSuggestionsFor === phase.key && productSuggestions.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-30 max-h-44 overflow-y-auto">
                    <button
                      v-for="p in productSuggestions"
                      :key="p.id"
                      type="button"
                      @mousedown.prevent="selectProduct(p)"
                      class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0"
                    >
                      <p class="font-medium text-agro-dark">{{ p.product_name }}</p>
                      <p class="text-xs text-agro-light">{{ p.price }} грн · {{ p.seller_profiles?.company_name }}</p>
                    </button>
                  </div>
                </div>
                <input v-model="inlineT.dosage" class="input text-sm py-2" placeholder="Доза (необов'язково)" />
                <div class="flex gap-2">
                  <button @click="addingToPhase = null; resetInline()" class="btn-outline flex-1 py-2 text-sm">Скасувати</button>
                  <button @click="saveTreatment(phase)" :disabled="!inlineT.product_name || saving" class="btn-primary flex-1 py-2 text-sm">
                    {{ saving ? '...' : 'Зберегти' }}
                  </button>
                </div>
              </div>

              <!-- Кнопка відкрити форму -->
              <div v-else class="px-5 py-2.5">
                <button @click="openAddForm(phase.key)" class="text-sm text-agro hover:text-agro-dark font-medium flex items-center gap-1.5 transition-colors">
                  <span class="text-base leading-none">+</span> Додати обробку
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Додати нову фазу -->
        <div class="card mt-2">
          <div v-if="!showAddPhase">
            <button @click="showAddPhase = true" class="btn-outline w-full text-sm py-2.5">
              ➕ Додати фазу
            </button>
          </div>
          <div v-else class="space-y-3">
            <p class="font-semibold text-agro-dark text-sm">Нова фаза росту</p>
            <div class="flex gap-2">
              <input v-model="newPhaseEmoji" class="input w-14 text-center text-lg px-2 py-2" placeholder="🌱" maxlength="2" />
              <input v-model="newPhaseName" class="input flex-1 text-sm py-2" placeholder="Назва фази..." />
            </div>
            <div class="flex gap-2">
              <button @click="showAddPhase = false; newPhaseName = ''; newPhaseEmoji = '🌱'" class="btn-outline flex-1 py-2 text-sm">Скасувати</button>
              <button @click="addCustomPhase" :disabled="!newPhaseName.trim()" class="btn-primary flex-1 py-2 text-sm">Додати</button>
            </div>
          </div>
        </div>
      </template>
    </div>
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
const program = ref<any>(null)
const treatments = ref<any[]>([])
const phases = ref<any[]>([])

const addingToPhase = ref<string | null>(null)
const inlineT = reactive({ product_name: '', type: 'підживлення', dosage: '' })
const showAddPhase = ref(false)
const newPhaseName = ref('')
const newPhaseEmoji = ref('🌱')
const productSuggestions = ref<any[]>([])
const showSuggestionsFor = ref<string | null>(null)
let searchTimer: any = null

const TYPE_ICONS: Record<string, string> = {
  підживлення: '🌿', захист: '🛡', гербіцид: '🌾', фунгіцид: '🍄', інсектицид: '🐛',
}
const TYPE_BG: Record<string, string> = {
  підживлення: 'bg-amber-50', захист: 'bg-blue-50', гербіцид: 'bg-orange-50', фунгіцид: 'bg-purple-50', інсектицид: 'bg-red-50',
}
const TYPE_BADGE: Record<string, string> = {
  підживлення: 'bg-amber-50 border-amber-200 text-amber-700',
  захист: 'bg-blue-50 border-blue-200 text-blue-700',
  гербіцид: 'bg-orange-50 border-orange-200 text-orange-700',
  фунгіцид: 'bg-purple-50 border-purple-200 text-purple-700',
  інсектицид: 'bg-red-50 border-red-200 text-red-700',
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

const openAddForm = (phaseKey: string) => {
  resetInline()
  addingToPhase.value = phaseKey
}

const resetInline = () => {
  inlineT.product_name = ''
  inlineT.type = 'підживлення'
  inlineT.dosage = ''
  productSuggestions.value = []
  showSuggestionsFor.value = null
}

const searchProducts = (phaseKey: string) => {
  clearTimeout(searchTimer)
  const q = inlineT.product_name.trim()
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
  inlineT.product_name = p.product_name
  productSuggestions.value = []
  showSuggestionsFor.value = null
}

const hideSuggestions = () => {
  setTimeout(() => { showSuggestionsFor.value = null }, 200)
}

const load = async () => {
  loading.value = true
  const { data: phasesData } = await supabase.from('growth_phases').select('*').order('order_num', { ascending: true })
  phases.value = (phasesData || []).map((p: any) => ({ key: p.key, emoji: p.emoji, order: p.order_num }))

  if (farmCropId) {
    const { data: programData } = await supabase
      .from('protection_programs').select('*').eq('farm_crop_id', farmCropId).maybeSingle()
    program.value = programData

    if (programData) {
      const { data: treatmentsData } = await supabase
        .from('program_treatments').select('*').eq('program_id', programData.id).order('phase_order', { ascending: true })
      treatments.value = treatmentsData || []
    }
  }
  loading.value = false
}

onMounted(load)

const saveTreatment = async (phase: any) => {
  if (!inlineT.product_name || !program.value) return
  saving.value = true
  const payload = {
    program_id: program.value.id,
    phase: phase.key,
    phase_order: phase.order ?? 99,
    type: inlineT.type,
    product_name: inlineT.product_name,
    dosage: inlineT.dosage || null,
    notes: null,
  }
  const { data: inserted, error } = await supabase.from('program_treatments').insert(payload).select().single()
  if (inserted) {
    treatments.value = [...treatments.value, inserted]
  } else {
    console.error('insert error', error)
    const { data } = await supabase.from('program_treatments').select('*').eq('program_id', program.value.id).order('phase_order', { ascending: true })
    treatments.value = data || []
  }
  resetInline()
  addingToPhase.value = null
  saving.value = false
}

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
  phases.value = [...phases.value, { key: newPhaseName.value.trim(), emoji: newPhaseEmoji.value || '🌱', order: newOrderNum }]
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

const deleteTreatment = async (t: any) => {
  if (!confirm(`Видалити "${t.product_name}"?`)) return
  await supabase.from('program_treatments').delete().eq('id', t.id)
  treatments.value = treatments.value.filter(tr => tr.id !== t.id)
}
</script>
