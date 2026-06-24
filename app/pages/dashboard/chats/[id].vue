<template>
  <div class="flex flex-col h-full">
    <!-- Хедер -->
    <div class="bg-white border-b border-agro-border px-6 py-4 flex items-center gap-4 shrink-0">
      <NuxtLink to="/dashboard/chats" class="text-agro-light hover:text-agro transition-colors">←</NuxtLink>
      <div class="w-10 h-10 rounded-full bg-agro-hover flex items-center justify-center font-bold text-agro">
        {{ interlocutorName?.[0]?.toUpperCase() || '?' }}
      </div>
      <div>
        <p class="font-bold text-agro-dark">{{ interlocutorName }}</p>
        <p class="text-xs text-agro-light">{{ iAmAgronomist ? 'Фермер' : 'Агроном' }}</p>
      </div>
    </div>

    <!-- Повідомлення -->
    <div ref="messagesEl" class="flex-1 overflow-y-auto p-6 space-y-4 bg-agro-bg">
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin text-2xl">🌿</div>
      </div>

      <template v-else>
        <!-- Підказка для агронома -->
        <div v-if="iAmAgronomist" class="bg-agro-hover border border-agro/20 rounded-xl px-4 py-3 text-sm text-agro-dark flex gap-3 items-start">
          <span class="text-lg shrink-0">💡</span>
          <div>
            Щоб фермер міг знайти препарат у каталозі — пишіть назву з символом <span class="font-bold text-agro">@</span>, наприклад: <span class="font-bold text-agro">@Раундап</span>, <span class="font-bold text-agro">@КаратеЗеон</span>. Назва має бути одним словом без пробілів.
          </div>
        </div>

        <div v-if="messages.length === 0" class="text-center py-16 text-agro-light">
          Поки немає повідомлень. Почніть розмову!
        </div>

        <div
          v-for="msg in messages"
          :key="msg.id"
          class="flex flex-col"
          :class="isMyMessage(msg) ? 'items-end' : 'items-start'"
        >
          <div
            class="max-w-lg rounded-2xl text-sm leading-relaxed overflow-hidden"
            :class="isMyMessage(msg)
              ? 'bg-agro text-white rounded-br-sm'
              : 'bg-white text-agro-dark shadow-sm rounded-bl-sm border border-agro-border'"
          >
            <img v-if="msg.image_url" :src="msg.image_url" class="w-full max-h-72 object-cover cursor-pointer" @click="lightboxUrl = msg.image_url" />
            <div v-if="msg.content || !msg.image_url" class="px-4 py-3">
              <!-- Повідомлення від агронома: парсимо препарати -->
              <p v-if="msg.content && !isMyMessage(msg)" v-html="renderMessage(msg.content)"></p>
              <p v-else-if="msg.content" class="whitespace-pre-wrap">{{ msg.content }}</p>
              <p class="text-xs mt-1 opacity-60 text-right">{{ formatTime(msg.created_at) }}</p>
            </div>
            <div v-else class="px-3 pb-2 text-right">
              <p class="text-xs opacity-60">{{ formatTime(msg.created_at) }}</p>
            </div>
          </div>

          <!-- Чіпи препаратів + кнопка в схему біля кожного -->
          <div v-if="!isMyMessage(msg) && msg.content && extractProducts(msg.content).length" class="mt-1.5 flex flex-wrap gap-1.5 max-w-lg">
            <div v-for="p in extractProducts(msg.content)" :key="p" class="flex items-center gap-0.5">
              <NuxtLink
                :to="`/catalog?search=${encodeURIComponent(p)}`"
                target="_blank"
                class="text-xs px-2.5 py-1 bg-agro-hover text-agro border border-agro/30 rounded-l-lg hover:bg-agro hover:text-white transition-colors font-medium">
                🔍 {{ p }}
              </NuxtLink>
              <button
                v-if="!iAmAgronomist"
                @click="openSchemeModalForProduct(p)"
                class="text-xs px-2 py-1 bg-agro-hover text-agro border border-l-0 border-agro/30 rounded-r-lg hover:bg-agro hover:text-white transition-colors"
                title="Додати до схеми захисту">
                🛡
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightboxUrl" class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" @click="lightboxUrl = null">
        <img :src="lightboxUrl" class="max-w-full max-h-full rounded-xl object-contain" />
      </div>
    </Teleport>

    <!-- Модалка схеми захисту -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="schemeModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="schemeModal.show = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
            <h2 class="font-bold text-agro-dark text-lg mb-4">🛡 Додати до схеми захисту</h2>
            <div class="space-y-3 mb-5">
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1">Препарат</label>
                <input v-model="schemeModal.product_name" class="input" placeholder="Назва препарату" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1">Фаза росту</label>
                <select v-model="schemeModal.phase" class="input">
                  <option value="">— без фази —</option>
                  <option v-for="p in phases" :key="p.key" :value="p.key">{{ p.emoji }} {{ p.key }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1">Тип</label>
                <select v-model="schemeModal.type" class="input">
                  <option value="підживлення">🌿 Підживлення</option>
                  <option value="захист">🛡 Захист</option>
                  <option value="обробка">💊 Обробка</option>
                  <option value="полив">💧 Полив</option>
                  <option value="інше">📌 Інше</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1">Доза</label>
                <input v-model="schemeModal.dosage" class="input" placeholder="Наприклад: 10 мл/10 л" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1">Нотатка</label>
                <textarea v-model="schemeModal.notes" class="input resize-none" rows="2" />
              </div>
            </div>
            <div class="flex gap-3">
              <button @click="schemeModal.show = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="saveToScheme" :disabled="!schemeModal.product_name || schemeModal.saving" class="btn-primary flex-1">
                {{ schemeModal.saving ? '...' : 'Додати' }}
              </button>
            </div>
            <p v-if="schemeModal.success" class="text-agro text-sm text-center mt-3">✅ Додано до схеми!</p>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Paywall -->
    <div v-if="!isUnlocked && !iAmAgronomist && messageCount >= 3" class="bg-white border-t border-agro-border p-4 text-center">
      <p class="font-semibold text-agro-dark mb-1">🔒 Розблокуйте повне листування</p>
      <p class="text-sm text-agro-light mb-3">Перші 3 повідомлення безкоштовні</p>
      <button @click="unlock" class="btn-primary">Розблокувати</button>
    </div>

    <!-- Інпут -->
    <div v-else class="bg-white border-t border-agro-border px-4 py-3 shrink-0">
      <!-- Превью зображення -->
      <div v-if="imagePreview" class="mb-2 relative inline-block">
        <img :src="imagePreview" class="h-20 rounded-xl object-cover border border-agro-border" />
        <button @click="clearImage" class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none">×</button>
      </div>
      <div class="flex items-end gap-2">
        <!-- Кнопка фото -->
        <label class="w-10 h-10 flex items-center justify-center rounded-xl border border-agro-border hover:bg-agro-hover cursor-pointer transition-colors shrink-0 text-agro-light hover:text-agro">
          <span class="text-lg">📎</span>
          <input type="file" accept="image/*" class="hidden" @change="onImagePick" ref="fileInputEl" />
        </label>
        <textarea
          v-model="input"
          @keydown.enter.exact.prevent="sendMessage"
          class="flex-1 border border-agro-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-agro bg-white"
          :style="{ minHeight: '44px', maxHeight: '120px' }"
          placeholder="Введіть повідомлення... (Enter для відправки)"
          rows="1"
          @input="autoResize"
          ref="inputEl"
        />
        <button
          @click="sendMessage"
          :disabled="(!input.trim() && !imageFile) || sending"
          class="w-11 h-11 bg-agro rounded-xl flex items-center justify-center text-white hover:bg-agro-dark transition-colors disabled:opacity-50 shrink-0"
        >
          <span v-if="sending" class="text-sm">...</span>
          <span v-else>↑</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const chatId = route.params.id as string
const supabase = useSupabaseClient()
const messagesEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)
const fileInputEl = ref<HTMLInputElement | null>(null)

