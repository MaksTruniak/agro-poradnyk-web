<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-extrabold text-agro-dark">🔔 Нагадування</h1>
        <p class="text-agro-light mt-1">Заплановані обробки та події</p>
      </div>
      <button @click="showAdd = true" class="btn-primary">➕ Додати</button>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="card animate-pulse h-20"></div>
    </div>

    <div v-else-if="reminders.length === 0" class="card text-center py-16">
      <p class="text-5xl mb-4">🔔</p>
      <p class="font-bold text-agro-dark text-lg mb-2">Нагадувань поки немає</p>
      <p class="text-agro-light mb-6">Додайте нагадування про обробку або будь-яку подію</p>
      <button @click="showAdd = true" class="btn-primary inline-block">➕ Додати нагадування</button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="r in reminders" :key="r.id"
        class="card flex items-start gap-4"
        :class="isPast(r.remind_at) ? 'opacity-60' : ''"
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

    <!-- Модалка додавання -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAdd" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAdd = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-8">
            <h2 class="font-bold text-agro-dark text-xl mb-5">🔔 Нове нагадування</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Назва</label>
                <input v-model="newForm.title" class="input" placeholder="Наприклад: Обприскування пшениці" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Дата та час</label>
                <input v-model="newForm.remind_at" type="datetime-local" class="input" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Нотатка (необов'язково)</label>
                <textarea v-model="newForm.note" class="input resize-none" rows="2" placeholder="Деталі..." />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-2">Тип</label>
                <div class="grid grid-cols-3 gap-2">
                  <button v-for="t in TYPES" :key="t.value" @click="newForm.type = t.value"
                    class="flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-colors"
                    :class="newForm.type === t.value ? 'border-agro bg-agro-hover text-agro font-semibold' : 'border-agro-border text-agro-light'">
                    <span>{{ t.emoji }}</span> {{ t.label }}
                  </button>
                </div>
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button @click="showAdd = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="addReminder" :disabled="!newForm.title || !newForm.remind_at || saving" class="btn-primary flex-1">
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
  { value: 'збір', label: 'Збір врожаю', emoji: '🌾' },
  { value: 'інше', label: 'Інше', emoji: '🔔' },
]

const TYPE_EMOJI: Record<string, string> = Object.fromEntries(TYPES.map(t => [t.value, t.emoji]))

const newForm = reactive({ title: '', remind_at: '', note: '', type: 'інше' })

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
  ? new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : ''

const isPast = (d: string) => d ? new Date(d) < new Date() : false


const addReminder = async () => {
  if (!newForm.title || !newForm.remind_at) return
  saving.value = true
  await supabase.from('reminders').insert({
    user_id: uid,
    description: newForm.title,
    scheduled_date: newForm.remind_at,
    type: newForm.type,
    from_agronomist: false,
  })
  Object.assign(newForm, { title: '', remind_at: '', note: '', type: 'інше' })
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
