<template>
  <div class="flex flex-col h-full">
    <!-- Хедер -->
    <div class="bg-white border-b border-agro-border px-6 py-4 flex items-center gap-4 shrink-0">
      <NuxtLink to="/dashboard/chats" class="text-agro-light hover:text-agro transition-colors">←</NuxtLink>
      <div class="w-10 h-10 rounded-full bg-agro-hover flex items-center justify-center font-bold text-agro">
        {{ interlocutorName?.[0]?.toUpperCase() || '?' }}
      </div>
      <div class="flex-1">
        <p class="font-bold text-agro-dark">{{ interlocutorName }}</p>
        <p class="text-xs text-agro-light">{{ iAmAgronomist ? 'Фермер' : 'Агроном' }}</p>
      </div>
      <!-- Кнопка відгуку: тільки для фермера в чаті з агрономом (не buy-request) -->
      <button v-if="!iAmAgronomist && !isBuyRequest" @click="openReviewModal"
        class="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-colors">
        ⭐ Відгук
      </button>
    </div>

    <!-- Модальне вікно відгуку -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="reviewModal.show" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" @click.self="reviewModal.show = false">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-agro-dark text-lg">⭐ Залишити відгук</h3>
              <button @click="reviewModal.show = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-agro-hover text-agro-light">✕</button>
            </div>

            <!-- Не eligible -->
            <div v-if="reviewModal.notEligible" class="text-center py-4">
              <p class="text-4xl mb-3">🔒</p>
              <p class="font-semibold text-agro-dark mb-2">Відгук недоступний</p>
              <p class="text-sm text-agro-light">{{ reviewModal.notEligibleReason }}</p>
            </div>

            <!-- Вже залишив відгук -->
            <div v-else-if="reviewModal.alreadyReviewed" class="text-center py-4">
              <p class="text-4xl mb-3">✅</p>
              <p class="font-semibold text-agro-dark mb-2">Ви вже залишили відгук</p>
              <p class="text-sm text-agro-light">Дякуємо за вашу оцінку!</p>
            </div>

            <!-- Форма відгуку -->
            <div v-else>
              <p class="text-sm text-agro-light mb-4">Поділіться досвідом роботи з агрономом <span class="font-semibold text-agro-dark">{{ interlocutorName }}</span></p>
              <!-- Зірки -->
              <div class="flex justify-center gap-2 mb-5">
                <button v-for="s in 5" :key="s" @click="reviewModal.rating = s"
                  class="text-3xl transition-transform hover:scale-110"
                  :class="s <= reviewModal.rating ? 'opacity-100' : 'opacity-30'">⭐</button>
              </div>
              <textarea v-model="reviewModal.text" rows="3"
                class="w-full border border-agro-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-agro mb-4"
                placeholder="Напишіть ваш відгук (необов'язково)..."></textarea>
              <button @click="submitReview" :disabled="!reviewModal.rating || reviewModal.saving"
                class="btn-primary w-full" :class="(!reviewModal.rating || reviewModal.saving) ? 'opacity-50 cursor-not-allowed' : ''">
                {{ reviewModal.saving ? 'Збереження...' : 'Надіслати відгук' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Повідомлення -->
    <div ref="messagesEl" class="flex-1 overflow-y-auto p-6 space-y-4 bg-agro-bg">
      <div v-if="loading" class="space-y-4">
        <div class="flex items-end gap-2">
          <div class="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0"></div>
          <div class="space-y-1.5">
            <div class="h-10 w-52 bg-white rounded-2xl rounded-bl-sm animate-pulse border border-agro-border"></div>
          </div>
        </div>
        <div class="flex items-end gap-2 justify-end">
          <div class="h-10 w-40 bg-agro/20 rounded-2xl rounded-br-sm animate-pulse"></div>
        </div>
        <div class="flex items-end gap-2">
          <div class="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0"></div>
          <div class="space-y-1.5">
            <div class="h-16 w-64 bg-white rounded-2xl rounded-bl-sm animate-pulse border border-agro-border"></div>
          </div>
        </div>
        <div class="flex items-end gap-2 justify-end">
          <div class="h-10 w-56 bg-agro/20 rounded-2xl rounded-br-sm animate-pulse"></div>
        </div>
        <div class="flex items-end gap-2">
          <div class="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0"></div>
          <div class="h-10 w-44 bg-white rounded-2xl rounded-bl-sm animate-pulse border border-agro-border"></div>
        </div>
      </div>

      <template v-else>
        <!-- Підказка -->
        <div v-if="iAmAgronomist && !isBuyRequest" class="bg-agro-hover border border-agro/20 rounded-xl px-4 py-3 text-sm text-agro-dark flex gap-3 items-start">
          <span class="text-lg shrink-0">💡</span>
          <div>
            Щоб фермер міг знайти препарат у каталозі — пишіть назву з символом <span class="font-bold text-agro">@</span>, наприклад: <span class="font-bold text-agro">@Раундап</span>, <span class="font-bold text-agro">@КаратеЗеон</span>. Назва має бути одним словом без пробілів.
          </div>
        </div>
        <div v-if="isBuyRequest" class="bg-agro-hover border border-agro/20 rounded-xl px-4 py-3 text-sm text-agro-dark flex gap-3 items-start">
          <span class="text-lg shrink-0">🛒</span>
          <div>
            <span class="font-semibold">{{ chatData?.title }}</span> — обговоріть ціну, обсяг, умови доставки та оплати.
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
          <!-- Deal-картка -->
          <template v-if="msg.content && msg.content.startsWith('[deal:')">
            <div class="max-w-sm w-full">
              <div v-if="getDeal(msg.content)" class="bg-white border-2 rounded-2xl overflow-hidden shadow-sm"
                :class="getDeal(msg.content)?.status === 'confirmed' ? 'border-agro' : getDeal(msg.content)?.status === 'cancelled' ? 'border-red-200' : 'border-yellow-300'">
                <div class="px-4 py-3 border-b"
                  :class="getDeal(msg.content)?.status === 'confirmed' ? 'bg-agro-hover' : getDeal(msg.content)?.status === 'cancelled' ? 'bg-red-50' : 'bg-yellow-50'">
                  <p class="font-bold text-agro-dark text-sm">
                    {{ getDeal(msg.content)?.status === 'confirmed' ? '✅ Угода підтверджена' : getDeal(msg.content)?.status === 'cancelled' ? '❌ Відхилено' : getDeal(msg.content)?.proposed_by === uid ? '💰 Ваша пропозиція' : '💰 Пропозиція' }}
                  </p>
                </div>
                <div class="px-4 py-3 space-y-1.5 text-sm">
                  <p><span class="text-agro-light">Культура:</span> <span class="font-semibold text-agro-dark">{{ getDeal(msg.content)?.crop_type }}</span></p>
                  <p><span class="text-agro-light">Кількість:</span> <span class="font-semibold text-agro-dark">{{ getDeal(msg.content)?.display_quantity ?? getDeal(msg.content)?.quantity_tons }} {{ getDeal(msg.content)?.unit || 'т' }}</span></p>
                  <p><span class="text-agro-light">Ціна за {{ getDeal(msg.content)?.unit || 'т' }}:</span> <span class="font-semibold text-agro-dark">{{ (getDeal(msg.content)?.display_price ?? getDeal(msg.content)?.price_per_ton)?.toLocaleString('uk-UA') }} грн</span></p>
                  <p class="text-agro font-bold text-base">{{ getDeal(msg.content)?.total_price?.toLocaleString('uk-UA') }} грн</p>
                </div>
                <!-- Кнопки для іншої сторони якщо pending -->
                <div v-if="getDeal(msg.content)?.status === 'pending' && getDeal(msg.content)?.proposed_by !== uid" class="px-4 pb-4 flex gap-2">
                  <button @click="counterDeal(getDeal(msg.content)!)" class="flex-1 py-2 text-sm border-2 border-agro text-agro rounded-xl font-semibold hover:bg-agro-hover transition-colors">Зустрічна</button>
                  <button @click="respondDeal(getDeal(msg.content)!.id, 'confirmed')" class="flex-1 py-2 text-sm bg-agro text-white rounded-xl font-semibold hover:bg-agro-dark transition-colors">✅ Прийняти</button>
                </div>
              </div>
              <p class="text-xs mt-1 opacity-50 px-1" :class="isMyMessage(msg) ? 'text-right' : ''">{{ formatTime(msg.created_at) }}</p>
            </div>
          </template>

          <template v-else>
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
          </template>

          <!-- Чіпи препаратів + кнопка в схему біля кожного -->
          <div v-if="!isMyMessage(msg) && msg.content && extractProducts(msg.content).length" class="mt-1.5 flex flex-wrap gap-1.5 max-w-lg">
            <div v-for="p in extractProducts(msg.content)" :key="p" class="flex items-center gap-0.5">
              <button
                @click="openProduct(p)"
                class="text-xs px-2.5 py-1 bg-agro-hover text-agro border border-agro/30 rounded-l-lg hover:bg-agro hover:text-white transition-colors font-medium">
                🧪 {{ p }}
              </button>
              <button
                v-if="!iAmAgronomist"
                @click="openSchemeModalForProduct(p)"
                class="text-xs px-2 py-1 bg-agro-hover text-agro border border-l-0 border-agro/30 rounded-r-lg hover:bg-agro hover:text-white transition-colors"
                title="Додати до технологічної карти">
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

    <!-- Модалка технологічної карти -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="schemeModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="schemeModal.show = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
            <h2 class="font-bold text-agro-dark text-lg mb-4">Додати до технологічної карти</h2>
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
            <p v-if="schemeModal.success" class="text-agro text-sm text-center mt-3">✅ Додано до карти!</p>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модалка пропозиції -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="dealModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="dealModal.show = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
            <h2 class="font-bold text-agro-dark text-lg mb-1">💰 {{ dealModal.isCounter ? 'Зустрічна пропозиція' : 'Пропозиція' }}</h2>
            <p class="text-sm text-agro-light mb-4">{{ cropFromTitle }}</p>
            <div class="space-y-3 mb-5">
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1">Кількість</label>
                <div class="flex gap-2">
                  <input v-model="dealModal.quantity" type="number" min="0.1" step="0.1" class="input flex-1" placeholder="50" />
                  <div class="flex rounded-xl border border-agro-border overflow-hidden shrink-0">
                    <button @click="dealModal.unit = 'т'" type="button"
                      class="px-3 py-2 text-sm font-semibold transition-colors"
                      :class="dealModal.unit === 'т' ? 'bg-agro text-white' : 'bg-white text-agro-light hover:bg-agro-hover'">т</button>
                    <button @click="dealModal.unit = 'кг'" type="button"
                      class="px-3 py-2 text-sm font-semibold transition-colors"
                      :class="dealModal.unit === 'кг' ? 'bg-agro text-white' : 'bg-white text-agro-light hover:bg-agro-hover'">кг</button>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1">Ціна за {{ dealModal.unit }} (грн)</label>
                <input v-model="dealModal.price_per_unit" type="number" min="1" class="input" :placeholder="dealModal.unit === 'т' ? '5000' : '5'" />
              </div>
              <div v-if="dealModal.quantity && dealModal.price_per_unit" class="bg-agro-hover rounded-xl px-4 py-3">
                <p class="text-xs text-agro-light mb-0.5">Загальна сума</p>
                <p class="text-xl font-extrabold text-agro">{{ (dealModal.quantity * dealModal.price_per_unit).toLocaleString('uk-UA') }} грн</p>
              </div>
            </div>
            <div class="flex gap-3">
              <button @click="dealModal.show = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="createDeal" :disabled="!dealModal.quantity || !dealModal.price_per_unit || dealModal.saving" class="btn-primary flex-1">
                {{ dealModal.saving ? '...' : 'Надіслати' }}
              </button>
            </div>
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
        <!-- Кнопка пропозиції (тільки в buy-request чаті) -->
        <button v-if="isBuyRequest" @click="openDealModal"
          class="w-10 h-10 flex items-center justify-center rounded-xl border border-agro-border hover:bg-agro-hover transition-colors shrink-0 text-agro"
          title="Запропонувати ціну і кількість">
          💰
        </button>
        <!-- Кнопка фото -->
        <label class="w-10 h-10 flex items-center justify-center rounded-xl border border-agro-border hover:bg-agro-hover cursor-pointer transition-colors shrink-0 text-agro-light hover:text-agro">
          <span class="text-lg">📎</span>
          <input type="file" accept="image/*" class="hidden" @change="onImagePick" ref="fileInputEl" />
        </label>
        <div class="relative flex-1">
          <textarea
            v-model="input"
            @keydown.enter.exact.prevent="onEnter"
            @keydown.arrow-down.prevent="atMoveDown"
            @keydown.arrow-up.prevent="atMoveUp"
            @keydown.escape="atClose"
            class="w-full border border-agro-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-agro bg-white"
            :style="{ minHeight: '44px', maxHeight: '120px' }"
            placeholder="Введіть повідомлення... (Enter для відправки)"
            rows="1"
            @input="onInput"
            ref="inputEl"
          />
          <!-- @ препарати dropdown -->
          <div v-if="atSuggestions.length" class="absolute bottom-full left-0 mb-1 w-72 bg-white rounded-2xl shadow-xl border border-agro-border overflow-hidden z-30">
            <div class="px-3 py-2 text-[11px] font-bold text-agro-light uppercase tracking-wide border-b border-agro-border">Препарати</div>
            <div class="max-h-52 overflow-y-auto">
              <button v-for="(p, i) in atSuggestions" :key="p.id"
                @mousedown.prevent="insertProduct(p)"
                class="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                :class="i === atIndex ? 'bg-agro-hover' : 'hover:bg-agro-bg'">
                <div class="w-8 h-8 rounded-lg bg-agro-hover flex items-center justify-center shrink-0 text-base">🧴</div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-agro-dark truncate">{{ p.product_name }}</p>
                  <p class="text-xs text-agro-light truncate">{{ p.ingredient || p.category || '' }}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
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

// Завантаження чату — до визначення ролі в чаті
const { data: chatData } = await supabase.from('chats').select('*, farmer_id, agronomist_id, is_unlocked, title').eq('id', chatId).single()
isUnlocked.value = chatData?.is_unlocked || false

// Визначаємо позицію в чаті за ID, а не за роллю профілю (підтримує farmer-to-farmer)
const iAmAgronomist = chatData?.agronomist_id === uid
const isBuyRequest = chatData?.title?.startsWith('Запит на купівлю')
// У buy-request чаті: farmer_id — це фермер, agronomist_id — це покупець
const iAmFarmerInBuyChat = isBuyRequest && chatData?.farmer_id === uid

const messageCount = computed(() => messages.value.filter(m => m.sender_id === uid).length)

const isMyMessage = (msg: any) => {
  return iAmAgronomist ? msg.role === 'assistant' : msg.role === 'user'
}

const formatTime = (d: string) => new Date(d).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })

