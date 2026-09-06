<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center gap-3 px-6 py-4 border-b border-agro-border bg-white shrink-0">
      <button v-if="!showSessionsList && chatSessions.length > 0" @click="showSessionsList = true"
        class="dash-icon-box shrink-0 hover:bg-agro-hover transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>
      <div v-if="showSessionsList || chatSessions.length === 0" class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/>
          <path d="M19 17l.9 2.1L22 20l-2.1.9L19 23l-.9-2.1L16 20l2.1-.9L19 17z"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-bold text-agro-dark bitter">AI Агроном</p>
        <p class="text-xs text-agro-light truncate">
          {{ showSessionsList ? 'Оберіть розмову або почніть нову' : (selectedCrop ? `${farmName} · ${emojiFor(selectedCrop.crop_type)} ${selectedCrop.crop_type}${selectedCrop.variety ? ` · ${selectedCrop.variety}` : ''}` : (farmName || 'Загальна консультація')) }}
        </p>
      </div>
      <div v-if="weatherInfo" class="shrink-0 flex items-center gap-1 text-xs text-agro-light bg-agro-hover rounded-xl px-3 py-1.5 border border-agro-border">
        <span>{{ weatherInfo.icon }}</span>
        <span class="font-medium text-agro-dark">{{ weatherInfo.temp }}°</span>
        <span>{{ weatherInfo.condition }}</span>
      </div>
      <div v-if="showSessionsList" class="flex items-center gap-2 shrink-0">
        <button @click="openNewChat"
          class="inline-flex items-center gap-1.5 text-xs bg-agro text-white rounded-xl px-3 py-2 hover:bg-agro/90 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Нова розмова
        </button>
      </div>
      <button v-else-if="messages.length > 0" @click="startNewSession" :disabled="generatingSummary"
        class="shrink-0 inline-flex items-center gap-1.5 text-xs border border-agro-border text-agro-light rounded-xl px-3 py-2 hover:border-agro hover:text-agro transition-colors">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7-7 7 7"/></svg>
        {{ generatingSummary ? 'Збереження...' : 'Нова розмова' }}
      </button>
    </div>

    <!-- Loading skeleton (chat) -->
    <div v-if="loading && !showSessionsList" class="flex-1 overflow-y-auto p-6 space-y-4 bg-agro-bg">
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

    <!-- Sessions List Skeleton -->
    <div v-if="loading && showSessionsList" class="flex-1 overflow-y-auto bg-agro-bg divide-y divide-agro-border">
      <div v-for="i in 5" :key="i" class="flex items-start gap-4 px-6 py-4 bg-white">
        <div class="w-9 h-9 rounded-full bg-gray-200 animate-pulse shrink-0 mt-0.5"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3.5 bg-gray-200 animate-pulse rounded-full w-3/4"></div>
          <div class="h-3 bg-gray-100 animate-pulse rounded-full w-full"></div>
        </div>
        <div class="h-3 w-10 bg-gray-200 animate-pulse rounded-full shrink-0 mt-1"></div>
      </div>
    </div>

    <!-- Sessions List -->
    <div v-if="!loading && showSessionsList" class="flex-1 overflow-y-auto flex flex-col bg-agro-bg">
      <div v-if="chatSessions.length === 0" class="flex flex-col items-center justify-center h-full text-center py-12">
        <div class="dash-empty-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/>
            <path d="M19 17l.9 2.1L22 20l-2.1.9L19 23l-.9-2.1L16 20l2.1-.9L19 17z"/>
          </svg>
        </div>
        <p class="font-bold text-agro-dark text-lg mb-2">Ще немає розмов</p>
        <p class="text-agro-light mb-6 max-w-sm text-sm">Почніть нову консультацію з AI агрономом</p>
        <button @click="openNewChat" class="btn-primary inline-flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Нова розмова
        </button>
      </div>
      <template v-else>
        <!-- Пошук + статистика -->
        <div class="px-6 py-3 bg-white border-b border-agro-border shrink-0">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="searchQuery" type="text" placeholder="Пошук по розмовах..." class="w-full pl-9 pr-3 py-2 text-sm border border-agro-border rounded-xl bg-agro-bg focus:outline-none focus:border-agro" />
          </div>
          <div v-if="sessionStats" class="flex items-center gap-3 mt-2 text-xs text-agro-light">
            <span>💬 {{ sessionStats.total }} розмов</span>
            <span v-if="sessionStats.todayCount">· 🟢 {{ sessionStats.todayCount }} сьогодні</span>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto divide-y divide-agro-border">
          <div v-if="filteredSessions.length === 0" class="text-center py-10 text-agro-light text-sm">
            Нічого не знайдено
          </div>
          <div
            v-for="session in filteredSessions"
            :key="session.id"
            class="flex items-start gap-4 px-6 py-4 bg-white hover:bg-agro-hover transition-colors group"
          >
            <button @click="openSession(session.id)" class="flex items-start gap-4 flex-1 min-w-0 text-left">
              <div class="w-9 h-9 rounded-full bg-agro-hover flex items-center justify-center shrink-0 mt-0.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-agro-dark truncate">{{ session.title }}</p>
                <p class="text-xs text-agro-light truncate mt-0.5">{{ session.preview }}</p>
              </div>
            </button>
            <div class="flex items-center gap-2 shrink-0">
              <p class="text-xs text-agro-light">{{ session.date }}</p>
              <button @click.stop="deleteSession(session.id)"
                class="w-7 h-7 flex items-center justify-center rounded-lg text-agro-light hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Chat -->
    <template v-if="!loading && !showSessionsList">
      <div ref="messagesEl" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-center py-12">
          <div class="dash-empty-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/>
              <path d="M19 17l.9 2.1L22 20l-2.1.9L19 23l-.9-2.1L16 20l2.1-.9L19 17z"/>
            </svg>
          </div>
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
            <NuxtLink :to="proLink" class="text-xs font-bold text-amber-700 hover:text-amber-900 shrink-0">PRO →</NuxtLink>
          </div>

          <div v-for="(msg, i) in messages" :key="i" class="flex gap-3" :class="msg.role === 'user' ? 'flex-row-reverse' : ''">
            <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm"
              :class="msg.role === 'user' ? 'bg-agro text-white' : 'bg-agro-hover text-agro'">
              <svg v-if="msg.role === 'user'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M9 8V6a3 3 0 016 0v2"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/><path d="M9 18h6"/></svg>
            </div>
            <div class="max-w-[75%]">
              <div class="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                :class="msg.role === 'user' ? 'bg-agro text-white rounded-tr-sm' : 'bg-white border border-agro-border text-agro-dark rounded-tl-sm'">
                <!-- User: фото + текст -->
                <div v-if="msg.role === 'user'">
                  <img v-if="msg.image_url" :src="msg.image_url" class="max-w-[220px] rounded-xl mb-2 block" />
                  <span v-if="msg.content && msg.content.trim() && msg.content !== ' '" class="whitespace-pre-wrap">{{ msg.content }}</span>
                </div>
                <!-- AI: з посиланнями на препарати -->
                <span v-else class="whitespace-pre-wrap" v-html="renderMessage(msg.content)"></span>
              </div>
              <!-- Кнопка нагадування від AI -->
              <div v-if="msg.role === 'assistant' && msg.reminder" class="mt-2">
                <button @click="addReminderFromAi(msg.reminder!)"
                  class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors font-medium">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                  Нагадати через {{ msg.reminder.days }} дн.: {{ msg.reminder.text }}
                </button>
              </div>
              <!-- AI actions: лайк/дизлайк/копія/нагадування -->
              <div v-if="msg.role === 'assistant'" class="mt-1.5 flex items-center gap-1">
                <button @click="copyMessage(msg.content, i)" :class="['w-7 h-7 flex items-center justify-center rounded-lg transition-colors', copiedIndex === i ? 'text-agro bg-agro-hover' : 'text-agro-light hover:text-agro hover:bg-agro-hover']" title="Копіювати">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                </button>
                <button @click="rateMessage(i, 1)" :class="['w-7 h-7 flex items-center justify-center rounded-lg transition-colors', msg.rating === 1 ? 'text-agro bg-agro-hover' : 'text-agro-light hover:text-agro hover:bg-agro-hover']" title="Корисно">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
                </button>
                <button @click="rateMessage(i, -1)" :class="['w-7 h-7 flex items-center justify-center rounded-lg transition-colors', msg.rating === -1 ? 'text-red-400 bg-red-50' : 'text-agro-light hover:text-red-400 hover:bg-red-50']" title="Не корисно">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>
                </button>
                <button @click="openReminderFromMsg(msg.content, i)" :class="['w-7 h-7 flex items-center justify-center rounded-lg transition-colors', msg.reminderSaved ? 'text-agro bg-agro-hover' : 'text-agro-light hover:text-agro hover:bg-agro-hover']" :title="msg.reminderSaved ? 'Нагадування збережено' : 'Зберегти нагадування'">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                </button>
              </div>
              <!-- Препарати: посилання на каталог + кнопка в схему -->
              <div v-if="msg.role === 'assistant' && msg.products?.length" class="mt-2 flex gap-2 flex-wrap">
                <div v-for="p in msg.products" :key="p" class="flex items-center gap-0.5">
                  <NuxtLink
                    :to="`/pesticides?q=${encodeURIComponent(p)}`"
                    target="_blank"
                    class="text-xs px-3 py-1.5 bg-agro-hover text-agro border border-agro/30 rounded-l-lg hover:bg-agro hover:text-white transition-colors font-medium">
                    🔍 {{ p }}
                  </NuxtLink>
                  <button
                    @click="openSchemeModalForProduct(p)"
                    class="text-xs px-2 py-1.5 bg-agro-hover text-agro border border-l-0 border-agro/30 rounded-r-lg hover:bg-agro hover:text-white transition-colors"
                    title="Додати до технологічної карти">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="streaming" class="flex gap-3">
            <div class="w-8 h-8 rounded-full bg-agro-hover flex items-center justify-center text-sm shrink-0 text-agro"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M9 8V6a3 3 0 016 0v2"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/><path d="M9 18h6"/></svg></div>
            <div class="bg-white border border-agro-border rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-agro-dark leading-relaxed whitespace-pre-wrap max-w-[75%]">
              {{ streamingText }}<span class="animate-pulse">▋</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Ліміт вичерпано -->
      <div v-if="monthlyTextCount >= textLimit" class="px-6 py-4 border-t border-agro-border bg-white shrink-0 text-center">
        <p class="font-semibold text-agro-dark mb-1">🔒 Місячний ліміт вичерпано</p>
        <p class="text-sm text-agro-light mb-3">Ліміт запитів на цей місяць: {{ textLimit }}. Оновіть тариф для збільшення.</p>
        <NuxtLink :to="proLink" class="btn-primary inline-flex items-center gap-1.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Переглянути тарифи
        </NuxtLink>
      </div>

      <!-- Input -->
      <div v-else class="px-6 py-4 border-t border-agro-border bg-white shrink-0"
        @dragover.prevent="dragOver = true" @dragleave="dragOver = false" @drop.prevent="onDrop"
        :class="{ 'ring-2 ring-agro ring-inset bg-agro/5': dragOver }">
        <!-- Шаблони запитів -->
        <div v-if="showTemplates" class="mb-3 flex flex-wrap gap-2">
          <button v-for="tpl in TEMPLATES" :key="tpl.label"
            @click="input = tpl.text; showTemplates = false; $nextTick(() => inputEl?.focus())"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-agro-border bg-agro-bg hover:bg-agro-hover text-xs font-medium text-agro-dark transition-colors">
            {{ tpl.icon }} {{ tpl.label }}
          </button>
        </div>
        <!-- Превью фото -->
        <div v-if="imagePreview" class="mb-2 relative inline-block">
          <img :src="imagePreview" class="h-20 rounded-xl object-cover border border-agro-border" />
          <button @click="clearImage" class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none">×</button>
        </div>
        <div class="flex gap-2 items-center">
          <!-- Кнопка експорту -->
          <button @click="exportChat" v-if="messages.length > 0" title="Зберегти консультацію"
            class="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border border-agro-border hover:bg-agro-hover transition-colors text-agro-light hover:text-agro">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <!-- Кнопка шаблонів -->
          <button @click="showTemplates = !showTemplates" :title="showTemplates ? 'Приховати шаблони' : 'Шаблони запитів'"
            :class="['w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border transition-colors', showTemplates ? 'bg-agro/10 border-agro text-agro' : 'border-agro-border hover:bg-agro-hover text-agro-light hover:text-agro']">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h7M17.5 14v7"/></svg>
          </button>
          <!-- Кнопка фото -->
          <label :class="['relative w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border cursor-pointer transition-colors', monthlyPhotoCount >= photoLimit ? 'opacity-40 cursor-not-allowed border-agro-border' : 'border-agro-border hover:bg-agro-hover text-agro-light hover:text-agro']">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
            <span class="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-agro-hover border border-agro-border rounded-full px-1 leading-4 text-agro-light">{{ monthlyPhotoCount }}/{{ photoLimit }}</span>
            <input type="file" accept="image/*" class="hidden" @change="onImagePick" ref="fileInputEl" :disabled="monthlyPhotoCount >= photoLimit" />
          </label>
          <textarea
            v-model="input"
            @keydown.enter.exact.prevent="send"
            rows="1"
            class="flex-1 input resize-none"
            style="height: 44px; min-height: 44px; max-height: 140px; line-height: 20px; padding-top: 11px; padding-bottom: 11px;"
            placeholder="Запитайте про агрономію..."
            :disabled="streaming"
            ref="inputEl"
            @input="autoResize"
          />
          <!-- Голосове введення -->
          <button @click="toggleVoice" v-if="speechSupported" :title="isListening ? 'Зупинити' : 'Голосове введення'"
            :class="['w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border transition-colors', isListening ? 'bg-red-50 border-red-300 text-red-500 animate-pulse' : 'border-agro-border hover:bg-agro-hover text-agro-light hover:text-agro']">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>
          </button>
          <button @click="send" :disabled="(!input.trim() && !imageFile) || streaming"
            class="w-11 h-11 shrink-0 disabled:opacity-50 flex items-center justify-center rounded-xl bg-agro text-white hover:bg-agro/90 transition-colors">
            <svg v-if="!streaming" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            <span v-else class="text-sm">...</span>
          </button>
        </div>
        <p class="text-xs text-agro-light mt-2 text-center">
          <span>{{ textLimit - monthlyTextCount }} з {{ textLimit }} запитів цього місяця · </span>Відповіді є рекомендаційними. Завжди консультуйтесь з агрономом.
        </p>
      </div>
    </template>

    <!-- Модалка нагадування з чату -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="reminderModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="reminderModal.show = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
            <h2 class="font-bold text-agro-dark text-lg mb-4">🔔 Зберегти нагадування</h2>
            <textarea v-model="reminderModal.text" rows="3" class="input w-full resize-none mb-3" placeholder="Опис нагадування..." />
            <div class="flex gap-2 mb-4">
              <input v-model="reminderModal.date" type="date" class="input flex-1" />
            </div>
            <div class="flex gap-2">
              <button @click="reminderModal.show = false" class="btn-outline flex-1">Скасувати</button>
              <button @click="saveReminderFromModal" :disabled="!reminderModal.text || !reminderModal.date || reminderModal.saving"
                class="btn-primary flex-1 justify-center disabled:opacity-50">
                {{ reminderModal.saving ? 'Збереження...' : 'Зберегти' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
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
                <div v-if="aiFarmCrops.length === 0" class="text-sm text-gray-400 py-2">Немає полів</div>
                <div v-else class="space-y-1.5">
                  <button v-for="fc in aiFarmCrops" :key="fc.id" type="button"
                    @click="aiSelectFarmCrop(fc.id)"
                    :class="['w-full flex items-start gap-2 px-3 py-2.5 rounded-xl border-2 transition-colors text-sm text-left',
                      schemeModal.farm_crop_id === fc.id ? 'border-agro bg-agro-hover text-agro font-medium' : 'border-[#E0EDCC] text-gray-600 hover:border-agro/50']">
                    <svg class="shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                    <span class="leading-tight">{{ fc.farm_name }}<br><span class="font-normal text-xs opacity-70">{{ fc.crop_type }}</span></span>
                  </button>
                </div>
              </div>

              <!-- Права панель: форма -->
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
                    <div v-if="aiProgramPhasesLoading" class="text-sm text-agro-light py-1">Завантаження...</div>
                    <div v-else class="flex flex-wrap gap-1.5">
                      <button v-for="ph in aiProgramPhases" :key="ph.key" type="button"
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
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'AI агроном' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const { getQueryUserId } = useTeamContext()

const { load: loadCrops, emojiFor } = useCropCatalog()
loadCrops()

const farmId = computed(() => route.query.farmId as string | undefined)
const queryChatId = computed(() => route.query.chatId as string | undefined)
const queryCropType = computed(() => route.query.cropType as string | undefined)
const queryVariety = computed(() => route.query.variety as string | undefined)
const queryCropId = computed(() => route.query.cropId as string | undefined)
const queryPrompt = computed(() => route.query.prompt as string | undefined)
const queryAnalyzeCard = computed(() => route.query.analyzeCard === '1')

const loading = ref(true)
const currentPlan = ref<'basic' | 'pro' | 'business' | 'enterprise'>('basic')
const isPro = computed(() => currentPlan.value !== 'basic')
const isAgronomist = import.meta.client
  ? (localStorage.getItem('agro_active_profile') || localStorage.getItem('agro_user_role')) === 'agronomist'
  : false
const proLink = isAgronomist ? '/dashboard/promotion' : '/dashboard/subscription'
const hasOlderHistory = ref(false)

const PLAN_LIMITS_FALLBACK: Record<string, { text: number; photo: number }> = {
  basic:      { text: 10,   photo: 1   },
  pro:        { text: 500,  photo: 60  },
  business:   { text: 3000, photo: 300 },
  enterprise: { text: 9999, photo: 9999 },
}
const planLimitsDb = ref<Record<string, { text: number; photo: number }>>({})

const getPlanLimit = (plan: string) =>
  planLimitsDb.value[plan] ?? PLAN_LIMITS_FALLBACK[plan] ?? PLAN_LIMITS_FALLBACK.basic
const monthlyTextCount  = ref(0)
const monthlyPhotoCount = ref(0)
const textLimit  = ref(10)
const photoLimit = ref(2)
const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
const farmName = ref('')
const farmHectares = ref<number | null>(null)
const farmRegion = ref('')
const weatherInfo = ref<{ temp: number; condition: string; icon: string } | null>(null)
const crops = ref<any[]>([])
const selectedCrop = ref<any | null>(null)
const currentChatId = ref<string | null>(null)

watch(currentChatId, (id) => {
  const query: Record<string, string> = { ...route.query as Record<string, string> }
  if (id) {
    query.chatId = id
  } else {
    delete query.chatId
  }
  router.replace({ query })
})
const uid = ref<string | null>(null)

const messages = ref<{ role: 'user' | 'assistant'; content: string; image_url?: string; products?: string[]; hasScheme?: boolean; rating?: number; reminderSaved?: boolean }[]>([])
const generatingSummary = ref(false)
const generatingReport = ref(false)
const aiMemory = ref<string | null>(null)
const showSessionsList = ref(true)
const chatSessions = ref<{ id: string; title: string; preview: string; date: string }[]>([])
const searchQuery = ref('')
const showTemplates = ref(false)
const input = ref('')
const streaming = ref(false)
const streamingText = ref('')
const messagesEl = ref<HTMLElement>()
const inputEl = ref<HTMLTextAreaElement>()
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const fileInputEl = ref<HTMLInputElement>()
const dragOver = ref(false)

const reminderModal = ref({ show: false, text: '', date: '', saving: false, msgIndex: -1 })

const dynamicHints = computed(() => {
  if (!selectedCrop.value) return [
    '🌾 Як захистити пшеницю від борошнистої роси?',
    '🌽 Коли вносити добрива під кукурудзу?',
    '🐛 Як боротись з попелицею?',
  ]
  const ct = selectedCrop.value.crop_type
  const v = selectedCrop.value.variety ? ` (${selectedCrop.value.variety})` : ''
  const name = `${ct}${v}`
  const month = new Date().getMonth() + 1
  const season = month >= 3 && month <= 5 ? 'весні' : month >= 6 && month <= 8 ? 'влітку' : month >= 9 && month <= 11 ? 'восени' : 'взимку'
  return [
    `Які хвороби найчастіші у ${name} ${season}?`,
    `Склади схему захисту від шкідників для ${name}`,
    `Коли і які добрива вносити під ${name}?`,
    `Оптимальні строки і норми сівби ${ct}`,
    `Як визначити нестачу поживних речовин у ${ct}?`,
  ]
})

const filteredSessions = computed(() => {
  if (!searchQuery.value.trim()) return chatSessions.value
  const q = searchQuery.value.toLowerCase()
  return chatSessions.value.filter(s =>
    s.title.toLowerCase().includes(q) || s.preview.toLowerCase().includes(q)
  )
})

const sessionStats = computed(() => {
  const total = chatSessions.value.length
  if (!total) return null
  const today = new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
  const todayCount = chatSessions.value.filter(s => s.date === 'Сьогодні').length
  return { total, todayCount }
})

const TEMPLATES = [
  { icon: '🔬', label: 'Аналіз листка', text: 'Проаналізуй симптоми на листках: ' },
  { icon: '🛡️', label: 'Схема захисту', text: 'Склади схему захисту рослин від хвороб і шкідників для ' },
  { icon: '🌿', label: 'Норми добрив', text: 'Які норми внесення добрив на різних фазах росту для ' },
  { icon: '📅', label: 'Строки обробки', text: 'Коли проводити обробки і в яких фазах росту для ' },
  { icon: '🐛', label: 'Визначення шкідника', text: 'Допоможи визначити шкідника за описом: ' },
  { icon: '💧', label: 'Полив та зрошення', text: 'Рекомендації щодо поливу та зрошення для ' },
]

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
  if (aiMemory.value) parts.push(`\nПам'ять з попередніх розмов:\n${aiMemory.value}`)
  return parts.join('\n') || null
})

