<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center gap-3 px-6 py-4 border-b border-agro-border bg-white shrink-0">
      <div class="w-10 h-10 rounded-full bg-agro flex items-center justify-center text-white text-xl shrink-0">🤖</div>
      <div class="flex-1 min-w-0">
        <p class="font-bold text-agro-dark">AI Агроном</p>
        <p class="text-xs text-agro-light truncate">
          {{ selectedCrop ? `${farmName} · ${CROP_EMOJI[selectedCrop.crop_type] || '🌱'} ${selectedCrop.crop_type}${selectedCrop.variety ? ` · ${selectedCrop.variety}` : ''}` : (farmName || 'Загальна консультація') }}
        </p>
      </div>
      <!-- Provider toggle -->
      <div class="flex items-center gap-1 bg-agro-bg rounded-xl p-1 shrink-0">
        <button @click="provider = 'groq'"
          class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
          :class="provider === 'groq' ? 'bg-white text-agro shadow-sm' : 'text-agro-light hover:text-agro'">
          Groq
        </button>
        <button @click="provider = 'gemini'"
          class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
          :class="provider === 'gemini' ? 'bg-white text-agro shadow-sm' : 'text-agro-light hover:text-agro'">
          Gemini
        </button>
        <button @click="provider = 'claude'"
          class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
          :class="provider === 'claude' ? 'bg-white text-agro shadow-sm' : 'text-agro-light hover:text-agro'">
          Claude
        </button>
      </div>

      <button v-if="selectedCrop !== undefined" @click="resetCrop"
        class="text-xs text-agro-light hover:text-agro px-3 py-1.5 rounded-lg border border-agro-border hover:border-agro transition-colors shrink-0">
        ← Змінити
      </button>
    </div>

    <!-- Crop selection screen -->
    <div v-if="!selectedCrop && !loading" class="flex-1 overflow-y-auto px-6 py-8">
      <div v-if="crops.length > 0">
        <p class="font-bold text-agro-dark text-lg mb-1">По якій культурі консультація?</p>
        <p class="text-agro-light text-sm mb-6">Оберіть культуру з поля <span class="font-medium text-agro-dark">{{ farmName }}</span></p>
        <div class="grid sm:grid-cols-2 gap-3 mb-6">
          <button v-for="crop in crops" :key="crop.id" @click="selectCrop(crop)"
            class="card flex items-center gap-4 text-left hover:border-agro hover:shadow-md transition-all border-2 border-transparent">
            <span class="text-4xl shrink-0">{{ CROP_EMOJI[crop.crop_type] || '🌱' }}</span>
            <div>
              <p class="font-bold text-agro-dark">{{ crop.crop_type }}</p>
              <p v-if="crop.variety" class="text-xs text-agro-light mt-0.5">Сорт: {{ crop.variety }}</p>
            </div>
          </button>
        </div>
        <button @click="selectGeneral"
          class="w-full text-center text-sm text-agro-light hover:text-agro py-3 border-2 border-dashed border-agro-border hover:border-agro rounded-xl transition-colors">
          🌾 Загальне питання без конкретної культури
        </button>
      </div>

      <!-- No farm / no crops -->
      <div v-else class="flex flex-col items-center justify-center h-full text-center py-12">
        <p class="text-5xl mb-4">🌾</p>
        <p class="font-bold text-agro-dark text-lg mb-2">Вітаю! Я ваш AI агроном</p>
        <p class="text-agro-light mb-6 max-w-sm">Запитайте мене про захист рослин, добрива, хвороби культур або будь-що пов'язане з агрономією</p>
        <button @click="selectGeneral" class="btn-primary">Почати консультацію →</button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="flex-1 overflow-y-auto p-6 space-y-4 bg-agro-bg">
      <div class="flex items-end gap-2">
        <div class="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0"></div>
        <div class="h-12 w-64 bg-white rounded-2xl rounded-bl-sm animate-pulse border border-agro-border"></div>
      </div>
      <div class="flex items-end gap-2 justify-end">
        <div class="h-10 w-44 bg-agro/20 rounded-2xl rounded-br-sm animate-pulse"></div>
      </div>
      <div class="flex items-end gap-2">
        <div class="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0"></div>
        <div class="h-20 w-72 bg-white rounded-2xl rounded-bl-sm animate-pulse border border-agro-border"></div>
      </div>
      <div class="flex items-end gap-2 justify-end">
        <div class="h-10 w-52 bg-agro/20 rounded-2xl rounded-br-sm animate-pulse"></div>
      </div>
      <div class="flex items-end gap-2">
        <div class="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0"></div>
        <div class="h-10 w-48 bg-white rounded-2xl rounded-bl-sm animate-pulse border border-agro-border"></div>
      </div>
    </div>

    <!-- Chat -->
    <template v-if="selectedCrop !== null && !loading">
      <div ref="messagesEl" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-center py-12">
          <p class="text-5xl mb-4">{{ selectedCrop ? (CROP_EMOJI[selectedCrop.crop_type] || '🌱') : '🤖' }}</p>
          <p class="font-bold text-agro-dark text-lg mb-2">
            {{ selectedCrop ? `Консультація по ${selectedCrop.crop_type}` : 'Загальна консультація' }}
          </p>
          <p class="text-agro-light mb-6 max-w-sm text-sm">Запитайте про захист, добрива, хвороби або шкідників</p>
          <div class="flex flex-wrap gap-2 justify-center">
            <button v-for="hint in dynamicHints" :key="hint" @click="sendHint(hint)"
              class="text-sm px-4 py-2 rounded-full border-2 border-agro-border hover:border-agro hover:text-agro text-agro-light transition-colors">
              {{ hint }}
            </button>
          </div>
        </div>

        <template v-else>
          <!-- Банер обмеження історії для free -->
          <div v-if="!isPro && hasOlderHistory" class="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
            <span class="text-lg shrink-0">🔒</span>
            <div class="flex-1">
              <p class="font-medium text-amber-800">Показано лише 7 днів історії</p>
              <p class="text-amber-600 text-xs mt-0.5">Перейдіть на PRO щоб бачити повну історію</p>
            </div>
            <NuxtLink to="/dashboard/subscription" class="text-xs font-bold text-amber-700 hover:text-amber-900 shrink-0">PRO →</NuxtLink>
          </div>

          <div v-for="(msg, i) in messages" :key="i" class="flex gap-3" :class="msg.role === 'user' ? 'flex-row-reverse' : ''">
            <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm"
              :class="msg.role === 'user' ? 'bg-agro text-white' : 'bg-agro-hover text-agro'">
              {{ msg.role === 'user' ? '👤' : '🤖' }}
            </div>
            <div class="max-w-[75%]">
              <div class="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                :class="msg.role === 'user' ? 'bg-agro text-white rounded-tr-sm' : 'bg-white border border-agro-border text-agro-dark rounded-tl-sm'">
                <!-- User: plain text -->
                <span v-if="msg.role === 'user'" class="whitespace-pre-wrap">{{ msg.content }}</span>
                <!-- AI: з посиланнями на препарати -->
                <span v-else class="whitespace-pre-wrap" v-html="renderMessage(msg.content)"></span>
              </div>
              <!-- Кнопка "Додати до схеми" для AI повідомлень зі схемою -->
              <div v-if="msg.role === 'assistant' && msg.hasScheme" class="mt-2 flex gap-2 flex-wrap">
                <button @click="openSchemeModal(msg.content)"
                  class="text-xs px-3 py-1.5 bg-agro text-white rounded-lg hover:bg-agro/90 transition-colors font-medium">
                  🛡 Додати до схеми захисту
                </button>
              </div>
              <!-- Препарати: посилання на каталог + кнопка в схему -->
              <div v-if="msg.role === 'assistant' && msg.products?.length" class="mt-2 flex gap-2 flex-wrap">
                <div v-for="p in msg.products" :key="p" class="flex items-center gap-0.5">
                  <NuxtLink
                    :to="`/catalog?search=${encodeURIComponent(p)}`"
                    target="_blank"
                    class="text-xs px-3 py-1.5 bg-agro-hover text-agro border border-agro/30 rounded-l-lg hover:bg-agro hover:text-white transition-colors font-medium">
                    🔍 {{ p }}
                  </NuxtLink>
                  <button
                    @click="openSchemeModalForProduct(p)"
                    class="text-xs px-2 py-1.5 bg-agro-hover text-agro border border-l-0 border-agro/30 rounded-r-lg hover:bg-agro hover:text-white transition-colors"
                    title="Додати до схеми захисту">
                    🛡
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="streaming" class="flex gap-3">
            <div class="w-8 h-8 rounded-full bg-agro-hover flex items-center justify-center text-sm shrink-0">🤖</div>
            <div class="bg-white border border-agro-border rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-agro-dark leading-relaxed whitespace-pre-wrap max-w-[75%]">
              {{ streamingText }}<span class="animate-pulse">▋</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Ліміт вичерпано -->
      <div v-if="!isPro && dailyCount >= DAILY_LIMIT" class="px-6 py-4 border-t border-agro-border bg-white shrink-0 text-center">
        <p class="font-semibold text-agro-dark mb-1">🔒 Ліміт на сьогодні вичерпано</p>
        <p class="text-sm text-agro-light mb-3">Базовий план — 5 запитів/день. Оновіть до PRO для необмеженого доступу та збереження історії.</p>
        <NuxtLink to="/dashboard/subscription" class="btn-primary inline-block">⭐ Перейти на PRO</NuxtLink>
      </div>

      <!-- Input -->
      <div v-else class="px-6 py-4 border-t border-agro-border bg-white shrink-0">
        <div class="flex gap-3 items-end">
          <textarea
            v-model="input"
            @keydown.enter.exact.prevent="send"
            rows="1"
            class="flex-1 input resize-none leading-relaxed"
            style="min-height: 44px; max-height: 140px;"
            placeholder="Запитайте про агрономію..."
            :disabled="streaming"
            ref="inputEl"
            @input="autoResize"
          />
          <button @click="send" :disabled="!input.trim() || streaming"
            class="btn-primary px-5 py-2.5 shrink-0 disabled:opacity-50">
            {{ streaming ? '...' : '➤' }}
          </button>
        </div>
        <p class="text-xs text-agro-light mt-2 text-center">
          <span v-if="!isPro" class="mr-2">{{ DAILY_LIMIT - dailyCount }} з {{ DAILY_LIMIT }} запитів сьогодні ·</span>
          Відповіді є рекомендаційними. Завжди консультуйтесь з агрономом.
        </p>
      </div>
    </template>

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
                <textarea v-model="schemeModal.notes" class="input resize-none" rows="2" placeholder="Додаткова інформація..." />
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const supabase = useSupabaseClient()

