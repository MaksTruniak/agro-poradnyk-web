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

    <LandingRoleSteps subtitle="Від першого поля до плану робіт — за один вечір" :steps="steps" />

    <LandingRoleFeatures subtitle="Для ягідників, садів і виноградників: усе, що зараз у зошитах, таблицях і в голові, — в одному кабінеті з телефона чи комп'ютера" :groups="groups" />

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

const groups = [
  {
    icon: '<path d="M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z"/>',
    title: 'Поля і насадження',
    lead: 'Картка кожного насадження з усією його історією.',
    can: [
      'Культура, сорт, рік посадки, площа, схема, зрошення',
      'Поділ великого насадження на квартали',
      'Випади й підсадки з причиною, врожайність по роках',
    ],
    result: 'усе про насадження в одному місці, а не в зошитах.',
  },
  {
    icon: '<path d="M12 22V12"/><path d="M12 12C12 12 7 10 7 5a5 5 0 0110 0c0 5-5 7-5 7z"/>',
    title: 'Фенофази',
    lead: 'Знаєте, на якій фазі кожна культура, — і що на ній робити.',
    can: [
      'Відмітка фази для кожного насадження',
      'Підказка орієнтовної фази за сумою активних температур',
      'Обробки з техкарти підтягуються під поточну фазу',
    ],
    result: 'обробки вчасно — саме тоді, коли це потрібно рослині.',
  },
  {
    icon: '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><path d="M9 5a2 2 0 002 2h2a2 2 0 002-2 2 2 0 00-2-2h-2a2 2 0 00-2 2zM9 12h6M9 16h4"/>',
    title: 'Техкарта',
    lead: 'План захисту й живлення на сезон, складений під вашу культуру.',
    can: [
      'AI складає техкарту за хвилину: обробки по фенофазах',
      'Препарати, норми і строк очікування',
      'Правки під себе або доповнення від агронома',
    ],
    result: 'готовий план сезону без пошуку схем в інтернеті.',
  },
  {
    icon: '<path d="M9 3h6"/><path d="M10 3v5L5 17.5A1 1 0 006 19h12a1 1 0 00.87-1.5L14 8V3"/><line x1="8" y1="13" x2="16" y2="13"/>',
    title: 'Журнал обробок',
    lead: 'Кожна обробка записана: що, коли, чим і скільки.',
    can: [
      'Препарат, норма, площа, фаза, погода й умови',
      'Дата «збір не раніше» за строком очікування',
      'Друк журналу для перевірок і покупців',
    ],
    result: 'жодного збору раніше строку і готовий документ на вимогу.',
  },
  {
    icon: '<path d="M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM16 2v4M8 2v4M3 10h18"/><path d="M9 15l2 2 4-4"/>',
    title: 'План на тиждень',
    lead: 'Одна сторінка, з якої починається робочий тиждень.',
    can: [
      'Обробки з техкарти по всіх полях, що настали за фазою',
      'Сезонні роботи з догляду для ваших культур',
      'Відмітили «виконано» — запис іде в журнал',
    ],
    result: 'зрозумілий список справ — не треба тримати все в голові.',
  },
  {
    icon: '<path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>',
    title: 'Нагадування',
    lead: 'Не забудете про обробку, підживлення, полив чи збір.',
    can: [
      'Нагадування на потрібну дату й годину',
      'Типи: обробка, підживлення, полив, збір, інше',
      'Приходять у кабінет і в Telegram; агроном теж може надіслати',
    ],
    result: 'жодної пропущеної справи, навіть у розпал сезону.',
  },
  {
    icon: '<path d="M17.5 19H9a7 7 0 116.7-9h1.8a4.5 4.5 0 010 9z"/>',
    title: 'Погода і ризики',
    lead: 'Прогноз для вашого регіону з поясненням, що він означає для саду.',
    can: [
      'Погода по регіону господарства в кабінеті',
      'Попередження про заморозки на чутливих фазах',
      'Ризик парші, мілдью, сірої гнилі та моніліозу за погодою',
    ],
    result: 'встигнете захистити врожай до заморозку чи спалаху хвороби.',
  },
  {
    icon: '<path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/>',
    title: 'AI агроном 24/7',
    plan: 'Business',
    lead: 'Відповідає вдень і вночі та знає ваші насадження.',
    can: [
      'Питання своїми словами і фото листка чи плоду',
      'Ймовірна причина проблеми і що робити, препарати з каталогу',
      'Порада одним натиском — у техкарту чи нагадування',
    ],
    result: 'консультацію одразу, коли проблема на полі.',
  },
  {
    icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    title: 'Живий агроном',
    lead: 'Перевірені агрономи з прозорими умовами співпраці.',
    can: [
      'Каталог агрономів: регіон, досвід, культури, ціна',
      'Угода: щомісячна, сезонна або разова, чат з агрономом',
      'Акти огляду з фото й рекомендаціями — одразу в техкарту',
    ],
    result: 'фахову підтримку без поїздок, усі поради збережені.',
  },
  {
    icon: '<path d="M4 8h16l-1.5 11a2 2 0 01-2 1.7h-9a2 2 0 01-2-1.7L4 8z"/><path d="M8 8V6a4 4 0 018 0v2"/>',
    title: 'Облік збору врожаю',
    plan: 'Business',
    lead: 'Для ягід і фруктів, які збирають наймані збирачі.',
    can: [
      'Зважування з QR-кодом збирача — без паперових відомостей',
      'Ціна за кілограм: загальна або індивідуальна',
      'Нарахування й виплати, збирач бачить свої кілограми в Telegram',
    ],
    result: 'чесні розрахунки і точно відомо, скільки зібрано з кожного насадження.',
  },
  {
    icon: '<path d="M4 12l4-8h8l4 8-4 8H8l-4-8z"/><path d="M9 12l2 2 4-4"/>',
    title: 'Продаж урожаю',
    lead: 'Покупці знаходять вас заздалегідь, а не в день збору.',
    can: [
      'Заготівельники бачать, коли й де ви збиратимете',
      'Угоди з закупівельником і накладні в кабінеті',
      'Паспорт партії: обробки, фенофази, огляди агронома',
    ],
    result: 'довіру покупця і кращу ціну за продукцію з історією.',
  },
  {
    icon: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
    title: 'Витрати та доходи',
    lead: 'Скільки вкладено і скільки зароблено — по кожному полю.',
    can: [
      'Витрати за категоріями: паливо, добрива, ЗЗР, техніка, праця',
      'Доходи від продажів, зокрема поза платформою',
      'Прибуток по полях і культурах',
    ],
    result: 'розуміння, яке насадження заробляє, а яке з\'їдає гроші.',
  },
  {
    icon: '<path d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/><path d="M9 21v-7h6v7"/>',
    title: 'Склад',
    lead: 'Що є в наявності — без походу в ангар.',
    can: [
      'Препарати й добрива із залишками',
      'Пальне і техніка',
      'Готова продукція на складі',
    ],
    result: 'вчасно докупите потрібне і не переплатите за зайве.',
  },
  {
    icon: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6"/><path d="M16 4.5a3.5 3.5 0 010 7M18.5 14.5c1.9.8 3 2.7 3 5.5"/>',
    title: 'Співробітники',
    lead: 'Команда працює в одному кабінеті з вами.',
    can: [
      'Запрошення працівника за email',
      'Ролі з різними правами: агроном, менеджер',
      'Посада для кожного і видалення доступу одним натиском',
    ],
    result: 'кожен бачить свої задачі, а ви — всю картину.',
  },
  {
    icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    title: 'Аналітика',
    lead: 'Господарство в цифрах на одній сторінці.',
    can: [
      'Культури по площі і поля',
      'Продажі по культурах',
      'Дані за кожен сезон окремо',
    ],
    result: 'рішення на наступний сезон на основі цифр, а не відчуттів.',
  },
]
</script>