const scrollToBottom = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      if (!messagesEl.value) return
      // Скролимо сам контейнер
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
      // Також скролимо найближчий scrollable батько (layout wrapper)
      let el: HTMLElement | null = messagesEl.value.parentElement
      while (el) {
        if (el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY !== 'hidden') {
          el.scrollTop = el.scrollHeight
        }
        el = el.parentElement
      }
    })
  })
}

const autoResize = () => {
  if (inputEl.value) {
    inputEl.value.style.height = 'auto'
    inputEl.value.style.height = inputEl.value.scrollHeight + 'px'
  }
}

// @ autocomplete
const atSuggestions = ref<any[]>([])
const atIndex = ref(0)
let atTimer: any = null

const getAtQuery = () => {
  const val = input.value
  const pos = inputEl.value?.selectionStart ?? val.length
  const before = val.slice(0, pos)
  const match = before.match(/@([\wЀ-ӿ\s]{1,30})$/)
  return match ? match[1].trimStart() : null
}

const atClose = () => { atSuggestions.value = []; atIndex.value = 0 }

const onInput = () => {
  autoResize()
  clearTimeout(atTimer)
  const q = getAtQuery()
  if (!q || q.length < 2) { atClose(); return }
  atTimer = setTimeout(async () => {
    const { data } = await supabase
      .from('pesticides')
      .select('id, product_name, ingredient, category')
      .ilike('product_name', `%${q}%`)
      .limit(8)
    atSuggestions.value = data || []
    atIndex.value = 0
  }, 250)
}

