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
      <!-- Угода: кнопка або статус для фермера в чаті з агрономом -->
      <template v-if="!iAmAgronomist && !isBuyRequest">
        <button v-if="canProposeAgreement" @click="showChatAgreementModal = true"
          class="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-agro bg-agro-hover border border-agro/20 px-3 py-1.5 rounded-xl transition-colors hover:bg-agro/20">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z"/></svg>
          Запропонувати співпрацю
        </button>
        <span v-else-if="agreementStatus === 'pending'" class="shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold" style="background:rgb(255,251,235);color:rgb(146,100,26)">⏳ Угода надіслана</span>
        <span v-else-if="agreementStatus === 'active'" class="shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold" style="background:rgb(234,240,222);color:rgb(47,82,51)">✓ Угода активна</span>
        <span v-else-if="agreementStatus === 'completed'" class="shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold" style="background:rgb(240,249,255);color:rgb(2,132,199)">Завершено</span>
      </template>
      <!-- Кнопка відгуку: тільки для фермера після завершення угоди -->
      <button v-if="!iAmAgronomist && !isBuyRequest && hasCompletedAgreement" @click="openReviewModal"
        class="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-colors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Відгук
      </button>
    </div>

    <!-- Модальне вікно відгуку -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="reviewModal.show" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" @click.self="reviewModal.show = false">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-agro-dark text-lg flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Залишити відгук</h3>
              <button @click="reviewModal.show = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-agro-hover text-agro-light">✕</button>
            </div>

            <!-- Не eligible -->
            <div v-if="reviewModal.notEligible" class="text-center py-4">
              <div class="w-14 h-14 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-3"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
              <p class="font-semibold text-agro-dark mb-2">Відгук недоступний</p>
              <p class="text-sm text-agro-light">{{ reviewModal.notEligibleReason }}</p>
            </div>

            <!-- Вже залишив відгук -->
            <div v-else-if="reviewModal.alreadyReviewed" class="text-center py-4">
              <div class="w-14 h-14 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-3"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
              <p class="font-semibold text-agro-dark mb-2">Ви вже залишили відгук</p>
              <p class="text-sm text-agro-light">Дякуємо за вашу оцінку!</p>
            </div>

            <!-- Форма відгуку -->
            <div v-else>
              <!-- Дати угоди -->
              <div v-if="reviewModal.agreementStartedAt" class="flex items-center gap-2 text-xs text-agro-light bg-agro-bg rounded-xl px-3 py-2 mb-4">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Угода: {{ new Date(reviewModal.agreementStartedAt).toLocaleDateString('uk-UA', {day:'numeric',month:'long',year:'numeric'}) }}
                <span v-if="reviewModal.agreementEndedAt"> — {{ new Date(reviewModal.agreementEndedAt).toLocaleDateString('uk-UA', {day:'numeric',month:'long',year:'numeric'}) }}</span>
              </div>
              <!-- Зірки -->
              <div class="flex justify-center gap-2 mb-4">
                <button v-for="s in 5" :key="s" @click="reviewModal.rating = s"
                  class="transition-transform hover:scale-110"
                  :class="s <= reviewModal.rating ? 'opacity-100' : 'opacity-30'">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </button>
              </div>
              <!-- Яку проблему вирішено (обов'язково) -->
              <div class="mb-3">
                <label class="block text-xs font-semibold text-agro-dark mb-1.5">Яку проблему було вирішено <span class="text-red-400">*</span></label>
                <textarea v-model="reviewModal.problem" rows="2"
                  class="w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-colors"
                  :class="reviewModal.problem.trim() ? 'border-agro' : 'border-agro-border'"
                  placeholder="Наприклад: хвороба листя соняшника, підбір добрив..."></textarea>
              </div>
              <!-- Загальний відгук -->
              <textarea v-model="reviewModal.text" rows="2"
                class="w-full border border-agro-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-agro mb-4"
                placeholder="Загальний відгук (необов'язково)..."></textarea>
              <button @click="submitReview" :disabled="!reviewModal.rating || !reviewModal.problem.trim() || reviewModal.saving"
                class="btn-primary w-full flex items-center justify-center gap-2" :class="(!reviewModal.rating || !reviewModal.problem.trim() || reviewModal.saving) ? 'opacity-50 cursor-not-allowed' : ''">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                {{ reviewModal.saving ? 'Збереження...' : 'Надіслати відгук' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модалка: запропонувати співпрацю з чату -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showChatAgreementModal" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" @click.self="showChatAgreementModal = false">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-agro-dark text-lg">Запропонувати співпрацю</h3>
              <button @click="showChatAgreementModal = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-agro-hover text-agro-light">✕</button>
            </div>
            <textarea v-model="chatAgreementForm.message" rows="3"
              class="w-full border border-agro-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-agro mb-3"
              placeholder="Опишіть що вам потрібно (необов'язково)..."></textarea>
            <div class="flex gap-2 mb-4">
              <div class="flex-1">
                <label class="text-xs text-agro-light mb-1 block">Бюджет (грн)</label>
                <input v-model="chatAgreementForm.price" type="number" min="0"
                  class="w-full border border-agro-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-agro"
                  placeholder="Не вказано" />
              </div>
              <div class="flex-1">
                <label class="text-xs text-agro-light mb-1 block">Тип оплати</label>
                <select v-model="chatAgreementForm.price_period"
                  class="w-full border border-agro-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-agro bg-white">
                  <option v-for="(label, val) in PERIOD_LABELS_CHAT" :key="val" :value="val">{{ label }}</option>
                </select>
              </div>
            </div>
            <button @click="sendChatAgreement" :disabled="sendingChatAgreement"
              class="btn-primary w-full" :class="sendingChatAgreement ? 'opacity-50 cursor-not-allowed' : ''">
              {{ sendingChatAgreement ? 'Надсилаємо...' : 'Надіслати запит' }}
            </button>
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
        <div v-if="iAmAgronomist && !isBuyRequest && !chatData?.title?.startsWith('Пропозиція продажу')" class="bg-agro-hover border border-agro/20 rounded-xl px-4 py-3 text-sm text-agro-dark flex gap-3 items-start">
          <span class="shrink-0 mt-0.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span>
          <div>
            Щоб фермер міг знайти препарат у каталозі — пишіть назву з символом <span class="font-bold text-agro">@</span>, наприклад: <span class="font-bold text-agro">@Раундап</span>, <span class="font-bold text-agro">@КаратеЗеон</span>. Назва має бути одним словом без пробілів.
          </div>
        </div>
        <div v-if="isBuyRequest" class="bg-agro-hover border border-agro/20 rounded-xl px-4 py-3 text-sm text-agro-dark flex gap-3 items-start">
          <span class="shrink-0 mt-0.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6"/></svg></span>
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
          v-show="!(msg.content?.startsWith('[for_farmer]') && iAmAgronomist) && !(msg.content?.startsWith('[for_buyer]') && !iAmAgronomist)"
          class="flex flex-col"
          :class="(msg.role === 'system' || msg.content?.startsWith('[for_farmer]') || msg.content?.startsWith('[for_buyer]')) ? 'items-center' : isMyMessage(msg) ? 'items-end' : 'items-start'"
        >
          <!-- Deal-картка -->
          <template v-if="msg.content && msg.content.startsWith('[deal:')">
            <div class="max-w-sm w-full">
              <div v-if="getDeal(msg.content)" class="bg-white border-2 rounded-2xl overflow-hidden shadow-sm"
                :class="getDeal(msg.content)?.status === 'confirmed' ? 'border-agro' : getDeal(msg.content)?.status === 'cancelled' ? 'border-red-200' : 'border-yellow-300'">
                <div class="px-4 py-3 border-b"
                  :class="getDeal(msg.content)?.status === 'confirmed' ? 'bg-agro-hover' : getDeal(msg.content)?.status === 'cancelled' ? 'bg-red-50' : 'bg-yellow-50'">
                  <p class="font-bold text-agro-dark text-sm">
                    <template v-if="getDeal(msg.content)?.status === 'confirmed'"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>Угода підтверджена</template>
                    <template v-else-if="getDeal(msg.content)?.status === 'cancelled'"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(179,69,47)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Відхилено</template>
                    <template v-else><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>{{ getDeal(msg.content)?.proposed_by === uid ? 'Ваша пропозиція' : 'Пропозиція' }}</template>
                  </p>
                </div>
                <div class="px-4 py-3 space-y-1.5 text-sm">
                  <p><span class="text-agro-light">Культура:</span> <span class="font-semibold text-agro-dark">{{ getDeal(msg.content)?.crop_type }}</span></p>
                  <p><span class="text-agro-light">Кількість:</span> <span class="font-semibold text-agro-dark">{{ getDeal(msg.content)?.display_quantity ?? getDeal(msg.content)?.quantity_tons }} {{ getDeal(msg.content)?.unit || 'т' }}</span></p>
                  <p><span class="text-agro-light">Ціна за {{ getDeal(msg.content)?.unit || 'т' }}:</span> <span class="font-semibold text-agro-dark">{{ (getDeal(msg.content)?.display_price ?? getDeal(msg.content)?.price_per_ton)?.toLocaleString('uk-UA') }} грн</span></p>
                  <p class="text-agro font-bold text-base">{{ getDeal(msg.content)?.total_price?.toLocaleString('uk-UA') }} грн</p>
                  <p v-if="getDeal(msg.content)?.delivery_type_id"><span class="text-agro-light">Доставка:</span> <span class="font-semibold text-agro-dark">{{ getDeal(msg.content)?.delivery_types?.name || (getDeal(msg.content)?.delivery_type_id === 1 ? 'Самовивіз' : 'Доставка') }}</span></p>
                </div>
                <!-- Кнопки для іншої сторони якщо pending і немає підтвердженої угоди -->
                <div v-if="getDeal(msg.content)?.status === 'pending' && getDeal(msg.content)?.proposed_by !== uid && !deals.some(d => d.status === 'confirmed') && getDeal(msg.content)?.id === latestPendingDealId" class="px-4 pb-4 flex gap-2">
                  <button @click="counterDeal(getDeal(msg.content)!)" class="flex-1 py-2 text-sm border-2 border-yellow-400 text-yellow-700 bg-yellow-50 rounded-xl font-semibold hover:bg-yellow-100 transition-colors">Зустрічна</button>
                  <button @click="respondDeal(getDeal(msg.content)!.id, 'confirmed')" class="btn-primary flex-1 inline-flex items-center justify-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Прийняти</button>
                </div>
                <div v-if="getDeal(msg.content)?.status === 'confirmed' && getDeal(msg.content)?.buyer_id === uid" class="px-4 pb-4">
                  <button @click="confirmReceived(getDeal(msg.content)!.id)" class="w-full py-2 text-sm border-2 border-agro text-agro bg-agro-hover rounded-xl font-semibold hover:bg-agro hover:text-white transition-colors inline-flex items-center justify-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Підтвердити отримання
                  </button>
                </div>
              </div>
              <p class="text-xs mt-1 opacity-50 px-1" :class="isMyMessage(msg) ? 'text-right' : ''">{{ formatTime(msg.created_at) }}</p>
            </div>
          </template>

          <!-- Системне повідомлення (адреса) -->
          <template v-else-if="(msg.role === 'system' || msg.role === 'assistant') && (msg.content.startsWith('[for_farmer]') || msg.content.startsWith('[for_buyer]')) && (
            (msg.content.startsWith('[for_farmer]') && !iAmAgronomist) ||
            (msg.content.startsWith('[for_buyer]') && iAmAgronomist)
          )">
            <div class="w-full flex flex-col items-center gap-2 my-1">
              <div class="bg-agro-hover border border-agro/20 rounded-xl px-4 py-2.5 text-sm text-agro-dark text-center max-w-sm">
                {{ msg.content.replace('[for_farmer]', '').replace('[for_buyer]', '') }}
              </div>
              <div v-if="userAddress" class="flex flex-col items-center gap-1.5">
                <button @click="sendAddress" class="text-xs font-semibold border border-agro text-agro rounded-xl px-4 py-1.5 hover:bg-agro hover:text-white transition-colors">
                  Надіслати: {{ userAddress }}
                </button>
                <button @click="userAddress = ''" class="text-xs text-agro-light underline hover:text-agro">Ввести іншу</button>
              </div>
              <div v-else class="flex gap-2 max-w-sm w-full">
                <input v-model="manualAddress" class="input flex-1 text-sm" placeholder="Введіть адресу вручну..." />
                <button @click="sendManualAddress" :disabled="!manualAddress.trim()" class="btn-primary text-sm px-4">Надіслати</button>
              </div>
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
              <NuxtLink
                :to="`/catalog?q=${encodeURIComponent(p)}`"
                target="_blank"
                class="text-xs px-3 py-1.5 bg-agro-hover text-agro border border-agro/30 rounded-l-lg hover:bg-agro hover:text-white transition-colors font-medium">
                🔍 {{ p }}
              </NuxtLink>
              <button
                v-if="!iAmAgronomist"
                @click="openSchemeModalForProduct(p)"
                class="text-xs px-2 py-1.5 bg-agro-hover text-agro border border-l-0 border-agro/30 rounded-r-lg hover:bg-agro hover:text-white transition-colors"
                title="Додати до технологічної карти">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
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
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl z-10 flex flex-col max-h-[90vh]">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-[#E0EDCC]">
              <h2 class="font-bold text-agro-dark text-lg">Додати до технологічної карти</h2>
              <button @click="schemeModal.show = false" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-agro-hover transition-colors text-agro-light">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div class="flex flex-1 overflow-hidden">
              <!-- Ліва панель: вибір поля -->
              <div class="w-56 shrink-0 border-r border-[#E0EDCC] p-4 overflow-y-auto bg-[#FAFDF7]">
                <p class="text-xs font-semibold text-agro-light uppercase tracking-wide mb-2">Поле / культура</p>
                <div v-if="farmCrops.length === 0" class="text-sm text-gray-400 py-2">Немає полів</div>
                <div v-else class="space-y-1.5">
                  <button v-for="fc in farmCrops" :key="fc.id" type="button"
                    @click="selectFarmCrop(fc.id)"
                    :class="['w-full flex items-start gap-2 px-3 py-2.5 rounded-xl border-2 transition-colors text-sm text-left',
                      schemeModal.farm_crop_id === fc.id ? 'border-agro bg-agro-hover text-agro font-medium' : 'border-[#E0EDCC] text-gray-600 hover:border-agro/50']">
                    <svg class="shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                    <span class="leading-tight">{{ fc.farm_name }}<br><span class="font-normal text-xs opacity-70">{{ fc.crop_type }}</span></span>
                  </button>
                </div>
              </div>

              <!-- Права панель: фази + форма -->
              <div class="flex-1 overflow-y-auto p-5 space-y-3">
                <div v-if="!schemeModal.farm_crop_id" class="flex flex-col items-center justify-center h-48 text-agro-light text-sm gap-2">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                  Оберіть поле зліва
                </div>

                <template v-else>
                  <!-- Препарат -->
                  <div>
                    <label class="block text-sm font-medium text-agro-dark mb-1">Препарат</label>
                    <input v-model="schemeModal.product_name" class="input" placeholder="Назва препарату" />
                  </div>

                  <!-- Тип -->
                  <div>
                    <label class="block text-sm font-medium text-agro-dark mb-1">Тип</label>
                    <div class="grid grid-cols-5 gap-1.5">
                      <button v-for="t in TREATMENT_TYPES" :key="t.value" type="button"
                        @click="schemeModal.type = t.value"
                        :class="['flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-colors text-xs font-medium',
                          schemeModal.type === t.value ? 'border-agro bg-agro-hover text-agro' : 'border-[#E0EDCC] text-gray-500 hover:border-agro/50']">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="t.icon" />
                        <span>{{ t.label }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- Фаза -->
                  <div>
                    <label class="block text-sm font-medium text-agro-dark mb-1">Фаза росту</label>
                    <div v-if="programPhasesLoading" class="text-sm text-agro-light py-1">Завантаження...</div>
                    <div v-else class="flex flex-wrap gap-1.5">
                      <button v-for="ph in programPhases" :key="ph.key" type="button"
                        @click="schemeModal.phase = ph.key; schemeModal.new_phase = ''"
                        :class="['inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-colors',
                          schemeModal.phase === ph.key ? 'border-agro bg-agro-hover text-agro' : 'border-[#E0EDCC] text-gray-600 hover:border-agro/50']">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="phaseIcon(ph.key)" />
                        {{ ph.key }}
                      </button>
                      <button type="button"
                        @click="schemeModal.phase = '__new__'"
                        :class="['inline-flex items-center gap-1 px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-colors',
                          schemeModal.phase === '__new__' ? 'border-agro bg-agro-hover text-agro' : 'border-dashed border-[#C0DCA0] text-agro-light hover:border-agro/50']">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                        Нова фаза
                      </button>
                    </div>
                    <div v-if="schemeModal.phase === '__new__'" class="mt-2">
                      <select v-model="schemeModal.new_phase" class="input text-sm py-2">
                        <option value="">— оберіть фазу —</option>
                        <option v-for="p in phases" :key="p.key" :value="p.key">{{ p.key }}</option>
                      </select>
                    </div>
                  </div>

                  <!-- Доза та нотатка -->
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-sm font-medium text-agro-dark mb-1">Доза</label>
                      <input v-model="schemeModal.dosage" class="input" placeholder="10 мл/10 л" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-agro-dark mb-1">Нотатка</label>
                      <input v-model="schemeModal.notes" class="input" placeholder="Необов'язково" />
                    </div>
                  </div>

                  <p v-if="schemeModal.success" class="text-agro text-sm flex items-center gap-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Додано до карти!
                  </p>
                </template>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex gap-3 px-6 py-4 border-t border-[#E0EDCC]">
              <button @click="schemeModal.show = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="saveToScheme"
                :disabled="!schemeModal.product_name || !schemeModal.farm_crop_id || schemeModal.saving"
                class="btn-primary flex-1 inline-flex items-center justify-center gap-1.5">
                <svg v-if="!schemeModal.saving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                {{ schemeModal.saving ? '...' : 'Додати до карти' }}
              </button>
            </div>
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
            <h2 class="font-bold text-agro-dark text-lg mb-1 flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> {{ dealModal.isCounter ? 'Зустрічна пропозиція' : 'Пропозиція' }}</h2>
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
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1">Тип доставки</label>
                <div class="flex rounded-xl overflow-hidden border border-agro">
                  <button v-for="dt in deliveryTypes" :key="dt.id" type="button"
                    @click="dealModal.delivery_type_id = dt.id"
                    class="flex-1 py-2 text-sm font-semibold transition-colors"
                    :class="dealModal.delivery_type_id === dt.id ? 'bg-agro text-white font-bold' : 'bg-white text-agro-light border-l border-agro-border first:border-l-0 hover:bg-agro-hover hover:text-agro'">
                    {{ dt.name }}
                  </button>
                </div>
              </div>
              <div v-if="dealModal.quantity && dealModal.price_per_unit" class="bg-agro-hover rounded-xl px-4 py-3">
                <p class="text-xs text-agro-light mb-0.5">Загальна сума</p>
                <p class="text-xl font-extrabold text-agro">{{ (dealModal.quantity * dealModal.price_per_unit).toLocaleString('uk-UA') }} грн</p>
              </div>
            </div>
            <div class="flex gap-3">
              <button @click="dealModal.show = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="createDeal" :disabled="!dealModal.quantity || !dealModal.price_per_unit || dealModal.saving" class="btn-primary flex-1 inline-flex items-center justify-center gap-1.5">
                <svg v-if="!dealModal.saving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                {{ dealModal.saving ? '...' : 'Надіслати' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Paywall -->
    <div v-if="!isUnlocked && !iAmAgronomist && !isPro && messageCount >= 3" class="bg-white border-t border-agro-border p-4 text-center">
      <p class="font-semibold text-agro-dark mb-1 flex items-center justify-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Розблокуйте повне листування</p>
      <p class="text-sm text-agro-light mb-3">Перші 3 повідомлення безкоштовні · <NuxtLink to="/dashboard/subscription" class="text-agro font-medium">PRO — необмежено</NuxtLink></p>
      <button @click="unlock" class="btn-primary">Розблокувати</button>
    </div>

    <!-- Немає активної угоди — фермер не може писати -->
    <div v-else-if="!isBuyRequest && !iAmAgronomist && agreementStatus !== 'active'" class="bg-white border-t border-agro-border px-6 py-4 shrink-0 text-center">
      <template v-if="agreementStatus === 'completed'">
        <svg class="mx-auto mb-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(160,175,150)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        <p class="text-sm text-agro-light">Угода завершена — чат заблоковано</p>
      </template>
      <template v-else-if="agreementStatus === 'pending'">
        <p class="text-sm text-agro-light">⏳ Чекаємо підтвердження угоди від агронома</p>
      </template>
      <template v-else>
        <p class="text-sm text-agro-light mb-2">Щоб писати, потрібна активна угода з агрономом</p>
        <button @click="showChatAgreementModal = true" class="text-xs font-semibold px-4 py-2 rounded-xl transition-colors" style="background:rgb(47,82,51);color:white;">
          Запропонувати співпрацю
        </button>
      </template>
    </div>

    <!-- Інпут -->
    <div v-else-if="isUnlocked || iAmAgronomist || isPro || messageCount < 3" class="bg-white border-t border-agro-border px-4 py-3 shrink-0">
      <!-- Превью зображення -->
      <div v-if="imagePreview" class="mb-2 relative inline-block">
        <img :src="imagePreview" class="h-20 rounded-xl object-cover border border-agro-border" />
        <button @click="clearImage" class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none">×</button>
      </div>
      <div class="flex gap-2 items-end">
        <!-- Кнопка пропозиції (тільки в buy-request чаті) -->
        <button v-if="isBuyRequest" @click="openDealModal"
          class="w-11 h-11 shrink-0 self-center flex items-center justify-center rounded-xl border border-agro-border hover:bg-agro-hover transition-colors text-agro"
          title="Запропонувати ціну і кількість">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </button>
        <!-- Кнопка фото -->
        <label class="w-11 h-11 shrink-0 self-center flex items-center justify-center rounded-xl border border-agro-border hover:bg-agro-hover cursor-pointer transition-colors text-agro-light hover:text-agro">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
          <input type="file" accept="image/*" class="hidden" @change="onImagePick" ref="fileInputEl" />
        </label>
        <div class="relative flex-1 self-center">
          <textarea
            v-model="input"
            @keydown.enter.exact.prevent="onEnter"
            @keydown.arrow-down.prevent="atMoveDown"
            @keydown.arrow-up.prevent="atMoveUp"
            @keydown.escape="atClose"
            class="w-full border border-agro-border rounded-xl px-4 text-sm resize-none focus:outline-none focus:border-agro bg-white"
            style="height: 44px; min-height: 44px; max-height: 120px; line-height: 20px; padding-top: 11px; padding-bottom: 11px;"
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
                <div class="w-8 h-8 rounded-lg bg-agro-hover flex items-center justify-center shrink-0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18"/></svg></div>
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
          class="w-11 h-11 shrink-0 self-center flex items-center justify-center rounded-xl bg-agro text-white hover:bg-agro-dark transition-colors disabled:opacity-50"
        >
          <svg v-if="!sending" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          <span v-else class="text-sm">...</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TREATMENT_TYPES } from '~/utils/treatmentTypes'
