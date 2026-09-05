<template>
  <div class="dash-page">
    <div class="dash-head">
      <NuxtLink to="/dashboard/fields" class="dash-icon-box shrink-0 hover:bg-agro-hover transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </NuxtLink>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Технічна карта</h1>
        <p class="dash-subtitle">{{ cropType || 'Програми захисту культур' }}</p>
      </div>
      <button v-if="program" @click="generateCard" :disabled="generating" class="dash-btn-outline shrink-0 flex items-center gap-1.5">
        <svg v-if="!generating" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/>
          <path d="M19 17l.9 2.1L22 20l-2.1.9L19 23l-.9-2.1L16 20l2.1-.9L19 17z"/>
        </svg>
        <svg v-else class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        {{ generating ? 'Генерую...' : 'AI генерація' }}
      </button>
      <button v-if="program" @click="openAiAnalysis" class="dash-btn-outline shrink-0 flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/>
          <path d="M19 17l.9 2.1L22 20l-2.1.9L19 23l-.9-2.1L16 20l2.1-.9L19 17z"/>
        </svg>
        AI аналіз
      </button>
      <button v-if="program" @click="exportPdf" class="dash-btn-primary shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        PDF
      </button>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="card animate-pulse h-20" v-for="i in 3" :key="i"></div>
    </div>

    <div v-else>
      <div v-if="!program" class="card text-center py-12">
        <div class="dash-empty-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z"/>
          </svg>
        </div>
        <p class="font-bold text-agro-dark text-lg">Програму ще не створено</p>
        <p class="text-agro-light mt-1 mb-6">Створіть технологічну карту для цієї культури</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button @click="createAndGenerate" :disabled="saving || generating" class="btn-primary inline-flex items-center gap-1.5">
            <svg v-if="!generating" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/>
              <path d="M19 17l.9 2.1L22 20l-2.1.9L19 23l-.9-2.1L16 20l2.1-.9L19 17z"/>
            </svg>
            <svg v-else class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            {{ generating ? 'Генерую...' : 'AI генерація карти' }}
          </button>
          <button @click="createProgram" :disabled="saving || generating" class="dash-btn-outline inline-block">
            {{ saving ? '...' : 'Створити порожню' }}
          </button>
        </div>
      </div>

      <template v-else>
        <!-- Розумний підбір (маркетплейс) -->
        <div v-if="MARKETPLACE && treatments.length > 0" class="mb-4">
          <button @click="openSmartBuy" class="w-full flex items-center justify-center gap-2 bg-white border-2 border-agro text-agro font-bold py-3 rounded-xl hover:bg-agro-hover transition-colors text-sm">
            🛒 Розумний підбір препаратів
          </button>
        </div>

        <!-- Блоки активних фаз -->
        <div class="space-y-4 mb-4">
          <div v-for="phase in activePhases" :key="phase.key" class="card p-0 overflow-visible">
            <!-- Заголовок фази -->
            <div class="flex items-center gap-2 px-5 py-3 bg-agro-hover border-b border-agro-border">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="text-agro shrink-0" v-html="phaseIcon(phase.key)" />
              <span class="font-bold text-agro-dark">{{ phase.key }}</span>
              <span class="ml-auto text-xs text-agro-light mr-2">{{ treatmentsByPhase[phase.key]?.length || 0 }} обробок</span>
              <button @click="removePhase(phase)" class="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-agro-light hover:text-red-400">
                <X :size="13" />
              </button>
            </div>

            <!-- Список обробок -->
            <div class="divide-y divide-agro-border">
              <div v-if="!treatmentsByPhase[phase.key]?.length" class="px-5 py-5 text-center text-sm text-agro-light">
                Обробок ще немає — додайте першу нижче
              </div>
              <div v-for="t in treatmentsByPhase[phase.key] || []" :key="t.id" class="flex items-start gap-3 px-5 py-3.5">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" :class="TYPE_BG[t.type] || 'bg-agro-bg'">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="TYPE_SVG[t.type] || TYPE_SVG['захист']" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-medium px-2 py-0.5 rounded-full border" :class="TYPE_BADGE[t.type] || 'bg-agro-bg border-agro-border text-agro-light'">{{ t.type }}</span>
                    <button @click="cycleStatus(t)"
                      :class="['text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors', t.status === 'done' ? 'bg-green-50 border-green-200 text-green-700' : t.status === 'missed' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-500']">
                      {{ t.status === 'done' ? '✓ Виконано' : t.status === 'missed' ? '✕ Пропущено' : '· Заплановано' }}
                    </button>
                  </div>
                  <p class="font-semibold text-agro-dark mt-1 text-sm" :class="{ 'line-through opacity-50': t.status === 'missed' }">{{ t.product_name }}</p>
                  <p v-if="t.dosage" class="text-xs text-agro-light mt-0.5 flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20M2 12l4-4M2 12l4 4M22 12l-4-4M22 12l-4 4"/></svg>
                    {{ t.dosage }}
                  </p>
                  <p v-if="t.notes" class="text-xs text-agro-light mt-0.5 italic">{{ t.notes }}</p>
                </div>
                <div class="relative shrink-0 reminder-info-wrap">
                  <button @click="toggleReminderInfo(t)" class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors shrink-0"
                    :class="futureRemindersCount(t.id) ? 'bg-agro/10 text-agro hover:bg-agro/20' : 'hover:bg-agro-hover text-agro-light hover:text-agro'"
                    title="Нагадування">
                    <Bell :size="14" />
                    <span v-if="futureRemindersCount(t.id)"
                      class="absolute -top-1 -right-1 w-4 h-4 bg-agro text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                      {{ futureRemindersCount(t.id) }}
                    </span>
                  </button>
                  <!-- Тултіп з нагадуваннями -->
                  <div v-if="activeReminderInfo === t.id"
                    class="absolute right-0 top-9 z-30 w-64 bg-white rounded-2xl shadow-xl border border-agro-border p-3">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-xs font-bold text-agro-dark">Нагадування</p>
                      <button @click="openReminderFor(t); activeReminderInfo = null"
                        class="text-xs text-agro font-medium hover:underline">+ Додати</button>
                    </div>
                    <div v-if="!treatmentReminders[t.id]?.length" class="text-xs text-agro-light py-2 text-center">
                      Немає нагадувань
                    </div>
                    <div v-else class="space-y-1.5">
                      <div v-for="r in treatmentReminders[t.id]" :key="r.id"
                        class="flex items-center gap-2 text-xs py-1 px-2 rounded-lg"
                        :class="new Date(r.scheduled_date) < new Date() ? 'bg-gray-50 text-gray-400' : 'bg-agro-hover text-agro-dark'">
                        <span>📅</span>
                        <span class="flex-1">{{ formatReminderDate(r.scheduled_date) }}</span>
                        <span v-if="new Date(r.scheduled_date) < new Date()" class="text-gray-300 text-[10px]">минуло</span>
                        <button @click.stop="deleteReminder(r.id, t.id)" class="ml-auto text-gray-400 hover:text-red-500 transition-colors leading-none">×</button>
                      </div>
                    </div>
                  </div>
                </div>
                <button @click="deleteTreatment(t)" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-red-400 shrink-0">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>

            <!-- Форма додавання в цю фазу (collapsed) -->
            <div class="border-t border-agro-border">
              <button
                @click="openFormPhase = openFormPhase === phase.key ? null : phase.key"
                class="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-agro-light hover:text-agro hover:bg-agro-hover transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                Додати обробку
              </button>
              <div v-if="openFormPhase === phase.key" class="px-5 pb-4 space-y-3 bg-[#FAFDF7]">
                <div class="grid grid-cols-5 gap-1.5 pt-3">
                  <button v-for="tt in TREATMENT_TYPES" :key="tt.value" type="button"
                    @click="inlineT[phase.key].type = tt.value"
                    :class="['flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-colors text-xs font-medium',
                      inlineT[phase.key]?.type === tt.value ? 'border-agro bg-agro-hover text-agro' : 'border-[#E0EDCC] text-gray-500 hover:border-agro/50']">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="tt.icon" />
                    <span style="font-size:10px">{{ tt.label }}</span>
                  </button>
                </div>
                <div class="relative">
                  <input
                    v-model="inlineT[phase.key].product_name"
                    @input="searchProducts(phase.key)"
                    @focus="showSuggestionsFor = phase.key"
                    @blur="hideSuggestions"
                    class="input text-sm py-2"
                    placeholder="Назва препарату або добрива..."
                    autocomplete="off"
                  />
                  <div v-if="showSuggestionsFor === phase.key && productSuggestions.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-30 max-h-44 overflow-y-auto">
                    <button v-for="p in productSuggestions" :key="p.id" type="button"
                      @mousedown.prevent="selectProduct(phase.key, p)"
                      class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0">
                      <p class="font-medium text-agro-dark">{{ p.product_name }}</p>
                    </button>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <input v-model="inlineT[phase.key].dosage" class="input text-sm py-2" placeholder="Доза" />
                  <input v-model="inlineT[phase.key].notes" class="input text-sm py-2" placeholder="Коментар" />
                </div>
                <button
                  @click="saveTreatment(phase)"
                  :disabled="!inlineT[phase.key].product_name || savingPhase === phase.key"
                  class="btn-primary w-full py-2.5 text-sm inline-flex items-center justify-center gap-1.5">
                  <svg v-if="savingPhase !== phase.key" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  {{ savingPhase === phase.key ? '...' : 'Додати обробку' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Кнопка / панель вибору фази -->
        <div class="relative" ref="phasePickerRef">
          <button
            @click="showPhasePicker = !showPhasePicker"
            class="btn-outline w-full text-sm py-3"
          >
            ➕ Додати фазу
          </button>

          <div v-if="showPhasePicker" class="card mt-2 p-0 overflow-hidden">
            <!-- Своя фаза — зверху, виділена -->
            <div class="px-4 py-3 bg-agro/5 border-b-2 border-agro/20">
              <p class="text-xs font-semibold text-agro mb-2 uppercase tracking-wide">Своя фаза</p>
              <div class="flex gap-2">
                <input v-model="newPhaseName" @keyup.enter="addCustomPhase" class="input flex-1 text-sm py-1.5" placeholder="Наприклад: Цвітіння, Збір врожаю..." />
                <button @click="addCustomPhase" :disabled="!newPhaseName.trim()"
                  class="btn-primary px-3 py-1.5 text-sm disabled:opacity-40 shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                </button>
              </div>
            </div>

            <!-- Стандартні фази -->
            <div v-if="availablePhases.length" class="divide-y divide-agro-border">
              <p class="px-4 pt-3 pb-1 text-xs font-semibold text-agro-light uppercase tracking-wide">Стандартні фази</p>
              <button
                v-for="phase in availablePhases"
                :key="phase.key"
                @click="addActivePhase(phase)"
                class="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-agro-hover transition-colors text-left"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="text-agro shrink-0" v-html="phaseIcon(phase.key)" />
                <span class="font-medium text-agro-dark">{{ phase.key }}</span>
              </button>
            </div>
            <p v-else class="px-4 py-3 text-sm text-agro-light">Всі стандартні фази вже додано</p>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- Модал нагадування -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="reminderTreatment" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="reminderTreatment = null" />
        <div class="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md z-10 max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl px-6 pt-6 pb-4 border-b border-agro-border">
            <div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
            <h2 class="font-bold text-agro-dark text-lg">Нагадування</h2>
            <p class="text-sm text-agro-light mt-0.5 truncate">{{ reminderTreatment.product_name }}</p>
          </div>
          <div class="px-6 py-5 space-y-5">
            <div>
              <label class="block text-sm font-semibold text-agro-dark mb-3">Дата</label>
              <div class="bg-agro-bg rounded-2xl p-4">
                <div class="flex items-center justify-between mb-4">
                  <button @click="rPrevMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-agro-dark font-bold">‹</button>
                  <span class="font-semibold text-agro-dark text-sm">{{ rMonthLabel }}</span>
                  <button @click="rNextMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-agro-dark font-bold">›</button>
                </div>
                <div class="grid grid-cols-7 mb-1">
                  <div v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']" :key="d" class="text-center text-xs font-medium text-agro-light py-1">{{ d }}</div>
                </div>
                <div class="grid grid-cols-7 gap-0.5">
                  <div v-for="blank in rFirstDayOffset" :key="'b'+blank" />
                  <button v-for="day in rDaysInMonth" :key="day"
                    @click="!rIsPastDay(day) && rSelectDay(day)" :disabled="rIsPastDay(day)"
                    class="aspect-square flex items-center justify-center text-sm rounded-xl transition-colors font-medium"
                    :class="[rIsPastDay(day) ? 'text-gray-300 cursor-not-allowed' : '', rIsSelectedDay(day) ? 'bg-agro text-white' : (!rIsPastDay(day) ? 'hover:bg-white text-agro-dark' : ''), rIsToday(day) && !rIsSelectedDay(day) ? 'text-agro font-bold' : '']">
                    {{ day }}
                  </button>
                </div>
              </div>
              <p v-if="rDate" class="text-xs text-agro mt-2 font-medium text-center">📅 {{ rFormatDate }}</p>
            </div>
            <div>
              <label class="block text-sm font-semibold text-agro-dark mb-3">Час</label>
              <div class="flex items-center gap-3 bg-agro-bg rounded-2xl px-5 py-4">
                <div class="flex-1">
                  <p class="text-xs text-agro-light text-center mb-2">Години</p>
                  <select v-model="rHour" class="w-full bg-white border border-agro-border rounded-xl px-3 py-2.5 text-center text-agro-dark font-semibold text-lg appearance-none focus:outline-none focus:border-agro cursor-pointer">
                    <option v-for="h in 24" :key="h-1" :value="h-1">{{ String(h-1).padStart(2,'0') }}</option>
                  </select>
                </div>
                <span class="text-2xl font-bold text-agro-dark mt-5">:</span>
                <div class="flex-1">
                  <p class="text-xs text-agro-light text-center mb-2">Хвилини</p>
                  <select v-model="rMinute" class="w-full bg-white border border-agro-border rounded-xl px-3 py-2.5 text-center text-agro-dark font-semibold text-lg appearance-none focus:outline-none focus:border-agro cursor-pointer">
                    <option v-for="m in [0,5,10,15,20,25,30,35,40,45,50,55]" :key="m" :value="m">{{ String(m).padStart(2,'0') }}</option>
                  </select>
                </div>
              </div>
              <p class="text-center text-agro font-bold text-base mt-2">🕐 {{ String(rHour).padStart(2,'0') }}:{{ String(rMinute).padStart(2,'0') }}</p>
            </div>
          </div>
          <div class="sticky bottom-0 bg-white border-t border-agro-border px-6 py-4 flex gap-3">
            <button @click="reminderTreatment = null" class="btn-outline flex-1">Скасувати</button>
            <button @click="saveReminder" :disabled="!rDate || rSaving" class="btn-primary flex-1 inline-flex items-center justify-center gap-1.5">
              <svg v-if="!rSaving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {{ rSaving ? '...' : 'Додати' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Модал розумного підбору -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showSmartModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4" @click.self="showSmartModal = false">
        <div class="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col">
          <div class="flex items-center justify-between px-5 py-4 border-b border-agro-border shrink-0">
            <h2 class="font-bold text-agro-dark text-base">🛒 Розумний підбір</h2>
            <button @click="showSmartModal = false" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-agro-bg text-agro-light text-lg">×</button>
          </div>

          <div class="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            <!-- Завантаження -->
            <div v-if="smartBuyLoading" class="py-10 text-center">
              <div class="animate-spin text-3xl mb-3">⏳</div>
              <p class="text-agro-light text-sm">Шукаємо найкращі пропозиції...</p>
            </div>

            <template v-else-if="smartBuyResult">
              <!-- Не знайдено -->
              <div v-if="smartBuyResult.notFound.length" class="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p class="font-semibold text-amber-700 text-sm mb-1">⚠️ Не знайдено в каталозі продавців:</p>
                <p v-for="name in smartBuyResult.notFound" :key="name" class="text-sm text-amber-600">• {{ name }}</p>
              </div>

              <!-- Нічого не знайдено взагалі -->
              <div v-if="!smartBuyResult.cheapestItems.length" class="text-center py-6">
                <p class="text-4xl mb-2">🔍</p>
                <p class="text-agro-dark font-semibold">Пропозицій не знайдено</p>
                <p class="text-agro-light text-sm mt-1">Продавці не мають цих препаратів в наявності</p>
              </div>

              <!-- Найдешевший варіант -->
              <div v-if="smartBuyResult.cheapestItems.length" class="card p-4">
                <div class="flex items-center justify-between mb-2">
                  <p class="font-bold text-agro-dark text-sm">💰 Найдешевший варіант</p>
                  <span class="font-bold text-agro">{{ smartBuyResult.cheapestTotal }} грн</span>
                </div>
                <p class="text-xs text-agro-light mb-3">
                  Від {{ new Set(smartBuyResult.cheapestItems.map((i: any) => i.offer.seller_profiles?.company_name)).size }} продавців
                </p>
                <div class="space-y-2 mb-3">
                  <div v-for="item in smartBuyResult.cheapestItems" :key="item.treatment_name" class="flex items-center justify-between text-sm py-1.5 border-t border-agro-border first:border-0">
                    <div>
                      <p class="font-medium text-agro-dark">{{ item.treatment_name }}</p>
                      <p class="text-xs text-agro-light">{{ item.offer.seller_profiles?.company_name }}</p>
                    </div>
                    <span class="font-semibold text-agro shrink-0 ml-2">{{ item.offer.price }} грн</span>
                  </div>
                </div>
                <button @click="addToCart(smartBuyResult.cheapestItems)" :disabled="cartSaving" class="btn-primary w-full py-2.5 text-sm">
                  {{ cartSaving ? '...' : '🛒 Додати до кошика' }}
                </button>
              </div>

              <!-- Один продавець -->
              <template v-if="smartBuyResult.fullSellers.length">
                <p class="text-sm font-bold text-agro-dark">🏪 Один продавець ({{ smartBuyResult.fullSellers.length }})</p>
                <div v-for="(seller, i) in smartBuyResult.fullSellers" :key="seller.seller.id" class="card p-4" :class="i === 0 ? 'border-agro border-2' : ''">
                  <div v-if="i === 0" class="text-xs font-bold text-agro mb-1">✓ Найдешевший від одного продавця</div>
                  <div class="flex items-center justify-between mb-1">
                    <p class="font-bold text-agro-dark text-sm">{{ seller.seller.company_name }}</p>
                    <span class="font-bold text-agro">{{ seller.total }} грн</span>
                  </div>
                  <p v-if="seller.seller.region" class="text-xs text-agro-light mb-3">📍 {{ seller.seller.region }}</p>
                  <div class="space-y-1 mb-3">
                    <div v-for="item in seller.items" :key="item.treatment_name" class="flex items-center justify-between text-sm py-1 border-t border-agro-border first:border-0">
                      <p class="text-agro-dark">{{ item.treatment_name }}</p>
                      <span class="font-semibold text-agro ml-2">{{ item.offer.price }} грн</span>
                    </div>
                  </div>
                  <button @click="addToCart(seller.items)" :disabled="cartSaving" class="btn-primary w-full py-2.5 text-sm">
                    {{ cartSaving ? '...' : '🛒 Додати до кошика' }}
                  </button>
                </div>
              </template>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Trash2, X, Bell } from 'lucide-vue-next'
import { TREATMENT_TYPES, TYPE_SVG, TYPE_BG, TYPE_BADGE } from '~/utils/treatmentTypes'
import { phaseIcon } from '~/utils/phaseIcons'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const MARKETPLACE = false

const route = useRoute()
const farmCropId = route.query.farmCropId as string
const cropType = route.query.cropType as string
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const CROP_GROUPS: Record<string, string> = {
  // grain – зернові
  'пшениця': 'grain', 'ячмінь': 'grain', 'жито': 'grain', 'овес': 'grain',
  'тритикале': 'grain', 'просо': 'grain', 'сорго': 'grain', 'гречка': 'grain',
  // corn – кукурудза
  'кукурудза': 'corn',
  // oilseed – олійні
  'соняшник': 'oilseed', 'ріпак': 'oilseed',
  // legume – бобові
  'соя': 'legume', 'горох': 'legume', 'квасоля': 'legume', 'боби': 'legume',
  'нут': 'legume', 'сочевиця': 'legume', 'люпин': 'legume',
  // technical – технічні
  'льон': 'technical', 'цукровий буряк': 'technical', 'коноплі': 'technical',
  'хміль': 'technical', 'тютюн': 'technical', 'лаванда': 'technical',
  "м'ята": 'technical', 'меліса': 'technical',
  // veg_nightshade – пасльонові
  'томат': 'veg_nightshade', 'помідор': 'veg_nightshade', 'перець': 'veg_nightshade',
  'баклажан': 'veg_nightshade', 'картопля': 'veg_nightshade',
  // veg_cucurbit – гарбузові
  'огірок': 'veg_cucurbit', 'кабачок': 'veg_cucurbit', 'гарбуз': 'veg_cucurbit',
  'кавун': 'veg_cucurbit', 'диня': 'veg_cucurbit', 'патисон': 'veg_cucurbit',
  // veg_brassica – капустяні
  'капуста': 'veg_brassica', 'броколі': 'veg_brassica', 'кольрабі': 'veg_brassica',
  // veg_allium – цибулеві
  'цибуля': 'veg_allium', 'часник': 'veg_allium', 'порей': 'veg_allium',
  // veg_root – коренеплоди
  'морква': 'veg_root', 'пастернак': 'veg_root', 'редиска': 'veg_root',
  'редька': 'veg_root', 'ріпа': 'veg_root', 'буряк': 'veg_root',
  // veg_leaf – листові/зелень
  'салат': 'veg_leaf', 'шпинат': 'veg_leaf', 'кріп': 'veg_leaf',
  'петрушка': 'veg_leaf', 'базилік': 'veg_leaf', 'селера': 'veg_leaf',
  'спаржа': 'veg_leaf', 'артишок': 'veg_leaf',
  // berry_shrub – ягідні кущові
  'смородина': 'berry_shrub', 'аґрус': 'berry_shrub', 'агрус': 'berry_shrub',
  'малина': 'berry_shrub', 'ожина': 'berry_shrub', 'виноград': 'berry_shrub',
  'калина': 'berry_shrub', 'горобина': 'berry_shrub', 'шипшина': 'berry_shrub',
  'обліпиха': 'berry_shrub', 'журавлина': 'berry_shrub',
  // berry_herb – ягідні трав'янисті
  'полуниця': 'berry_herb', 'суниця': 'berry_herb',
  'чорниця': 'berry_herb', 'лохина': 'berry_herb',
  // fruit_pome – зерняткові
  'яблуня': 'fruit_pome', 'яблука': 'fruit_pome', 'груша': 'fruit_pome', 'айва': 'fruit_pome',
  // fruit_stone – кісточкові
  'вишня': 'fruit_stone', 'черешня': 'fruit_stone', 'слива': 'fruit_stone',
  'персик': 'fruit_stone', 'нектарин': 'fruit_stone', 'абрикос': 'fruit_stone',
  'алича': 'fruit_stone', 'кизил': 'fruit_stone', 'хурма': 'fruit_stone', 'інжир': 'fruit_stone',
  // nut – горіхові
  'горіх': 'nut', 'ліщина': 'nut', 'каштан': 'nut', 'фундук': 'nut', 'мигдаль': 'nut',
}

const getCropGroup = (crop: string): string | null => {
  if (!crop) return null
  const lower = crop.toLowerCase().trim()
  // Точний збіг спочатку (для "цукровий буряк" vs "буряк")
  for (const [key, group] of Object.entries(CROP_GROUPS)) {
    if (lower === key) return group
  }
  // Потім пошук підрядка
  for (const [key, group] of Object.entries(CROP_GROUPS)) {
    if (lower.includes(key)) return group
  }
  return null
}

const loading = ref(true)
const saving = ref(false)
const savingPhase = ref<string | null>(null)
const program = ref<any>(null)
const treatments = ref<any[]>([])
const growthPhases = useGrowthPhases()
const allPhases = growthPhases.allPhases
const phases = ref<any[]>([])
const activePhasesKeys = ref<string[]>([])

const showPhasePicker = ref(false)
const showAddPhaseInline = ref(false)
const newPhaseName = ref('')
const newPhaseEmoji = ref('🌱')
const productSuggestions = ref<any[]>([])
const showSuggestionsFor = ref<string | null>(null)
const inlineT = ref<Record<string, { product_name: string; type: string; dosage: string; notes: string }>>({})
const openFormPhase = ref<string | null>(null)
let searchTimer: any = null

const treatmentsByPhase = computed(() => {
  const map: Record<string, any[]> = {}
  for (const t of treatments.value) {
    const key = t.phase || '__none__'
    if (!map[key]) map[key] = []
    map[key].push(t)
  }
  return map
})

const activePhases = computed(() =>
  activePhasesKeys.value
    .map(key => allPhases.value.find(p => p.key === key) || phases.value.find(p => p.key === key) || { key })
)

const availablePhases = computed(() =>
  phases.value.filter(p => !activePhasesKeys.value.includes(p.key))
)

const ensureInlineT = (key: string) => {
  if (!inlineT.value[key]) {
    inlineT.value[key] = { product_name: '', type: 'підживлення', dosage: '', notes: '' }
  }
}

const removePhase = async (phase: any) => {
  const count = treatmentsByPhase.value[phase.key]?.length || 0
  if (count > 0 && !await confirmDialog(`Фаза "${phase.key}" та ${count} обробок у ній будуть видалені.`, { title: 'Видалити фазу?' })) return
  if (count > 0 && program.value) {
    const ids = treatmentsByPhase.value[phase.key].map((t: any) => t.id)
    await supabase.from('reminders').delete().in('treatment_id', ids)
    await supabase.from('program_treatments').delete().in('id', ids)
    treatments.value = treatments.value.filter(t => t.phase !== phase.key)
    ids.forEach((id: string) => delete treatmentReminders.value[id])
  }
  activePhasesKeys.value = activePhasesKeys.value.filter(k => k !== phase.key)
  await saveActivePhasesToDb()
}

const saveActivePhasesToDb = async () => {
  if (!program.value?.id) return
  await supabase.from('protection_programs').update({ active_phases: activePhasesKeys.value }).eq('id', program.value.id)
}

const STATUS_CYCLE: Record<string, string> = { planned: 'done', done: 'missed', missed: 'planned' }

const generating = ref(false)

const generateCard = async () => {
  if (!program.value || !cropType) return
  const hasExisting = treatments.value.length > 0
  if (hasExisting) {
    const ok = await confirmDialog('Поточна карта буде замінена новою згенерованою. Продовжити?', { title: 'AI генерація карти' })
    if (!ok) return
  }
  generating.value = true
  try {
    const result = await $fetch('/api/ai-generate-card', {
      method: 'POST',
      body: { cropType },
    }) as { phases: { name: string; treatments: { type: string; product_name: string; dosage: string; notes: string }[] }[] }

    if (!result?.phases?.length) throw new Error('Порожня відповідь')

    // Видаляємо старі обробки і фази
    if (treatments.value.length) {
      const ids = treatments.value.map((t: any) => t.id)
      await supabase.from('reminders').delete().in('treatment_id', ids)
      await supabase.from('program_treatments').delete().in('id', ids)
    }

    // Додаємо нові фази і обробки
    const newPhaseKeys: string[] = []
    for (const phase of result.phases) {
      newPhaseKeys.push(phase.name)
      for (const t of phase.treatments) {
        await supabase.from('program_treatments').insert({
          program_id: program.value.id,
          phase: phase.name,
          type: t.type,
          product_name: t.product_name,
          dosage: t.dosage || null,
          notes: t.notes || null,
          status: 'planned',
        })
      }
    }

    // Оновлюємо активні фази
    activePhasesKeys.value = newPhaseKeys
    await saveActivePhasesToDb()
    await load()

    // Рахуємо як 1 текстовий запит
    if (user.value?.id) {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const { data: usage } = await supabase.from('ai_usage').select('text_count').eq('user_id', user.value.id).eq('month', currentMonth).maybeSingle()
      await supabase.from('ai_usage').upsert({
        user_id: user.value.id,
        month: currentMonth,
        text_count: (usage?.text_count || 0) + 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,month' })
    }
  } catch (e: any) {
    alert('Помилка генерації: ' + (e?.message || 'невідома'))
  } finally {
    generating.value = false
  }
}

const openAiAnalysis = () => {
  // Збираємо всі фази і обробки в текстовий опис
  const lines: string[] = [`Технічна карта для культури: ${cropType}`]
  for (const phase of activePhases.value) {
    const ts = treatmentsByPhase.value[phase.key] || []
    if (!ts.length) continue
    lines.push(`\nФаза: ${phase.key}`)
    for (const t of ts) {
      const status = t.status === 'done' ? '✓' : t.status === 'missed' ? '✕' : '·'
      lines.push(`  ${status} [${t.type}] ${t.product_name}${t.dosage ? ' — ' + t.dosage : ''}${t.notes ? ' (' + t.notes + ')' : ''}`)
    }
  }
  const cardText = lines.join('\n')

  // Зберігаємо в sessionStorage — URL занадто короткий для всіх даних
  sessionStorage.setItem('ai_analyze_card', JSON.stringify({
    cropType,
    cardText,
    auto: true,
  }))

  const params = new URLSearchParams({
    cropType: cropType || '',
    ...(farmCropId ? { cropId: farmCropId } : {}),
    analyzeCard: '1',
  })
  navigateTo(`/dashboard/ai-chat?${params.toString()}`)
}

const exportPdf = () => {
  const statusLabel = (s: string) => s === 'done' ? '✓ Виконано' : s === 'missed' ? '✕ Пропущено' : '· Заплановано'
  const rows = activePhases.value.map(phase => {
    const pts = treatmentsByPhase.value[phase.key] || []
    const tRows = pts.map((t: any) => `
      <tr>
        <td style="padding:6px 10px;font-size:13px;">${t.product_name}</td>
        <td style="padding:6px 10px;font-size:12px;color:#555;">${t.type}</td>
        <td style="padding:6px 10px;font-size:12px;color:#555;">${t.dosage || '—'}</td>
        <td style="padding:6px 10px;font-size:12px;">${statusLabel(t.status || 'planned')}</td>
        <td style="padding:6px 10px;font-size:12px;color:#555;">${t.notes || ''}</td>
      </tr>`).join('')
    return `
      <tr style="background:#f0f5e8;">
        <td colspan="5" style="padding:8px 10px;font-weight:700;font-size:13px;color:#2F5233;">${phase.key}</td>
      </tr>${tRows}`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Технічна карта — ${cropType}</title>
  <style>body{font-family:Arial,sans-serif;padding:30px;color:#1a3a06}h1{font-size:20px;margin-bottom:4px}p{color:#666;font-size:13px;margin:0 0 20px}table{width:100%;border-collapse:collapse}th{background:#2F5233;color:#fff;padding:8px 10px;text-align:left;font-size:12px}tr:nth-child(even){background:#f9fdf4}td{border-bottom:1px solid #e0edcc}@media print{body{padding:15px}}</style>
  </head><body>
  <h1>Технічна карта</h1><p>${cropType || ''} · АгроПростір · ${new Date().toLocaleDateString('uk-UA')}</p>
  <table><thead><tr><th>Препарат</th><th>Тип</th><th>Доза</th><th>Статус</th><th>Примітки</th></tr></thead>
  <tbody>${rows}</tbody></table>
  </body></html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print(); w.close() }, 400)
}

const cycleStatus = async (t: any) => {
  const next = STATUS_CYCLE[t.status || 'planned'] || 'done'
  t.status = next
  await supabase.from('program_treatments').update({ status: next }).eq('id', t.id)
}

const addActivePhase = async (phase: any) => {
  if (!activePhasesKeys.value.includes(phase.key)) {
    activePhasesKeys.value.push(phase.key)
    ensureInlineT(phase.key)
    await saveActivePhasesToDb()
  }
  showPhasePicker.value = false
  showAddPhaseInline.value = false
}

const searchProducts = (phaseKey: string) => {
  clearTimeout(searchTimer)
  const q = inlineT.value[phaseKey]?.product_name.trim()
  if (!q || q.length < 2) { productSuggestions.value = []; return }
  searchTimer = setTimeout(async () => {
    const BIO_TYPES = ['bio_product', 'biostimulator', 'biofungicide', 'biological_fungicide', 'bioinsecticide', 'bioherbicide']
    const [offersRes, bioRes] = await Promise.all([
      supabase.from('seller_offers').select('id, product_name, price, seller_profiles(company_name)').ilike('product_name', `%${q}%`).eq('in_stock', true).limit(4),
      supabase.from('agro_products').select('id, name').ilike('name', `%${q}%`).in('type', BIO_TYPES).limit(4),
    ])
    const offers = offersRes.data || []
    const usedNames = new Set(offers.map((o: any) => o.product_name.toLowerCase()))
    const addUniq = (items: any[], getName: (i: any) => string) =>
      items.filter(i => !usedNames.has(getName(i).toLowerCase())).map(i => { usedNames.add(getName(i).toLowerCase()); return { id: i.id, product_name: getName(i), price: null, seller_profiles: null } })
    productSuggestions.value = [
      ...offers,
      ...addUniq(bioRes.data || [], b => b.name),
    ].slice(0, 8)
  }, 300)
}

const selectProduct = (phaseKey: string, p: any) => {
  inlineT.value[phaseKey].product_name = p.product_name
  productSuggestions.value = []
  showSuggestionsFor.value = null
}

const hideSuggestions = () => {
  setTimeout(() => { showSuggestionsFor.value = null }, 200)
}

const load = async () => {
  loading.value = true
  await growthPhases.load()
  const cropGroup = getCropGroup(cropType)
  phases.value = allPhases.value.filter((p: any) => !p.crop_groups || !cropGroup || p.crop_groups?.includes(cropGroup))

  if (farmCropId) {
    const { data: programRows, error: progErr } = await supabase
      .from('protection_programs').select('*').eq('farm_crop_id', farmCropId).limit(1)
    const programData = programRows?.[0] ?? null
    program.value = programData
    if (programData) {
      const { data: treatmentsData } = await supabase
        .from('program_treatments').select('*').eq('program_id', programData.id).order('phase_order', { ascending: true })
      treatments.value = treatmentsData || []
      await loadTreatmentReminders(treatmentsData || [])
      const usedPhaseKeys = [...new Set(treatmentsData?.map((t: any) => t.phase).filter(Boolean) || [])]
      const savedPhaseKeys: string[] = programData.active_phases || []
      const allKeys = [...new Set([...savedPhaseKeys, ...usedPhaseKeys])]
      activePhasesKeys.value = allKeys
      allKeys.forEach(ensureInlineT)
    }
  }
  loading.value = false
}

let realtimeChannel: any = null
let remindersChannel: any = null

const onVisibilityChange = () => {
  if (!document.hidden && treatments.value.length) loadTreatmentReminders(treatments.value)
}

onMounted(() => {
  load()
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.reminder-info-wrap')) activeReminderInfo.value = null
  })
  document.addEventListener('visibilitychange', onVisibilityChange)
})


watch(program, (prog) => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
  if (remindersChannel) supabase.removeChannel(remindersChannel)
  if (!prog?.id) return
  realtimeChannel = supabase
    .channel(`program_treatments_${prog.id}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'program_treatments',
      filter: `program_id=eq.${prog.id}`,
    }, () => { load() })
    .subscribe()
  remindersChannel = supabase
    .channel(`reminders_program_${prog.id}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'reminders',
    }, () => { if (treatments.value.length) loadTreatmentReminders(treatments.value) })
    .subscribe()
})

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
  if (remindersChannel) supabase.removeChannel(remindersChannel)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