const atMoveDown = () => { if (atSuggestions.value.length) atIndex.value = (atIndex.value + 1) % atSuggestions.value.length }
const atMoveUp = () => { if (atSuggestions.value.length) atIndex.value = (atIndex.value - 1 + atSuggestions.value.length) % atSuggestions.value.length }

const insertProduct = (p: any) => {
  const val = input.value
  const pos = inputEl.value?.selectionStart ?? val.length
  const before = val.slice(0, pos)
  const after = val.slice(pos)
  const replaced = before.replace(/@([\wЀ-ӿ\s]{0,30})$/, `@${p.product_name} `)
  input.value = replaced + after
  atClose()
  nextTick(() => {
    autoResize()
    const newPos = replaced.length
    inputEl.value?.setSelectionRange(newPos, newPos)
    inputEl.value?.focus()
  })
}

const onEnter = () => {
  if (atSuggestions.value.length) { insertProduct(atSuggestions.value[atIndex.value]); return }
  sendMessage()
}

// Ім'я співрозмовника
const interlocutorId = iAmAgronomist ? chatData?.farmer_id : chatData?.agronomist_id
const { data: interlocutorData } = await supabase.from('users').select('name, role').eq('id', interlocutorId).single()
interlocutorName.value = interlocutorData?.name || 'Користувач'
useHead({ title: chatData?.title || `Чат з ${interlocutorName.value}` })

