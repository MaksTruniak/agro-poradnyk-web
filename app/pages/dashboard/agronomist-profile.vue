<template>
  <div class="p-8">
    <h1 class="text-2xl font-extrabold text-agro-dark mb-1">👨‍🌾 Кабінет агронома</h1>
    <p class="text-agro-light mb-6">Привіт, {{ userName }}!</p>

    <div v-if="loading" class="space-y-4">
      <div class="card animate-pulse h-20"></div>
      <div class="card animate-pulse h-28"></div>
    </div>

    <template v-else>
      <!-- Статус верифікації -->
      <div
        class="rounded-2xl px-5 py-4 mb-6 flex items-start gap-3"
        :class="profile?.is_verified ? 'bg-agro-hover border border-agro/30' : 'bg-yellow-50 border border-yellow-200'"
      >
        <span class="text-xl">{{ profile?.is_verified ? '✅' : '⏳' }}</span>
        <div>
          <p class="font-bold text-agro-dark text-sm">{{ profile?.is_verified ? 'Профіль верифіковано' : 'Очікує верифікації' }}</p>
          <p class="text-xs mt-0.5" :class="profile?.is_verified ? 'text-agro' : 'text-yellow-700'">
            {{ profile?.is_verified ? 'Ви відображаєтесь у маркетплейсі агрономів' : 'Заповніть профіль повністю — адміністратор перевірить' }}
          </p>
        </div>
      </div>


      <!-- Вкладки -->
      <div class="flex bg-agro-hover rounded-2xl p-1 mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="activeTab === tab.key ? 'bg-agro text-white shadow-sm' : 'text-agro-light hover:text-agro'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- ОСНОВНЕ -->
      <div v-if="activeTab === 'main'" class="space-y-5">
        <div class="card">
          <div class="flex items-center justify-between mb-5">
            <div>
              <p class="font-bold text-agro-dark">Доступність</p>
              <p class="text-xs text-agro-light mt-0.5">Приймаєте нових клієнтів?</p>
            </div>
            <button
              @click="form.is_available = !form.is_available"
              class="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors"
              :class="form.is_available ? 'bg-agro border-agro text-white' : 'border-agro-border text-agro-light'"
            >
              {{ form.is_available ? 'Так ✓' : 'Ні' }}
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Регіон роботи</label>
              <input v-model="form.region" class="input" placeholder="Наприклад: Львівська область" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Досвід (років)</label>
                <input v-model="form.experience_years" class="input" type="number" placeholder="10" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Ставка (грн/год)</label>
                <input v-model="form.rate_per_hour" class="input" type="number" placeholder="350" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Про себе</label>
              <textarea v-model="form.bio" class="input resize-none" rows="4" placeholder="Розкажіть про свій підхід до роботи..." />
            </div>
          </div>

          <!-- Рейтинг та відгуки -->
          <div v-if="profile?.rating || profile?.reviews_count" class="flex gap-6 mt-5 pt-5 border-t border-agro-border">
            <div>
              <p class="text-xl font-extrabold text-agro-dark">⭐ {{ profile.rating?.toFixed(1) || '0.0' }}</p>
              <p class="text-xs text-agro-light mt-0.5">Рейтинг</p>
            </div>
            <div>
              <p class="text-xl font-extrabold text-agro-dark">{{ profile.reviews_count || 0 }}</p>
              <p class="text-xs text-agro-light mt-0.5">Відгуків</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ОСВІТА -->
      <div v-if="activeTab === 'education'" class="space-y-4">
        <!-- Диплом -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="font-bold text-agro-dark">🎓 Диплом / сертифікат</p>
              <p class="text-xs text-agro-light mt-0.5">Профільна освіта або курси</p>
            </div>
            <button
              @click="form.has_degree = !form.has_degree"
              class="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors"
              :class="form.has_degree ? 'bg-agro border-agro text-white' : 'border-agro-border text-agro-light'"
            >
              {{ form.has_degree ? 'Є ✓' : 'Немає' }}
            </button>
          </div>

          <div v-if="form.has_degree" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Навчальний заклад</label>
              <input v-model="form.institution" class="input" placeholder="Наприклад: Львівський аграрний університет" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Спеціальність</label>
              <input v-model="form.education" class="input" placeholder="Наприклад: Агрономія" />
            </div>
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Рік закінчення</label>
              <input v-model="form.education_year" class="input" type="number" placeholder="2010" />
            </div>
          </div>

          <div v-else class="text-center py-4 text-agro-light text-sm">
            Освіта відсутня
          </div>
        </div>

        <!-- Практичний досвід -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="font-bold text-agro-dark">🌾 Практичний досвід</p>
              <p class="text-xs text-agro-light mt-0.5">Роки роботи в полі без диплому</p>
            </div>
            <button
              @click="form.has_experience = !form.has_experience"
              class="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors"
              :class="form.has_experience ? 'bg-agro border-agro text-white' : 'border-agro-border text-agro-light'"
            >
              {{ form.has_experience ? 'Є ✓' : 'Немає' }}
            </button>
          </div>

          <div v-if="form.has_experience" class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-agro-dark mb-1.5">Опишіть досвід</label>
              <textarea
                v-model="form.experience_description"
                class="input resize-none"
                rows="5"
                placeholder="Наприклад: 15 років вирощую смородину на власному господарстві 5га. З 2015 консультую сусідів..."
              />
            </div>
            <div class="bg-agro-hover rounded-xl p-3 text-sm text-agro">
              💡 Практики верифікуються після 5 відгуків від реальних клієнтів
            </div>
          </div>

          <div v-else class="text-center py-4 text-agro-light text-sm">
            Практичний досвід не вказано
          </div>
        </div>
      </div>

      <!-- КУЛЬТУРИ -->
      <div v-if="activeTab === 'crops'" class="card">
        <p class="font-bold text-agro-dark mb-1">Культури з якими працюєте</p>
        <p class="text-xs text-agro-light mb-4">Оберіть категорію, потім культури</p>

        <!-- Категорії -->
        <div v-if="loadingCrops" class="text-agro-light text-sm text-center py-4">Завантаження...</div>
        <template v-else>
          <div class="flex gap-2 flex-wrap mb-4">
            <button
              v-for="cat in categories"
              :key="cat.name"
              @click="activeCategory = cat.name"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-sm font-medium transition-colors"
              :class="activeCategory === cat.name ? 'border-agro bg-agro text-white' : 'border-agro-border text-agro-light hover:border-agro'"
            >
              <span>{{ cat.emoji }}</span>
              <span>{{ cat.name }}</span>
            </button>
          </div>

          <!-- Культури категорії -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            <button
              v-for="crop in cropsInCategory"
              :key="crop.name"
              @click="toggleCrop(crop.name)"
              class="flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-colors text-left"
              :class="selectedCrops.includes(crop.name)
                ? 'border-agro bg-agro-hover text-agro'
                : 'border-agro-border text-agro-light hover:border-agro'"
            >
              <span>{{ crop.emoji || '🌱' }}</span>
              <span>{{ crop.name }}</span>
            </button>
          </div>

          <!-- Обрані -->
          <div v-if="selectedCrops.length" class="border-t border-agro-border pt-4">
            <p class="text-sm font-semibold text-agro mb-2">✅ Обрано: {{ selectedCrops.length }}</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="crop in selectedCrops"
                :key="crop"
                @click="toggleCrop(crop)"
                class="text-xs bg-agro-hover text-agro px-3 py-1 rounded-full border border-agro/30 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
              >
                {{ crop }} ✕
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- Кнопка збереження -->
      <div class="mt-6">
        <button @click="saveProfile" :disabled="saving" class="btn-primary w-full py-3.5 text-base">
          {{ saving ? 'Збереження...' : 'Зберегти профіль' }}
        </button>
        <p v-if="saved" class="text-agro text-sm text-center mt-3">✅ Профіль збережено!</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()

