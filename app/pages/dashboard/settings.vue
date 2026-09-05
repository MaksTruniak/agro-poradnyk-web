<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Налаштування</h1>
        <p class="dash-subtitle">Профіль та параметри акаунту</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-6">
      <div class="card animate-pulse h-64"></div>
      <div class="card animate-pulse h-40"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- Профіль -->
      <div class="card">
        <h2 class="dash-card-title bitter mb-5">Профіль</h2>

        <!-- Аватар -->
        <div class="flex items-center gap-4 mb-5 pb-5 border-b border-agro-border">
          <div class="relative shrink-0">
            <div class="w-16 h-16 rounded-full overflow-hidden bg-agro-hover flex items-center justify-center">
              <img v-if="avatarUrl" :src="avatarUrl" class="w-full h-full object-cover" />
              <span v-else class="text-2xl font-extrabold text-agro" style="font-family:'Bitter',serif;">{{ (form.first_name?.[0] || '?').toUpperCase() }}</span>
            </div>
          </div>
          <div>
            <label class="btn-outline text-sm cursor-pointer inline-flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {{ uploadingAvatar ? 'Завантаження...' : 'Завантажити фото' }}
              <input type="file" accept="image/*" class="hidden" @change="onAvatarPick" :disabled="uploadingAvatar" />
            </label>
            <p class="text-xs text-agro-light mt-1">JPG, PNG до 2 МБ</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Ім'я</label>
              <input v-model="form.first_name" class="input" placeholder="Іван" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Прізвище</label>
              <input v-model="form.last_name" class="input" placeholder="Петренко" />
            </div>
          </div>
          <div v-if="companyLabel">
            <label class="block text-sm font-medium text-agro-dark mb-1.5">{{ companyLabel }}</label>
            <input v-model="form.company_name" class="input" :placeholder="companyPlaceholder" />
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Email</label>
            <input :value="email" class="input bg-agro-bg" disabled />
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Телефон</label>
            <input v-model="form.phone" class="input" placeholder="+380..." />
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Область</label>
            <select v-model="form.region" @change="onAreaChange" class="input">
              <option value="">Оберіть область</option>
              <option v-for="a in areas" :key="a.Ref" :value="a.Description">{{ a.Description }}</option>
            </select>
          </div>
          <div class="relative">
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Населений пункт</label>
            <input v-model="citySearch" @input="onCityInput" class="input" placeholder="Почніть вводити назву..." autocomplete="off" />
            <div v-if="citySuggestions.length" class="absolute z-10 left-0 right-0 bg-white border border-agro-border rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto">
              <button v-for="c in citySuggestions" :key="c.Ref" type="button"
                class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors"
                @click="selectCity(c)">
                {{ c.Present }}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Адреса (вулиця, будинок)</label>
            <input v-model="form.address" class="input" placeholder="Наприклад: вул. Шевченка 12" />
            <p class="text-xs text-agro-light mt-1">Використовується при угодах для самовивозу або доставки</p>
          </div>
        </div>
        <button @click="saveProfile" :disabled="saving" class="btn-primary mt-5">
          {{ saving ? 'Збереження...' : 'Зберегти' }}
        </button>
        <p v-if="saved" class="text-agro text-sm mt-2">✅ Збережено!</p>
      </div>

      <!-- Публічний профіль агронома -->
      <div v-if="isAgronomist" class="card">
        <h2 class="dash-card-title bitter mb-1">Публічний профіль</h2>
        <p class="text-sm text-agro-light mb-4">Поділіться посиланням — фермери зможуть знайти вас та надіслати запит на співпрацю</p>
        <div class="flex items-center gap-2 bg-agro-bg rounded-xl px-4 py-3">
          <span class="text-sm text-agro-dark flex-1 truncate">{{ publicProfileUrl }}</span>
          <button @click="copyProfileUrl" class="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-agro hover:text-agro-dark transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            {{ copied ? 'Скопійовано!' : 'Копіювати' }}
          </button>
        </div>
        <NuxtLink :to="`/agronomist/${uid}`" target="_blank" class="inline-flex items-center gap-1.5 text-sm text-agro hover:underline mt-3">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Переглянути профіль
        </NuxtLink>
      </div>

      <!-- Реквізити -->
      <div class="card">
        <h2 class="dash-card-title bitter mb-1">Реквізити</h2>
        <p class="text-sm text-agro-light mb-5">Використовуються для формування накладних. Заповнювати за потребою.</p>
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">ЄДРПОУ / ІПН</label>
              <input v-model="form.edrpou" class="input" placeholder="12345678" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Назва банку</label>
              <input v-model="form.bank_name" class="input" placeholder="АТ КБ «ПриватБанк»" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">IBAN</label>
            <input v-model="form.iban" class="input" placeholder="UA213996220000026007233566001" />
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Юридична адреса</label>
            <input v-model="form.legal_address" class="input" placeholder="49000, Дніпропетровська обл., м. Дніпро, вул. Шевченка 1" />
          </div>
        </div>
        <button @click="saveProfile" :disabled="saving" class="btn-primary mt-5">
          {{ saving ? 'Збереження...' : 'Зберегти' }}
        </button>
        <p v-if="saved" class="text-agro text-sm mt-2">✅ Збережено!</p>
      </div>

      <!-- Зміна пароля -->
      <div class="card">
        <h2 class="dash-card-title bitter mb-5">Зміна пароля</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Новий пароль</label>
            <input v-model="newPassword" type="password" class="input" placeholder="Мінімум 6 символів" />
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Повторіть пароль</label>
            <input v-model="confirmPassword" type="password" class="input" placeholder="Повторіть новий пароль" />
          </div>
        </div>
        <p v-if="passError" class="text-red-500 text-sm mt-2">{{ passError }}</p>
        <button @click="changePassword" :disabled="savingPass" class="btn-primary mt-5">
          {{ savingPass ? '...' : 'Змінити пароль' }}
        </button>
      </div>

      <!-- Налаштування магазину (тільки для продавця) -->
      <div v-if="isSeller" class="card">
        <h2 class="dash-card-title bitter mb-5">Налаштування магазину</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Назва компанії</label>
            <input v-model="shopForm.company_name" class="input" placeholder="Наприклад: AgroMaks" />
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Регіон</label>
            <input v-model="shopForm.region" class="input" placeholder="Наприклад: Київська обл." />
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Телефон магазину</label>
            <input v-model="shopForm.phone" class="input" placeholder="+380..." />
          </div>
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Опис магазину</label>
            <textarea v-model="shopForm.description" class="input resize-none" rows="3" placeholder="Розкажіть про ваш магазин..." />
          </div>
        </div>
        <button @click="saveShop" :disabled="savingShop" class="btn-primary mt-5">
          {{ savingShop ? 'Збереження...' : 'Зберегти магазин' }}
        </button>
        <p v-if="savedShop" class="text-agro text-sm mt-2">✅ Збережено!</p>
      </div>

      <!-- Доставка (тільки для продавця) -->
      <div v-if="isSeller" class="card">
        <h2 class="dash-card-title bitter mb-5">Способи доставки</h2>
        <div class="space-y-3 mb-5">
          <label v-for="opt in DELIVERY_OPTIONS" :key="opt.key"
            class="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors"
            :class="deliveryOptions.includes(opt.key) ? 'border-agro bg-agro-hover' : 'border-agro-border hover:border-agro'"
          >
            <input type="checkbox" :value="opt.key" v-model="deliveryOptions" class="w-4 h-4 accent-agro" />
            <span class="text-lg">{{ opt.icon }}</span>
            <span class="font-medium text-agro-dark">{{ opt.label }}</span>
          </label>
        </div>
        <div v-if="deliveryOptions.includes('pickup')" class="mb-5">
          <label class="block text-sm font-medium text-agro-dark mb-1.5">Адреса самовивозу</label>
          <input v-model="pickupAddress" class="input" placeholder="Наприклад: м. Київ, вул. Хрещатик, 1" />
        </div>
        <button @click="saveDelivery" :disabled="savingDelivery" class="btn-primary">
          {{ savingDelivery ? 'Збереження...' : 'Зберегти доставку' }}
        </button>
        <p v-if="savedDelivery" class="text-agro text-sm mt-2">✅ Збережено!</p>
      </div>

      <!-- Профілі акаунту -->
      <div class="card">
        <h2 class="dash-card-title bitter mb-1">Профілі акаунту</h2>
        <p class="text-sm text-agro-light mb-4">Підключіть додатковий профіль, щоб використовувати один акаунт і як фермер, і як агроном</p>
        <div class="flex flex-wrap gap-2 mb-4">
          <div
            v-for="r in userRoles"
            :key="r"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style="background:rgb(234,240,222); color:rgb(47,82,51);"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#2F5233" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ ROLE_SHORT_MAP[r] || r }}
          </div>
        </div>
        <div v-if="availableToAdd.length" class="flex flex-wrap gap-2">
          <button
            v-for="r in availableToAdd"
            :key="r"
            @click="addProfile(r)"
            :disabled="addingProfile"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-agro-border text-sm font-semibold text-agro-dark hover:border-agro transition-colors"
          >
            + Додати профіль {{ ROLE_SHORT_MAP[r] }}
          </button>
        </div>
        <p v-else class="text-xs text-agro-light">Усі доступні профілі вже підключені</p>
        <p v-if="profileAdded" class="text-agro text-sm mt-2">✅ Профіль додано! При наступному вході оберіть потрібний.</p>
      </div>

      <!-- Вихід -->
      <div class="card">
        <h2 class="dash-card-title bitter mb-3">Сесія</h2>
        <button @click="logout" class="px-5 py-2.5 border-2 border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors font-semibold text-sm">
          Вийти з акаунту
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Налаштування' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const { confirm: confirmDialog } = useConfirm()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const saved = ref(false)
const savingPass = ref(false)
const savingShop = ref(false)
const savedShop = ref(false)
const passError = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const email = ref('')
const avatarUrl = ref('')
const uploadingAvatar = ref(false)
const copied = ref(false)