// Повідомлення
const { data: msgsData } = await supabase
  .from('messages')
  .select('*')
  .eq('chat_id', chatId)
  .order('created_at', { ascending: true })

messages.value = msgsData || []
loading.value = false
onMounted(() => {
  scrollToBottom()
  setTimeout(scrollToBottom, 150)
})

// Позначити прочитаними і оновити лічильник в layout
await supabase.from('messages')
  .update({ is_read: true })
  .eq('chat_id', chatId)
  .eq('role', iAmAgronomist ? 'user' : 'assistant')
  .eq('is_read', false)
const unreadChats = useState<number>('unread-chats', () => 0)
unreadChats.value = Math.max(0, unreadChats.value - 1)

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
const api = useAgroApi()
const router = useRouter()

const openProduct = async (name: string) => {
  try {
    const data = await api.getProducts({ search: name, limit: 1 })
    const product = data?.products?.[0] || data?.items?.[0]
    if (product?.slug) {
      router.push(`/pesticides/${product.slug}`)
    } else {
      router.push(`/catalog?search=${encodeURIComponent(name)}`)
    }
  } catch {
    router.push(`/catalog?search=${encodeURIComponent(name)}`)
  }
}

const renderMessage = (text: string) => {
  return text.replace(/@([\wА-ЯҐЄІЇа-яґєії'-]+)/g, (_, name) =>
    `<a href="/catalog?search=${encodeURIComponent(name)}" target="_blank" class="inline-flex items-center gap-1 text-agro font-semibold underline underline-offset-2 hover:text-agro/80 transition-colors">🔍 ${name}</a>`
  )
}

const extractProducts = (text: string): string[] => {
  const matches = [...text.matchAll(/@([\wА-ЯҐЄІЇа-яґєії'-]+)/g)]
  return [...new Set(matches.map(m => m[1]))]
}

// Deals
const deals = ref<any[]>([])
const dealModal = reactive({ show: false, isCounter: false, quantity: 0, unit: 'т', price_per_unit: 0, saving: false })

const cropFromTitle = computed(() =>
  chatData?.title?.replace('Запит на купівлю: ', '') || ''
)

const parseDealContent = (content: string) => {
  const match = content.match(/\[deal:([^:\]]+)(?::([^:\]]+))?(?::([^:\]]+))?(?::([^:\]]+))?\]/)
  if (!match) return null
  return { id: match[1], unit: match[2] || 'т', displayQty: match[3] ? parseFloat(match[3]) : null, displayPrice: match[4] ? parseFloat(match[4]) : null }
}

const getDeal = (content: string) => {
  const parsed = parseDealContent(content)
  if (!parsed) return null
  const deal = deals.value.find(d => d.id === parsed.id)
  if (!deal) return null
  return { ...deal, unit: parsed.unit, display_quantity: parsed.displayQty, display_price: parsed.displayPrice }
}

const openDealModal = () => {
  dealModal.isCounter = false
  dealModal.quantity = 0
  dealModal.unit = 'т'
  dealModal.price_per_unit = 0
  dealModal.show = true
}

const counterDeal = (deal: any) => {
  dealModal.isCounter = true
  dealModal.unit = deal.unit || 'т'
  // Показуємо у тих самих одиницях що й оригінал
  dealModal.quantity = deal.display_quantity ?? deal.quantity_tons
  dealModal.price_per_unit = deal.display_price ?? deal.price_per_ton
  dealModal.show = true
}

const createDeal = async () => {
  if (!dealModal.quantity || !dealModal.price_per_unit) return
  dealModal.saving = true
  const quantityTons = dealModal.unit === 'кг' ? dealModal.quantity / 1000 : dealModal.quantity
  const pricePerTon = dealModal.unit === 'кг' ? dealModal.price_per_unit * 1000 : dealModal.price_per_unit
  const { data: deal, error: dealError } = await supabase.from('deals').insert({
    chat_id: chatId,
    buyer_id: chatData?.agronomist_id,
    farmer_id: chatData?.farmer_id,
    crop_type: cropFromTitle.value,
    quantity_tons: quantityTons,
    price_per_ton: pricePerTon,
    proposed_by: uid,
  }).select().single()
  if (dealError) { console.error('deal error:', dealError); dealModal.saving = false; return }
  if (deal) {
    const dealWithDisplay = { ...deal, unit: dealModal.unit, display_quantity: dealModal.quantity, display_price: dealModal.price_per_unit }
    deals.value.push(dealWithDisplay)
    const role = iAmAgronomist ? 'assistant' : 'user'
    const content = `[deal:${deal.id}:${dealModal.unit}:${dealModal.quantity}:${dealModal.price_per_unit}]`
    // Оптимістично показуємо одразу
    const tempMsg = { id: `temp-deal-${Date.now()}`, chat_id: chatId, role, content, created_at: new Date().toISOString(), is_read: false }
    messages.value.push(tempMsg)
    scrollToBottom()
    const { data: savedMsg } = await supabase.from('messages').insert({ chat_id: chatId, role, content, is_read: false }).select().single()
    if (savedMsg) {
      const idx = messages.value.findIndex(m => m.id === tempMsg.id)
      if (idx !== -1) messages.value[idx] = savedMsg
    }
  }
  dealModal.saving = false
  dealModal.show = false
  dealModal.quantity = 0
  dealModal.price_per_unit = 0
}

const respondDeal = async (dealId: string, status: 'confirmed' | 'cancelled') => {
  const update: any = { status }
  if (status === 'confirmed') update.confirmed_at = new Date().toISOString()
  await supabase.from('deals').update(update).eq('id', dealId)
  const idx = deals.value.findIndex(d => d.id === dealId)
  if (idx !== -1) deals.value[idx] = { ...deals.value[idx], ...update }
}

// Відгук агроному
const reviewModal = reactive({
  show: false,
  notEligible: false,
  notEligibleReason: '',
  alreadyReviewed: false,
  rating: 0,
  text: '',
  saving: false,
})

const agronomistId = iAmAgronomist ? uid : chatData?.agronomist_id
const farmerId = iAmAgronomist ? chatData?.farmer_id : uid

const openReviewModal = async () => {
  reviewModal.show = true
  reviewModal.notEligible = false
  reviewModal.alreadyReviewed = false
  reviewModal.rating = 0
  reviewModal.text = ''

  // Перевірити чи вже залишив відгук
  const { data: existing } = await supabase
    .from('agronomist_reviews')
    .select('id')
    .eq('farmer_id', farmerId)
    .eq('agronomist_id', agronomistId)
    .maybeSingle()
  if (existing) { reviewModal.alreadyReviewed = true; return }

  // Перевірити field_share: accepted + більше 6 місяців
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const { data: share } = await supabase
    .from('field_shares')
    .select('id, created_at')
    .eq('farmer_id', farmerId)
    .eq('agronomist_id', agronomistId)
    .eq('status', 'accepted')
    .lt('created_at', sixMonthsAgo.toISOString())
    .maybeSingle()
  if (!share) {
    reviewModal.notEligible = true
    reviewModal.notEligibleReason = 'Відгук можна залишити після 6 місяців відкритої консультації з цим агрономом.'
    return
  }

  // Перевірити чи є реальні повідомлення в чаті
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('chat_id', chatId)
  if (!count || count < 1) {
    reviewModal.notEligible = true
    reviewModal.notEligibleReason = 'Відгук можна залишити лише після реального спілкування з агрономом.'
  }
}

const submitReview = async () => {
  if (!reviewModal.rating || reviewModal.saving) return
  reviewModal.saving = true
  await supabase.from('agronomist_reviews').insert({
    farmer_id: farmerId,
    agronomist_id: agronomistId,
    rating: reviewModal.rating,
    text: reviewModal.text.trim() || null,
    chat_id: chatId,
  })
  // Оновити рейтинг агронома
  const { data: allReviews } = await supabase
    .from('agronomist_reviews')
    .select('rating')
    .eq('agronomist_id', agronomistId)
  if (allReviews?.length) {
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    await supabase.from('agronomist_profiles').update({
      rating: Math.round(avg * 10) / 10,
      reviews_count: allReviews.length,
    }).eq('user_id', agronomistId)
  }
  reviewModal.saving = false
  reviewModal.alreadyReviewed = true
}

supabase.from('deals').select('*').eq('chat_id', chatId).then(({ data }) => {
  deals.value = data || []
})

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