import { phaseIcon } from '~/utils/phaseIcons'
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

const [profileRes, subRes] = await Promise.all([
  supabase.from('users').select('role').eq('id', uid).single(),
  supabase.from('subscriptions').select('plan, expires_at').eq('user_id', uid).maybeSingle(),
])
const profileData = profileRes.data
const isPro = subRes.data?.plan === 'pro' && subRes.data?.expires_at
  ? new Date(subRes.data.expires_at) > new Date()
  : false

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
const chatFarmerId = chatData?.farmer_id
const chatAgronomistId = chatData?.agronomist_id

const [interlocutorRes, myProfileRes] = await Promise.all([
  supabase.from('users').select('name, role').eq('id', interlocutorId).single(),
  supabase.from('users').select('address, city').eq('id', uid).single(),
])
interlocutorName.value = interlocutorRes.data?.name || 'Користувач'

// Угода між фермером і агрономом
const agreementStatus = ref<string | null>(null)
const agreementId = ref<string | null>(null)
if (!isBuyRequest && chatFarmerId && chatAgronomistId) {
  const { data: ag } = await supabase.from('agreements')
    .select('id, status').eq('farmer_id', chatFarmerId).eq('agronomist_id', chatAgronomistId)
    .not('status', 'in', '(cancelled)').order('created_at', { ascending: false }).limit(1).maybeSingle()
  agreementStatus.value = ag?.status || null
  agreementId.value = ag?.id || null
}
const hasCompletedAgreement = computed(() => agreementStatus.value === 'completed')
const canProposeAgreement = computed(() => !iAmAgronomist && !isBuyRequest && !agreementStatus.value)