const saveTreatment = async (phase: any) => {
  const t = inlineT.value[phase.key]
  if (!t?.product_name || !program.value) return
  savingPhase.value = phase.key
  const payload = {
    program_id: program.value.id,
    phase: phase.key,
    phase_order: phase.order ?? 99,
    type: t.type,
    product_name: t.product_name,
    dosage: t.dosage || null,
    notes: t.notes || null,
  }
  const { data: inserted, error } = await supabase.from('program_treatments').insert(payload).select().single()
  if (inserted) {
    treatments.value = [...treatments.value, inserted]
  } else {
    const { data } = await supabase.from('program_treatments').select('*').eq('program_id', program.value.id).order('phase_order', { ascending: true })
    treatments.value = data || []
  }
  t.product_name = ''
  t.dosage = ''
  t.notes = ''
  savingPhase.value = null
  openFormPhase.value = null
}

const addCustomPhase = async () => {
  if (!newPhaseName.value.trim()) return
  const { data: { session } } = await supabase.auth.getSession()
  const newOrderNum = phases.value.length + 1
  const { data: inserted } = await supabase.from('growth_phases').insert({
    key: newPhaseName.value.trim(),
    emoji: newPhaseEmoji.value || '🌱',
    order_num: newOrderNum,
    is_default: false,
    created_by: session?.user?.id,
  }).select().single()
  const newPhase = inserted || { key: newPhaseName.value.trim(), emoji: newPhaseEmoji.value || '🌱', order: newOrderNum }
  phases.value = [...phases.value, newPhase]
  newPhaseName.value = ''
  newPhaseEmoji.value = '🌱'
  showAddPhaseInline.value = false
  addActivePhase(newPhase)
}