const CROP_EMOJI: Record<string, string> = {
  'Пшениця': '🌾', 'Кукурудза': '🌽', 'Соняшник': '🌻', 'Соя': '🫘',
  'Ріпак': '🌼', 'Ячмінь': '🌾', 'Жито': '🌾', 'Овес': '🌾',
  'Цукровий буряк': '🥕', 'Картопля': '🥔', 'Помідор': '🍅',
  'Огірок': '🥒', 'Перець': '🌶', 'Капуста': '🥬',
}

const farmId = computed(() => route.query.farmId as string | undefined)

const provider = ref<'groq' | 'gemini' | 'claude'>('groq')
const loading = ref(true)
const isPro = ref(false)
const dailyCount = ref(0)
const DAILY_LIMIT = 5
const hasOlderHistory = ref(false)
const farmName = ref('')
const farmHectares = ref<number | null>(null)
const farmRegion = ref('')
const crops = ref<any[]>([])
const selectedCrop = ref<any | null | undefined>(undefined)
const currentChatId = ref<string | null>(null)
const uid = ref<string | null>(null)

const messages = ref<{ role: 'user' | 'assistant'; content: string; products?: string[]; hasScheme?: boolean }[]>([])
const input = ref('')
const streaming = ref(false)
const streamingText = ref('')
const messagesEl = ref<HTMLElement>()
const inputEl = ref<HTMLTextAreaElement>()

