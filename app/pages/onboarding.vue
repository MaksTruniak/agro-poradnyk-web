<template>
  <div class="min-h-screen bg-[#F5F8F0] flex flex-col items-center justify-center p-4">
    <!-- Logo -->
    <div class="mb-8 flex items-center gap-2.5">
      <div class="w-10 h-10 rounded-xl bg-agro flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FAF6EC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M5 3a7 7 0 0 0 7 7 7 7 0 0 0-7-7"/><path d="M19 3a7 7 0 0 1-7 7 7 7 0 0 1 7-7"/></svg>
      </div>
      <span class="font-extrabold text-xl text-agro-dark">АгроПростір</span>
    </div>

    <!-- Progress -->
    <div class="flex items-center gap-2 mb-8">
      <div v-for="i in totalSteps" :key="i"
        class="h-1.5 rounded-full transition-all duration-300"
        :class="[i <= step ? 'bg-agro' : 'bg-agro-border', i === step ? 'w-8' : 'w-4']" />
    </div>

    <!-- Card -->
    <div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-agro-border overflow-hidden">

      <!-- Step 1: Вітання + роль -->
      <Transition name="slide" mode="out-in">
        <div v-if="step === 1" key="1" class="p-7">
          <div class="w-14 h-14 rounded-2xl bg-agro-hover flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h1 class="text-2xl font-extrabold text-agro-dark mb-1">Ласкаво просимо!</h1>
          <p class="text-sm text-agro-light mb-6">Давайте налаштуємо ваш акаунт. Хто ви?</p>

          <div class="grid grid-cols-2 gap-3 mb-6">
            <button v-for="r in ROLES" :key="r.value" @click="form.role = r.value"
              class="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all"
              :class="form.role === r.value ? 'border-agro bg-agro-hover' : 'border-agro-border hover:border-agro/40'">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                :class="form.role === r.value ? 'bg-agro' : 'bg-agro-bg'">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  :stroke="form.role === r.value ? '#FAF6EC' : 'rgb(47,82,51)'"
                  stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
                  v-html="r.icon" />
              </div>
              <span class="text-sm font-semibold" :class="form.role === r.value ? 'text-agro' : 'text-agro-dark'">{{ r.label }}</span>
              <span class="text-xs text-agro-light text-center leading-tight">{{ r.desc }}</span>
            </button>
          </div>

          <button @click="next" :disabled="!form.role" class="btn-primary w-full justify-center disabled:opacity-40">
            Далі →
          </button>
        </div>

        <!-- Step 2: Поле -->
        <div v-else-if="step === 2" key="2" class="p-7">
          <div class="w-14 h-14 rounded-2xl bg-agro-hover flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          </div>
          <h2 class="text-xl font-extrabold text-agro-dark mb-1">Ваше перше поле</h2>
          <p class="text-sm text-agro-light mb-5">Додайте господарство або поле де ви працюєте</p>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-agro-dark mb-1.5">Назва поля / господарства</label>
              <input v-model="form.farmName" class="input" placeholder="Поле №1, Ферма Колос..." />
            </div>
            <div>
              <label class="block text-sm font-semibold text-agro-dark mb-1.5">Область</label>
              <div class="relative">
                <input v-model="regionQuery" @focus="showRegions = true" @blur="setTimeout(() => showRegions = false, 150)"
                  class="input" placeholder="Почніть вводити..." />
                <div v-if="showRegions && filteredRegions.length"
                  class="absolute z-10 w-full bg-white border border-agro-border rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                  <button v-for="r in filteredRegions" :key="r.name" @click="selectRegion(r)"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover text-agro-dark">{{ r.name }}</button>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-agro-dark mb-1.5">Площа (га)</label>
              <input v-model.number="form.hectares" type="number" class="input" placeholder="0.0" min="0" step="0.1" />
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button @click="step--" class="btn-outline">← Назад</button>
            <button @click="next" :disabled="!form.farmName" class="btn-primary flex-1 justify-center disabled:opacity-40">
              Далі →
            </button>
          </div>
          <button @click="skipField" class="w-full text-center text-xs text-agro-light mt-3 hover:text-agro transition-colors">
            Пропустити, додам пізніше
          </button>
        </div>

        <!-- Step 3: Культура -->
        <div v-else-if="step === 3" key="3" class="p-7">
          <div class="w-14 h-14 rounded-2xl bg-agro-hover flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M5 3a7 7 0 0 0 7 7 7 7 0 0 0-7-7"/><path d="M19 3a7 7 0 0 1-7 7 7 7 0 0 1 7-7"/></svg>
          </div>
          <h2 class="text-xl font-extrabold text-agro-dark mb-1">Яка культура?</h2>
          <p class="text-sm text-agro-light mb-5">Що вирощуєте на полі <strong>{{ form.farmName }}</strong>?</p>

          <div class="grid grid-cols-3 gap-2 mb-4">
            <button v-for="c in CROPS" :key="c" @click="toggleCrop(c)"
              class="py-2.5 px-2 rounded-xl border-2 text-xs font-medium transition-all text-center"
              :class="form.crops.includes(c) ? 'border-agro bg-agro-hover text-agro' : 'border-agro-border text-agro-light hover:border-agro/40'">
              {{ c }}
            </button>
          </div>

          <div>
            <label class="block text-sm font-semibold text-agro-dark mb-1.5">Або введіть свою</label>
            <div class="flex gap-2">
              <input v-model="customCrop" @keydown.enter="addCustomCrop" class="input flex-1" placeholder="смородина, малина..." />
              <button @click="addCustomCrop" class="btn-outline px-3">+</button>
            </div>
          </div>

          <div v-if="form.crops.length" class="flex flex-wrap gap-1.5 mt-3">
            <span v-for="c in form.crops" :key="c"
              class="inline-flex items-center gap-1 bg-agro-hover text-agro text-xs font-medium px-2.5 py-1 rounded-full">
              {{ c }}
              <button @click="form.crops = form.crops.filter(x => x !== c)" class="hover:text-red-500">×</button>
            </span>
          </div>

          <div class="flex gap-3 mt-6">
            <button @click="step--" class="btn-outline">← Назад</button>
            <button @click="finish" :disabled="saving" class="btn-primary flex-1 justify-center disabled:opacity-40">
              {{ saving ? 'Зберігаємо...' : 'Розпочати →' }}
            </button>
          </div>
          <button @click="finish" class="w-full text-center text-xs text-agro-light mt-3 hover:text-agro transition-colors">
            Пропустити, додам пізніше
          </button>
        </div>

        <!-- Step 4: Done -->
        <div v-else-if="step === 4" key="4" class="p-7 text-center">
          <div class="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 class="text-xl font-extrabold text-agro-dark mb-2">Все готово!</h2>
          <p class="text-sm text-agro-light mb-6">Ваш акаунт налаштовано. Починаємо роботу.</p>
          <button @click="goToDashboard" class="btn-primary w-full justify-center">
            Перейти до кабінету →
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const step = ref(1)
const totalSteps = 3
const saving = ref(false)
const createdFarmId = ref<string | null>(null)