const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  'Вінницька': { lat: 49.23, lon: 28.47 }, 'Волинська': { lat: 50.74, lon: 25.32 },
  'Дніпропетровська': { lat: 48.46, lon: 35.04 }, 'Донецька': { lat: 48.02, lon: 37.80 },
  'Житомирська': { lat: 50.25, lon: 28.66 }, 'Закарпатська': { lat: 48.62, lon: 22.30 },
  'Запорізька': { lat: 47.84, lon: 35.14 }, 'Івано-Франківська': { lat: 48.92, lon: 24.71 },
  'Київська': { lat: 50.40, lon: 30.52 }, 'Кіровоградська': { lat: 48.51, lon: 32.26 },
  'Львівська': { lat: 49.84, lon: 24.03 }, 'Миколаївська': { lat: 46.97, lon: 32.00 },
  'Одеська': { lat: 46.48, lon: 30.73 }, 'Полтавська': { lat: 49.59, lon: 34.55 },
  'Рівненська': { lat: 50.62, lon: 26.25 }, 'Сумська': { lat: 50.91, lon: 34.80 },
  'Тернопільська': { lat: 49.55, lon: 25.59 }, 'Харківська': { lat: 49.99, lon: 36.23 },
  'Херсонська': { lat: 46.64, lon: 32.62 }, 'Хмельницька': { lat: 49.42, lon: 26.99 },
  'Черкаська': { lat: 49.44, lon: 32.06 }, 'Чернівецька': { lat: 48.29, lon: 25.94 },
  'Чернігівська': { lat: 51.49, lon: 31.29 },
}

