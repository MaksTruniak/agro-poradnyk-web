<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h2M9 16h2M13 12h2M13 16h2"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Облік збору</h1>
        <p class="dash-subtitle">Сезони збору врожаю і облік працівників</p>
      </div>
      <button v-if="hasAccess && tab === 'seasons'" @click="openCreate" class="dash-btn-primary shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Створити облік
      </button>
      <button v-else-if="hasAccess" @click="openCreateWorker" class="dash-btn-primary shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Додати збирача
      </button>
    </div>

    <!-- Обмеження плану -->
    <div v-if="hasAccess === false" class="card flex flex-col items-center text-center py-16 gap-4">
      <div class="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(180,120,0)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      </div>
      <div>
        <p class="font-bold text-agro-dark text-lg">Функція доступна на планах Business і Business Pro</p>
        <p class="text-agro-light text-sm mt-1">Оновіть підписку щоб отримати доступ до обліку збору врожаю та управління збирачами</p>
      </div>
      <NuxtLink to="/dashboard/subscription" class="dash-btn-primary mt-2">Оновити план</NuxtLink>
    </div>

    <!-- Вкладки -->
    <template v-else-if="hasAccess">
    <div class="flex gap-1 mb-6 bg-white border border-agro-border rounded-xl p-1 w-fit">
      <button @click="tab='seasons'" class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
        :class="tab==='seasons' ? 'bg-agro text-white' : 'text-agro-light hover:text-agro-dark'">Обліки</button>
      <button @click="tab='workers'" class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
        :class="tab==='workers' ? 'bg-agro text-white' : 'text-agro-light hover:text-agro-dark'">Збирачі</button>
    </div>

    <!-- Обліки -->
    <template v-if="tab === 'seasons'">
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="card animate-pulse h-24"></div>
    </div>

    <template v-else>
      <div v-if="!seasons.length" class="card flex flex-col items-center justify-center text-center py-16">
        <div class="dash-empty-icon mx-auto mb-4">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h2M9 16h2M13 12h2M13 16h2"/>
          </svg>
        </div>
        <p class="font-bold text-agro-dark text-lg mb-2">Немає активних обліків</p>
        <p class="text-agro-light text-sm mb-6">Створіть перший облік збору врожаю</p>
        <button @click="openCreate" class="dash-btn-primary">Створити облік</button>
      </div>

      <div v-else class="space-y-4">
        <div v-for="s in seasons" :key="s.id" class="card flex items-center gap-4 hover:shadow-md transition-shadow">
          <NuxtLink :to="`/dashboard/harvest/${s.id}`" class="flex items-center gap-4 flex-1 min-w-0 cursor-pointer">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              :class="s.status === 'active' ? 'bg-green-50' : 'bg-gray-100'">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="s.status === 'active' ? 'rgb(47,82,51)' : 'rgb(150,150,150)'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-bold text-agro-dark">{{ s.crop }}<span v-if="s.variety" class="font-normal text-agro-light ml-1">({{ s.variety }})</span></p>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="s.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'">
                  {{ s.status === 'active' ? 'Активний' : 'Завершений' }}
                </span>
              </div>
              <p class="text-sm text-agro-light mt-0.5">{{ s.price_per_kg }} грн/кг · {{ s._workers }} {{ workerWord(s._workers) }} · створено {{ formatDate(s.created_at) }}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="font-extrabold text-agro text-lg">{{ s._total_kg.toFixed(1) }} кг</p>
              <p class="text-xs text-agro-light">зібрано</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(150,150,150)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </NuxtLink>
          <button @click="confirmDelete(s)" class="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          </button>
        </div>
      </div>

      <!-- Підтвердження видалення -->
      <div v-if="deleteTarget" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="deleteTarget=null">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
          <h2 class="text-xl font-bold text-agro-dark mb-2">Видалити облік?</h2>
          <p class="text-sm text-agro-light mb-1">{{ deleteTarget.crop }}<span v-if="deleteTarget.variety"> ({{ deleteTarget.variety }})</span></p>
          <p class="text-sm text-red-500 mb-6">Будуть видалені всі записи зважувань, виплат і працівники цього обліку.</p>
          <div class="flex gap-3">
            <button @click="deleteTarget=null" class="btn-outline flex-1 justify-center">Скасувати</button>
            <button @click="deleteSeason" :disabled="deleting" class="flex-1 h-10 rounded-[10px] bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors">
              {{ deleting ? 'Видалення...' : 'Видалити' }}
            </button>
          </div>
        </div>
      </div>
    </template>
    </template>

    <!-- Збирачі -->
    <template v-if="tab === 'workers'">
      <div v-if="workersLoading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="card animate-pulse h-20"></div>
      </div>
      <template v-else>
        <div v-if="!workers.length" class="card flex flex-col items-center justify-center text-center py-16">
          <div class="dash-empty-icon mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <p class="font-bold text-agro-dark text-lg mb-2">Немає збирачів</p>
          <p class="text-agro-light text-sm mb-6">Додайте першого збирача врожаю</p>
          <button @click="openCreateWorker" class="dash-btn-primary">Додати збирача</button>
        </div>
        <div v-else class="space-y-3">
          <div v-for="w in workers" :key="w.id" class="card flex items-center gap-4">
            <NuxtLink :to="`/dashboard/harvest/workers/${w.id}`" class="flex items-center gap-4 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center shrink-0 font-bold text-agro text-sm">
                {{ w.first_name[0] }}{{ w.last_name[0] }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-agro-dark">{{ w.first_name }} {{ w.last_name }}</p>
                <p class="text-sm text-agro-light mt-0.5">{{ w.phone }}<span v-if="w.email"> · {{ w.email }}</span></p>
              </div>
              <p class="text-xs text-agro-light shrink-0">{{ w._seasons }} {{ seasonWord(w._seasons) }}</p>
            </NuxtLink>
            <button @click="confirmDeleteWorker(w)" class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </div>
        </div>
      </template>

      <!-- Підтвердження видалення збирача -->
      <div v-if="deleteWorkerTarget" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="deleteWorkerTarget=null">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
          <h2 class="text-xl font-bold text-agro-dark mb-2">Видалити збирача?</h2>
          <p class="text-sm text-agro-light mb-6">{{ deleteWorkerTarget.first_name }} {{ deleteWorkerTarget.last_name }} буде видалений з усіх обліків.</p>
          <div class="flex gap-3">
            <button @click="deleteWorkerTarget=null" class="btn-outline flex-1 justify-center">Скасувати</button>
            <button @click="deleteWorker" :disabled="deletingWorker" class="flex-1 h-10 rounded-[10px] bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors">
              {{ deletingWorker ? 'Видалення...' : 'Видалити' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Модал додавання збирача -->
      <div v-if="showCreateWorker" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showCreateWorker=false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <h2 class="text-xl font-bold text-agro-dark mb-6 bitter">Новий збирач</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-agro-dark mb-1.5">Ім'я *</label>
                <input v-model="wForm2.first_name" class="input" placeholder="Іван" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-agro-dark mb-1.5">Прізвище *</label>
                <input v-model="wForm2.last_name" class="input" placeholder="Петренко" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-agro-dark mb-1.5">Телефон * <span class="font-normal text-agro-light">(для входу)</span></label>
              <input v-model="wForm2.phone" type="tel" class="input" placeholder="+380..." />
            </div>
            <div class="border-t border-agro-border pt-4">
              <label class="block text-sm font-semibold text-agro-dark mb-1.5">Пароль *</label>
              <div class="relative">
                <input v-model="wForm2.password" :type="showPassword ? 'text' : 'password'" class="input pr-10" placeholder="Мінімум 6 символів" />
                <button type="button" @click="showPassword=!showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light hover:text-agro-dark transition-colors">
                  <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
              <p class="text-xs text-agro-light mt-2">Збирач входить за номером телефону + пароль.</p>
            </div>
          </div>
          <p v-if="wFormError" class="text-red-500 text-sm mt-3">{{ wFormError }}</p>
          <div class="flex gap-3 mt-6">
            <button @click="showCreateWorker=false" class="btn-outline flex-1">Скасувати</button>
            <button @click="createWorker" :disabled="wSaving2" class="btn-primary flex-1">
              {{ wSaving2 ? 'Збереження...' : 'Додати' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Модал створення сезону -->
    <div v-if="showCreate" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showCreate=false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h2 class="text-xl font-bold text-agro-dark mb-6 bitter">Новий облік збору</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-agro-dark mb-1.5">Поле / культура *</label>
            <div v-if="farmCropsLoading" class="input text-agro-light text-sm">Завантаження...</div>
            <UiAppSelect v-else v-model="form.farm_crop_id"
              :options="[{ value: '', label: '— Виберіть поле —' }, ...farmCrops.map(fc => ({ value: fc.id, label: `${fc.crop_type}${fc.variety ? ` (${fc.variety})` : ''} · ${fc.farms?.name}` }))]"
              @update:modelValue="onCropSelect" />
          </div>
          <div v-if="form.farm_crop_id">
            <label class="block text-sm font-semibold text-agro-dark mb-1.5">Ціна за кг (грн) *</label>
            <input v-model="form.price_per_kg" type="number" step="0.01" min="0" class="input" placeholder="0.00" />
          </div>
        </div>
        <p v-if="createSeasonError" class="text-red-500 text-sm mt-3">{{ createSeasonError }}</p>
        <div class="flex gap-3 mt-8">
          <button @click="showCreate=false" class="btn-outline flex-1 justify-center">Скасувати</button>
          <button @click="createSeason" :disabled="saving || !form.farm_crop_id || !form.price_per_kg" class="btn-primary flex-1 justify-center">
            {{ saving ? 'Збереження...' : 'Створити' }}
          </button>
        </div>
      </div>
    </div>
    </template><!-- end v-else-if hasAccess -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const supabase = useSupabaseClient()
const router = useRouter()

const route = useRoute()
const tab = ref<'seasons'|'workers'>(route.query.tab === 'workers' ? 'workers' : 'seasons')

const loading = ref(true)
const seasons = ref<any[]>([])
const showCreate = ref(false)
const saving = ref(false)
const form = reactive({ farm_crop_id: '', crop: '', variety: '', price_per_kg: '' })

const farmCrops = ref<any[]>([])
const farmCropsLoading = ref(true)

// Збирачі
const workers = ref<any[]>([])
const workersLoading = ref(false)
const showCreateWorker = ref(false)
const wSaving2 = ref(false)
const wFormError = ref('')
const showPassword = ref(false)
const wForm2 = reactive({ first_name: '', last_name: '', phone: '', email: '', password: '' })
const deleteWorkerTarget = ref<any>(null)
const deletingWorker = ref(false)

const seasonWord = (n: number) => n === 1 ? 'облік' : n >= 2 && n <= 4 ? 'обліки' : 'обліків'

const loadWorkers = async () => {
  workersLoading.value = true
  const { data: { session } } = await supabase.auth.getSession()
  const { data } = await supabase
    .from('harvest_workers')
    .select('*')
    .eq('owner_id', session!.user.id)
    .order('first_name')
  workers.value = (data || []).map((w: any) => ({ ...w, _seasons: 0 }))
  workersLoading.value = false
}

watch(tab, (t) => { if (t === 'workers') loadWorkers() }, { immediate: true })

const openCreateWorker = () => {
  Object.assign(wForm2, { first_name: '', last_name: '', phone: '', email: '', password: '' })
  wFormError.value = ''
  showPassword.value = false
  showCreateWorker.value = true
}

const createWorker = async () => {
  if (!wForm2.first_name || !wForm2.last_name || !wForm2.phone || !wForm2.password) {
    wFormError.value = 'Заповніть всі обов\'язкові поля'; return
  }
  if (wForm2.password.length < 6) { wFormError.value = 'Пароль мінімум 6 символів'; return }
  wSaving2.value = true; wFormError.value = ''
  const { data: { session } } = await supabase.auth.getSession()
  try {
    await $fetch('/api/harvest/create-worker', {
      method: 'POST',
      body: { owner_id: session!.user.id, ...wForm2 },
    })
    showCreateWorker.value = false
    await loadWorkers()
  } catch (e: any) {
    wFormError.value = e?.data?.message || 'Помилка збереження'
  } finally {
    wSaving2.value = false
  }
}

const confirmDeleteWorker = (w: any) => { deleteWorkerTarget.value = w }

const deleteWorker = async () => {
  deletingWorker.value = true
  await supabase.from('harvest_workers').delete().eq('id', deleteWorkerTarget.value.id)
  workers.value = workers.value.filter(w => w.id !== deleteWorkerTarget.value.id)
  deletingWorker.value = false
  deleteWorkerTarget.value = null
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
const workerWord = (n: number) => n === 1 ? 'працівник' : n >= 2 && n <= 4 ? 'працівники' : 'працівників'

const hasAccess = ref<boolean | null>(null)

const load = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const uid = session.user.id

  const { data: sub } = await supabase
    .from('subscriptions').select('plan, expires_at').eq('user_id', uid).maybeSingle()
  const activePlan = (sub && (!sub.expires_at || new Date(sub.expires_at) > new Date())) ? sub.plan : 'basic'
  hasAccess.value = activePlan === 'business' || activePlan === 'business_pro'
  if (!hasAccess.value) { loading.value = false; return }

  const { data: seasonsData } = await supabase
    .from('harvest_seasons')
    .select('*')
    .eq('owner_id', uid)
    .order('created_at', { ascending: false })

  if (!seasonsData?.length) { loading.value = false; return }

  const seasonIds = seasonsData.map((s: any) => s.id)

  const [workersRes, recordsRes] = await Promise.all([
    supabase.from('harvest_season_workers').select('season_id').in('season_id', seasonIds),
    supabase.from('harvest_records').select('season_id, weight_kg').in('season_id', seasonIds),
  ])

  const workerCount: Record<string, number> = {}
  for (const w of (workersRes.data || [])) workerCount[w.season_id] = (workerCount[w.season_id] || 0) + 1

  const totalKg: Record<string, number> = {}
  for (const r of (recordsRes.data || [])) totalKg[r.season_id] = (totalKg[r.season_id] || 0) + Number(r.weight_kg)

  seasons.value = seasonsData.map((s: any) => ({
    ...s,
    _workers: workerCount[s.id] || 0,
    _total_kg: totalKg[s.id] || 0,
  }))
  loading.value = false
}

const onCropSelect = (val?: string | number) => {
  const id = val ?? form.farm_crop_id
  const fc = farmCrops.value.find(fc => fc.id === id)
  if (fc) { form.crop = fc.crop_type; form.variety = fc.variety || '' }
}

const openCreate = async () => {
  form.farm_crop_id = ''; form.crop = ''; form.variety = ''; form.price_per_kg = ''
  showCreate.value = true
  farmCropsLoading.value = true
  const { data: { session } } = await supabase.auth.getSession()
  const { data: farmsData } = await supabase.from('farms').select('id').eq('user_id', session!.user.id)
  const farmIds = (farmsData || []).map((f: any) => f.id)
  if (farmIds.length) {
    const { data } = await supabase
      .from('farm_crops')
      .select('id, crop_type, variety, farm_id, farms(name)')
      .in('farm_id', farmIds)
      .order('crop_type')
    farmCrops.value = data || []
  }
  farmCropsLoading.value = false
}

const createSeasonError = ref('')
const createSeason = async () => {
  if (!form.farm_crop_id || !form.price_per_kg) return
  saving.value = true
  createSeasonError.value = ''
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase.from('harvest_seasons').insert({
    owner_id: session!.user.id,
    farm_crop_id: form.farm_crop_id,
    crop: form.crop,
    variety: form.variety || null,
    price_per_kg: Number(form.price_per_kg),
    status: 'active',
  }).select().single()
  saving.value = false
  console.log('createSeason', data, error)
  if (error) { createSeasonError.value = error.message; return }
  if (data) {
    showCreate.value = false
    router.push(`/dashboard/harvest/${data.id}`)
  }
}

const deleteTarget = ref<any>(null)
const deleting = ref(false)

const confirmDelete = (s: any) => { deleteTarget.value = s }

const deleteSeason = async () => {
  if (!deleteTarget.value) return
  deleting.value = true
  await supabase.from('harvest_seasons').delete().eq('id', deleteTarget.value.id)
  seasons.value = seasons.value.filter(s => s.id !== deleteTarget.value.id)
  deleting.value = false
  deleteTarget.value = null
}

onMounted(load)
</script>