// Модалка угоди з чату
const showChatAgreementModal = ref(false)
const chatAgreementForm = reactive({ message: '', price: '', price_period: 'monthly' })
const sendingChatAgreement = ref(false)
const PERIOD_LABELS_CHAT: Record<string, string> = { monthly: 'Щомісяця', seasonal: 'За сезон', 'one-time': 'Разово' }

const sendChatAgreement = async () => {
  sendingChatAgreement.value = true
  const { data } = await supabase.from('agreements').insert({
    farmer_id: uid, agronomist_id: chatAgronomistId,
    message: chatAgreementForm.message || null,
    price: chatAgreementForm.price ? Number(chatAgreementForm.price) : null,
    price_period: chatAgreementForm.price_period,
    status: 'pending',
  }).select().single()
  if (data) { agreementStatus.value = 'pending'; agreementId.value = data.id }
  showChatAgreementModal.value = false
  sendingChatAgreement.value = false
}
const userAddressStr = [myProfileRes.data?.city, myProfileRes.data?.address].filter(Boolean).join(', ')
const userAddress = ref(userAddressStr)
const manualAddress = ref('')

const sendAddress = async () => {
  if (!userAddress.value) return
  const role = iAmAgronomist ? 'assistant' : 'user'
  const content = `📍 Моя адреса: ${userAddress.value}`
  const tempMsg = { id: `temp-addr-send-${Date.now()}`, chat_id: chatId, role, content, created_at: new Date().toISOString(), is_read: false }
  messages.value.push(tempMsg)
  scrollToBottom()
  const { data: savedMsg } = await supabase.from('messages').insert({ chat_id: chatId, role, content, is_read: false }).select().single()
  if (savedMsg) {
    const idx = messages.value.findIndex(m => m.id === tempMsg.id)
    if (idx !== -1) messages.value[idx] = savedMsg
  }
}
const sendManualAddress = async () => {
  if (!manualAddress.value.trim()) return
  const role = iAmAgronomist ? 'assistant' : 'user'
  const content = `📍 Моя адреса: ${manualAddress.value.trim()}`
  const tempMsg = { id: `temp-addr-manual-${Date.now()}`, chat_id: chatId, role, content, created_at: new Date().toISOString(), is_read: false }
  messages.value.push(tempMsg)
  scrollToBottom()
  const { data: savedMsg } = await supabase.from('messages').insert({ chat_id: chatId, role, content, is_read: false }).select().single()
  if (savedMsg) {
    const idx = messages.value.findIndex(m => m.id === tempMsg.id)
    if (idx !== -1) messages.value[idx] = savedMsg
  }
  userAddress.value = manualAddress.value.trim()
  manualAddress.value = ''
}

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
const { count: unreadCount } = await supabase.from('messages')
  .select('*', { count: 'exact', head: true })
  .eq('chat_id', chatId)
  .eq('role', iAmAgronomist ? 'user' : 'assistant')
  .eq('is_read', false)