const dynamicHints = computed(() => {
  if (!selectedCrop.value) return [
    '🌾 Як захистити пшеницю від борошнистої роси?',
    '🌽 Коли вносити добрива під кукурудзу?',
    '🐛 Як боротись з попелицею?',
  ]
  const ct = selectedCrop.value.crop_type
  return [
    `Які хвороби найчастіші у ${ct}?`,
    `Як захистити ${ct} від шкідників?`,
    `Коли і як вносити добрива під ${ct}?`,
    `Оптимальні строки сівби ${ct}`,
  ]
})

const farmContext = computed(() => {
  const parts: string[] = []
  if (farmName.value) parts.push(`Поле: ${farmName.value}`)
  if (farmHectares.value) parts.push(`Площа: ${farmHectares.value} га`)
  if (farmRegion.value) parts.push(`Регіон: ${farmRegion.value}`)
  if (selectedCrop.value) {
    parts.push(`Культура: ${selectedCrop.value.crop_type}${selectedCrop.value.variety ? ` (${selectedCrop.value.variety})` : ''}`)
  }
  if (crops.value.length > 1) {
    const others = crops.value
      .filter(c => c.id !== selectedCrop.value?.id)
      .map(c => c.crop_type).join(', ')
    if (others) parts.push(`Інші культури на полі: ${others}`)
  }
  return parts.join('\n') || null
})