const form = reactive({
  role: '',
  farmName: '',
  region: '',
  hectares: null as number | null,
  crops: [] as string[],
})

const regionQuery = ref('')
const showRegions = ref(false)
const customCrop = ref('')

const ROLES = [
  {
    value: 'farmer',
    label: 'Фермер',
    desc: 'Вирощую і продаю продукцію',
    icon: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  },
  {
    value: 'agronomist',
    label: 'Агроном',
    desc: 'Консультую фермерів',
    icon: '<path d="M12 22V12"/><path d="M5 3a7 7 0 0 0 7 7 7 7 0 0 0-7-7"/><path d="M19 3a7 7 0 0 1-7 7 7 7 0 0 1 7-7"/>',
  },
  {
    value: 'buyer',
    label: 'Заготівельник',
    desc: 'Купую продукцію у фермерів',
    icon: '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>',
  },
  {
    value: 'seller',
    label: 'Постачальник',
    desc: 'Продаю засоби захисту',
    icon: '<path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>',
  },
]

const CROPS = ['Пшениця', 'Кукурудза', 'Соняшник', 'Соя', 'Ріпак', 'Ячмінь', 'Картопля', 'Буряк', 'Овочі', 'Сад', 'Ягоди', 'Виноград']

const REGIONS = [
  { name: 'Вінницька область', ref: 'Vinnytsia' },
  { name: 'Волинська область', ref: 'Volyn' },
  { name: 'Дніпропетровська область', ref: 'Dnipropetrovsk' },
  { name: 'Донецька область', ref: 'Donetsk' },
  { name: 'Житомирська область', ref: 'Zhytomyr' },
  { name: 'Закарпатська область', ref: 'Zakarpattia' },
  { name: 'Запорізька область', ref: 'Zaporizhzhia' },
  { name: 'Івано-Франківська область', ref: 'Ivano-Frankivsk' },
  { name: 'Київська область', ref: 'Kyiv' },
  { name: 'Кіровоградська область', ref: 'Kirovohrad' },
  { name: 'Луганська область', ref: 'Luhansk' },
  { name: 'Львівська область', ref: 'Lviv' },
  { name: 'Миколаївська область', ref: 'Mykolaiv' },
  { name: 'Одеська область', ref: 'Odesa' },
  { name: 'Полтавська область', ref: 'Poltava' },
  { name: 'Рівненська область', ref: 'Rivne' },
  { name: 'Сумська область', ref: 'Sumy' },
  { name: 'Тернопільська область', ref: 'Ternopil' },
  { name: 'Харківська область', ref: 'Kharkiv' },
  { name: 'Херсонська область', ref: 'Kherson' },
  { name: 'Хмельницька область', ref: 'Khmelnytskyi' },
  { name: 'Черкаська область', ref: 'Cherkasy' },
  { name: 'Чернівецька область', ref: 'Chernivtsi' },
  { name: 'Чернігівська область', ref: 'Chernihiv' },
  { name: 'м. Київ', ref: 'KyivCity' },
]