const createProgram = async () => {
  saving.value = true
  const { data } = await supabase.from('protection_programs').upsert({
    farm_crop_id: farmCropId,
    name: `Програма для ${cropType}`,
    description: `Календар живлення та захисту для ${cropType}`,
  }, { onConflict: 'farm_crop_id' }).select().single()
  program.value = data
  saving.value = false
}

const createAndGenerate = async () => {
  await createProgram()
  await generateCard()
}

const { confirm: confirmDialog } = useConfirm()

const deleteTreatment = async (t: any) => {
  if (!await confirmDialog(`"${t.product_name}" буде видалено з програми.`, { title: 'Видалити обробку?' })) return
  await supabase.from('reminders').delete().eq('treatment_id', t.id)
  await supabase.from('program_treatments').delete().eq('id', t.id)
  treatments.value = treatments.value.filter(tr => tr.id !== t.id)
  delete treatmentReminders.value[t.id]
}

// Розумний підбір
const showSmartModal = ref(false)
const smartBuyLoading = ref(false)
const smartBuyResult = ref<any>(null)
const cartSaving = ref(false)
const { success: showSuccess, error: showError } = useToast()

const openSmartBuy = async () => {
  showSmartModal.value = true
  smartBuyLoading.value = true
  smartBuyResult.value = null

  const productNames = [...new Set(treatments.value.map(t => t.product_name))]
  const { data: offers } = await supabase
    .from('seller_offers')
    .select('*, seller_profiles(id, company_name, region)')
    .in('product_name', productNames)
    .eq('in_stock', true)

  const foundProducts: any[] = []
  const notFound: string[] = []

  for (const name of productNames) {
    const productOffers = (offers || []).filter((o: any) => o.product_name === name)
    if (productOffers.length > 0) {
      foundProducts.push({ treatment_name: name, offers: productOffers })
    } else {
      notFound.push(name)
    }
  }

  // Найдешевший варіант (по одному від кожного)
  let cheapestTotal = 0
  const cheapestItems: any[] = []
  for (const fp of foundProducts) {
    const cheapest = fp.offers.reduce((min: any, o: any) => o.price < min.price ? o : min)
    cheapestItems.push({ treatment_name: fp.treatment_name, offer: cheapest })
    cheapestTotal += cheapest.price
  }

  // Продавці з усіма товарами
  const sellerMap: Record<string, any> = {}
  for (const fp of foundProducts) {
    for (const offer of fp.offers) {
      const sellerId = offer.seller_profiles?.id
      if (!sellerId) continue
      if (!sellerMap[sellerId]) sellerMap[sellerId] = { seller: offer.seller_profiles, items: [], total: 0, seen: new Set() }
      if (!sellerMap[sellerId].seen.has(fp.treatment_name)) {
        sellerMap[sellerId].seen.add(fp.treatment_name)
        sellerMap[sellerId].items.push({ treatment_name: fp.treatment_name, offer })
        sellerMap[sellerId].total += offer.price
      }
    }
  }

  const fullSellers = Object.values(sellerMap)
    .filter((s: any) => foundProducts.every(fp => s.seen.has(fp.treatment_name)))
    .sort((a: any, b: any) => a.total - b.total)

  smartBuyResult.value = { foundProducts, notFound, cheapestItems, cheapestTotal, fullSellers }
  smartBuyLoading.value = false
}