await supabase.from('messages')
  .update({ is_read: true })
  .eq('chat_id', chatId)
  .eq('role', iAmAgronomist ? 'user' : 'assistant')
  .eq('is_read', false)
const unreadChats = useState<number>('unread-chats', () => 0)
if ((unreadCount ?? 0) > 0) {
  unreadChats.value = Math.max(0, unreadChats.value - 1)
}

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
      router.push(`/catalog?q=${encodeURIComponent(name)}`)
    }
  } catch {
    router.push(`/catalog?q=${encodeURIComponent(name)}`)
  }
}

const renderMessage = (text: string) => {
  return text.replace(/@([\wА-ЯҐЄІЇа-яґєії'-]+)/g, (_, name) =>
    `<a href="/catalog?q=${encodeURIComponent(name)}" target="_blank" class="inline-flex items-center gap-1 text-agro font-semibold underline underline-offset-2 hover:text-agro/80 transition-colors">🔍 ${name}</a>`
  )
}

const extractProducts = (text: string): string[] => {
  const matches = [...text.matchAll(/@([\wА-ЯҐЄІЇа-яґєії'-]+)/g)]
  return [...new Set(matches.map(m => m[1]))]
}

// Deals
const deals = ref<any[]>([])
const deliveryTypes = [{ id: 1, name: 'Самовивіз' }, { id: 2, name: 'Доставка' }]
const dealModal = reactive({ show: false, isCounter: false, quantity: 0, unit: 'т', price_per_unit: 0, delivery_type_id: 1, saving: false })

const latestPendingDealId = computed(() => {
  const pending = deals.value.filter(d => d.status === 'pending')
  return pending.length ? pending[pending.length - 1].id : null
})

const cropFromTitle = computed(() =>
  chatData?.title?.replace('Запит на купівлю: ', '').replace('Пропозиція продажу: ', '') || ''
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
  dealModal.delivery_type_id = 1
  dealModal.show = true
}

const counterDeal = (deal: any) => {
  dealModal.isCounter = true
  dealModal.unit = deal.unit || 'т'
  dealModal.quantity = deal.display_quantity ?? deal.quantity_tons
  dealModal.price_per_unit = deal.display_price ?? deal.price_per_ton
  dealModal.delivery_type_id = deal.delivery_type_id || 1
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
    delivery_type_id: dealModal.delivery_type_id,
  }).select('*, delivery_types(id, name)').single()
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

const confirmReceived = async (dealId: string) => {
  await supabase.from('deals').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', dealId)
  const deal = deals.value.find(d => d.id === dealId)
  if (deal) deal.status = 'completed'
  await supabase.from('messages').insert({ chat_id: chatId, role: 'assistant', content: '✅ Отримання підтверджено. Угоду завершено.', is_read: false })
}

const respondDeal = async (dealId: string, status: 'confirmed' | 'cancelled') => {
  const update: any = { status }
  if (status === 'confirmed') update.confirmed_at = new Date().toISOString()
  await supabase.from('deals').update(update).eq('id', dealId)
  const idx = deals.value.findIndex(d => d.id === dealId)
  if (idx !== -1) deals.value[idx] = { ...deals.value[idx], ...update }

  if (status === 'confirmed') {
    const deal = deals.value.find(d => d.id === dealId)
    // Самовивіз (id=1): заготівельник їде до фермера → потрібна адреса фермера
    // Доставка (id=2): фермер везе до заготівельника → потрібна адреса заготівельника
    const isSamovyviz = (deal?.delivery_types?.name || '').toLowerCase().includes('самовивіз') || deal?.delivery_type_id === 1
    // iAmAgronomist тут = заготівельник (buyer), бо agronomist_id = buyer у цих чатах
    // Самовивіз → фермер надає адресу → повідомлення тільки фермеру
    // Доставка → заготівельник надає адресу → повідомлення тільки заготівельнику
    const targetPrefix = isSamovyviz ? '[for_farmer]' : '[for_buyer]'
    const addressText = isSamovyviz
      ? '📍 Угоду підтверджено. Будь ласка, надішліть адресу для самовивозу.'
      : '📍 Угоду підтверджено. Будь ласка, надішліть адресу підприємства для доставки.'
    const content = targetPrefix + addressText
    // Показуємо одразу тільки якщо це для поточного юзера
    const showForMe = (isSamovyviz && !iAmAgronomist) || (!isSamovyviz && iAmAgronomist)
    if (showForMe) {
      const tempMsg = { id: `temp-addr-${Date.now()}`, chat_id: chatId, role: 'system', content, created_at: new Date().toISOString(), is_read: false }
      messages.value.push(tempMsg)
      scrollToBottom()
    }
    // Зберігаємо як assistant щоб не блокувалось RLS
    await supabase.from('messages').insert({ chat_id: chatId, role: 'assistant', content, is_read: false })
  }
}

// Відгук агроному
const reviewModal = reactive({
  show: false,
  notEligible: false,
  notEligibleReason: '',
  alreadyReviewed: false,
  rating: 0,
  text: '',
  problem: '',
  saving: false,
  agreementStartedAt: '',
  agreementEndedAt: '',
})

const agronomistId = iAmAgronomist ? uid : chatData?.agronomist_id
const farmerId = iAmAgronomist ? chatData?.farmer_id : uid

const openReviewModal = async () => {
  reviewModal.show = true
  reviewModal.notEligible = false
  reviewModal.alreadyReviewed = false
  reviewModal.rating = 0
  reviewModal.text = ''
  reviewModal.problem = ''
  reviewModal.agreementStartedAt = ''
  reviewModal.agreementEndedAt = ''

  // Перевірити чи вже залишив відгук
  const { data: existing } = await supabase
    .from('agronomist_reviews')
    .select('id')
    .eq('farmer_id', farmerId)
    .eq('agronomist_id', agronomistId)
    .maybeSingle()
  if (existing) { reviewModal.alreadyReviewed = true; return }

  // Перевірити наявність завершеної угоди
  const { data: agreement } = await supabase
    .from('agreements')
    .select('id, started_at, ended_at')
    .eq('farmer_id', farmerId)
    .eq('agronomist_id', agronomistId)
    .eq('status', 'completed')
    .order('ended_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!agreement) {
    reviewModal.notEligible = true
    reviewModal.notEligibleReason = 'Відгук можна залишити лише після завершення угоди з агрономом.'
    return
  }

  reviewModal.agreementStartedAt = agreement.started_at || ''
  reviewModal.agreementEndedAt = agreement.ended_at || ''
}

const submitReview = async () => {
  if (!reviewModal.rating || !reviewModal.problem.trim() || reviewModal.saving) return
  reviewModal.saving = true
  await supabase.from('agronomist_reviews').insert({
    farmer_id: farmerId,
    agronomist_id: agronomistId,
    rating: reviewModal.rating,
    text: reviewModal.text.trim() || null,
    problem_solved: reviewModal.problem.trim(),
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

supabase.from('deals').select('*, delivery_types(id, name)').eq('chat_id', chatId).order('created_at', { ascending: true }).then(({ data }) => {
  deals.value = data || []
})

const growthPhases = useGrowthPhases()
const phases = growthPhases.allPhases
growthPhases.load()

const farmCrops = ref<{ id: string; farm_name: string; crop_type: string }[]>([])
const programPhases = ref<{ key: string; emoji: string }[]>([])
const programPhasesLoading = ref(false)

const loadFarmCrops = async () => {
  const { data } = await supabase
    .from('farms')
    .select('id, name, farm_crops(id, crop_type)')
    .eq('user_id', uid)
  farmCrops.value = (data || []).flatMap((f: any) =>
    (f.farm_crops || []).map((fc: any) => ({ id: fc.id, farm_name: f.name, crop_type: fc.crop_type }))
  )
}

const loadProgramPhases = async (farmCropId: string) => {
  programPhasesLoading.value = true
  programPhases.value = []
  const { data: progRows } = await supabase
    .from('protection_programs')
    .select('id')
    .eq('farm_crop_id', farmCropId)
    .order('created_at', { ascending: true })
    .limit(1)
  const prog = progRows?.[0] ?? null
  if (prog?.id) {
    const { data: treatments } = await supabase
      .from('program_treatments')
      .select('phase')
      .eq('program_id', prog.id)
      .not('phase', 'is', null)
    const uniquePhases = [...new Set((treatments || []).map((t: any) => t.phase))]
    programPhases.value = uniquePhases.map(key => {
      const p = phases.value.find(ph => ph.key === key)
      return { key, emoji: p?.emoji || '🌱' }
    })
  }
  programPhasesLoading.value = false
}

const selectFarmCrop = async (id: string) => {
  schemeModal.farm_crop_id = id
  schemeModal.phase = ''
  schemeModal.new_phase = ''
  await loadProgramPhases(id)
}

const schemeModal = reactive({
  show: false,
  farm_crop_id: '' as string,
  product_name: '',
  phase: '',
  new_phase: '',
  type: 'захист',
  dosage: '',
  notes: '',
  saving: false,
  success: false,
})

const openSchemeModalForProduct = async (productName: string) => {
  schemeModal.product_name = productName
  schemeModal.farm_crop_id = ''
  schemeModal.phase = ''
  schemeModal.new_phase = ''
  schemeModal.type = 'захист'
  schemeModal.dosage = ''
  schemeModal.notes = ''
  schemeModal.success = false
  programPhases.value = []
  await loadFarmCrops()
  if (farmCrops.value.length === 1) await selectFarmCrop(farmCrops.value[0].id)
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
  if (!schemeModal.product_name || !schemeModal.farm_crop_id) return
  schemeModal.saving = true

  const fc = farmCrops.value.find(f => f.id === schemeModal.farm_crop_id)
  let programId: string | null = null

  const { data: existingRows, error: fetchError } = await supabase
    .from('protection_programs')
    .select('id')
    .eq('farm_crop_id', schemeModal.farm_crop_id)
    .limit(1)
  const existing = existingRows?.[0] ?? null

  if (fetchError) {
    schemeModal.saving = false
    return
  }

  if (existing?.id) {
    programId = existing.id
  } else {
    const { data: created, error: createError } = await supabase
      .from('protection_programs')
      .insert({ farm_crop_id: schemeModal.farm_crop_id, user_id: uid, name: `Програма для ${fc?.crop_type || ''}` })
      .select('id').single()
    if (createError) {
      schemeModal.saving = false
      return
    }
    programId = created?.id || null
  }

  if (programId) {
    const effectivePhase = schemeModal.phase === '__new__' ? schemeModal.new_phase : schemeModal.phase
    const phaseObj = phases.value.find(p => p.key === effectivePhase)
    const { error: insertError } = await supabase.from('program_treatments').insert({
      program_id: programId,
      product_name: schemeModal.product_name,
      phase: effectivePhase || null,
      phase_order: phaseObj?.order ?? 99,
      type: schemeModal.type,
      dosage: schemeModal.dosage || null,
      notes: schemeModal.notes || null,
    })
    if (insertError) {
      schemeModal.saving = false
      return
    }
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
