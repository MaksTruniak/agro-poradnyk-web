<template>
  <div class="p-8">
    <h1 class="text-2xl font-extrabold text-agro-dark mb-8">⚙️ Налаштування</h1>

    <div v-if="loading" class="space-y-6">
      <div class="card animate-pulse h-64"></div>
      <div class="card animate-pulse h-40"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- Профіль -->
      <div class="card">
        <h2 class="font-bold text-agro-dark mb-5 text-lg">👤 Профіль</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-agro-dark mb-1.5">Ім'я</label>
            <input v-model="form.name" class="input" placeholder="Ваше ім'я" />
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
        </div>
        <button @click="saveProfile" :disabled="saving" class="btn-primary mt-5">
          {{ saving ? 'Збереження...' : 'Зберегти' }}
        </button>
        <p v-if="saved" class="text-agro text-sm mt-2">✅ Збережено!</p>
      </div>

      <!-- Зміна пароля -->
      <div class="card">
        <h2 class="font-bold text-agro-dark mb-5 text-lg">🔒 Зміна пароля</h2>
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
        <h2 class="font-bold text-agro-dark mb-5 text-lg">🏪 Налаштування магазину</h2>
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
        <h2 class="font-bold text-agro-dark mb-5 text-lg">🚚 Способи доставки</h2>
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

      <!-- Вихід -->
      <div class="card">
        <h2 class="font-bold text-agro-dark mb-3 text-lg">🚪 Сесія</h2>
        <button @click="logout" class="px-5 py-2.5 border-2 border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors font-semibold text-sm">
          Вийти з акаунту
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
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

const form = reactive({ name: '', phone: '', region: '', city: '' })
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

const np = useNovaPost()

// Завантажуємо області першими
const areasData = await np.getAreas().catch(() => [])
areas.value = areasData.sort((a: any, b: any) => a.Description.localeCompare(b.Description, 'uk'))

const { data: profile } = await supabase.from('users').select('name, phone, region, city, role').eq('id', uid).single()
if (profile) {
  form.name = profile.name || ''
  form.phone = profile.phone || ''
  form.region = profile.region || ''
  form.city = profile.city || ''
  citySearch.value = profile.city || ''
}

const isSeller = computed(() => profile?.role === 'seller')

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
  await supabase.from('users').update({ name: form.name, phone: form.phone, region: form.region, city: form.city }).eq('id', uid)
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