// Reminder info tooltip
const treatmentReminders = ref<Record<string, any[]>>({})
const activeReminderInfo = ref<string | null>(null)
const futureRemindersCount = (treatmentId: string) =>
  (treatmentReminders.value[treatmentId] || []).filter(r => new Date(r.scheduled_date) >= new Date()).length

const toggleReminderInfo = (t: any) => {
  const opening = activeReminderInfo.value !== t.id
  activeReminderInfo.value = opening ? t.id : null
  if (opening && treatments.value.length) loadTreatmentReminders(treatments.value)
}

const deleteReminder = async (reminderId: string, treatmentId: string) => {
  if (!await confirmDialog('Нагадування буде видалено.', { title: 'Видалити нагадування?' })) return
  await supabase.from('reminders').delete().eq('id', reminderId)
  if (treatmentReminders.value[treatmentId]) {
    treatmentReminders.value[treatmentId] = treatmentReminders.value[treatmentId].filter(r => r.id !== reminderId)
  }
}

const loadTreatmentReminders = async (ts: any[]) => {
  if (!ts.length) return
  const ids = ts.map((t: any) => t.id).filter(Boolean)
  if (!ids.length) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { data } = await supabase.from('reminders')
    .select('id, treatment_id, description, scheduled_date, from_agronomist')
    .in('treatment_id', ids)
    .order('scheduled_date', { ascending: true })
  const map: Record<string, any[]> = {}
  for (const r of data || []) {
    if (!map[r.treatment_id]) map[r.treatment_id] = []
    map[r.treatment_id].push(r)
  }
  treatmentReminders.value = map
}

