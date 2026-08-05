<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="flex items-center gap-2.5 mb-1.5">
        <div class="dash-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2l-2 4h16l-2-4M4 6l2 14h12l2-14M9 10v6M12 10v6M15 10v6"/>
          </svg>
        </div>
        <h1 class="dash-title bitter">Що закуповую</h1>
        <button @click="showModal = true" class="dash-btn-primary ml-auto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Додати культуру
        </button>
      </div>
      <p class="dash-subtitle">Культури які ви шукаєте</p>
    </div>

    <!-- Список -->
    <div class="card">
      <div v-if="loading" class="divide-y divide-agro-border">
        <div v-for="i in 3" :key="i" class="flex items-center gap-4 py-4 first:pt-0 last:pb-0 animate-pulse">
          <div class="w-8 h-8 rounded-full bg-agro-hover shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-agro-hover rounded w-1/3"></div>
            <div class="h-3 bg-agro-hover rounded w-1/2"></div>
          </div>
        </div>
      </div>
      <div v-else-if="crops.length" class="divide-y divide-agro-border">
        <div v-for="c in crops" :key="c.id" class="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
          <span class="text-2xl shrink-0">{{ cropEmoji(c.crop_type) }}</span>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-agro-dark">{{ c.crop_type }}</p>
            <p class="text-xs text-agro-light mt-0.5">
              {{ (c.min_qty || c.max_qty) ? `${c.min_qty || '—'} – ${c.max_qty || '—'} ${c.unit}` : 'Обсяг не вказано' }}
            </p>
            <p v-if="c.notes" class="text-xs text-agro-light mt-0.5 italic">{{ c.notes }}</p>
          </div>
          <button @click="deleteCrop(c.id)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-red-400 shrink-0">✕</button>
        </div>
      </div>
      <div v-else-if="!crops.length" class="text-center py-20 text-agro-light">
        <p class="text-5xl mb-3">🌾</p>
        <p class="font-semibold text-agro-dark">Поки нічого не додано</p>
        <p class="text-sm mt-1">Натисніть "Додати культуру" щоб почати</p>
      </div>
    </div>
  </div>

  <!-- Попап -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="font-bold text-agro-dark text-lg">➕ Додати культуру</h2>
            <button @click="showModal = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-agro-hover text-agro-light">✕</button>
          </div>
          <div class="space-y-4">
            <div class="relative">
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Культура</label>
              <input v-model="form.crop_type" @input="onCropInput" @blur="hideSuggestions" class="input" placeholder="Наприклад: Пшениця..." autocomplete="off" />
              <div v-if="cropSuggestions.length" class="absolute z-10 left-0 right-0 bg-white border border-agro-border rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                <button v-for="s in cropSuggestions" :key="s" type="button"
                  @mousedown.prevent="selectCrop(s)"
                  class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors flex items-center gap-2">
                  <span>{{ cropEmoji(s) }}</span>
                  <span>{{ s }}</span>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Обсяг закупівлі</label>
              <div class="flex gap-2 items-center">
                <input v-model="form.min_qty" type="number" min="0" class="input" placeholder="від" />
                <span class="text-agro-light shrink-0 font-medium">–</span>
                <input v-model="form.max_qty" type="number" min="0" class="input" placeholder="до" />
                <div class="flex rounded-xl border border-agro-border overflow-hidden shrink-0">
                  <button @click="form.unit = 'т'" type="button"
                    class="px-3 py-3 text-sm font-semibold transition-colors"
                    :class="form.unit === 'т' ? 'bg-agro text-white' : 'bg-white text-agro-light hover:bg-agro-hover'">т</button>
                  <button @click="form.unit = 'кг'" type="button"
                    class="px-3 py-3 text-sm font-semibold transition-colors"
                    :class="form.unit === 'кг' ? 'bg-agro text-white' : 'bg-white text-agro-light hover:bg-agro-hover'">кг</button>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Опис / умови (необов'язково)</label>
              <textarea v-model="form.notes" class="input resize-none" rows="2" placeholder="Наприклад: тільки суха, клас не нижче 3..." />
            </div>
            <div class="flex gap-3 pt-1">
              <button @click="showModal = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="addCrop" :disabled="!form.crop_type.trim() || saving" class="btn-primary flex-1">
                {{ saving ? '...' : 'Додати' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
useHead({ title: 'Що закуповую' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const { cropEmoji, CROP_SLUGS } = await import('~/utils/cropSlugs')

const crops = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const form = reactive({ crop_type: '', min_qty: null as number | null, max_qty: null as number | null, unit: 'т', notes: '' })

const cropSuggestions = ref<string[]>([])
const allCropNames = Object.keys(CROP_SLUGS)

const onCropInput = () => {
  const q = form.crop_type.trim().toLowerCase()
  cropSuggestions.value = q.length < 1 ? [] : allCropNames.filter(n => n.toLowerCase().includes(q)).slice(0, 8)
}
const selectCrop = (name: string) => {
  form.crop_type = name
  cropSuggestions.value = []
}
const hideSuggestions = () => {
  setTimeout(() => { cropSuggestions.value = [] }, 150)
}

const authFetch = async (url: string, opts: any = {}) => {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = session ? { Authorization: `Bearer ${session.access_token}` } : {}
  return $fetch(url, { ...opts, headers: { ...headers, ...opts.headers } })
}

onMounted(async () => {
  try {
    crops.value = await authFetch('/api/buyer-crops') as any[]
  } catch (e) {
    console.error('load crops error:', e)
  } finally {
    loading.value = false
  }
})

const addCrop = async () => {
  if (!form.crop_type.trim() || saving.value) return
  saving.value = true
  try {
    const data = await authFetch('/api/buyer-crops', {
      method: 'POST',
      body: {
        crop_type: form.crop_type.trim(),
        min_qty: form.min_qty || null,
        max_qty: form.max_qty || null,
        unit: form.unit,
        notes: form.notes.trim() || null,
      },
    })
    crops.value.push(data as any)
    form.crop_type = ''
    form.min_qty = null
    form.max_qty = null
    form.unit = 'т'
    form.notes = ''
    showModal.value = false
  } catch (e: any) {
    alert('Помилка: ' + (e.data?.statusMessage || e.message))
  }
  saving.value = false
}

const { confirm: confirmDialog } = useConfirm()

const deleteCrop = async (id: string) => {
  if (!await confirmDialog('Культуру буде видалено.', { title: 'Видалити?' })) return
  await authFetch(`/api/buyer-crops/${id}`, { method: 'DELETE' })
  crops.value = crops.value.filter((c: any) => c.id !== id)
}
</script>

<style scoped>
.dash-page { padding: 44px 56px; font-family: Manrope, sans-serif; max-width: 1196px; }
.dash-head { margin-bottom: 28px; }
.dash-title { font-family: 'Bitter', Georgia, serif; font-weight: 800; font-size: 28px; color: rgb(27,46,27); margin: 0; }
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-subtitle { font-size: 15.5px; color: rgb(107,122,100); margin: 4px 0 0; }
.dash-icon-box { width: 40px; height: 40px; border-radius: 10px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dash-btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: 10px; background: rgb(47,82,51); color: rgb(250,246,236); font-weight: 700; font-size: 14px; border: none; cursor: pointer; }
@media (max-width: 640px) { .dash-page { padding: 24px 20px; } }
</style>
