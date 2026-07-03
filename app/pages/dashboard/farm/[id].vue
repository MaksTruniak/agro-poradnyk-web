<template>
  <div class="p-8">
    <NuxtLink to="/dashboard/fields" class="inline-flex items-center gap-2 text-agro-light hover:text-agro mb-8 text-sm font-medium transition-colors">
      ← Назад до полів
    </NuxtLink>

    <div v-if="loading" class="space-y-5">
      <div class="card animate-pulse h-40"></div>
      <div class="card animate-pulse h-32"></div>
    </div>

    <div v-else-if="farm" class="space-y-6">
      <!-- Основна інформація -->
      <div class="card">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h1 class="text-2xl font-extrabold text-agro-dark">🌾 {{ farm.name }}</h1>
            <p v-if="farm.region" class="text-agro-light mt-1">📍 {{ farm.region }}</p>
          </div>
          <span class="font-bold text-agro text-2xl">{{ farm.hectares }} га</span>
        </div>

        <div v-if="!editing" class="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <p class="text-xs text-agro-light uppercase tracking-wide mb-1">Назва</p>
            <p class="font-semibold text-agro-dark">{{ farm.name }}</p>
          </div>
          <div>
            <p class="text-xs text-agro-light uppercase tracking-wide mb-1">Регіон</p>
            <p class="font-semibold text-agro-dark">{{ farm.region || '—' }}</p>
          </div>
          <div v-if="farm.city">
            <p class="text-xs text-agro-light uppercase tracking-wide mb-1">Населений пункт</p>
            <p class="font-semibold text-agro-dark">{{ farm.city }}</p>
          </div>
          <div>
            <p class="text-xs text-agro-light uppercase tracking-wide mb-1">Площа</p>
            <p class="font-semibold text-agro-dark">{{ farm.hectares }} га</p>
          </div>
          <div v-if="farm.cadastral_number">
            <p class="text-xs text-agro-light uppercase tracking-wide mb-1">Кадастровий номер</p>
            <p class="font-semibold text-agro-dark">{{ farm.cadastral_number }}</p>
          </div>
        </div>

        <!-- Форма редагування -->
        <div v-else class="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Назва</label>
            <input v-model="editForm.name" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Площа (га)</label>
            <input v-model="editForm.hectares" type="number" class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Область</label>
            <div class="relative">
              <input
                v-model="editRegionQuery"
                @input="onEditRegionInput"
                @focus="showEditRegionList = true"
                @blur="() => setTimeout(() => showEditRegionList = false, 150)"
                class="input"
                placeholder="Оберіть область..."
                autocomplete="off"
              />
              <div v-if="showEditRegionList && editFilteredAreas.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-30 max-h-44 overflow-y-auto">
                <button
                  v-for="area in editFilteredAreas"
                  :key="area.ref"
                  type="button"
                  @mousedown.prevent="selectEditArea(area)"
                  class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0 text-agro-dark"
                >{{ area.name }}</button>
              </div>
            </div>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Населений пункт</label>
            <div class="relative">
              <input
                v-model="editSettlementQuery"
                @input="onEditSettlementInput"
                @focus="showEditSettlementList = true"
                @blur="() => setTimeout(() => showEditSettlementList = false, 150)"
                class="input"
                placeholder="Місто або село..."
                autocomplete="off"
                :disabled="!editForm.region"
              />
              <div v-if="loadingEditSettlements" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-agro-light">...</div>
              <div v-if="showEditSettlementList && editSettlements.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-30 max-h-44 overflow-y-auto">
                <button
                  v-for="s in editSettlements"
                  :key="s.DeliveryCity"
                  type="button"
                  @mousedown.prevent="selectEditSettlement(s)"
                  class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0 text-agro-dark"
                >{{ s.Present }}</button>
              </div>
            </div>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Кадастровий номер</label>
            <input v-model="editForm.cadastral_number" class="input" placeholder="Необов'язково" />
          </div>
        </div>

        <div class="flex gap-3">
          <button v-if="!editing" @click="startEdit" class="btn-outline text-sm py-2">✏️ Редагувати</button>
          <template v-else>
            <button @click="saveFarm" :disabled="saving" class="btn-primary text-sm py-2">{{ saving ? '...' : 'Зберегти' }}</button>
            <button @click="editing = false" class="btn-outline text-sm py-2">Скасувати</button>
          </template>
        </div>
      </div>

      <!-- Культури -->
      <div class="card">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-bold text-agro-dark text-lg">🌱 Культури</h2>
          <button @click="isPro || crops.length === 0 ? showAddCrop = true : showPaywall = true" class="btn-primary text-sm py-2">➕ Додати</button>
        </div>

        <div v-if="crops.length === 0" class="text-center py-8 text-agro-light">
          Поки немає культур
        </div>

        <div v-else class="space-y-3">
          <div v-for="(crop, index) in crops" :key="crop.id" class="relative flex items-center gap-4 p-4 bg-agro-bg rounded-xl">
            <!-- Замок для заблокованих культур -->
            <div v-if="!isPro && index > 0" class="absolute inset-0 rounded-xl flex items-center justify-center bg-white/70 backdrop-blur-sm z-10 gap-2">
              <span class="text-xl">🔒</span>
              <span class="text-sm font-semibold text-agro-dark">Доступно в PRO</span>
              <NuxtLink to="/dashboard/subscription" class="text-xs text-agro underline ml-1">Оновити</NuxtLink>
            </div>
            <span class="text-2xl">{{ CROP_EMOJI[crop.crop_type] || '🌱' }}</span>
            <div class="flex-1">
              <p class="font-semibold text-agro-dark">{{ crop.crop_type }}{{ crop.variety ? ` · ${crop.variety}` : '' }}</p>
              <p class="text-xs text-agro-light">{{ crop.area_ha }} га</p>
            </div>
            <NuxtLink
              :to="`/dashboard/protection?farmCropId=${crop.id}&cropType=${crop.crop_type}`"
              class="btn-outline text-sm py-1.5 px-3 flex items-center gap-1.5"
            ><ShieldCheck :size="14" /> Схема</NuxtLink>
            <button @click="deleteCrop(crop)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-red-400">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Сівозміна (поки приховано) -->
      <div v-if="false" class="card">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="font-bold text-agro-dark text-lg">🔄 Сівозміна та врожайність</h2>
            <p class="text-agro-light text-sm mt-0.5">Облік культур і врожаю по роках</p>
          </div>
          <button @click="showAddRotation = true" class="btn-primary text-sm py-2">➕ Додати рік</button>
        </div>

        <div v-if="rotation.length === 0" class="text-center py-8 text-agro-light text-sm">
          Журнал сівозміни порожній — додайте записи по роках
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-agro-border">
                <th class="text-left pb-3 text-xs text-agro-light uppercase tracking-wide font-medium">Рік</th>
                <th class="text-left pb-3 text-xs text-agro-light uppercase tracking-wide font-medium">Культура</th>
                <th class="text-left pb-3 text-xs text-agro-light uppercase tracking-wide font-medium">Сорт</th>
                <th class="text-right pb-3 text-xs text-agro-light uppercase tracking-wide font-medium">Площа, га</th>
                <th class="text-right pb-3 text-xs text-agro-light uppercase tracking-wide font-medium">План т/га</th>
                <th class="text-right pb-3 text-xs text-agro-light uppercase tracking-wide font-medium">Факт т/га</th>
                <th class="pb-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-agro-border">
              <tr v-for="r in rotation" :key="r.id" class="hover:bg-agro-bg transition-colors">
                <td class="py-3 font-bold text-agro">{{ r.year }}</td>
                <td class="py-3 font-medium text-agro-dark">{{ CROP_EMOJI[r.crop_type] || '🌱' }} {{ r.crop_type }}</td>
                <td class="py-3 text-agro-light">{{ r.variety || '—' }}</td>
                <td class="py-3 text-right text-agro-dark">{{ r.area_ha || '—' }}</td>
                <td class="py-3 text-right text-agro-light">{{ r.planned_yield_t || '—' }}</td>
                <td class="py-3 text-right">
                  <span v-if="r.actual_yield_t" class="font-semibold" :class="r.actual_yield_t >= (r.planned_yield_t || 0) ? 'text-agro' : 'text-orange-500'">
                    {{ r.actual_yield_t }}
                  </span>
                  <span v-else class="text-agro-light">—</span>
                </td>
                <td class="py-3 pl-2">
                  <div class="flex gap-1 justify-end">
                    <button @click="editRotationRow(r)" class="w-7 h-7 rounded-lg hover:bg-agro-hover flex items-center justify-center text-agro-light hover:text-agro transition-colors">✏️</button>
                    <button @click="deleteRotation(r.id)" class="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-300 hover:text-red-500 transition-colors">🗑</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Доступ агрономів (тільки для власника) -->
      <div v-if="!readOnly" class="card">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-bold text-agro-dark text-lg">👨‍🌾 Доступ агрономів</h2>
          <button @click="showShareModal = true" class="btn-outline text-sm py-2">🤝 Поділитись</button>
        </div>

        <div v-if="shares.length === 0" class="text-center py-6 text-agro-light text-sm">
          Жоден агроном ще не має доступу
        </div>

        <div v-else class="space-y-2">
          <div v-for="share in shares" :key="share.id" class="flex items-center justify-between p-3 bg-agro-bg rounded-xl">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-agro-hover flex items-center justify-center font-bold text-agro text-sm">
                {{ share.users?.name?.[0]?.toUpperCase() || '?' }}
              </div>
              <p class="font-medium text-agro-dark text-sm">{{ share.users?.name || 'Агроном' }}</p>
            </div>
            <button @click="removeShare(share.id)" class="text-red-400 hover:text-red-600 text-sm transition-colors">Забрати доступ</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Paywall модалка -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showPaywall" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showPaywall = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-8 text-center">
            <div class="text-5xl mb-4">💎</div>
            <h2 class="font-extrabold text-agro-dark text-xl mb-2">Потрібен PRO план</h2>
            <p class="text-agro-light text-sm mb-6">На безкоштовному плані доступна лише <strong>1 культура</strong> на поле. Оновіть до PRO для необмеженого доступу.</p>
            <div class="space-y-3">
              <NuxtLink to="/dashboard/subscription" class="btn-primary w-full block">Оновити до PRO</NuxtLink>
              <button @click="showPaywall = false" class="btn-outline w-full">Залишитись на Basic</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модалка додавання культури -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddCrop" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAddCrop = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-8">
            <h2 class="font-bold text-agro-dark text-xl mb-5">➕ Нова культура</h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Культура</label>
                <div class="relative">
                  <input
                    v-model="cropSearch"
                    @input="searchCrops"
                    @focus="showCropSuggestions = true"
                    @blur="setTimeout(() => showCropSuggestions = false, 200)"
                    class="input"
                    :class="selectedCrop ? 'border-agro' : ''"
                    placeholder="Почніть вводити назву..."
                  />
                  <div v-if="showCropSuggestions && cropResults.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                    <button
                      v-for="c in cropResults" :key="c.id"
                      @mousedown.prevent="selectCrop(c)"
                      class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover border-b border-agro-border last:border-0 flex items-center gap-2"
                    >
                      <span>{{ c.emoji || '🌱' }}</span>
                      <span class="font-medium text-agro-dark">{{ c.name }}</span>
                    </button>
                  </div>
                </div>
                <p v-if="selectedCrop" class="text-xs text-agro mt-1 font-medium">✅ {{ selectedCrop.name }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Сорт (необов'язково)</label>
                <div class="relative">
                  <input v-model="newVariety" @input="searchVarieties" @focus="loadVarieties" @blur="setTimeout(() => showVarietySuggestions = false, 200)"
                    class="input" placeholder="Введіть або оберіть сорт..." />
                  <div v-if="showVarietySuggestions" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-10 overflow-hidden">
                    <button v-for="v in varietySuggestions" :key="v" @mousedown.prevent="newVariety = v; showVarietySuggestions = false"
                      class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover border-b border-agro-border last:border-0">{{ v }}</button>
                    <div v-if="newVariety.trim() && !varietySuggestions.find(v => v.toLowerCase() === newVariety.trim().toLowerCase())"
                      class="px-4 py-2.5 text-sm text-agro-light">
                      ➕ "{{ newVariety }}" — новий сорт, збережеться в базі
                    </div>
                    <div v-if="!varietySuggestions.length && !newVariety.trim()" class="px-4 py-3 text-sm text-agro-light text-center">
                      Немає сортів — введіть свій
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Площа (га)</label>
                <input v-model="newArea" class="input" placeholder="0.0" inputmode="decimal" @input="newArea = ($event.target as HTMLInputElement).value.replace(',', '.')" />
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button @click="showAddCrop = false; selectedCrop = null; newVariety = ''; newArea = ''" class="btn-outline flex-1">Скасувати</button>
              <button @click="addCrop" :disabled="!selectedCrop || saving" class="btn-primary flex-1">{{ saving ? '...' : 'Додати' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модалка сівозміни -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddRotation" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeRotationModal" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-8">
            <h2 class="font-bold text-agro-dark text-xl mb-5">{{ rotationForm.id ? '✏️ Редагувати запис' : '➕ Новий запис сівозміни' }}</h2>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-agro-dark mb-1.5">Рік</label>
                  <input v-model="rotationForm.year" type="number" class="input" :placeholder="new Date().getFullYear().toString()" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-agro-dark mb-1.5">Площа (га)</label>
                  <input v-model="rotationForm.area_ha" class="input" placeholder="0.0" inputmode="decimal" @input="rotationForm.area_ha = ($event.target as HTMLInputElement).value.replace(',', '.')" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Культура</label>
                <input v-model="rotationForm.crop_type" class="input" placeholder="Наприклад: Пшениця" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Сорт (необов'язково)</label>
                <input v-model="rotationForm.variety" class="input" placeholder="Наприклад: Миронівська 808" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-agro-dark mb-1.5">Плановий врожай (т/га)</label>
                  <input v-model="rotationForm.planned_yield_t" class="input" placeholder="0.0" inputmode="decimal" @input="rotationForm.planned_yield_t = ($event.target as HTMLInputElement).value.replace(',', '.')" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-agro-dark mb-1.5">Фактичний врожай (т/га)</label>
                  <input v-model="rotationForm.actual_yield_t" class="input" placeholder="0.0" inputmode="decimal" @input="rotationForm.actual_yield_t = ($event.target as HTMLInputElement).value.replace(',', '.')" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Примітки</label>
                <textarea v-model="rotationForm.notes" class="input resize-none" rows="2" placeholder="Додаткова інформація..." />
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button @click="closeRotationModal" class="btn-outline flex-1">Скасувати</button>
              <button @click="saveRotation" :disabled="saving" class="btn-primary flex-1">{{ saving ? '...' : 'Зберегти' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модалка поділитись -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showShareModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showShareModal = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-8">
            <h2 class="font-bold text-agro-dark text-xl mb-5">🤝 Поділитись з агрономом</h2>
            <div class="relative mb-4">
              <input v-model="agronSearch" @input="searchAgronomists" class="input" placeholder="Пошук агронома за ім'ям..." />
              <div v-if="agronResults.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-10 overflow-hidden">
                <button v-for="a in agronResults" :key="a.id" @mousedown.prevent="shareWithAgronomist(a)"
                  class="w-full text-left px-4 py-3 text-sm hover:bg-agro-hover border-b border-agro-border last:border-0 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-agro-hover flex items-center justify-center font-bold text-agro text-xs">{{ a.name?.[0]?.toUpperCase() }}</div>
                  <div>
                    <p class="font-medium text-agro-dark">{{ a.name }}</p>
                    <p class="text-xs text-agro-light">{{ a.agronomist_profiles?.[0]?.specialization || 'Агроном' }}</p>
                  </div>
                </button>
              </div>
            </div>
            <button @click="showShareModal = false" class="btn-outline w-full">Закрити</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { Trash2, ShieldCheck } from 'lucide-vue-next'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const farmId = route.params.id as string
const readOnly = route.query.readOnly === '1'
const supabase = useSupabaseClient()

onMounted(() => {
  if (route.query.share === '1') showShareModal.value = true
})

const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const farm = ref<any>(null)
const crops = ref<any[]>([])
const shares = ref<any[]>([])
const showAddCrop = ref(false)
const showPaywall = ref(false)
const showShareModal = ref(false)
const showAddRotation = ref(false)
const rotation = ref<any[]>([])
const rotationForm = reactive({ id: '', year: new Date().getFullYear(), crop_type: '', variety: '', area_ha: '', planned_yield_t: '', actual_yield_t: '', notes: '' })

const editForm = reactive({ name: '', region: '', city: '', hectares: '', cadastral_number: '' })

const { searchSettlements } = useNovaPost()

const UA_AREAS = [
  { name: 'Вінницька область', ref: 'Vinnytsia' }, { name: 'Волинська область', ref: 'Volyn' },
  { name: 'Дніпропетровська область', ref: 'Dnipropetrovsk' }, { name: 'Донецька область', ref: 'Donetsk' },
  { name: 'Житомирська область', ref: 'Zhytomyr' }, { name: 'Закарпатська область', ref: 'Zakarpattia' },
  { name: 'Запорізька область', ref: 'Zaporizhzhia' }, { name: 'Івано-Франківська область', ref: 'Ivano-Frankivsk' },
  { name: 'Київська область', ref: 'Kyiv' }, { name: 'Кіровоградська область', ref: 'Kirovohrad' },
  { name: 'Луганська область', ref: 'Luhansk' }, { name: 'Львівська область', ref: 'Lviv' },
  { name: 'Миколаївська область', ref: 'Mykolaiv' }, { name: 'Одеська область', ref: 'Odesa' },
  { name: 'Полтавська область', ref: 'Poltava' }, { name: 'Рівненська область', ref: 'Rivne' },
  { name: 'Сумська область', ref: 'Sumy' }, { name: 'Тернопільська область', ref: 'Ternopil' },
  { name: 'Харківська область', ref: 'Kharkiv' }, { name: 'Херсонська область', ref: 'Kherson' },
  { name: 'Хмельницька область', ref: 'Khmelnytskyi' }, { name: 'Черкаська область', ref: 'Cherkasy' },
  { name: 'Чернівецька область', ref: 'Chernivtsi' }, { name: 'Чернігівська область', ref: 'Chernihiv' },
  { name: 'м. Київ', ref: 'KyivCity' },
]

const editRegionQuery = ref('')
const showEditRegionList = ref(false)
const editSettlementQuery = ref('')
const editSettlements = ref<any[]>([])
const showEditSettlementList = ref(false)
const loadingEditSettlements = ref(false)
let editSettlementTimer: any = null

const editFilteredAreas = computed(() => {
  const q = editRegionQuery.value.toLowerCase().trim()
  if (!q) return UA_AREAS
  return UA_AREAS.filter(a => a.name.toLowerCase().includes(q))
})

const onEditRegionInput = () => {
  editForm.region = editRegionQuery.value
  editForm.city = ''
  editSettlementQuery.value = ''
  showEditRegionList.value = true
}

const selectEditArea = (area: any) => {
  editRegionQuery.value = area.name
  editForm.region = area.name
  showEditRegionList.value = false
  editSettlementQuery.value = ''
  editForm.city = ''
}

const onEditSettlementInput = () => {
  clearTimeout(editSettlementTimer)
  editForm.city = editSettlementQuery.value
  const q = editSettlementQuery.value.trim()
  if (q.length < 2) { editSettlements.value = []; return }
  loadingEditSettlements.value = true
  editSettlementTimer = setTimeout(async () => {
    editSettlements.value = await searchSettlements(q)
    loadingEditSettlements.value = false
  }, 350)
}

const selectEditSettlement = (s: any) => {
  const name = s.Present.split(',')[0].trim()
  editSettlementQuery.value = s.Present
  editForm.city = name
  editSettlements.value = []
  showEditSettlementList.value = false
}
const selectedCrop = ref<any>(null)
const cropSearch = ref('')
const cropResults = ref<any[]>([])
const showCropSuggestions = ref(false)
let cropSearchTimer: any = null
const newVariety = ref('')
const newArea = ref('')
const varietySuggestions = ref<string[]>([])
const showVarietySuggestions = ref(false)
const agronSearch = ref('')
const agronResults = ref<any[]>([])

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const { data: subData } = await supabase.from('subscriptions').select('plan, expires_at').eq('user_id', uid).maybeSingle()
const isPro = subData?.plan === 'pro' && (!subData?.expires_at || new Date(subData.expires_at) > new Date())

const CROP_EMOJI: Record<string, string> = {
  'Смородина': '🫐', 'Полуниця': '🍓', 'Томати': '🍅', 'Огірки': '🥒',
  'Картопля': '🥔', 'Яблука': '🍎', 'Груші': '🍐', 'Виноград': '🍇',
  'Пшениця': '🌾', 'Кукурудза': '🌽', 'Соняшник': '🌻', 'Ріпак': '🌿',
  'Соя': '🫘', 'Ячмінь': '🌾', 'Жито': '🌾', 'Буряк': '🫚',
}

const load = async () => {
  const [farmData, cropsData, sharesData, rotationData] = await Promise.all([
    supabase.from('farms').select('*').eq('id', farmId).single(),
    supabase.from('farm_crops').select('*').eq('farm_id', farmId).order('created_at'),
    supabase.from('field_shares').select('id, agronomist_id').eq('farm_id', farmId).eq('status', 'accepted'),
    supabase.from('crop_rotation').select('*').eq('farm_id', farmId).order('year', { ascending: false }),
  ])
  rotation.value = rotationData.data || []
  farm.value = farmData.data
  crops.value = cropsData.data || []

  // Підтягуємо імена агрономів
  const rawShares = sharesData.data || []
  if (rawShares.length) {
    const agrIds = rawShares.map((s: any) => s.agronomist_id)
    const { data: agrUsers } = await supabase.from('users').select('id, name').in('id', agrIds)
    const agrMap = Object.fromEntries((agrUsers || []).map((u: any) => [u.id, u.name]))
    shares.value = rawShares.map((s: any) => ({ ...s, users: { name: agrMap[s.agronomist_id] || 'Агроном' } }))
  } else {
    shares.value = []
  }
  loading.value = false
}

await load()

const startEdit = () => {
  Object.assign(editForm, { name: farm.value.name, region: farm.value.region || '', city: farm.value.city || '', hectares: String(farm.value.hectares), cadastral_number: farm.value.cadastral_number || '' })
  editRegionQuery.value = farm.value.region || ''
  editSettlementQuery.value = farm.value.city || ''
  editing.value = true
}

const saveFarm = async () => {
  saving.value = true
  await supabase.from('farms').update({ name: editForm.name, region: editForm.region || null, city: editForm.city || null, hectares: parseFloat(editForm.hectares) || 0, cadastral_number: editForm.cadastral_number || null }).eq('id', farmId)
  editing.value = false
  saving.value = false
  await load()
}

const searchCrops = () => {
  clearTimeout(cropSearchTimer)
  cropSearchTimer = setTimeout(async () => {
    const q = cropSearch.value.trim()
    const query = supabase.from('crop_catalog').select('id, name, emoji').order('name').limit(20)
    const { data } = q ? await query.ilike('name', `%${q}%`) : await query
    cropResults.value = data || []
    showCropSuggestions.value = true
  }, 200)
}

const selectCrop = (c: any) => {
  selectedCrop.value = c
  cropSearch.value = c.name
  showCropSuggestions.value = false
}

// Завантажуємо культури одразу при відкритті
watch(showAddCrop, async (val) => {
  if (val) {
    const { data } = await supabase.from('crop_catalog').select('id, name, emoji').order('name').limit(20)
    cropResults.value = data || []
    cropSearch.value = ''
    selectedCrop.value = null
  }
})

const loadVarieties = async () => {
  if (!selectedCrop.value) { showVarietySuggestions.value = false; return }
  const cropName = selectedCrop.value.name
  const { data } = await supabase.from('varieties').select('name')
    .ilike('crop_type', `${cropName}%`)
    .order('name')
  varietySuggestions.value = (data || []).map((v: any) => v.name)
  showVarietySuggestions.value = true
}

let varTimer: any = null
const searchVarieties = () => {
  clearTimeout(varTimer)
  varTimer = setTimeout(async () => {
    if (!selectedCrop.value) return
    const { data } = await supabase.from('varieties').select('name').ilike('crop_type', `${selectedCrop.value.name}%`).ilike('name', `%${newVariety.value}%`).order('name')
    varietySuggestions.value = (data || []).map((v: any) => v.name)
    showVarietySuggestions.value = true
  }, 200)
}

const addCrop = async () => {
  if (!selectedCrop.value) return
  const totalFieldArea = parseFloat(farm.value?.hectares) || 0
  if (!isPro && crops.value.length >= 1) {
    showPaywall.value = true
    return
  }
  const newCropArea = parseFloat(newArea.value) || 0
  if (totalFieldArea > 0) {
    const existingTotal = crops.value.reduce((sum: number, c: any) => sum + (c.area_ha || 0), 0)
    if (existingTotal + newCropArea > totalFieldArea) {
      alert(`⚠️ Сума площ культур (${(existingTotal + newCropArea).toFixed(2)} га) перевищує загальну площу поля (${totalFieldArea} га).`)
      return
    }
  }
  saving.value = true
  if (newVariety.value.trim() && !varietySuggestions.value.includes(newVariety.value.trim())) {
    await supabase.from('varieties').insert({ crop_type: selectedCrop.value.name, name: newVariety.value.trim() })
  }
  await supabase.from('farm_crops').insert({
    farm_id: farmId,
    crop_type: selectedCrop.value.name,
    catalog_id: selectedCrop.value.id,
    variety: newVariety.value.trim() || null,
    area_ha: parseFloat(newArea.value) || 0,
  })
  selectedCrop.value = null
  cropSearch.value = ''
  newVariety.value = ''
  newArea.value = ''
  showAddCrop.value = false
  saving.value = false
  await load()
}

const deleteCrop = async (crop: any) => {
  if (!confirm(`Видалити ${crop.crop_type}?`)) return
  await supabase.from('farm_crops').delete().eq('id', crop.id)
  await load()
}

let agronTimer: any = null
const searchAgronomists = () => {
  clearTimeout(agronTimer)
  agronTimer = setTimeout(async () => {
    const { data } = await supabase.from('users').select('id, name, agronomist_profiles(specialization)').eq('role', 'agronomist').ilike('name', `%${agronSearch.value}%`).limit(10)
    agronResults.value = data || []
  }, 300)
}

const shareWithAgronomist = async (agron: any) => {
  await supabase.from('field_shares').upsert({ farm_id: farmId, farmer_id: uid, agronomist_id: agron.id }, { onConflict: 'farm_id,agronomist_id' })
  agronSearch.value = ''
  agronResults.value = []
  showShareModal.value = false
  await load()
}

const removeShare = async (shareId: string) => {
  if (!confirm('Забрати доступ?')) return
  await supabase.from('field_shares').delete().eq('id', shareId)
  await load()
}

const closeRotationModal = () => {
  showAddRotation.value = false
  Object.assign(rotationForm, { id: '', year: new Date().getFullYear(), crop_type: '', variety: '', area_ha: '', planned_yield_t: '', actual_yield_t: '', notes: '' })
}

const editRotationRow = (r: any) => {
  Object.assign(rotationForm, { id: r.id, year: r.year, crop_type: r.crop_type, variety: r.variety || '', area_ha: r.area_ha || '', planned_yield_t: r.planned_yield_t || '', actual_yield_t: r.actual_yield_t || '', notes: r.notes || '' })
  showAddRotation.value = true
}

const saveRotation = async () => {
  if (!rotationForm.crop_type || !rotationForm.year) return
  saving.value = true
  const payload = {
    farm_id: farmId,
    year: Number(rotationForm.year),
    crop_type: rotationForm.crop_type,
    variety: rotationForm.variety || null,
    area_ha: parseFloat(rotationForm.area_ha) || null,
    planned_yield_t: parseFloat(rotationForm.planned_yield_t) || null,
    actual_yield_t: parseFloat(rotationForm.actual_yield_t) || null,
    notes: rotationForm.notes || null,
  }
  if (rotationForm.id) {
    await supabase.from('crop_rotation').update(payload).eq('id', rotationForm.id)
  } else {
    await supabase.from('crop_rotation').insert(payload)
  }
  saving.value = false
  closeRotationModal()
  await load()
}

const deleteRotation = async (id: string) => {
  if (!confirm('Видалити запис?')) return
  await supabase.from('crop_rotation').delete().eq('id', id)
  await load()
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
