<template>
  <div class="dash-page">
    <div class="dash-head">
      <NuxtLink to="/dashboard/inventory" class="dash-icon-box shrink-0 hover:bg-agro-hover transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </NuxtLink>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Продукція</h1>
        <p class="dash-subtitle">Залишки вирощеної продукції на складі</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="card animate-pulse h-20"></div>
    </div>

    <div v-else-if="!crops.length" class="card text-center py-16">
      <div class="dash-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,130,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22V12"/><path d="M8 18c0-4 4-8 4-8s4 4 4 8"/><path d="M5 22h14"/>
        </svg>
      </div>
      <p class="font-bold text-agro-dark text-lg mb-2">Немає культур</p>
      <p class="text-agro-light">Додайте культури до своїх полів, щоб вести облік продукції</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="crop in crops" :key="crop.id" class="card flex items-center gap-4">
        <img :src="`/crops/${cropToSlug(crop.crop_type)}.svg`" :alt="crop.crop_type"
          class="w-9 h-9 object-contain shrink-0"
          @error="($event.target as HTMLImageElement).style.display='none'" />
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-agro-dark">{{ crop.crop_type }}{{ crop.variety ? ` · ${crop.variety}` : '' }}</p>
          <p class="text-xs text-agro-light mt-0.5">{{ crop.farm_name }}{{ crop.area_ha ? ` · ${crop.area_ha} га` : '' }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span v-if="crop.stock_quantity != null"
            class="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full">
            {{ crop.stock_quantity }} {{ crop.stock_unit || 'т' }}
          </span>
          <span v-else class="text-xs text-agro-light">не вказано</span>
          <button @click="startEdit(crop)"
            class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-agro-hover transition-colors text-agro">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Модал редагування залишку -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="editingCrop" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="editingCrop = null" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
          <div class="flex items-center gap-3 mb-5">
            <img :src="`/crops/${cropToSlug(editingCrop.crop_type)}.svg`" :alt="editingCrop.crop_type"
              class="w-8 h-8 object-contain shrink-0"
              @error="($event.target as HTMLImageElement).style.display='none'" />
            <div>
              <h2 class="font-bold text-agro-dark text-lg leading-tight">{{ editingCrop.crop_type }}{{ editingCrop.variety ? ` · ${editingCrop.variety}` : '' }}</h2>
              <p class="text-xs text-agro-light">{{ editingCrop.farm_name }}</p>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">На складі</label>
              <div class="flex gap-2">
                <input v-model="editQty" type="number" min="0" step="0.1"
                  class="input flex-1" placeholder="0" inputmode="decimal" />
                <div class="flex rounded-xl border border-agro-border overflow-hidden shrink-0">
                  <button @click="editUnit = 'т'" type="button"
                    class="px-3 py-2 text-sm font-semibold transition-colors"
                    :class="editUnit === 'т' ? 'bg-agro text-white' : 'bg-white text-agro-light hover:bg-agro-hover'">т</button>
                  <button @click="editUnit = 'кг'" type="button"
                    class="px-3 py-2 text-sm font-semibold transition-colors"
                    :class="editUnit === 'кг' ? 'bg-agro text-white' : 'bg-white text-agro-light hover:bg-agro-hover'">кг</button>
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button @click="editingCrop = null" class="btn-outline flex-1">Скасувати</button>
            <button @click="save" :disabled="saving" class="btn-primary flex-1 flex items-center justify-center">
              {{ saving ? '...' : 'Зберегти' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Продукція — Склад' })

const supabase = useSupabaseClient()
const { getQueryUserId } = useTeamContext()

const crops = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const editingCrop = ref<any>(null)
const editQty = ref('')
const editUnit = ref('т')

const cropToSlug = (name: string) => name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яіїєґ0-9-]/gi, '') || 'grain'

function startEdit(crop: any) {
  editingCrop.value = crop
  editQty.value = crop.stock_quantity != null ? String(crop.stock_quantity) : ''
  editUnit.value = crop.stock_unit || 'т'
}

async function save() {
  if (!editingCrop.value) return
  saving.value = true
  const qty = editQty.value !== '' ? parseFloat(editQty.value) : null
  await supabase.from('farm_crops').update({ stock_quantity: qty, stock_unit: editUnit.value }).eq('id', editingCrop.value.id)
  editingCrop.value.stock_quantity = qty
  editingCrop.value.stock_unit = editUnit.value
  editingCrop.value = null
  saving.value = false
}

async function load() {
  loading.value = true
  const uid = await getQueryUserId()
  if (!uid) { loading.value = false; return }

  const { data, error } = await supabase
    .from('farms')
    .select('id, name, farm_crops(*)')
    .eq('user_id', uid)
    .order('created_at')

  if (error) console.error('[products]', error)

  const result: any[] = []
  for (const farm of data || []) {
    for (const c of (farm.farm_crops || [])) {
      result.push({ ...c, farm_name: farm.name })
    }
  }
  result.sort((a, b) => a.crop_type.localeCompare(b.crop_type, 'uk'))
  crops.value = result
  loading.value = false
}

onMounted(load)
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(230,245,225); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
</style>