const filteredRegions = computed(() =>
  regionQuery.value.length < 1 ? REGIONS : REGIONS.filter(r => r.name.toLowerCase().includes(regionQuery.value.toLowerCase()))
)

const selectRegion = (r: { name: string }) => {
  form.region = r.name
  regionQuery.value = r.name
  showRegions.value = false
}

const toggleCrop = (c: string) => {
  if (form.crops.includes(c)) form.crops = form.crops.filter(x => x !== c)
  else form.crops.push(c)
}

const addCustomCrop = () => {
  const val = customCrop.value.trim()
  if (val && !form.crops.includes(val)) form.crops.push(val)
  customCrop.value = ''
}

const next = async () => {
  if (step.value === 1) {
    // Зберігаємо роль
    const { data: { session } } = await supabase.auth.getSession()
    if (session) await supabase.from('users').update({ role: form.role }).eq('id', session.user.id)
    step.value = form.role === 'agronomist' || form.role === 'buyer' || form.role === 'seller' ? 4 : 2
    // Агрономи/покупці/продавці не додають поле — одразу фінішуємо
    if (step.value === 4) await completeOnboarding()
  } else if (step.value === 2) {
    await saveFarm()
    step.value = 3
  }
}

const skipField = () => {
  step.value = 4
  completeOnboarding()
}

const saveFarm = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !form.farmName) return
  const { data } = await supabase.from('farms').insert({
    user_id: session.user.id,
    name: form.farmName,
    region: form.region || null,
    hectares: form.hectares || 0,
  }).select('id').single()
  if (data) createdFarmId.value = data.id
}

const finish = async () => {
  saving.value = true
  if (form.crops.length && createdFarmId.value) {
    for (const crop of form.crops) {
      await supabase.from('farm_crops').insert({
        farm_id: createdFarmId.value,
        crop_type: crop,
      })
    }
  }
  await completeOnboarding()
  saving.value = false
  step.value = 4
}

const completeOnboarding = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) await supabase.from('users').update({ onboarded_at: new Date().toISOString() }).eq('id', session.user.id)
}

const goToDashboard = () => navigateTo('/dashboard')
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from { opacity: 0; transform: translateX(20px); }
.slide-leave-to { opacity: 0; transform: translateX(-20px); }
</style>