const loading = ref(true)
const sending = ref(false)
const messages = ref<any[]>([])
const input = ref('')
const interlocutorName = ref('')
const isUnlocked = ref(false)
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const lightboxUrl = ref<string | null>(null)

const onImagePick = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

const clearImage = () => {
  imageFile.value = null
  imagePreview.value = null
  if (fileInputEl.value) fileInputEl.value.value = ''
}

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const { data: profileData } = await supabase.from('users').select('role').eq('id', uid).single()
const iAmAgronomist = profileData?.role === 'agronomist'

const messageCount = computed(() => messages.value.filter(m => m.sender_id === uid).length)

const isMyMessage = (msg: any) => {
  return iAmAgronomist ? msg.role === 'assistant' : msg.role === 'user'
}

const formatTime = (d: string) => new Date(d).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

const autoResize = () => {
  if (inputEl.value) {
    inputEl.value.style.height = 'auto'
    inputEl.value.style.height = inputEl.value.scrollHeight + 'px'
  }
}

// Завантаження чату
const { data: chatData } = await supabase.from('chats').select('*, farmer_id, agronomist_id, is_unlocked').eq('id', chatId).single()
isUnlocked.value = chatData?.is_unlocked || false

// Ім'я співрозмовника
const interlocutorId = iAmAgronomist ? chatData?.farmer_id : chatData?.agronomist_id
const { data: interlocutorData } = await supabase.from('users').select('name').eq('id', interlocutorId).single()
interlocutorName.value = interlocutorData?.name || (iAmAgronomist ? 'Фермер' : 'Агроном')

// Повідомлення
const { data: msgsData } = await supabase
  .from('messages')
  .select('*')
  .eq('chat_id', chatId)
  .order('created_at', { ascending: true })

messages.value = msgsData || []
loading.value = false
scrollToBottom()

// Позначити прочитаними
await supabase.from('messages')
  .update({ is_read: true })
  .eq('chat_id', chatId)
  .eq('role', iAmAgronomist ? 'user' : 'assistant')
  .eq('is_read', false)