const formatReminderDate = (d: string) => new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })

// Reminder from treatment
const reminderTreatment = ref<any>(null)
const rDate = ref('')
const rHour = ref(9)
const rMinute = ref(0)
const rSaving = ref(false)
const rCalMonth = ref(new Date().getMonth())
const rCalYear = ref(new Date().getFullYear())

const UK_MONTHS_R = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']
const UK_MONTHS_GEN_R = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']
const rMonthLabel = computed(() => `${UK_MONTHS_R[rCalMonth.value]} ${rCalYear.value}`)
const rFirstDayOffset = computed(() => { const d = new Date(rCalYear.value, rCalMonth.value, 1).getDay(); return d === 0 ? 6 : d - 1 })
const rDaysInMonth = computed(() => new Date(rCalYear.value, rCalMonth.value + 1, 0).getDate())
const rPrevMonth = () => { if (rCalMonth.value === 0) { rCalMonth.value = 11; rCalYear.value-- } else rCalMonth.value-- }
const rNextMonth = () => { if (rCalMonth.value === 11) { rCalMonth.value = 0; rCalYear.value++ } else rCalMonth.value++ }
const rSelectDay = (day: number) => { const m = String(rCalMonth.value + 1).padStart(2,'0'); const d = String(day).padStart(2,'0'); rDate.value = `${rCalYear.value}-${m}-${d}` }
const rIsSelectedDay = (day: number) => { if (!rDate.value) return false; const [y,m,d] = rDate.value.split('-').map(Number); return y === rCalYear.value && m === rCalMonth.value + 1 && d === day }
const rIsToday = (day: number) => { const t = new Date(); return t.getFullYear() === rCalYear.value && t.getMonth() === rCalMonth.value && t.getDate() === day }
const rIsPastDay = (day: number) => { const t = new Date(); t.setHours(0,0,0,0); return new Date(rCalYear.value, rCalMonth.value, day) < t }
const rFormatDate = computed(() => { if (!rDate.value) return ''; const [y,m,d] = rDate.value.split('-').map(Number); return `${d} ${UK_MONTHS_GEN_R[m-1]} ${y}` })