const loading = ref(true)
const loadingCrops = ref(true)
const saving = ref(false)
const saved = ref(false)
const activeTab = ref<'main' | 'education' | 'crops'>('main')
const activeCategory = ref('')

const userName = ref('')
const profile = ref<any>(null)
const stats = ref({ clients: 0, fields: 0, chats: 0 })
const categories = ref<any[]>([])
const allCrops = ref<any[]>([])
const selectedCrops = ref<string[]>([])

const tabs = [
  { key: 'main', label: '📋 Основне' },
  { key: 'education', label: '🎓 Освіта' },
  { key: 'crops', label: '🌱 Культури' },
]

const form = reactive({
  is_available: true,
  region: '',
  experience_years: '',
  rate_per_hour: '',
  bio: '',
  has_degree: false,
  institution: '',
  education: '',
  education_year: '',
  has_experience: false,
  experience_description: '',
})

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

// Профіль користувача
const { data: userData } = await supabase.from('users').select('name').eq('id', uid).single()
userName.value = userData?.name || ''

// Профіль агронома
const { data: profileData } = await supabase.from('agronomist_profiles').select('*').eq('user_id', uid).single()
if (profileData) {
  profile.value = profileData
  form.is_available = profileData.is_available ?? true
  form.region = profileData.region || ''
  form.experience_years = profileData.experience_years?.toString() || ''
  form.rate_per_hour = profileData.rate_per_hour?.toString() || ''
  form.bio = profileData.bio || ''
  form.has_degree = profileData.has_degree || false
  form.institution = profileData.institution || ''
  form.education = profileData.education || ''
  form.education_year = profileData.education_year?.toString() || ''
  form.has_experience = profileData.has_experience || false
  form.experience_description = profileData.experience_description || ''
  selectedCrops.value = profileData.crops_expertise || []
}

