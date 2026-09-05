<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Кабінет агронома</h1>
        <p class="dash-subtitle">Привіт, {{ userName }}!</p>
      </div>
    </div>

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
        <span class="flex items-center justify-center w-6 h-6">
          <svg v-if="profile?.is_verified" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </span>
        <div>
          <p class="font-bold text-agro-dark text-sm">{{ profile?.is_verified ? 'Профіль верифіковано' : 'Очікує верифікації' }}</p>
          <p class="text-xs mt-0.5" :class="profile?.is_verified ? 'text-agro' : 'text-yellow-700'">
            {{ profile?.is_verified ? 'Ви відображаєтесь у маркетплейсі агрономів' : 'Заповніть профіль повністю — адміністратор перевірить' }}
          </p>
        </div>
      </div>


      <!-- Вкладки -->
      <div class="flex rounded-[14px] p-[5px] mb-6" style="background:rgb(241,239,227)">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="activeTab === tab.key ? 'bg-white shadow-sm text-agro-dark' : 'text-agro-light hover:text-agro-dark'"
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
              <p class="text-xl font-extrabold text-agro-dark flex items-center gap-1.5"><svg width="15" height="15" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> {{ profile.rating?.toFixed(1) || '0.0' }}</p>
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
              <p class="font-bold text-agro-dark flex items-center gap-1.5"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> Диплом / сертифікат</p>
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
              <p class="font-bold text-agro-dark flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V8"/><path d="M5 12C5 12 3 10 3 7c2.5 0 4.5 2 5 4"/><path d="M19 12C19 12 21 10 21 7c-2.5 0-4.5 2-5 4"/><path d="M12 8C12 8 10 6 10 3c2 0 3.5 1.5 4 3"/><path d="M12 8C12 8 14 6 14 3c-2 0-3.5 1.5-4 3"/></svg> Практичний досвід</p>
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="categoryIcon(cat.name)" />
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
              <img :src="`/crops/${cropToSlug(crop.name)}.svg`" :alt="crop.name" class="w-4 h-4 object-contain shrink-0" @error="($event.target as HTMLImageElement).style.display='none'" />
              <span>{{ crop.name }}</span>
            </button>
          </div>

          <!-- Обрані -->
          <div v-if="selectedCrops.length" class="border-t border-agro-border pt-4">
            <p class="text-sm font-semibold text-agro mb-2 flex items-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Обрано: {{ selectedCrops.length }}</p>
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

      <!-- ВІДГУКИ -->
      <div v-if="activeTab === 'reviews'" class="space-y-4">
        <div v-if="!myReviews.length" class="card text-center py-12">
          <div style="width:48px;height:48px;border-radius:14px;background:rgb(238,241,227);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <p class="font-bold text-agro-dark mb-1">Відгуків поки немає</p>
          <p class="text-sm text-agro-light">Відгуки з'являться після завершення угод</p>
        </div>
        <div v-else>
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center gap-1.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span class="text-xl font-extrabold text-agro-dark">{{ profile?.rating?.toFixed(1) || '0.0' }}</span>
            </div>
            <span class="text-agro-light text-sm">{{ myReviews.length }} {{ myReviews.length === 1 ? 'відгук' : myReviews.length < 5 ? 'відгуки' : 'відгуків' }}</span>
          </div>
          <div v-for="r in myReviews" :key="r.id" class="card mb-3">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-agro-hover flex items-center justify-center font-bold text-agro text-sm shrink-0">
                  {{ r.farmer_name?.[0]?.toUpperCase() || '?' }}
                </div>
                <div>
                  <p class="font-semibold text-agro-dark text-sm">{{ r.farmer_name }}</p>
                  <p class="text-xs text-agro-light">{{ formatDate(r.created_at) }}</p>
                </div>
              </div>
              <div class="flex gap-0.5 shrink-0">
                <svg v-for="s in 5" :key="s" width="14" height="14" viewBox="0 0 24 24" :fill="s <= r.rating ? 'rgb(180,130,40)' : 'rgb(220,220,220)'" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
            </div>
            <div class="bg-agro-bg rounded-xl px-3 py-2 mb-2">
              <p class="text-xs font-semibold text-agro-dark mb-0.5">Проблема:</p>
              <p class="text-sm text-agro-dark">{{ r.problem_solved }}</p>
            </div>
            <p v-if="r.text" class="text-sm text-agro-dark leading-relaxed">{{ r.text }}</p>
          </div>
        </div>
      </div>

      <!-- Кнопка збереження (не для відгуків) -->
      <div v-if="activeTab !== 'reviews'" class="mt-6">
        <button @click="saveProfile" :disabled="saving" class="btn-primary w-full py-3.5 text-base inline-flex items-center justify-center gap-2">
          <svg v-if="!saving" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {{ saving ? 'Збереження...' : 'Зберегти профіль' }}
        </button>
        <p v-if="saved" class="text-agro text-sm text-center mt-3 flex items-center justify-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Профіль збережено!</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Кабінет агронома' })
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const { cropToSlug } = await import('~/utils/cropSlugs')

