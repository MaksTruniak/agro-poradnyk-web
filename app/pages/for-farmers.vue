<template>
  <div>
    <!-- Hero -->
    <section class="hero-farmer relative flex items-center justify-center text-center">
      <div class="hero-overlay absolute inset-0"></div>
      <div class="relative z-10 px-4 py-32 md:py-40 max-w-3xl mx-auto">
        <p class="hero-eyebrow text-sm font-semibold uppercase tracking-[0.18em] mb-5">
          Для фермерів
        </p>
        <h1 class="hero-title text-[40px] sm:text-6xl md:text-7xl font-black leading-none mb-6">
          Все господарство —<br>в одному місці
        </h1>
        <p class="text-white/80 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
          Ягідники, сади й виноградники: насадження, техкарти, план робіт на тиждень, агрономи й продаж урожаю — без паперів і зайвих дзвінків
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/auth?mode=register"
            class="inline-flex items-center justify-center gap-2 bg-[#2F5233] text-white font-bold rounded-full px-8 py-3.5 text-base hover:bg-[#3d6b42] transition-colors shadow-lg shadow-black/30">
            Почати безкоштовно →
          </NuxtLink>
          <NuxtLink to="/farmers"
            class="inline-flex items-center justify-center border-2 border-white/70 text-white font-bold rounded-full px-8 py-3.5 text-base bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
            Подивитись фермерів
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Кроки -->
    <section class="px-4 sm:px-14 py-[90px] bg-[rgb(238,241,227)]">
      <div class="max-w-[920px] mx-auto">
        <div class="text-center mb-14">
          <h2 class="bitter text-[32px] sm:text-[38px] font-bold text-[rgb(27,46,27)] mb-3">Як це працює</h2>
          <p class="text-base text-[rgb(91,107,83)]">Від першого поля до плану робіт — за один вечір</p>
        </div>
        <div class="flex flex-col gap-10">
          <div v-for="(step, i) in steps" :key="step.title" class="flex gap-5 sm:gap-6">
            <div class="shrink-0 w-11 h-11 rounded-xl bg-[#2F5233] text-[#FAF6EC] flex items-center justify-center bitter font-bold text-lg">{{ i + 1 }}</div>
            <div>
              <h3 class="text-[19px] font-bold text-[rgb(27,46,27)] mb-2">{{ step.title }}</h3>
              <p class="text-[15px] leading-relaxed text-[rgb(91,107,83)] mb-3.5">{{ step.desc }}</p>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="tag in step.tags" :key="tag" class="step-tag">{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Можливості -->
    <section class="px-4 sm:px-14 py-[90px]">
      <div class="max-w-[1180px] mx-auto">
        <div class="text-center mb-14 max-w-2xl mx-auto">
          <h2 class="bitter text-[32px] sm:text-[38px] font-bold text-[rgb(27,46,27)] mb-3">Що ви можете і що отримуєте</h2>
          <p class="text-base text-[rgb(91,107,83)]">Для ягідників, садів і виноградників: усе, що зараз у зошитах, таблицях і в голові, — в одному кабінеті з телефона чи комп'ютера</p>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div v-for="g in groups" :key="g.title" class="feature-card">
            <div class="flex items-start gap-4 mb-4">
              <div class="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] text-[#2F5233] flex items-center justify-center" v-html="g.icon" />
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-[19px] font-bold text-[rgb(27,46,27)]">{{ g.title }}</h3>
                  <span v-if="g.plan" class="plan-badge">{{ g.plan }}</span>
                </div>
                <p class="text-[14.5px] leading-relaxed text-[rgb(91,107,83)] mt-1">{{ g.lead }}</p>
              </div>
            </div>
            <ul class="flex flex-col gap-2.5 mb-5">
              <li v-for="item in g.can" :key="item" class="flex gap-2.5 items-start text-[14px] leading-relaxed text-[rgb(62,79,59)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="shrink-0 mt-[3px]"><circle cx="12" cy="12" r="10" fill="#2F5233"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>{{ item }}</span>
              </li>
            </ul>
            <p class="feature-result"><b>Що отримуєте:</b> {{ g.result }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Плани -->
    <section class="px-4 sm:px-14 py-[100px] bg-[rgb(238,241,227)]">
      <div class="max-w-[1180px] mx-auto text-center">
        <h2 class="bitter text-[32px] sm:text-[38px] font-bold text-[rgb(27,46,27)] mb-3">Тарифи</h2>
        <p class="text-base text-[rgb(91,107,83)] mb-12">Базовий план безкоштовний назавжди. Business і Business Pro відкривають розширені можливості для вашого господарства.</p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-[900px] mx-auto">

          <!-- Basic -->
          <div class="bg-white rounded-[20px] p-8 border border-[rgb(225,219,198)] flex flex-col">
            <div class="text-sm font-bold text-[rgb(91,107,83)] mb-2">Звичайний</div>
            <div class="bitter font-extrabold text-[26px] text-[rgb(27,46,27)] mb-1">Безкоштовно</div>
            <p class="text-xs text-[rgb(91,107,83)] mb-6">до 2 га · назавжди</p>
            <div class="flex flex-col gap-3 flex-1">
              <div v-for="item in ['До 2 га полів','1 культура','1 технологічна карта','Склад','Нагадування','Чат з агрономом без угоди — 2 000 символів на місяць','Угоди з агрономом (у чаті без обмежень)','Угоди із заготівельником']" :key="item"
                class="flex gap-2 items-start text-[13.5px] text-[rgb(62,79,59)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="shrink-0 mt-px"><circle cx="12" cy="12" r="10" fill="#2F5233"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                {{ item }}
              </div>
              <div v-for="item in ['AI агроном','Аналітика','Співробітники','Інтеграції']" :key="item"
                class="flex gap-2 items-start text-[13.5px] text-[rgb(180,196,160)] line-through">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="shrink-0 mt-px"><circle cx="12" cy="12" r="10" fill="#d1dcc8"/><path d="M8 12h8" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>
                {{ item }}
              </div>
            </div>
            <NuxtLink to="/register" class="mt-6 text-center text-sm font-bold text-[#2F5233] border border-[#2F5233] rounded-xl px-4 py-2.5 hover:bg-agro-hover transition-colors block">Почати безкоштовно →</NuxtLink>
          </div>

          <!-- Business -->
          <div class="bg-[rgb(27,46,27)] rounded-[20px] p-8 relative shadow-[0_24px_50px_-20px_rgba(27,46,27,0.5)] flex flex-col">
            <span class="absolute top-6 right-6 px-2.5 py-0.5 rounded-full bg-[#C98A3C] text-[rgb(27,46,27)] text-xs font-extrabold">Популярний</span>
            <div class="text-sm font-bold text-[rgb(183,196,172)] mb-2">Business</div>
            <div class="flex items-baseline gap-1.5 mb-1">
              <span class="bitter font-extrabold text-[26px] text-white">{{ (plans['business']?.base_price ?? 0).toLocaleString('uk-UA') }}</span>
              <span class="text-sm text-[rgb(183,196,172)]">грн/міс</span>
            </div>
            <p class="text-[rgb(183,196,172)] text-xs mb-6">+ {{ plans['business']?.ha_rate ?? 0 }} грн/га · 2–50 га · / місяць</p>
            <div class="flex flex-col gap-3 flex-1">
              <div v-for="item in ['Все що у Звичайному','Поля — необмежено (2–50 га)','Культури — необмежено','1 технологічна карта на культуру','AI агроном — кредити щомісяця (залежать від площі)','Чат з агрономом — без обмежень','Аналітика','Облік збору врожаю','Співробітники до 5 осіб (поля, склад, нагадування, збір)']" :key="item"
                class="flex gap-2 items-start text-[13.5px] text-[rgb(228,233,218)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="shrink-0 mt-px"><circle cx="12" cy="12" r="10" fill="#C98A3C"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#1B2E1B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                {{ item }}
              </div>
            </div>
            <NuxtLink to="/dashboard/subscription" class="mt-6 inline-block text-center text-sm font-bold bg-[#C98A3C] text-[rgb(27,46,27)] rounded-xl px-4 py-2.5 hover:bg-[#b87a30] transition-colors">Обрати Business →</NuxtLink>
          </div>

          <!-- Business Pro -->
          <div class="bg-white rounded-[20px] p-8 border border-[rgb(225,219,198)] flex flex-col" style="background: linear-gradient(135deg, #fffbf0 0%, #fff 100%);">
            <div class="text-sm font-bold text-amber-600 mb-2">Business Pro</div>
            <div class="flex items-baseline gap-1.5 mb-1">
              <span class="bitter font-extrabold text-[26px] text-amber-600">{{ (plans['business_pro']?.base_price ?? 0).toLocaleString('uk-UA') }}</span>
              <span class="text-sm text-[rgb(91,107,83)]">грн/міс</span>
            </div>
            <p class="text-xs text-[rgb(91,107,83)] mb-6">+ {{ plans['business_pro']?.ha_rate ?? 0 }} грн/га · 50+ га · / місяць</p>
            <div class="flex flex-col gap-3 flex-1">
              <div v-for="item in ['Все що в Бізнес','Поля — необмежено (50+ га)','AI агроном — більше кредитів','Співробітники — необмежено (поля, склад, нагадування, збір)','Інтеграції','Пріоритетна підтримка']" :key="item"
                class="flex gap-2 items-start text-[13.5px] text-[rgb(62,79,59)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="shrink-0 mt-px"><circle cx="12" cy="12" r="10" fill="#C98A3C"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                {{ item }}
              </div>
            </div>
            <NuxtLink to="/dashboard/subscription" class="mt-6 inline-block text-center text-sm font-bold bg-amber-500 text-white rounded-xl px-4 py-2.5 hover:bg-amber-600 transition-colors">Перейти на Бізнес Про →</NuxtLink>
          </div>

        </div>

        <p class="mt-10 text-sm text-[rgb(91,107,83)]">
          Великий агрохолдинг або потрібні особливі умови?
          <button type="button" @click="contactOpen = true" class="font-bold text-[#2F5233] underline hover:no-underline">Залишити Enterprise-запит</button>
        </p>
      </div>
    </section>

    <!-- Модалка Enterprise -->
    <Teleport to="body">
      <div v-if="contactOpen" class="fixed inset-0 z-50 flex items-center justify-center px-4" @click.self="contactOpen = false">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-[24px] shadow-2xl w-full max-w-md p-8">
          <button @click="contactOpen = false" class="absolute top-5 right-5 text-[rgb(91,107,83)] hover:text-[rgb(27,46,27)] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          <template v-if="!contactSent">
            <h3 class="bitter text-[22px] font-bold text-[rgb(27,46,27)] mb-1">Enterprise запит</h3>
            <p class="text-sm text-[rgb(91,107,83)] mb-6">Залиште контакти — менеджер зв'яжеться з вами найближчим часом</p>
            <form @submit.prevent="submitContact" class="flex flex-col gap-4">
              <div>
                <label class="block text-xs font-semibold text-[rgb(62,79,59)] mb-1.5">Ім'я</label>
                <input v-model="contactForm.name" required placeholder="Ваше ім'я" class="input w-full" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-[rgb(62,79,59)] mb-1.5">Email</label>
                <input v-model="contactForm.email" type="email" required placeholder="email@example.com" class="input w-full" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-[rgb(62,79,59)] mb-1.5">Номер телефону</label>
                <input v-model="contactForm.phone" type="tel" required placeholder="+380" class="input w-full" />
              </div>
              <p v-if="contactError" class="text-sm text-red-500">{{ contactError }}</p>
              <button type="submit" :disabled="contactLoading"
                class="mt-2 w-full py-3.5 rounded-xl bg-[#2F5233] text-white font-bold text-sm hover:bg-[#3d6b42] transition-colors disabled:opacity-60">
                {{ contactLoading ? 'Надсилаємо...' : 'Надіслати запит' }}
              </button>
            </form>
          </template>

          <template v-else>
            <div class="text-center py-6">
              <div class="w-16 h-16 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 class="bitter text-[22px] font-bold text-[rgb(27,46,27)] mb-2">Дякуємо!</h3>
              <p class="text-[rgb(91,107,83)] text-sm">Найближчим часом з вами зв'яжеться наш менеджер</p>
              <button @click="contactOpen = false; contactSent = false" class="mt-6 text-sm font-bold text-[#2F5233] hover:underline">Закрити</button>
            </div>
          </template>
        </div>
      </div>
    </Teleport>

    <!-- CTA -->
    <section class="px-4 sm:px-14 py-[100px] text-center" style="background: linear-gradient(rgb(238,241,227), rgb(220,230,203));">
      <span class="text-[13px] font-extrabold tracking-[0.1em] text-[#C98A3C] uppercase">Безкоштовно для фермерів</span>
      <h2 class="bitter text-[32px] sm:text-[38px] font-bold text-[rgb(27,46,27)] mt-4 mb-3.5">Реєстрація займе 1 хвилину</h2>
      <p class="text-[17px] text-[rgb(76,90,70)] mb-8">Додайте перше поле вже сьогодні</p>
      <NuxtLink to="/auth?mode=register"
        class="inline-flex items-center gap-2 px-[34px] py-[17px] rounded-full bg-[#2F5233] text-[#FAF6EC] font-bold text-base shadow-[0_14px_30px_-10px_rgba(47,82,51,0.5)] hover:bg-[#3d6b42] transition-colors">
        Зареєструватись
        <svg width="16" height="12" viewBox="0 0 18 12" fill="none"><path d="M1 6h15M11 1l6 5-6 5" stroke="#FAF6EC" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </NuxtLink>
    </section>
  </div>
</template>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.feature-card {
  background: #fff;
  border: 1px solid rgb(225, 219, 198);
  border-radius: 20px;
  padding: 28px;
  display: flex;
  flex-direction: column;
}
.feature-card ul { flex: 1; }
.feature-result {
  font-size: 14px;
  line-height: 1.55;
  color: rgb(47, 82, 51);
  background: rgb(238, 241, 227);
  border-radius: 12px;
  padding: 12px 14px;
}
.plan-badge {
  font-size: 11.5px;
  font-weight: 800;
  color: #8a5a12;
  background: #fbf0db;
  border-radius: 999px;
  padding: 2px 9px;
}
@media (max-width: 640px) { .feature-card { padding: 20px; } }
.step-tag {
  padding: 7px 14px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid rgb(225, 219, 198);
  font-size: 13px;
  font-weight: 600;
  color: rgb(62, 79, 59);
}
.hero-farmer {
  min-height: 100svh;
  background:
    linear-gradient(to bottom, rgba(8, 18, 8, 0.55) 0%, rgba(12, 24, 8, 0.45) 60%, rgba(8, 18, 8, 0.7) 100%),
    url('/role-farmer.jpg') center/cover no-repeat;
  background-color: #0d1a08;
}
.hero-overlay {
  background: linear-gradient(160deg, rgba(6,14,4,0.3) 0%, rgba(20,38,10,0.1) 50%, rgba(6,14,4,0.4) 100%);
}
.hero-eyebrow {
  color: #c9a84c;
  letter-spacing: 0.18em;
}
.hero-title {
  font-family: 'Bitter', Georgia, serif;
  color: #ffffff;
  text-shadow: 0 2px 24px rgba(0,0,0,0.35);
}
</style>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()

const plans = ref<Record<string, { base_price: number; ha_rate: number }>>({})
const { data: plansData } = await useAsyncData('public-plans', async () => {
  const { data } = await supabase.from('plans').select('id, base_price, ha_rate').in('id', ['business', 'business_pro'])
  return data
})
if (plansData.value) {
  for (const p of plansData.value) plans.value[p.id] = { base_price: p.base_price ?? 0, ha_rate: p.ha_rate ?? 0 }
}

const contactOpen = ref(false)
const contactSent = ref(false)
const contactLoading = ref(false)
const contactForm = reactive({ name: '', email: '', phone: '' })

const contactError = ref('')
const submitContact = async () => {
  contactError.value = ''
  const name = contactForm.name.trim(), email = contactForm.email.trim().toLowerCase(), phone = contactForm.phone.trim()
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.replace(/\D/g, '').length < 9) {
    contactError.value = 'Перевірте ім\'я, email і телефон'
    return
  }
  contactLoading.value = true
  // Запит видно в адмінці («Запити»). Помилку не ховаємо — раніше форма писала «надіслано» навіть без запису
  const { error } = await supabase.from('contact_requests').insert({
    name: name.slice(0, 200), email: email.slice(0, 200), phone: phone.slice(0, 50), type: 'enterprise',
  })
  contactLoading.value = false
  if (error) {
    contactError.value = 'Не вдалося надіслати запит. Спробуйте ще раз або напишіть на support@agroprostir.com.ua'
    return
  }
  contactSent.value = true
}
useSeoMeta({
  title: 'АгроПростір для фермерів — ягідники, сади й виноградники',
  description: 'Насадження, техкарти, журнал обробок, план робіт на тиждень, AI агроном, угоди з агрономами, облік збору й продаж урожаю — в одному кабінеті.',
})

const steps = [
  {
    title: 'Додайте поля',
    desc: 'Назва, площа, регіон і населений пункт, за бажання — кадастровий номер. Регіон потрібен, щоб підтягнути погоду саме для вашого господарства.',
    tags: ['Площа і регіон', 'Кадастровий номер', 'Погода по регіону'],
  },
  {
    title: 'Опишіть насадження',
    desc: 'Лохина, малина, полуниця, смородина, яблуня, груша, черешня, виноград та інші: сорт, рік посадки, площа, схема, зрошення. Велике насадження можна поділити на квартали.',
    tags: ['Культура і сорт', 'Рік посадки', 'Квартали', 'Зрошення'],
  },
  {
    title: 'Отримайте техкарту',
    desc: 'AI агроном складе технологічну карту захисту й живлення під культуру: обробки по фенофазах з препаратами й нормами. Її можна правити під себе або попросити агронома.',
    tags: ['Обробки по фазах', 'Препарати і норми', 'Правки під себе'],
  },
  {
    title: 'Працюйте за планом на тиждень',
    desc: 'Щопонеділка — що робити на кожному насадженні: обробки з техкарти, догляд, поради на сезон і нагадування з урахуванням погоди. Виконали — відмітили, і запис іде в журнал.',
    tags: ['План робіт', 'Погода', 'Журнал обробок'],
  },
]

const ICON = (d: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`

const groups = [
  {
    icon: ICON('<path d="M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z"/>'),
    title: 'Насадження під контролем',
    lead: 'Повна картка кожного насадження — не лише площа, а вся його історія.',
    can: [
      'Вести поля й насадження: культура, сорт, рік посадки, площа, схема садіння, тип зрошення',
      'Ділити насадження на квартали і бачити, що відбувається в кожному',
      'Відмічати фенофази — система підкаже орієнтовну фазу за сумою активних температур',
      'Записувати випади й підсадки рослин з причиною: мороз, хвороби, посуха',
      'Зберігати врожайність по роках і журнал догляду',
    ],
    result: 'історію кожного насадження за всі роки в одному місці — замість зошитів і пам\'яті.',
  },
  {
    icon: ICON('<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><path d="M9 5a2 2 0 002 2h2a2 2 0 002-2 2 2 0 00-2-2h-2a2 2 0 00-2 2zM9 12h6M9 16h4"/>'),
    title: 'Техкарта і журнал обробок',
    lead: 'Що, коли, чим і скільки — від плану до відмітки «виконано».',
    can: [
      'Отримати технологічну карту від AI за хвилину: обробки по фенофазах, препарати й норми',
      'Препарати з техкарти пов\'язані з каталогом, для кожної обробки вказано строк очікування',
      'Вести журнал обробок: препарат, норма, площа, фаза, строк очікування',
      'Бачити дату «збір не раніше» для кожної обробки',
      'Роздрукувати журнал обробок для перевірок і покупців',
    ],
    result: 'жодної пропущеної обробки і жодного збору раніше строку очікування.',
  },
  {
    icon: ICON('<path d="M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM16 2v4M8 2v4M3 10h18"/><path d="M9 15l2 2 4-4"/>'),
    title: 'План на тиждень',
    lead: 'Одна сторінка, з якої починається робочий тиждень.',
    can: [
      'Бачити обробки з техкарти, які настали за фазою, по всіх полях одразу',
      'Отримувати роботи з догляду й поради на сезон для ваших культур',
      'Враховувати прогноз погоди для вашого регіону',
      'Ставити нагадування на потрібну дату одним натиском',
      'Отримувати план, нагадування й попередження про сильний заморозок у Telegram',
    ],
    result: 'зрозумілий список справ на тиждень — не треба тримати все в голові.',
  },
  {
    icon: ICON('<path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/>'),
    title: 'AI агроном 24/7',
    plan: 'Business',
    lead: 'Відповідає вдень і вночі та знає ваше господарство.',
    can: [
      'Ставити питання своїми словами — AI враховує ваше насадження: культуру, сорт, вік, схему, зрошення',
      'Надсилати фото листка чи плоду і отримувати ймовірну причину та що робити',
      'Препарати у відповіді — з посиланням на каталог',
      'Додавати пораду в техкарту або зберігати нагадування прямо з чату',
      'AI пам\'ятає попередні розмови, а наприкінці сезону складе звіт: проблеми, рішення, висновки',
    ],
    result: 'швидку консультацію в момент, коли проблема на полі, а не через тиждень.',
  },
  {
    icon: ICON('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>'),
    title: 'Живий агроном поруч',
    lead: 'Перевірені агрономи вашого регіону з прозорими умовами співпраці.',
    can: [
      'Знайти агронома в каталозі: регіон, досвід, культури, вартість',
      'Укласти угоду: щомісячна, сезонна або разова оплата',
      'Агроном бачить ваші поля, техкарти й журнал — не треба нічого пересилати',
      'Отримувати акти огляду з фото знахідок, ступенем ураження і рекомендаціями',
      'Додавати рекомендації агронома в техкарту одним натиском; чат з агрономом',
    ],
    result: 'фахову підтримку без поїздок і дзвінків, а всі поради — збережені й під рукою.',
  },
  {
    icon: ICON('<path d="M4 8h16l-1.5 11a2 2 0 01-2 1.7h-9a2 2 0 01-2-1.7L4 8z"/><path d="M8 8V6a4 4 0 018 0v2"/>'),
    title: 'Облік збору врожаю',
    plan: 'Business',
    lead: 'Для ягід і фруктів, які збирають наймані збирачі.',
    can: [
      'Відкрити облік сезону збору і додати збирачів',
      'Зважувати врожай з QR-кодом збирача — без паперових відомостей',
      'Ставити ціну за кілограм: загальну або індивідуальну',
      'Вести виплати і бачити, скільки кому нараховано',
      'Збирач бачить свої зважування у Telegram',
    ],
    result: 'чесні розрахунки зі збирачами і точний облік, скільки зібрано з кожного насадження.',
  },
  {
    icon: ICON('<path d="M4 12l4-8h8l4 8-4 8H8l-4-8z"/><path d="M9 12l2 2 4-4"/>'),
    title: 'Продаж урожаю',
    lead: 'Покупці знаходять вас заздалегідь, а не в день збору.',
    can: [
      'Заготівельники бачать, коли й де ви збиратимете ягоди, фрукти чи виноград',
      'Домовлятися про угоду з закупівельником у кабінеті',
      'Відкривати покупцю паспорт партії: обробки за сезон, фенофази, огляди агронома',
      'Формувати накладну і вести продажі, укладені поза платформою',
    ],
    result: 'довіру покупця і кращу ціну за продукцію з підтвердженою історією вирощування.',
  },
  {
    icon: ICON('<path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>'),
    title: 'Гроші, склад і команда',
    lead: 'Економіка господарства без окремих таблиць.',
    can: [
      'Записувати витрати й доходи по полях і культурах',
      'Бачити аналітику: площі, культури, прибуток по роках',
      'Вести склад: препарати й добрива, пальне, техніка, продукція',
      'Додавати співробітників з різними правами: менеджер, агроном',
    ],
    result: 'розуміння, яке насадження заробляє, а яке з\'їдає гроші.',
  },
]
</script>