onMounted(async () => {
  try {
  const { data: { session } } = await supabase.auth.getSession()
  uid.value = session?.user?.id || null

  const [phasesRes, subRes] = await Promise.all([
    supabase.from('growth_phases').select('*').order('order_num', { ascending: true }),
    supabase.from('subscriptions').select('plan, expires_at').eq('user_id', uid.value).maybeSingle(),
  ])

  phases.value = (phasesRes.data || []).map((p: any) => ({ key: p.key, emoji: p.emoji, order: p.order_num }))

  const sub = subRes.data
  isPro.value = sub?.plan === 'pro' && (!sub.expires_at || new Date(sub.expires_at) > new Date())

  // Підрахунок денного ліміту для базових
  if (!isPro.value && uid.value) {
    const today = new Date().toISOString().slice(0, 10)
    const { data: chatIds } = await supabase
      .from('ai_chats').select('id').eq('user_id', uid.value)
    if (chatIds?.length) {
      const { count } = await supabase
        .from('ai_messages')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'user')
        .gte('created_at', today)
        .in('chat_id', chatIds.map((c: any) => c.id))
      dailyCount.value = count || 0
    }
  }

  if (farmId.value) {
    const { data } = await supabase
      .from('farms')
      .select('name, hectares, region, farm_crops(id, crop_type, variety)')
      .eq('id', farmId.value)
      .single()

    if (data) {
      farmName.value = data.name
      farmHectares.value = data.hectares
      farmRegion.value = data.region || ''
      crops.value = data.farm_crops || []
    }
  }
  } finally {
    loading.value = false
  }
})

const selectCrop = async (crop: any) => {
  selectedCrop.value = crop
  messages.value = []
  currentChatId.value = null
  if (uid.value) await loadHistory(crop.id)
}

const selectGeneral = async () => {
  selectedCrop.value = null
  messages.value = []
  currentChatId.value = null
  if (uid.value) await loadHistory(null)
}

const resetCrop = () => {
  selectedCrop.value = undefined
  messages.value = []
  currentChatId.value = null
}

const loadHistory = async (farmCropId: string | null) => {
  const query = supabase
    .from('ai_chats')
    .select('id, ai_messages(id, role, content, created_at)')
    .eq('user_id', uid.value)
    .order('created_at', { referencedTable: 'ai_messages', ascending: true })

  if (farmId.value) query.eq('farm_id', farmId.value)
  if (farmCropId) query.eq('farm_crop_id', farmCropId)
  else query.is('farm_crop_id', null)

  const { data } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (data) {
    currentChatId.value = data.id
    let msgs = data.ai_messages || []

    // Free: тільки останні 7 днів
    if (!isPro.value) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7)
      const filtered = msgs.filter((m: any) => new Date(m.created_at) >= cutoff)
      hasOlderHistory.value = filtered.length < msgs.length
      msgs = filtered
    } else {
      hasOlderHistory.value = false
    }

    messages.value = msgs.map((m: any) => ({
      role: m.role,
      content: m.content,
      products: extractProducts(m.content),
      hasScheme: m.content.includes('SCHEME_DETECTED'),
    }))
    await scrollToBottom()
  }
}

