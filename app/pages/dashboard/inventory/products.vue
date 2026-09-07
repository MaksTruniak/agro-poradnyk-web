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
          <div v-if="editing === crop.id" class="flex items-center gap-2">
            <input v-model="editQty" type="number" min="0" step="0.1"
              class="input w-24 text-right" placeholder="0" @keyup.enter="save(crop)" @keyup.escape="editing = null" />
            <div class="flex rounded-xl border border-agro-border overflow-hidden">
              <button @click="editUnit = 'т'" type="button"
                class="px-2.5 py-1.5 text-xs font-semibold transition-colors"
                :class="editUnit === 'т' ? 'bg-agro text-white' : 'bg-white text-agro-light hover:bg-agro-hover'">т</button>
              <button @click="editUnit = 'кг'" type="button"
                class="px-2.5 py-1.5 text-xs font-semibold transition-colors"
                :class="editUnit === 'кг' ? 'bg-agro text-white' : 'bg-white text-agro-light hover:bg-agro-hover'">кг</button>
            </div>
            <button @click="save(crop)" :disabled="saving" class="dash-btn-primary text-xs px-3 py-1.5">
              {{ saving ? '...' : 'Зберегти' }}
            </button>
            <button @click="editing = null" class="w-8 h-8 flex items-center justify-center rounded-xl border border-agro-border text-agro-light hover:bg-agro-hover transition-colors">✕</button>
          </div>
          <template v-else>
            <span v-if="crop.stock_quantity != null"
              class="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full">
              {{ crop.stock_quantity }} {{ crop.stock_unit || 'т' }}
            </span>
            <span v-else class="text-xs text-agro-light">не вказано</span>
            <button @click="startEdit(crop)"
              class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-agro-hover transition-colors text-agro">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Продукція — Склад' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const crops = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const editing = ref<string | null>(null)
const editQty = ref('')
const editUnit = ref('т')

const cropToSlug = (name: string) => name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яіїєґ0-9-]/gi, '') || 'grain'

function startEdit(crop: any) {
  editing.value = crop.id
  editQty.value = crop.stock_quantity != null ? String(crop.stock_quantity) : ''
  editUnit.value = crop.stock_unit || 'т'
}

async function save(crop: any) {
  saving.value = true
  const qty = editQty.value !== '' ? parseFloat(editQty.value) : null
  await supabase.from('farm_crops').update({ stock_quantity: qty, stock_unit: editUnit.value }).eq('id', crop.id)
  crop.stock_quantity = qty
  crop.stock_unit = editUnit.value
  editing.value = null
  saving.value = false
}

async function load() {
  loading.value = true
  const uid = user.value?.id
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