const openReminderFor = (t: any) => {
  reminderTreatment.value = t
  rDate.value = ''
  rHour.value = 9
  rMinute.value = 0
  const now = new Date()
  rCalMonth.value = now.getMonth()
  rCalYear.value = now.getFullYear()
}

const saveReminder = async () => {
  if (!rDate.value || !reminderTreatment.value) return
  rSaving.value = true
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { rSaving.value = false; return }
  const [y,m,d] = rDate.value.split('-').map(Number)
  const iso = new Date(y, m-1, d, Number(rHour.value), Number(rMinute.value), 0).toISOString()
  await supabase.from('reminders').insert({
    user_id: session.user.id,
    created_by: session.user.id,
    treatment_id: reminderTreatment.value.id,
    description: reminderTreatment.value.product_name,
    scheduled_date: iso,
    type: 'обробка',
    from_agronomist: true,
  })
  rSaving.value = false
  reminderTreatment.value = null
  await loadTreatmentReminders(treatments.value)
  showSuccess('Нагадування додано 🔔')
}

const addToCart = async (items: any[]) => {
  cartSaving.value = true
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { showError('Необхідна авторизація'); cartSaving.value = false; return }
  for (const item of items) {
    await supabase.from('cart_items').upsert({ user_id: session.user.id, offer_id: item.offer.id, quantity: 1 }, { onConflict: 'user_id,offer_id' })
  }
  cartSaving.value = false
  showSmartModal.value = false
  showSuccess(`${items.length} товарів додано до кошика 🛒`)
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
.dash-btn-outline { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1.5px solid rgb(47,82,51); color: rgb(47,82,51); font-size: 13px; font-weight: 700; background: transparent; cursor: pointer; transition: background 0.15s; }
.dash-btn-outline:hover { background: rgb(238,241,227); }
</style>
