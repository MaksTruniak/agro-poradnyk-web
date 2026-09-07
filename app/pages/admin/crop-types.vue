<template>
  <div class="p-8 max-w-4xl">
    <div class="mb-7 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22V12"/><path d="M8 18c0-4 4-8 4-8s4 4 4 8"/><path d="M5 22h14"/><path d="M4 12c0-4 3.5-7 8-7s8 3 8 7"/>
          </svg>
          Категорії культур
        </h1>
        <p class="text-agro-light mt-1">Довідник культур для вибору при додаванні поля</p>
      </div>
      <button @click="openAdd" class="btn-primary shrink-0">+ Додати</button>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="card animate-pulse h-16" />
    </div>

    <div v-else class="card p-0 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-agro-border bg-agro-bg">
            <th class="text-left px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide w-8">#</th>
            <th class="text-left px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide">Назва</th>
            <th class="text-left px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide">Slug</th>
            <th class="text-left px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide">Опис</th>
            <th class="px-5 py-3.5 text-center text-agro-light font-semibold text-xs uppercase tracking-wide">Активна</th>
            <th class="px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide w-20">Порядок</th>
            <th class="px-5 py-3.5 w-24"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" class="border-b border-agro-border last:border-0 hover:bg-agro-bg/40 transition-colors">
            <td class="px-5 py-3 text-agro-light text-xs font-mono">{{ item.sort_order }}</td>
            <td class="px-5 py-3 font-semibold text-agro-dark">{{ item.name }}</td>
            <td class="px-5 py-3 text-agro-light font-mono text-xs">{{ item.slug }}</td>
            <td class="px-5 py-3 text-agro-light text-xs max-w-xs truncate">{{ item.description || '—' }}</td>
            <td class="px-5 py-3 text-center">
              <span class="inline-block w-2 h-2 rounded-full" :class="item.is_active ? 'bg-green-500' : 'bg-gray-300'" />
            </td>
            <td class="px-5 py-3 text-agro-light text-sm">{{ item.sort_order }}</td>
            <td class="px-5 py-3 text-right">
              <button @click="openEdit(item)" class="text-xs font-semibold text-agro hover:text-agro-dark transition-colors">
                Редагувати
              </button>
            </td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="7" class="px-5 py-10 text-center text-agro-light">Немає культур</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Модал додавання/редагування -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="modal.show = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
          <h2 class="font-bold text-agro-dark text-lg mb-5">{{ modal.id ? 'Редагувати культуру' : 'Додати культуру' }}</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1">Назва <span class="text-red-400">*</span></label>
                <input v-model="modal.name" type="text" class="input" placeholder="Пшениця" @input="autoSlug" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1">Slug <span class="text-red-400">*</span></label>
                <input v-model="modal.slug" type="text" class="input font-mono text-sm" placeholder="pshenytsia" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1">Опис</label>
              <textarea v-model="modal.description" class="input resize-none" rows="2" placeholder="Короткий опис культури" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1">Порядок сортування</label>
                <input v-model.number="modal.sort_order" type="number" min="0" class="input" placeholder="0" />
              </div>
              <div class="flex items-end pb-1">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <button @click="modal.is_active = !modal.is_active" type="button"
                    class="w-10 h-6 rounded-full transition-colors flex items-center px-0.5"
                    :class="modal.is_active ? 'bg-agro' : 'bg-gray-200'">
                    <span class="w-5 h-5 rounded-full bg-white shadow transition-transform"
                      :class="modal.is_active ? 'translate-x-4' : 'translate-x-0'" />
                  </button>
                  <span class="text-sm font-medium text-agro-dark">Активна</span>
                </label>
              </div>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button @click="modal.show = false" class="btn-outline flex-1">Скасувати</button>
            <button @click="save" :disabled="!modal.name || !modal.slug || saving" class="btn-primary flex-1 flex items-center justify-center disabled:opacity-50">
              {{ saving ? '...' : 'Зберегти' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'Культури — Адмін' })

const supabase = useSupabaseClient()
const items = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)

const modal = reactive({
  show: false, id: null as string | null,
  name: '', slug: '', description: '', is_active: true, sort_order: 0,
})

function autoSlug() {
  if (modal.id) return
  modal.slug = modal.name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-zа-яіїєґ0-9-]/gi, '')
    .replace(/[а-яіїєґ]/gi, (c: string) => {
      const map: Record<string, string> = { а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ie',ж:'zh',з:'z',и:'y',і:'i',ї:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'iu',я:'ia' }
      return map[c.toLowerCase()] || c
    })
}

function openAdd() {
  Object.assign(modal, { show: true, id: null, name: '', slug: '', description: '', is_active: true, sort_order: items.value.length * 10 })
}

function openEdit(item: any) {
  Object.assign(modal, { show: true, id: item.id, name: item.name, slug: item.slug, description: item.description || '', is_active: item.is_active, sort_order: item.sort_order })
}

async function save() {
  saving.value = true
  const payload = { name: modal.name, slug: modal.slug, description: modal.description || null, is_active: modal.is_active, sort_order: modal.sort_order }
  if (modal.id) {
    const { error } = await supabase.from('agro_product_types').update(payload).eq('id', modal.id)
    if (!error) {
      const idx = items.value.findIndex(i => i.id === modal.id)
      if (idx !== -1) Object.assign(items.value[idx], payload)
    }
  } else {
    const { data, error } = await supabase.from('agro_product_types').insert(payload).select().single()
    if (!error && data) items.value.push(data)
  }
  saving.value = false
  modal.show = false
}

async function load() {
  const { data } = await supabase.from('agro_product_types').select('*').order('sort_order').order('name')
  items.value = data || []
  loading.value = false
}

onMounted(load)
</script>