const form = reactive({ first_name: '', last_name: '', company_name: '', phone: '', region: '', city: '', address: '', edrpou: '', iban: '', bank_name: '', legal_address: '' })
const areas = ref<any[]>([])
const citySearch = ref('')
const citySuggestions = ref<any[]>([])
let citySearchTimer: any = null
const shopForm = reactive({ company_name: '', region: '', phone: '', description: '' })
const deliveryOptions = ref<string[]>([])
const pickupAddress = ref('')
const savingDelivery = ref(false)
const savedDelivery = ref(false)

const DELIVERY_OPTIONS = [
  { key: 'nova_poshta', label: 'Нова Пошта', icon: '📦' },
  { key: 'ukrposhta', label: 'Укрпошта', icon: '✉️' },
  { key: 'pickup', label: 'Самовивіз', icon: '🏪' },
]

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id
email.value = session?.user?.email || ''

const publicProfileUrl = computed(() => `${import.meta.client ? window.location.origin : ''}/agronomist/${uid}`)
const copyProfileUrl = async () => {
  await navigator.clipboard.writeText(publicProfileUrl.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

const onAvatarPick = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { alert('Файл більше 2 МБ'); return }
  uploadingAvatar.value = true
  const ext = file.name.split('.').pop()
  const path = `avatars/${uid}.${ext}`
  const { error } = await supabase.storage.from('user-avatars').upload(path, file, { upsert: true })
  if (!error) {
    const { data: urlData } = supabase.storage.from('user-avatars').getPublicUrl(path)
    const url = urlData.publicUrl + '?t=' + Date.now()
    avatarUrl.value = url
    await supabase.from('users').update({ avatar_url: url }).eq('id', uid)
  }
  uploadingAvatar.value = false
}

const np = useNovaPost()

// Завантажуємо області першими
const areasData = await np.getAreas().catch(() => [])
areas.value = areasData.sort((a: any, b: any) => a.Description.localeCompare(b.Description, 'uk'))

const { data: profile } = await supabase.from('users').select('name, first_name, last_name, company_name, phone, region, city, role, roles, address, edrpou, iban, bank_name, legal_address, avatar_url').eq('id', uid).single()
if (profile) {
  if (profile.first_name) {
    form.first_name = profile.first_name
    form.last_name = profile.last_name || ''
  } else if (profile.name) {
    const parts = profile.name.trim().split(' ')
    form.first_name = parts[0] || ''
    form.last_name = parts.slice(1).join(' ') || ''
  }
  form.company_name = profile.company_name || ''
  form.phone = profile.phone || ''
  form.region = profile.region || ''
  form.city = profile.city || ''
  citySearch.value = profile.city || ''
  form.address = profile.address || ''
  form.edrpou = profile.edrpou || ''
  form.iban = profile.iban || ''
  form.bank_name = profile.bank_name || ''
  form.legal_address = profile.legal_address || ''
  avatarUrl.value = profile.avatar_url || ''
}

const role = computed(() => profile?.role || '')
const ROLE_SHORT_MAP: Record<string, string> = { farmer: 'Фермер', agronomist: 'Агроном', seller: 'Продавець', buyer: 'Заготівельник' }
const ALL_ADDABLE_ROLES = ['farmer', 'agronomist']
const userRoles = ref<string[]>(profile?.roles?.length ? profile.roles : [profile?.role || 'farmer'])
const isAgronomist = computed(() => role.value === 'agronomist' || userRoles.value.includes('agronomist'))
const availableToAdd = computed(() => ALL_ADDABLE_ROLES.filter(r => !userRoles.value.includes(r)))
const addingProfile = ref(false)
const profileAdded = ref(false)

const addProfile = async (newRole: string) => {
  addingProfile.value = true
  const merged = [...new Set([...userRoles.value, newRole])]
  await supabase.from('users').update({ roles: merged }).eq('id', uid)
  userRoles.value = merged
  profileAdded.value = true
  addingProfile.value = false
  setTimeout(() => { profileAdded.value = false }, 3000)
}
const isSeller = computed(() => role.value === 'seller')
const companyLabel = computed(() => {
  if (role.value === 'farmer') return 'Назва фермерського господарства'
  if (role.value === 'buyer') return 'Назва підприємства або ФОП'
  return ''
})
const companyPlaceholder = computed(() => {
  if (role.value === 'farmer') return 'Наприклад: Фермерське господарство "Колос"'
  if (role.value === 'buyer') return 'Наприклад: ФОП Петренко або ТОВ "Агро"'
  return ''
})

// Buyer crops
const buyerCrops = ref<any[]>([])
const savingCrop = ref(false)
const cropForm = reactive({ crop_type: '', min_qty: null as number | null, max_qty: null as number | null, unit: 'т' })

if (profile?.role === 'buyer') {
  const { data: bc } = await supabase.from('buyer_crops').select('*').eq('user_id', uid).order('created_at')
  buyerCrops.value = bc || []
}

const addBuyerCrop = async () => {
  if (!cropForm.crop_type.trim() || savingCrop.value) return
  savingCrop.value = true
  const { data } = await supabase.from('buyer_crops').insert({
    user_id: uid,
    crop_type: cropForm.crop_type.trim(),
    min_qty: cropForm.min_qty || null,
    max_qty: cropForm.max_qty || null,
    unit: cropForm.unit,
  }).select().single()
  if (data) buyerCrops.value.push(data)
  cropForm.crop_type = ''
  cropForm.min_qty = null
  cropForm.max_qty = null
  cropForm.unit = 'т'
  savingCrop.value = false
}

const deleteBuyerCrop = async (id: string) => {
  if (!await confirmDialog('Культуру буде видалено.', { title: 'Видалити культуру?' })) return
  await supabase.from('buyer_crops').delete().eq('id', id)
  buyerCrops.value = buyerCrops.value.filter((c: any) => c.id !== id)
}

let sellerProfileId: string | null = null
if (isSeller.value) {
  const { data: sp } = await supabase.from('seller_profiles').select('*').eq('user_id', uid).single()
  if (sp) {
    sellerProfileId = sp.id
    shopForm.company_name = sp.company_name || ''
    shopForm.region = sp.region || ''
    shopForm.phone = sp.phone || ''
    shopForm.description = sp.description || ''
    deliveryOptions.value = sp.delivery_options || []
    pickupAddress.value = sp.pickup_address || ''
  }
}
loading.value = false

const saveProfile = async () => {
  saving.value = true
  await supabase.from('users').update({
    name: `${form.first_name} ${form.last_name}`.trim(),
    first_name: form.first_name,
    last_name: form.last_name,
    company_name: form.company_name || null,
    phone: form.phone,
    region: form.region,
    city: form.city,
    address: form.address || null,
    edrpou: form.edrpou || null,
    iban: form.iban || null,
    bank_name: form.bank_name || null,
    legal_address: form.legal_address || null,
  }).eq('id', uid)
  saving.value = false
  saved.value = true
  setTimeout(() => saved.value = false, 3000)
}

const changePassword = async () => {
  passError.value = ''
  if (newPassword.value.length < 6) { passError.value = 'Мінімум 6 символів'; return }
  if (newPassword.value !== confirmPassword.value) { passError.value = 'Паролі не збігаються'; return }
  savingPass.value = true
  const { error } = await supabase.auth.updateUser({ password: newPassword.value })
  savingPass.value = false
  if (error) { passError.value = error.message } else { newPassword.value = ''; confirmPassword.value = ''; alert('✅ Пароль змінено!') }
}

const saveShop = async () => {
  savingShop.value = true
  const payload = {
    company_name: shopForm.company_name,
    region: shopForm.region,
    phone: shopForm.phone,
    description: shopForm.description,
  }
  if (sellerProfileId) {
    await supabase.from('seller_profiles').update(payload).eq('id', sellerProfileId)
  } else {
    const { data } = await supabase.from('seller_profiles').insert({ user_id: uid, ...payload }).select().single()
    if (data) sellerProfileId = data.id
  }
  savingShop.value = false
  savedShop.value = true
  setTimeout(() => savedShop.value = false, 3000)
}

const onAreaChange = () => {
  form.city = ''
  citySearch.value = ''
  citySuggestions.value = []
}

const onCityInput = () => {
  clearTimeout(citySearchTimer)
  const q = citySearch.value.trim()
  if (q.length < 2) { citySuggestions.value = []; return }
  citySearchTimer = setTimeout(async () => {
    const areaRef = areas.value.find((a: any) => a.Description === form.region)?.Ref || ''
    const results = await np.searchSettlements(q, areaRef).catch(() => [])
    citySuggestions.value = results.slice(0, 10)
  }, 300)
}

const selectCity = (c: any) => {
  form.city = c.Present
  citySearch.value = c.Present
  citySuggestions.value = []
}

const saveDelivery = async () => {
  if (!sellerProfileId) return
  savingDelivery.value = true
  await supabase.from('seller_profiles').update({
    delivery_options: deliveryOptions.value,
    pickup_address: deliveryOptions.value.includes('pickup') ? pickupAddress.value : null,
  }).eq('id', sellerProfileId)
  savingDelivery.value = false
  savedDelivery.value = true
  setTimeout(() => savedDelivery.value = false, 3000)
}

const logout = async () => {
  await supabase.auth.signOut()
  router.push('/auth')
}
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-card-title { font-family: 'Bitter', Georgia, serif; font-size: 17px; font-weight: 800; color: rgb(27,46,27); margin: 0; }
</style>