// Realtime
const channel = supabase.channel(`chat-${chatId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `chat_id=eq.${chatId}`,
  }, (payload) => {
    // Не дублюємо якщо вже є
    if (messages.value.find(m => m.id === payload.new.id)) return
    messages.value.push(payload.new)
    scrollToBottom()
    // Позначити прочитаним якщо не моє
    const myRole = iAmAgronomist ? 'assistant' : 'user'
    if (payload.new.role !== myRole) {
      supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id)
    }
  })
  .subscribe()

onUnmounted(() => { supabase.removeChannel(channel) })

const sendMessage = async () => {
  if (!input.value.trim() && !imageFile.value) return
  if (sending.value) return
  sending.value = true

  const content = input.value.trim()
  input.value = ''
  if (inputEl.value) inputEl.value.style.height = 'auto'

  const role = iAmAgronomist ? 'assistant' : 'user'

  let image_url: string | null = null
  if (imageFile.value) {
    const fd = new FormData()
    fd.append('file', imageFile.value)
    fd.append('chatId', chatId)
    const res = await $fetch<{ url: string }>('/api/upload-image', { method: 'POST', body: fd }).catch(() => null)
    if (res?.url) image_url = res.url
    clearImage()
  }

  const tempMsg = { id: `temp-${Date.now()}`, chat_id: chatId, role, content, image_url, created_at: new Date().toISOString(), is_read: false }
  messages.value.push(tempMsg)
  scrollToBottom()

  const { data, error } = await supabase.from('messages').insert({
    chat_id: chatId,
    role,
    content: content || null,
    image_url,
    is_read: false,
  }).select().single()


  if (data) {
    const idx = messages.value.findIndex(m => m.id === tempMsg.id)
    if (idx !== -1) messages.value[idx] = data
  }

  sending.value = false
}

const unlock = async () => {
  await supabase.from('chats').update({ is_unlocked: true }).eq('id', chatId)
  isUnlocked.value = true
}

// Парсинг [[Препарат]] → посилання
const renderMessage = (text: string) => {
  return text.replace(/@([\wА-ЯҐЄІЇа-яґєії'-]+)/g, (_, name) =>
    `<a href="/catalog?search=${encodeURIComponent(name)}" target="_blank" class="inline-flex items-center gap-1 text-agro font-semibold underline underline-offset-2 hover:text-agro/80 transition-colors">🔍 ${name}</a>`
  )
}

const extractProducts = (text: string): string[] => {
  const matches = [...text.matchAll(/@([\wА-ЯҐЄІЇа-яґєії'-]+)/g)]
  return [...new Set(matches.map(m => m[1]))]
}

const phases = ref<{ key: string; emoji: string; order: number }[]>([])
supabase.from('growth_phases').select('*').order('order_num', { ascending: true }).then(({ data }) => {
  phases.value = (data || []).map((p: any) => ({ key: p.key, emoji: p.emoji, order: p.order_num }))
})

const schemeModal = reactive({
  show: false,
  product_name: '',
  phase: '',
  type: 'захист',
  dosage: '',
  notes: '',
  saving: false,
  success: false,
})

const openSchemeModalForProduct = (productName: string) => {
  schemeModal.product_name = productName
  schemeModal.phase = ''
  schemeModal.type = 'захист'
  schemeModal.dosage = ''
  schemeModal.notes = ''
  schemeModal.success = false
  schemeModal.show = true
}

const openSchemeModal = (content: string) => {
  const products = extractProducts(content)
  schemeModal.product_name = products[0] || ''
  schemeModal.phase = ''
  schemeModal.type = 'захист'
  schemeModal.dosage = ''
  schemeModal.notes = ''
  schemeModal.success = false
  schemeModal.show = true
}

const saveToScheme = async () => {
  if (!schemeModal.product_name) return
  schemeModal.saving = true

  const { data: farms } = await supabase
    .from('farms')
    .select('id, farm_crops(id, crop_type)')
    .eq('user_id', uid)
    .limit(1)
    .single()

  const farmCrop = farms?.farm_crops?.[0]
  let programId: string | null = null

  if (farmCrop) {
    const { data: prog } = await supabase
      .from('protection_programs')
      .upsert(
        { farm_crop_id: farmCrop.id, user_id: uid, name: `Схема для ${farmCrop.crop_type}` },
        { onConflict: 'farm_crop_id' }
      )
      .select('id').single()
    programId = prog?.id || null
  }

  if (programId) {
    const phaseObj = phases.value.find(p => p.key === schemeModal.phase)
    await supabase.from('program_treatments').insert({
      program_id: programId,
      product_name: schemeModal.product_name,
      phase: schemeModal.phase || null,
      phase_order: phaseObj?.order ?? 99,
      type: schemeModal.type,
      dosage: schemeModal.dosage || null,
      notes: schemeModal.notes || null,
    })
  }

  schemeModal.saving = false
  schemeModal.success = true
  setTimeout(() => { schemeModal.show = false }, 1500)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