// Статистика
const [sharesRes, chatsRes] = await Promise.all([
  supabase.from('field_shares').select('farm_id, farmer_id').eq('agronomist_id', uid).eq('status', 'accepted'),
  supabase.from('chats').select('*', { count: 'exact', head: true }).eq('agronomist_id', uid).eq('type', 'human'),
])
stats.value = {
  clients: new Set((sharesRes.data || []).map((s: any) => s.farmer_id)).size,
  fields: sharesRes.data?.length || 0,
  chats: chatsRes.count || 0,
}

loading.value = false

// Каталог культур
const [catsRes, cropsRes] = await Promise.all([
  supabase.from('crop_categories').select('name, emoji').order('order_num', { ascending: true }),
  supabase.from('crop_catalog').select('name, emoji, crop_categories(name)').order('name'),
])
categories.value = catsRes.data || []
allCrops.value = (cropsRes.data || []).map((c: any) => ({
  name: c.name,
  emoji: c.emoji || '🌱',
  category: c.crop_categories?.name || '',
}))
if (categories.value.length) activeCategory.value = categories.value[0].name
loadingCrops.value = false

const cropsInCategory = computed(() =>
  allCrops.value.filter(c => c.category === activeCategory.value)
)

const toggleCrop = (name: string) => {
  if (selectedCrops.value.includes(name)) {
    selectedCrops.value = selectedCrops.value.filter(c => c !== name)
  } else {
    selectedCrops.value = [...selectedCrops.value, name]
  }
}

const saveProfile = async () => {
  saving.value = true

  // Автоматично формуємо спеціалізацію з категорій обраних культур
  const selectedCategories = [...new Set(
    selectedCrops.value
      .map(cropName => allCrops.value.find(c => c.name === cropName)?.category)
      .filter(Boolean)
  )]
  const autoSpecialization = selectedCategories.join(', ')

  const payload = {
    user_id: uid,
    is_available: form.is_available,
    region: form.region,
    experience_years: parseInt(form.experience_years as string) || 0,
    rate_per_hour: parseFloat(form.rate_per_hour as string) || 0,
    bio: form.bio,
    specialization: autoSpecialization,
    has_degree: form.has_degree,
    institution: form.has_degree ? form.institution : null,
    education: form.has_degree ? form.education : null,
    education_year: form.has_degree ? (parseInt(form.education_year as string) || null) : null,
    has_experience: form.has_experience,
    experience_description: form.has_experience ? form.experience_description : null,
    crops_expertise: selectedCrops.value,
  }

  if (profile.value) {
    await supabase.from('agronomist_profiles').update(payload).eq('id', profile.value.id)
  } else {
    const { data } = await supabase.from('agronomist_profiles').insert(payload).select().single()
    profile.value = data
  }

  saving.value = false
  saved.value = true
  setTimeout(() => saved.value = false, 3000)
}
</script>