const loadWeather = async (region: string) => {
  try {
    const coords = Object.entries(REGION_COORDS).find(([key]) => region.includes(key))?.[1]
    if (!coords) return
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&forecast_days=1&timezone=Europe%2FKyiv`
    const res = await fetch(url)
    const data = await res.json()
    const code = data.current.weather_code
    const icon = code === 0 ? '☀️' : code <= 3 ? '⛅' : code <= 67 ? '🌧️' : code <= 77 ? '❄️' : code <= 99 ? '⛈️' : '🌤️'
    const condition = code === 0 ? 'Ясно' : code <= 3 ? 'Хмарно' : code <= 67 ? 'Дощ' : code <= 77 ? 'Сніг' : code <= 99 ? 'Гроза' : 'Мінлива'
    weatherInfo.value = { temp: Math.round(data.current.temperature_2m), condition, icon }
  } catch {}
}

onMounted(async () => {
  try {
  uid.value = await getQueryUserId()

  const [, subRes, planLimitsRes] = await Promise.all([
    growthPhases.load(),
    supabase.from('subscriptions').select('plan, expires_at, ai_text_limit, ai_photo_limit').eq('user_id', uid.value).maybeSingle(),
    supabase.from('ai_plan_limits').select('plan, text_limit, photo_limit'),
  ])

  // Завантажуємо ліміти з БД (якщо є)
  if (planLimitsRes.data?.length) {
    planLimitsDb.value = Object.fromEntries(
      planLimitsRes.data.map((r: any) => [r.plan, { text: r.text_limit, photo: r.photo_limit }])
    )
  }

  const sub = subRes.data
  const plan = sub?.plan ?? 'basic'
  const isActive = !sub?.expires_at || new Date(sub.expires_at) > new Date()
  currentPlan.value = (isActive ? plan : 'basic') as typeof currentPlan.value

  const limits = getPlanLimit(currentPlan.value)
  textLimit.value  = sub?.ai_text_limit  ?? limits.text
  photoLimit.value = sub?.ai_photo_limit ?? limits.photo

  // Місячне використання
  if (uid.value) {
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('text_count, photo_count')
      .eq('user_id', uid.value)
      .eq('month', currentMonth)
      .maybeSingle()
    monthlyTextCount.value  = usage?.text_count  || 0
    monthlyPhotoCount.value = usage?.photo_count || 0
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
      if (data.region) loadWeather(data.region)
      // Якщо перейшли з конкретної культури — вибираємо її, інакше першу
      if (queryCropId.value) {
        selectedCrop.value = crops.value.find(c => c.id === queryCropId.value) || crops.value[0] || null
      } else if (crops.value.length) {
        selectedCrop.value = crops.value[0]
      }
      showSessionsList.value = false
    }
  }
  if (uid.value) {
    await loadSessions()
    const { data: mem } = await supabase.from('ai_memory').select('summary').eq('user_id', uid.value).maybeSingle()
    if (mem?.summary) aiMemory.value = mem.summary
    // Якщо немає ферми — беремо регіон першої ферми для погоди
    if (!farmId.value) {
      const { data: firstFarm } = await supabase.from('farms').select('region').eq('user_id', uid.value).not('region', 'is', null).limit(1).maybeSingle()
      if (firstFarm?.region) loadWeather(firstFarm.region)
    }
    // Якщо прийшли з картки культури городника
    if (!farmId.value && queryCropType.value) {
      selectedCrop.value = { crop_type: queryCropType.value, variety: queryVariety.value || null, id: null }
      showSessionsList.value = false
    }
    // Якщо в URL є chatId — одразу відкрити конкретний чат
    if (queryChatId.value) {
      await openSession(queryChatId.value)
    }
    // Якщо прийшли з AI аналізу карти — читаємо дані і автоматично відправляємо
    if (queryAnalyzeCard.value) {
      try {
        const stored = sessionStorage.getItem('ai_analyze_card')
        if (stored) {
          const { cardText } = JSON.parse(stored)
          sessionStorage.removeItem('ai_analyze_card')
          input.value = `Проаналізуй мою технічну карту і дай рекомендації: які є слабкі місця, що можна покращити в програмі захисту і живлення?\n\n${cardText}`
          await nextTick()
          // Автоматично відправляємо після невеликої затримки
          setTimeout(() => send(), 300)
        }
      } catch {}
    } else if (queryPrompt.value) {
      input.value = queryPrompt.value
      await nextTick()
      inputEl.value?.focus()
    }
  }
  } finally {
    loading.value = false
  }
})

const startNewSession = async () => {
  if (!messages.value.length || !uid.value) return
  generatingSummary.value = true
  try {
    const { summary } = await $fetch('/api/ai-summary', {
      method: 'POST',
      body: { messages: messages.value, prevSummary: aiMemory.value },
    }) as any
    // Зберегти summary в пам'ять
    await supabase.from('ai_memory').upsert({
      user_id: uid.value,
      farm_id: farmId.value || null,
      summary,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    aiMemory.value = summary
    // Повернутись до списку сесій
    currentChatId.value = null
    messages.value = []
    await loadSessions()
    showSessionsList.value = true
  } finally {
    generatingSummary.value = false
  }
}


const loadSessions = async () => {
  if (!uid.value) return
  // Спочатку отримуємо чати
  const { data: chats } = await supabase
    .from('ai_chats')
    .select('id, created_at, updated_at')
    .eq('user_id', uid.value)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (!chats?.length) return

  // Для кожного чату беремо перше повідомлення user і останнє повідомлення
  const sessions = await Promise.all(chats.map(async (chat: any) => {
    const { data: msgs } = await supabase
      .from('ai_messages')
      .select('role, content, created_at')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true })

    if (!msgs?.length) return null

    const firstUser = msgs.find((m: any) => m.role === 'user')
    const lastMsg = msgs[msgs.length - 1]
    const title = firstUser ? firstUser.content.slice(0, 60).replace(/\n/g, ' ') : 'Розмова'
    const preview = lastMsg?.role === 'assistant'
      ? lastMsg.content.replace(/@[\wА-ЯҐЄІЇа-яґєії'-]+/g, (m: string) => m.slice(1)).replace(/SCHEME_DETECTED/g, '').trim().slice(0, 80)
      : (lastMsg?.content || '').slice(0, 80)
    const d = new Date(chat.updated_at || chat.created_at)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    const date = diffDays === 0 ? 'Сьогодні' : diffDays === 1 ? 'Вчора' : `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
    return { id: chat.id, title, preview, date }
  }))

  chatSessions.value = sessions.filter(Boolean) as any[]
}