const CATEGORY_ICONS: Record<string, string> = {
  'Ягоди':     '<circle cx="8" cy="14" r="3"/><circle cx="16" cy="14" r="3"/><circle cx="12" cy="9" r="3"/><path d="M12 6V3"/>',
  'Фрукти':    '<path d="M12 2a4 4 0 014 4c0 3-2 5-4 9-2-4-4-6-4-9a4 4 0 014-4z"/><path d="M12 2c1-1 2.5-1 3-0.5"/>',
  'Овочі':     '<path d="M12 22V10"/><path d="M12 10C12 10 7 7 7 3c2 0 4 1.5 5 3.5C13 4.5 15 3 17 3c0 4-5 7-5 7z"/>',
  'Зернові':   '<path d="M12 22V8"/><path d="M5 12C5 12 3 10 3 7c2.5 0 4.5 2 5 4"/><path d="M19 12C19 12 21 10 21 7c-2.5 0-4.5 2-5 4"/><path d="M12 8C12 8 10 6 10 3c2 0 3.5 1.5 4 3"/><path d="M12 8C12 8 14 6 14 3c-2 0-3.5 1.5-4 3"/>',
  'Баштанні':  '<ellipse cx="12" cy="13" rx="8" ry="6"/><path d="M12 7V4"/><path d="M9 4c1 1 2 2 3 3"/><path d="M9 13c1-1.5 3-2 4-1"/>',
  'Технічні':  '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>',
}
const CROP_ICON = '<path d="M12 22V12"/><path d="M12 12C12 12 7 9 7 4a5 5 0 0110 0c0 5-5 8-5 8z"/>'
const categoryIcon = (name: string) => CATEGORY_ICONS[name] ?? CROP_ICON

const loading = ref(true)
const loadingCrops = ref(true)
const saving = ref(false)
const saved = ref(false)
const activeTab = ref<'main' | 'education' | 'crops'>('main')
const activeCategory = ref('')

const userName = ref('')
const profile = ref<any>(null)
const stats = ref({ clients: 0, active: 0, completed: 0 })
const myReviews = ref<any[]>([])
const categories = ref<any[]>([])
const allCrops = ref<any[]>([])
const selectedCrops = ref<string[]>([])

const tabs = [
  { key: 'main', label: 'Основне' },
  { key: 'education', label: 'Освіта' },
  { key: 'crops', label: 'Культури' },
  { key: 'reviews', label: 'Відгуки' },
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

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

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

// Статистика з угод
const [agreementsRes, reviewsRes] = await Promise.all([
  supabase.from('agreements').select('id, farmer_id, status').eq('agronomist_id', uid).neq('status', 'cancelled'),
  supabase.from('agronomist_reviews').select('id, farmer_id, rating, text, problem_solved, created_at').eq('agronomist_id', uid).order('created_at', { ascending: false }),
])
const agrData = agreementsRes.data || []
stats.value = {
  clients: new Set(agrData.map((a: any) => a.farmer_id)).size,
  active: agrData.filter((a: any) => a.status === 'active').length,
  completed: agrData.filter((a: any) => a.status === 'completed').length,
}
// Відгуки — додаємо імена фермерів
const reviewsData = reviewsRes.data || []
if (reviewsData.length) {
  const fids = [...new Set(reviewsData.map((r: any) => r.farmer_id))]
  const { data: fUsers } = await supabase.from('users').select('id, name').in('id', fids)
  const fMap = Object.fromEntries((fUsers || []).map((u: any) => [u.id, u.name]))
  myReviews.value = reviewsData.map((r: any) => ({ ...r, farmer_name: fMap[r.farmer_id] || 'Фермер' }))
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

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-card-title { font-family: 'Bitter', Georgia, serif; font-size: 17px; font-weight: 800; color: rgb(27,46,27); margin: 0; }
</style>