// Парсинг [[Препарат]] → посилання
const renderMessage = (text: string) => {
  const clean = text.replace(/SCHEME_DETECTED/g, '').trim()
  return clean.replace(/@([\wА-ЯҐЄІЇа-яґєії'-]+)/g, (_, name) =>
    `<a href="/catalog?search=${encodeURIComponent(name)}" target="_blank" class="inline-flex items-center gap-1 text-agro font-semibold underline underline-offset-2 hover:text-agro/80 transition-colors">🔍 ${name}</a>`
  )
}

const extractProducts = (text: string): string[] => {
  const matches = [...text.matchAll(/@([\wА-ЯҐЄІЇа-яґєії'-]+)/g)]
  return [...new Set(matches.map(m => m[1]))]
}

// Фази росту для модалки
const phases = ref<{ key: string; emoji: string; order: number }[]>([])

// Модалка схеми захисту
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
  schemeModal.type = 'фунгіцид'
  schemeModal.dosage = ''
  schemeModal.notes = ''
  schemeModal.success = false
  schemeModal.show = true
}

const saveToScheme = async () => {
  if (!schemeModal.product_name) return
  schemeModal.saving = true

  const { data: { session } } = await supabase.auth.getSession()
  const uid = session?.user?.id
  if (!uid) { schemeModal.saving = false; return }

  let programId: string | null = null

  if (selectedCrop.value) {
    const { data: existing, error: findErr } = await supabase
      .from('protection_programs')
      .select('id')
      .eq('farm_crop_id', selectedCrop.value.id)
      .maybeSingle()

    if (existing) {
      programId = existing.id
    } else {
      const { data: created, error: createErr } = await supabase
        .from('protection_programs')
        .insert({ farm_crop_id: selectedCrop.value.id, user_id: uid, name: `Схема для ${selectedCrop.value.crop_type}` })
        .select('id').single()
      programId = created?.id || null
    }
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

const scrollToBottom = async () => {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

const autoResize = () => {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 140) + 'px'
}

const sendHint = (hint: string) => {
  input.value = hint
  send()
}

const send = async () => {
  const text = input.value.trim()
  if (!text || streaming.value) return

  // Перевірка денного ліміту для базових
  if (!isPro.value && dailyCount.value >= DAILY_LIMIT) return

  messages.value.push({ role: 'user', content: text })
  input.value = ''
  if (inputEl.value) inputEl.value.style.height = 'auto'
  await scrollToBottom()

  streaming.value = true
  streamingText.value = ''

  // Створюємо чат в БД при першому повідомленні (всі користувачі)
  if (uid.value && !currentChatId.value) {
    const { data: chat } = await supabase.from('ai_chats').insert({
      user_id: uid.value,
      farm_id: farmId.value || null,
      farm_crop_id: selectedCrop.value?.id || null,
      crop_type: selectedCrop.value?.crop_type || null,
      provider: provider.value,
    }).select('id').single()
    currentChatId.value = chat?.id || null
  }

  // Зберігаємо повідомлення користувача
  if (currentChatId.value) {
    await supabase.from('ai_messages').insert({ chat_id: currentChatId.value, role: 'user', content: text })
  }
  if (!isPro.value) dailyCount.value++

  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.value.map(m => ({ role: m.role, content: m.content })),
        farmContext: farmContext.value,
        provider: provider.value,
      }),
    })

    if (!res.ok) throw new Error('API error')

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') break
        try {
          const parsed = JSON.parse(data)
          if (parsed.text) { streamingText.value += parsed.text; await scrollToBottom() }
        } catch {}
      }
    }

    const fullText = streamingText.value
    messages.value.push({
      role: 'assistant',
      content: fullText,
      products: extractProducts(fullText),
      hasScheme: fullText.includes('SCHEME_DETECTED'),
    })

    // Зберігаємо відповідь AI (всі користувачі)
    if (currentChatId.value) {
      await supabase.from('ai_messages').insert({ chat_id: currentChatId.value, role: 'assistant', content: fullText })
      await supabase.from('ai_chats').update({ updated_at: new Date().toISOString() }).eq('id', currentChatId.value)
    }
  } catch {
    messages.value.push({ role: 'assistant', content: 'Вибачте, виникла помилка. Спробуйте ще раз.' })
  } finally {
    streaming.value = false
    streamingText.value = ''
    await scrollToBottom()
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
