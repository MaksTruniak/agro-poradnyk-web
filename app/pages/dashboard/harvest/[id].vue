<template>
  <div class="dash-page">
    <div class="dash-head">
      <NuxtLink to="/dashboard/harvest" class="dash-icon-box shrink-0 hover:bg-agro-hover transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </NuxtLink>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">{{ season?.crop }}<span v-if="season?.variety" class="font-normal text-agro-light ml-2 text-base">({{ season.variety }})</span></h1>
        <p class="dash-subtitle">
          {{ season?.price_per_kg }} грн/кг · {{ season?.status === 'active' ? 'Активний сезон' : 'Завершений' }}
          <button @click="openChangePrice" class="ml-2 text-xs text-agro underline hover:no-underline">змінити ціну</button>
        </p>
      </div>
      <button @click="openAddWorker" class="dash-btn-primary shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати працівника
      </button>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-3 gap-4"><div v-for="i in 3" :key="i" class="card animate-pulse h-20"></div></div>
      <div class="card animate-pulse h-40"></div>
    </div>

    <template v-else>
      <!-- Статистика -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="card text-center">
          <p class="dash-stat-num">{{ stats.totalKg.toFixed(1) }}</p>
          <p class="dash-stat-label">кг зібрано</p>
        </div>
        <div class="card text-center">
          <p class="dash-stat-num">{{ stats.totalEarned.toLocaleString('uk-UA') }}</p>
          <p class="dash-stat-label">грн нараховано</p>
        </div>
        <div class="card text-center">
          <p class="dash-stat-num">{{ stats.totalPaid.toLocaleString('uk-UA') }}</p>
          <p class="dash-stat-label">грн виплачено</p>
        </div>
        <div class="card text-center">
          <p class="dash-stat-num text-orange-500">{{ (stats.totalEarned - stats.totalPaid).toLocaleString('uk-UA') }}</p>
          <p class="dash-stat-label">грн залишок</p>
        </div>
      </div>

      <!-- Кнопка зважування -->
      <div v-if="workers.length" class="card mb-6 flex items-center justify-between gap-4">
        <div>
          <p class="font-bold text-agro-dark">Записати зважування</p>
          <p class="text-sm text-agro-light mt-0.5">Сканує QR або вибирає працівника вручну</p>
        </div>
        <button @click="openRecord" class="dash-btn-primary shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 14h3M14 17v3"/></svg>
          Зважити
        </button>
      </div>

      <!-- Список працівників -->
      <div v-if="!workers.length" class="card text-center py-12">
        <p class="font-bold text-agro-dark mb-2">Немає працівників</p>
        <p class="text-sm text-agro-light mb-4">Додайте першого працівника</p>
        <button @click="openAddWorker" class="dash-btn-primary">Додати працівника</button>
      </div>

      <div v-else class="space-y-4">
        <h2 class="font-bold text-agro-dark text-base">Працівники ({{ workers.length }})</h2>
        <div v-for="w in [...workers].sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0))" :key="w.id" class="card" :class="!w.is_active ? 'opacity-60' : ''">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
              :class="w.is_active ? 'bg-agro-hover text-agro' : 'bg-gray-100 text-gray-400'">
              {{ w.first_name[0] }}{{ w.last_name[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="font-bold text-agro-dark">{{ w.first_name }} {{ w.last_name }}</p>
                <span v-if="!w.is_active" class="text-xs bg-gray-100 border border-gray-200 text-gray-500 rounded-lg px-2 py-0.5">Не збирає</span>
                <span v-else class="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-2 py-0.5">
                  {{ w.custom_price_per_kg || season?.price_per_kg }} грн/кг
                  <button @click.stop="openChangeWorkerPrice(w)" class="ml-1 underline hover:no-underline">змінити</button>
                </span>
              </div>
              <p v-if="w.phone || w.email" class="text-sm text-agro-light mt-0.5">{{ [w.phone, w.email].filter(Boolean).join(' · ') }}</p>
            </div>
            <!-- Деактивувати / Реактивувати -->
            <button @click="toggleWorkerActive(w)" :title="w.is_active ? 'Завершити роботу' : 'Поновити роботу'"
              class="shrink-0 inline-flex items-center gap-1.5 text-xs border rounded-xl px-3 py-1.5 transition-colors font-medium"
              :class="w.is_active ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-agro-hover border-agro-border text-agro hover:bg-agro hover:text-white'">
              <svg v-if="w.is_active" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ w.is_active ? 'Завершити' : 'Поновити' }}
            </button>
            <!-- QR -->
            <button v-if="w.is_active" @click="showQR(w)" class="shrink-0 inline-flex items-center gap-1.5 text-xs bg-agro-hover border border-agro-border text-agro rounded-xl px-3 py-1.5 hover:bg-agro hover:text-white transition-colors font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 14h3M14 17v3"/></svg>
              QR
            </button>
          </div>

          <!-- Записи зважування -->
          <div class="mt-3 pt-3 border-t border-agro-border">
            <div v-if="workerRecords[w.id]?.length" class="space-y-1.5 mb-3">
              <div v-for="r in workerRecords[w.id]" :key="r.id"
                class="flex items-center gap-3 px-3 py-2 bg-agro-bg rounded-xl text-sm">
                <span class="text-agro-light text-xs w-28 shrink-0">{{ formatDateTime(r.recorded_at) }}</span>
                <span class="text-agro-dark font-medium">{{ r.weight_kg }} кг</span>
                <span class="text-agro-light text-xs">× {{ r.price_per_kg }} грн</span>
                <span class="ml-auto font-bold text-agro">{{ Number(r.amount).toLocaleString('uk-UA') }} грн</span>
              </div>
            </div>
            <div v-else class="text-xs text-agro-light py-2 mb-3">Записів ще немає</div>

            <!-- Підсумок -->
            <div class="flex items-center gap-4 flex-wrap pt-2 border-t border-agro-border">
              <div class="flex items-center gap-1.5">
                <span class="text-xs text-agro-light">Разом:</span>
                <span class="font-bold text-agro">{{ (workerStats[w.id]?.kg || 0).toFixed(1) }} кг</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs text-agro-light">Нараховано:</span>
                <span class="font-bold text-agro-dark">{{ (workerStats[w.id]?.earned || 0).toLocaleString('uk-UA') }} грн</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs text-agro-light">Виплачено:</span>
                <span class="font-bold text-green-600">{{ (workerStats[w.id]?.paid || 0).toLocaleString('uk-UA') }} грн</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs text-agro-light">Залишок:</span>
                <span class="font-bold" :class="(workerStats[w.id]?.debt || 0) > 0 ? 'text-orange-500' : 'text-green-600'">
                  {{ (workerStats[w.id]?.debt || 0).toLocaleString('uk-UA') }} грн
                </span>
              </div>
              <button @click="openPay(w)" :disabled="!(workerStats[w.id]?.debt > 0)" class="ml-auto inline-flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 rounded-xl px-3 py-1.5 hover:bg-green-100 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Виплатити
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Модал зміни ціни -->
    <div v-if="showPriceModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showPriceModal=false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <h2 class="text-xl font-bold text-agro-dark mb-2 bitter">Змінити ціну</h2>
        <p class="text-sm text-agro-light mb-6">Нова ціна буде застосована до наступних зважувань. Попередні записи залишаються незмінними.</p>
        <div>
          <label class="block text-sm font-semibold text-agro-dark mb-1.5">Нова ціна (грн/кг) *</label>
          <input v-model="newPrice" type="number" step="0.01" min="0" class="input" :placeholder="`Поточна: ${season?.price_per_kg}`" />
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showPriceModal=false" class="btn-outline flex-1 justify-center">Скасувати</button>
          <button @click="savePrice" :disabled="priceSaving" class="btn-primary flex-1 justify-center">
            {{ priceSaving ? 'Збереження...' : 'Зберегти' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модал зміни ціни працівника -->
    <div v-if="showWorkerPriceModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showWorkerPriceModal=false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <h2 class="text-xl font-bold text-agro-dark mb-2 bitter">Ціна для {{ workerPriceTarget?.first_name }}</h2>
        <p class="text-sm text-agro-light mb-6">Стандартна ціна: {{ season?.price_per_kg }} грн/кг</p>
        <div>
          <label class="block text-sm font-semibold text-agro-dark mb-1.5">Індивідуальна ціна (грн/кг)</label>
          <input v-model="workerNewPrice" type="number" step="0.01" min="0" class="input" :placeholder="`Стандартна: ${season?.price_per_kg}`" />
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showWorkerPriceModal=false" class="btn-outline flex-1 justify-center">Скасувати</button>
          <button @click="saveWorkerPrice" :disabled="workerPriceSaving" class="btn-primary flex-1 justify-center">
            {{ workerPriceSaving ? 'Збереження...' : 'Зберегти' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модал додавання збирача до сезону -->
    <div v-if="showWorkerModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showWorkerModal=false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 overflow-y-auto max-h-[90vh]">
        <h2 class="text-xl font-bold text-agro-dark mb-2 bitter">Додати збирача</h2>
        <p class="text-sm text-agro-light mb-6">Виберіть зі списку або <NuxtLink to="/dashboard/harvest?tab=workers" class="text-agro underline">додайте нового збирача</NuxtLink></p>

        <div v-if="availableWorkers.length === 0" class="text-center py-6 text-agro-light text-sm">
          Всі збирачі вже додані до цього обліку.<br>
          <NuxtLink to="/dashboard/harvest?tab=workers" class="text-agro underline mt-1 inline-block">Створити нового збирача</NuxtLink>
        </div>

        <div v-else class="space-y-2 mb-6">
          <div v-for="w in availableWorkers" :key="w.id"
            class="rounded-xl border transition-colors"
            :class="selectedWorkerIds.includes(w.id) ? 'border-agro bg-[#F0F7EC]' : 'border-agro-border'">
            <label class="flex items-center gap-3 p-3 cursor-pointer">
              <input type="checkbox" :value="w.id" v-model="selectedWorkerIds" class="accent-[#2F5233] w-4 h-4" />
              <div class="w-8 h-8 rounded-lg bg-agro-hover flex items-center justify-center shrink-0 font-bold text-agro text-xs">
                {{ w.first_name[0] }}{{ w.last_name[0] }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-agro-dark text-sm">{{ w.first_name }} {{ w.last_name }}</p>
                <p class="text-xs text-agro-light">{{ w.phone }}</p>
              </div>
              <button v-if="selectedWorkerIds.includes(w.id)"
                @click.prevent="toggleWorkerCustomPrice(w.id)"
                class="text-xs text-agro underline shrink-0">
                {{ workerCustomPrices[w.id] !== undefined ? 'стандартна' : 'своя ціна' }}
              </button>
            </label>
            <div v-if="selectedWorkerIds.includes(w.id) && workerCustomPrices[w.id] !== undefined"
              class="px-3 pb-3">
              <input v-model="workerCustomPrices[w.id]" type="number" step="0.01" min="0" class="input text-sm"
                :placeholder="`Стандартна: ${season?.price_per_kg}`" @click.stop />
            </div>
          </div>
        </div>

        <p v-if="wError" class="text-red-500 text-sm mb-3">{{ wError }}</p>
        <div class="flex gap-3">
          <button @click="showWorkerModal=false" class="btn-outline flex-1">Скасувати</button>
          <button @click="addWorkers" :disabled="wSaving || !selectedWorkerIds.length" class="btn-primary flex-1">
            {{ wSaving ? 'Додавання...' : `Додати (${selectedWorkerIds.length})` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модал зважування -->
    <div v-if="showRecordModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showRecordModal=false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <h2 class="text-xl font-bold text-agro-dark mb-6 bitter">Записати зважування</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-agro-dark mb-1.5">Працівник *</label>
            <select v-model="rForm.worker_id" class="w-full px-4 py-2.5 rounded-xl border border-agro-border bg-white text-sm text-agro-dark focus:outline-none focus:border-agro focus:ring-2 focus:ring-agro/10 transition-colors appearance-none cursor-pointer">
              <option value="">— Виберіть —</option>
              <option v-for="w in workers.filter(w => w.is_active)" :key="w.id" :value="w.id">{{ w.first_name }} {{ w.last_name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-agro-dark mb-1.5">Вага (кг) *</label>
            <input v-model="rForm.weight_kg" type="number" step="0.001" min="0" class="input" placeholder="0.000" />
          </div>
          <div v-if="rForm.worker_id" class="bg-agro-bg rounded-xl p-3 text-sm text-agro-dark">
            Ціна: <span class="font-bold">{{ effectivePrice(rForm.worker_id) }} грн/кг</span>
            <span v-if="rForm.weight_kg" class="ml-2">· Сума: <span class="font-bold">{{ (Number(rForm.weight_kg) * effectivePrice(rForm.worker_id)).toFixed(2) }} грн</span></span>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showRecordModal=false" class="btn-outline flex-1">Скасувати</button>
          <button @click="saveRecord" :disabled="rSaving" class="btn-primary flex-1">
            {{ rSaving ? 'Збереження...' : 'Записати' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модал виплати -->
    <div v-if="showPayModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showPayModal=false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <h2 class="text-xl font-bold text-agro-dark mb-2 bitter">Виплата</h2>
        <p class="text-agro-light text-sm mb-6">{{ payWorker?.first_name }} {{ payWorker?.last_name }} · Залишок: <span class="font-bold text-orange-500">{{ (workerStats[payWorker?.id]?.debt || 0).toLocaleString('uk-UA') }} грн</span></p>
        <div>
          <label class="block text-sm font-semibold text-agro-dark mb-1.5">Сума виплати (грн) *</label>
          <input v-model="payAmount" type="number" step="0.01" min="0" class="input" placeholder="0.00" />
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showPayModal=false" class="btn-outline flex-1">Скасувати</button>
          <button @click="savePay" :disabled="paySaving" class="btn-primary flex-1">
            {{ paySaving ? 'Збереження...' : 'Виплатити' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модал QR -->
    <div v-if="qrWorker" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="qrWorker=null">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
        <h2 class="text-xl font-bold text-agro-dark mb-2 bitter">QR-код працівника</h2>
        <p class="text-agro-light text-sm mb-6">{{ qrWorker.first_name }} {{ qrWorker.last_name }}</p>
        <div class="flex justify-center mb-4">
          <canvas ref="qrCanvas" width="200" height="200"></canvas>
        </div>
        <p class="text-xs text-agro-light mb-6">Відскануйте при зважуванні щоб автоматично вибрати працівника</p>
        <button @click="qrWorker=null" class="btn-outline w-full">Закрити</button>
      </div>
    </div>

    <!-- Модал історії -->
    <div v-if="showHistoryModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showHistoryModal=false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold text-agro-dark mb-1 bitter">{{ historyWorker?.first_name }} {{ historyWorker?.last_name }}</h2>
        <p class="text-agro-light text-sm mb-6">Історія зважувань та виплат</p>

        <div v-if="historyLoading" class="text-center py-6 text-agro-light text-sm">Завантаження...</div>
        <template v-else>
          <div v-if="historyRecords.length" class="mb-4">
            <p class="text-xs font-semibold text-agro-light uppercase tracking-wide mb-2">Зважування</p>
            <div class="space-y-2">
              <div v-for="r in historyRecords" :key="r.id" class="flex items-center gap-3 p-3 bg-agro-bg rounded-xl">
                <div class="flex-1">
                  <p class="text-sm font-medium text-agro-dark">{{ r.weight_kg }} кг · {{ r.price_per_kg }} грн/кг</p>
                  <p class="text-xs text-agro-light">{{ formatDateTime(r.recorded_at) }}</p>
                </div>
                <p class="font-bold text-agro">{{ Number(r.amount).toLocaleString('uk-UA') }} грн</p>
              </div>
            </div>
          </div>

          <div v-if="historyPayments.length">
            <p class="text-xs font-semibold text-agro-light uppercase tracking-wide mb-2">Виплати</p>
            <div class="space-y-2">
              <div v-for="p in historyPayments" :key="p.id" class="flex items-center gap-3 p-3 rounded-xl"
                :class="p.status === 'confirmed' ? 'bg-green-50' : 'bg-amber-50'">
                <div class="flex-1">
                  <p class="text-sm font-medium text-agro-dark">{{ Number(p.amount).toLocaleString('uk-UA') }} грн</p>
                  <p class="text-xs text-agro-light">{{ formatDateTime(p.paid_at) }}</p>
                </div>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                  :class="p.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
                  {{ p.status === 'confirmed' ? 'Підтверджено' : 'Очікує підтвердження' }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="!historyRecords.length && !historyPayments.length" class="text-center py-6 text-agro-light text-sm">
            Немає записів
          </div>
        </template>
        <button @click="showHistoryModal=false" class="btn-outline w-full mt-6">Закрити</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const supabase = useSupabaseClient()
const route = useRoute()
const seasonId = route.params.id as string

const loading = ref(true)
const season = ref<any>(null)
const workers = ref<any[]>([])
const workerRecords = ref<Record<string, any[]>>({})
const workerStats = ref<Record<string, { kg: number; earned: number; paid: number; debt: number }>>({})
const stats = computed(() => {
  const vals = Object.values(workerStats.value)
  return {
    totalKg: vals.reduce((s, v) => s + v.kg, 0),
    totalEarned: vals.reduce((s, v) => s + v.earned, 0),
    totalPaid: vals.reduce((s, v) => s + v.paid, 0),
  }
})

// Зміна ціни працівника
const showWorkerPriceModal = ref(false)
const workerPriceTarget = ref<any>(null)
const workerNewPrice = ref('')
const workerPriceSaving = ref(false)

const openChangeWorkerPrice = (w: any) => {
  workerPriceTarget.value = w
  workerNewPrice.value = String(w.custom_price_per_kg || '')
  showWorkerPriceModal.value = true
}

const saveWorkerPrice = async () => {
  workerPriceSaving.value = true
  const price = workerNewPrice.value ? Number(workerNewPrice.value) : null
  const { error } = await supabase
    .from('harvest_season_workers')
    .update({ custom_price_per_kg: price })
    .eq('season_id', seasonId)
    .eq('worker_id', workerPriceTarget.value.id)
  workerPriceSaving.value = false
  if (!error) {
    const w = workers.value.find(w => w.id === workerPriceTarget.value.id)
    if (w) w.custom_price_per_kg = price
    showWorkerPriceModal.value = false
  }
}

// Зміна ціни
const showPriceModal = ref(false)
const newPrice = ref('')
const priceSaving = ref(false)

const openChangePrice = () => { newPrice.value = String(season.value?.price_per_kg || ''); showPriceModal.value = true }

const savePrice = async () => {
  if (!newPrice.value) return
  priceSaving.value = true
  const { error } = await supabase.from('harvest_seasons').update({ price_per_kg: Number(newPrice.value) }).eq('id', seasonId)
  priceSaving.value = false
  if (!error) { season.value.price_per_kg = Number(newPrice.value); showPriceModal.value = false }
}

// Форма збирача
const showWorkerModal = ref(false)
const wSaving = ref(false)
const wError = ref('')
const availableWorkers = ref<any[]>([])
const selectedWorkerIds = ref<string[]>([])
const workerCustomPrices = ref<Record<string, string>>({})

const toggleWorkerCustomPrice = (id: string) => {
  if (workerCustomPrices.value[id] !== undefined) {
    const p = { ...workerCustomPrices.value }
    delete p[id]
    workerCustomPrices.value = p
  } else {
    workerCustomPrices.value = { ...workerCustomPrices.value, [id]: '' }
  }
}

// Форма запису
const showRecordModal = ref(false)
const rSaving = ref(false)
const rForm = reactive({ worker_id: '', weight_kg: '' })

// Виплата
const showPayModal = ref(false)
const paySaving = ref(false)
const payWorker = ref<any>(null)
const payAmount = ref('')

// QR
const qrWorker = ref<any>(null)
const qrCanvas = ref<HTMLCanvasElement | null>(null)

// Історія
const showHistoryModal = ref(false)
const historyWorker = ref<any>(null)
const historyLoading = ref(false)
const historyRecords = ref<any[]>([])
const historyPayments = ref<any[]>([])

const formatDate = (d: string) => new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
const formatDateTime = (d: string) => new Date(d).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const effectivePrice = (workerId: string) => {
  const w = workers.value.find(w => w.id === workerId)
  return w?.custom_price_per_kg || season.value?.price_per_kg || 0
}

const load = async () => {
  const [seasonRes, swRes] = await Promise.all([
    supabase.from('harvest_seasons').select('*').eq('id', seasonId).single(),
    supabase.from('harvest_season_workers')
      .select('custom_price_per_kg, is_active, harvest_workers(*)')
      .eq('season_id', seasonId)
      .order('created_at'),
  ])
  season.value = seasonRes.data

  // Розгортаємо workers з join, зберігаємо custom_price_per_kg і is_active зі зв'язку
  workers.value = (swRes.data || []).map((sw: any) => ({
    ...sw.harvest_workers,
    custom_price_per_kg: sw.custom_price_per_kg,
    is_active: sw.is_active !== false,
  }))

  if (workers.value.length) {
    const wIds = workers.value.map((w: any) => w.id)
    const [recordsRes, paymentsRes] = await Promise.all([
      supabase.from('harvest_records').select('*').eq('season_id', seasonId).in('worker_id', wIds).order('recorded_at', { ascending: false }),
      supabase.from('harvest_payments').select('worker_id, amount, status').eq('season_id', seasonId).in('worker_id', wIds),
    ])
    const stats: Record<string, any> = {}
    const recs: Record<string, any[]> = {}
    for (const w of workers.value) { stats[w.id] = { kg: 0, earned: 0, paid: 0, debt: 0 }; recs[w.id] = [] }
    for (const r of (recordsRes.data || [])) {
      stats[r.worker_id].kg += Number(r.weight_kg)
      stats[r.worker_id].earned += Number(r.amount)
      recs[r.worker_id].push(r)
    }
    for (const p of (paymentsRes.data || [])) {
      if (p.status === 'confirmed') stats[p.worker_id].paid += Number(p.amount)
    }
    for (const id in stats) stats[id].debt = stats[id].earned - stats[id].paid
    workerStats.value = stats
    workerRecords.value = recs
  }
  loading.value = false
}

const toggleWorkerActive = async (w: any) => {
  const newVal = !w.is_active
  const { error } = await supabase
    .from('harvest_season_workers')
    .update({ is_active: newVal })
    .eq('season_id', seasonId)
    .eq('worker_id', w.id)
  if (!error) w.is_active = newVal
}

const openAddWorker = async () => {
  wError.value = ''
  selectedWorkerIds.value = []
  workerCustomPrices.value = {}
  showWorkerModal.value = true
  // Завантажуємо збирачів власника яких ще немає в цьому сезоні
  const { data: { session } } = await supabase.auth.getSession()
  const { data: allWorkers } = await supabase
    .from('harvest_workers')
    .select('id, first_name, last_name, phone')
    .eq('owner_id', session!.user.id)
    .order('first_name')
  const currentIds = workers.value.map(w => w.id)
  availableWorkers.value = (allWorkers || []).filter(w => !currentIds.includes(w.id))
}

const addWorkers = async () => {
  if (!selectedWorkerIds.value.length) return
  wSaving.value = true; wError.value = ''
  const inserts = selectedWorkerIds.value.map(wid => {
    const cp = workerCustomPrices.value[wid]
    return {
      season_id: seasonId,
      worker_id: wid,
      custom_price_per_kg: cp ? Number(cp) : null,
    }
  })
  const { error } = await supabase.from('harvest_season_workers').insert(inserts)
  wSaving.value = false
  if (error) { wError.value = error.message; return }
  showWorkerModal.value = false
  await load()
}

const openRecord = () => {
  rForm.worker_id = ''; rForm.weight_kg = ''
  showRecordModal.value = true
}

const saveRecord = async () => {
  if (!rForm.worker_id || !rForm.weight_kg) return
  rSaving.value = true
  const { data: { session } } = await supabase.auth.getSession()
  const price = effectivePrice(rForm.worker_id)
  await supabase.from('harvest_records').insert({
    worker_id: rForm.worker_id,
    season_id: seasonId,
    weight_kg: Number(rForm.weight_kg),
    price_per_kg: price,
    recorded_by: session!.user.id,
  })
  rSaving.value = false
  showRecordModal.value = false
  await load()
}

const openPay = (w: any) => {
  payWorker.value = w
  payAmount.value = ''
  showPayModal.value = true
}

const savePay = async () => {
  if (!payAmount.value) return
  paySaving.value = true
  await supabase.from('harvest_payments').insert({
    worker_id: payWorker.value.id,
    season_id: seasonId,
    amount: Number(payAmount.value),
    status: 'pending',
  })
  paySaving.value = false
  showPayModal.value = false
  load()
}

const showQR = async (w: any) => {
  qrWorker.value = w
  await nextTick()
  if (!qrCanvas.value) return
  const QRCode = (await import('qrcode')).default
  const siteUrl = window.location.origin
  const url = `${siteUrl}/dashboard/harvest/${seasonId}?weigh=${w.id}`
  QRCode.toCanvas(qrCanvas.value, url, { width: 200, margin: 2 })
}

const openHistory = async (w: any) => {
  historyWorker.value = w
  showHistoryModal.value = true
  historyLoading.value = true
  const [rec, pay] = await Promise.all([
    supabase.from('harvest_records').select('*').eq('worker_id', w.id).order('recorded_at', { ascending: false }),
    supabase.from('harvest_payments').select('*').eq('worker_id', w.id).order('paid_at', { ascending: false }),
  ])
  historyRecords.value = rec.data || []
  historyPayments.value = pay.data || []
  historyLoading.value = false
}

onMounted(async () => {
  await load()
  // Якщо прийшли через QR — одразу відкриваємо модал зважування
  const weighWorkerId = route.query.weigh as string
  if (weighWorkerId && workers.value.find(w => w.id === weighWorkerId)) {
    rForm.worker_id = weighWorkerId
    rForm.weight_kg = ''
    showRecordModal.value = true
  }
})
</script>