const openSession = async (chatId: string) => {
  showSessionsList.value = false
  currentChatId.value = chatId
  const { data } = await supabase
    .from('ai_chats')
    .select('id, ai_messages(id, role, content, created_at)')
    .eq('id', chatId)
    .order('created_at', { referencedTable: 'ai_messages', ascending: true })
    .single()
  if (data) {
    let msgs = data.ai_messages || []
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

const openNewChat = () => {
  showSessionsList.value = false
  currentChatId.value = null
  messages.value = []
}

const generateSeasonReport = async () => {
  if (!uid.value || generatingReport.value) return
  generatingReport.value = true
  try {
    // Збираємо всі повідомлення з усіх сесій
    const allMsgs: string[] = []
    for (const session of chatSessions.value) {
      const { data: msgs } = await supabase.from('ai_messages')
        .select('role, content, created_at').eq('chat_id', session.id)
        .order('created_at', { ascending: true })
      if (msgs?.length) {
        allMsgs.push(`--- Розмова "${session.title}" (${session.date}) ---`)
        msgs.forEach((m: any) => allMsgs.push(`${m.role === 'user' ? 'Фермер' : 'AI'}: ${m.content.replace(/SCHEME_DETECTED/g, '').replace(/REMINDER:[^\n]+/g, '').trim()}`))
      }
    }
    const res = await $fetch('/api/ai-season-report', {
      method: 'POST',
      body: { conversations: allMsgs.join('\n'), farmName: farmName.value, memory: aiMemory.value },
    }) as any

    // Прибираємо <think>...</think> теги що може вставляти qwen
    const rawReport = (res.report || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()

    const date = new Date().toLocaleDateString('uk-UA')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Звіт сезону — ${farmName.value || 'Господарство'}</title>
    <style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a2e1a}
    h1{color:#2f5233;border-bottom:3px solid #7ab648;padding-bottom:12px}
    h2{color:#2f5233;margin-top:28px}
    p{line-height:1.7}ul{line-height:1.9}
    .meta{color:#888;margin-bottom:28px}
    footer{margin-top:48px;text-align:center;color:#aaa;font-size:12px;border-top:1px solid #e0edcc;padding-top:16px}</style></head>
    <body><h1>Звіт сезону</h1>
    <p class="meta">${farmName.value || 'Загальна консультація'} · Сформовано ${date}</p>
    <div>${rawReport.replace(/\n/g, '<br>')}</div>
    <footer>Сформовано через АгроПростір · agroprostir.com.ua</footer></body></html>`

    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close(); win.print() }
  } catch (e) {
    console.error('season report error', e)
    alert('Помилка генерації звіту')
  } finally {
    generatingReport.value = false
  }
}

const deleteSession = async (chatId: string) => {
  if (!confirm('Видалити цю розмову?')) return
  await supabase.from('ai_messages').delete().eq('chat_id', chatId)
  await supabase.from('ai_chats').delete().eq('id', chatId)
  chatSessions.value = chatSessions.value.filter(s => s.id !== chatId)
}

// Рейтинг відповідей
const copiedIndex = ref<number | null>(null)
const rateMessage = (index: number, rating: 1 | -1) => {
  const msg = messages.value[index] as any
  if (msg) msg.rating = msg.rating === rating ? 0 : rating
}
const copyMessage = async (content: string, index?: number) => {
  const clean = content.replace(/@([\wА-ЯҐЄІЇа-яґєії'-]+)/g, '$1').replace(/SCHEME_DETECTED/g, '').trim()
  await navigator.clipboard.writeText(clean)
  if (index !== undefined) {
    copiedIndex.value = index
    setTimeout(() => { copiedIndex.value = null }, 1500)
  }
}

// Голосове введення
const isListening = ref(false)
const speechSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
let recognition: any = null
const toggleVoice = () => {
  if (isListening.value) {
    recognition?.stop()
    isListening.value = false
    return
  }
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  recognition = new SR()
  recognition.lang = 'uk-UA'
  recognition.continuous = false
  recognition.interimResults = false
  recognition.onresult = (e: any) => {
    const text = e.results[0]?.[0]?.transcript || ''
    input.value = (input.value + ' ' + text).trim()
    isListening.value = false
  }
  recognition.onerror = () => { isListening.value = false }
  recognition.onend = () => { isListening.value = false }
  recognition.start()
  isListening.value = true
}

// Експорт чату
const exportChat = () => {
  const date = new Date().toLocaleDateString('uk-UA')
  const lines = messages.value.map(m => {
    const role = m.role === 'user' ? '👨‍🌾 Фермер' : '🤖 AI Агроном'
    const content = m.content.replace(/@([\wА-ЯҐЄІЇа-яґєії'-]+)/g, '$1').replace(/SCHEME_DETECTED/g, '').trim()
    return `${role}:\n${content}`
  })
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Консультація AI Агронома — ${date}</title>
  <style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a2e1a}
  h1{color:#2f5233;border-bottom:2px solid #e0edcc;padding-bottom:12px}
  .msg{margin:16px 0;padding:16px;border-radius:12px}
  .user{background:#f0f7eb;border-left:4px solid #2f5233}
  .ai{background:#fff;border:1px solid #e0edcc;border-left:4px solid #7ab648}
  .role{font-weight:700;margin-bottom:6px;font-size:13px;color:#5a7a5a}
  p{margin:0;white-space:pre-wrap;line-height:1.6}
  footer{margin-top:40px;text-align:center;color:#999;font-size:12px}</style></head><body>
  <h1>Консультація AI Агронома</h1><p style="color:#888;margin-bottom:24px">${farmName.value || 'Загальна консультація'} · ${date}</p>
  ${messages.value.map(m => `<div class="msg ${m.role === 'user' ? 'user' : 'ai'}"><div class="role">${m.role === 'user' ? '👨‍🌾 Фермер' : '🤖 AI Агроном'}</div><p>${m.content.replace(/@([\wА-ЯҐЄІЇа-яґєії'-]+)/g, '$1').replace(/SCHEME_DETECTED/g, '').trim()}</p></div>`).join('')}
  <footer>Сформовано через АгроПростір · agroprostir.com.ua</footer></body></html>`
  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close(); win.print() }
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

const RU_TO_UA: [RegExp, string][] = [
  [/Железн/gi, 'Залізн'], [/железн/gi, 'залізн'],
  [/Медн/gi, 'Мідн'], [/медн/gi, 'мідн'],
  [/Марганцев/gi, 'Марганцев'], // вже ок
  [/Серн/gi, 'Сірч'], [/серн/gi, 'сірч'],
  [/Известь/gi, 'Вапно'], [/известь/gi, 'вапно'],
  [/Фосфорн/gi, 'Фосфорн'], // вже ок
  [/Калийн/gi, 'Калійн'], [/калийн/gi, 'калійн'],
  [/Азотн/gi, 'Азотн'], // вже ок
  [/Листов/gi, 'Листов'], // вже ок
]
const fixLanguage = (text: string) => RU_TO_UA.reduce((t, [ru, ua]) => t.replace(ru, ua), text)

// Парсинг [[Препарат]] → посилання
const extractReminder = (text: string): { text: string; days: number } | undefined => {
  const match = text.match(/REMINDER:([^|\n]+)\|(\d+)/)
  if (!match) return undefined
  return { text: match[1].replace(/@([\wА-ЯҐЄІЇа-яґєії'-]+)/g, '$1').trim(), days: parseInt(match[2]) }
}

const addReminderFromAi = async (reminder: { text: string; days: number }) => {
  if (!uid.value) return
  const date = new Date()
  date.setDate(date.getDate() + reminder.days)
  await supabase.from('reminders').insert({
    user_id: uid.value,
    description: reminder.text,
    scheduled_date: date.toISOString(),
    type: 'spray',
    from_agronomist: false,
  })
  alert(`✅ Нагадування додано на ${date.toLocaleDateString('uk-UA')}`)
}

const renderMessage = (text: string) => {
  const clean = fixLanguage(text).replace(/SCHEME_DETECTED/g, '').replace(/REMINDER:[^\n]+/g, '').trim()
  return clean.replace(/@([\wА-ЯҐЄІЇа-яґєії'-]+)/g, (_, name) =>
    `<a href="/pesticides?q=${encodeURIComponent(name)}" target="_blank" class="inline-flex items-center gap-1 text-agro font-semibold underline underline-offset-2 hover:text-agro/80 transition-colors">🔍 ${name}</a>`
  )
}

const extractProducts = (text: string): string[] => {
  const fixed = fixLanguage(text)
  const matches = [...fixed.matchAll(/@([\wА-ЯҐЄІЇа-яґєії'-]+)/g)]
  return [...new Set(matches.map(m => m[1]))]
}

import { TREATMENT_TYPES } from '~/utils/treatmentTypes'
import { phaseIcon } from '~/utils/phaseIcons'

const growthPhases = useGrowthPhases()
const phases = growthPhases.allPhases

// Поля для модалки схеми
const aiFarmCrops = ref<{ id: string; farm_name: string; crop_type: string }[]>([])
const aiProgramPhases = ref<{ key: string; emoji: string }[]>([])
const aiProgramPhasesLoading = ref(false)

const aiLoadFarmCrops = async () => {
  const userId = uid.value
  if (!userId) return
  const { data } = await supabase
    .from('farms')
    .select('id, name, farm_crops(id, crop_type)')
    .eq('user_id', userId)
  aiFarmCrops.value = (data || []).flatMap((f: any) =>
    (f.farm_crops || []).map((fc: any) => ({ id: fc.id, farm_name: f.name, crop_type: fc.crop_type }))
  )
}

const aiLoadProgramPhases = async (farmCropId: string) => {
  aiProgramPhasesLoading.value = true
  aiProgramPhases.value = []
  const { data: progRows } = await supabase
    .from('protection_programs')
    .select('id')
    .eq('farm_crop_id', farmCropId)
    .limit(1)
  const prog = progRows?.[0] ?? null
  if (prog?.id) {
    const { data: treatments } = await supabase
      .from('program_treatments')
      .select('phase')
      .eq('program_id', prog.id)
      .not('phase', 'is', null)
    const uniquePhases = [...new Set((treatments || []).map((t: any) => t.phase))]
    aiProgramPhases.value = uniquePhases.map(key => {
      const p = phases.value.find(ph => ph.key === key)
      return { key, emoji: p?.emoji || '🌱' }
    })
  }
  aiProgramPhasesLoading.value = false
}

const aiSelectFarmCrop = async (id: string) => {
  schemeModal.farm_crop_id = id
  schemeModal.phase = ''
  schemeModal.new_phase = ''
  await aiLoadProgramPhases(id)
}

// Модалка технологічної карти
const schemeModal = reactive({
  show: false,
  product_name: '',
  farm_crop_id: '',
  phase: '',
  new_phase: '',
  type: 'захист',
  dosage: '',
  notes: '',
  saving: false,
  success: false,
})

const openSchemeModalForProduct = (productName: string) => {
  schemeModal.product_name = productName
  schemeModal.farm_crop_id = ''
  schemeModal.phase = ''
  schemeModal.new_phase = ''
  schemeModal.type = 'захист'
  schemeModal.dosage = ''
  schemeModal.notes = ''
  schemeModal.success = false
  aiLoadFarmCrops()
  schemeModal.show = true
}

const openSchemeModal = (content: string) => {
  const products = extractProducts(content)
  schemeModal.product_name = products[0] || ''
  schemeModal.farm_crop_id = ''
  schemeModal.phase = ''
  schemeModal.new_phase = ''
  schemeModal.type = 'захист'
  schemeModal.dosage = ''
  schemeModal.notes = ''
  schemeModal.success = false
  aiLoadFarmCrops()
  schemeModal.show = true
}

const saveToScheme = async () => {
  if (!schemeModal.product_name || !schemeModal.farm_crop_id) return
  schemeModal.saving = true

  const userId = uid.value
  if (!userId) { schemeModal.saving = false; return }

  const { data: progRows } = await supabase
    .from('protection_programs')
    .select('id')
    .eq('farm_crop_id', schemeModal.farm_crop_id)
    .limit(1)
  let prog = progRows?.[0] ?? null

  if (!prog) {
    const fc = aiFarmCrops.value.find(f => f.id === schemeModal.farm_crop_id)
    const { data: created } = await supabase
      .from('protection_programs')
      .insert({ farm_crop_id: schemeModal.farm_crop_id, user_id: userId, name: `Схема для ${fc?.crop_type || 'культури'}` })
      .select('id').single()
    prog = created
  }

  if (prog?.id) {
    const effectivePhase = schemeModal.phase === '__new__' ? schemeModal.new_phase : schemeModal.phase
    const phaseObj = phases.value.find(p => p.key === effectivePhase)
    await supabase.from('program_treatments').insert({
      program_id: prog.id,
      product_name: schemeModal.product_name,
      phase: effectivePhase || null,
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

const onImagePick = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  setImageFile(file)
}

const clearImage = () => {
  imageFile.value = null
  imagePreview.value = null
  if (fileInputEl.value) fileInputEl.value.value = ''
}

const setImageFile = (file: File) => {
  if (monthlyPhotoCount.value >= photoLimit.value) {
    alert(`Ліміт фото на місяць вичерпано (${photoLimit.value} шт.). Оновіть тариф для збільшення ліміту.`)
    return
  }
  imageFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { imagePreview.value = ev.target?.result as string }
  reader.readAsDataURL(file)
}

const onDrop = (e: DragEvent) => {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) setImageFile(file)
}

const openReminderFromMsg = (content: string, index: number) => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = tomorrow.toISOString().slice(0, 10)
  const short = content.replace(/[*#`]/g, '').slice(0, 120).trim()
  reminderModal.value = { show: true, text: short, date: dateStr, saving: false, msgIndex: index }
}

const saveReminderFromModal = async () => {
  if (!uid.value || !reminderModal.value.text || !reminderModal.value.date) return
  reminderModal.value.saving = true
  try {
    await supabase.from('reminders').insert({
      user_id: uid.value,
      description: reminderModal.value.text,
      scheduled_date: reminderModal.value.date,
    })
    if (reminderModal.value.msgIndex >= 0) {
      messages.value[reminderModal.value.msgIndex].reminderSaved = true
    }
    reminderModal.value.show = false
  } finally {
    reminderModal.value.saving = false
  }
}

const send = async () => {
  const text = input.value.trim()
  if ((!text && !imageFile.value) || streaming.value) return

  if (monthlyTextCount.value >= textLimit.value) return
  if (imagePreview.value && monthlyPhotoCount.value >= photoLimit.value) return

  const imageDataUrl = imagePreview.value || undefined
  if (imageDataUrl) monthlyPhotoCount.value++
  messages.value.push({ role: 'user', content: text || ' ', image_url: imageDataUrl })
  input.value = ''
  imageFile.value = null
  imagePreview.value = null
  if (fileInputEl.value) fileInputEl.value.value = ''
  if (inputEl.value) inputEl.value.style.height = 'auto'
  await scrollToBottom()

  streaming.value = true
  streamingText.value = ''

  // Створюємо чат в БД при першому повідомленні (всі користувачі)
  if (uid.value && !currentChatId.value) {
    const { data: chat, error: chatErr } = await supabase.from('ai_chats').insert({
      user_id: uid.value,
      farm_id: farmId.value || null,
      farm_crop_id: selectedCrop.value?.id || null,
    }).select('id').single()
    if (chatErr) console.error('[ai-chat] create chat error:', chatErr)
    currentChatId.value = chat?.id || null
  }

  // Зберігаємо повідомлення користувача
  if (currentChatId.value) {
    await supabase.from('ai_messages').insert({ chat_id: currentChatId.value, role: 'user', content: text })
  }
  monthlyTextCount.value++
  // Інкремент у БД (upsert)
  if (uid.value) {
    await supabase.from('ai_usage').upsert({
      user_id: uid.value,
      month: currentMonth,
      text_count: monthlyTextCount.value,
      photo_count: monthlyPhotoCount.value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,month' })
  }

  try {
    const apiMessages = messages.value.map(m => {
      if (m.image_url) {
        return {
          role: m.role,
          content: [
            { type: 'image_url', image_url: { url: m.image_url } },
            { type: 'text', text: m.content || 'Що на фото?' },
          ],
        }
      }
      return { role: m.role, content: m.content }
    })
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: apiMessages,
        farmContext: farmContext.value,
        hasImage: !!imageDataUrl,
        region: farmRegion.value || null,
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown')
      console.error('[ai-chat] API error', res.status, errText)
      if (res.status === 429) {
        messages.value.push({ role: 'assistant', content: '⏳ Зараз велике навантаження на AI. Спробуйте за хвилину.' })
        streaming.value = false; streamingText.value = ''; return
      }
      throw new Error(`API error ${res.status}: ${errText}`)
    }

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
      reminder: extractReminder(fullText),
    })

    // Зберігаємо відповідь AI (всі користувачі)
    if (currentChatId.value) {
      await supabase.from('ai_messages').insert({ chat_id: currentChatId.value, role: 'assistant', content: fullText })
      await supabase.from('ai_chats').update({ updated_at: new Date().toISOString() }).eq('id', currentChatId.value)
    }
  } catch (err) {
    console.error('[ai-chat] send error:', err)
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
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-icon-box { width: 40px; height: 40px; border-radius: 10px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
</style>
