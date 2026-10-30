<template>
  <div>
    <!-- Hero -->
    <section class="hero-agronomist relative flex items-center justify-center text-center">
      <div class="hero-overlay absolute inset-0"></div>
      <div class="relative z-10 px-4 py-32 md:py-40 max-w-3xl mx-auto">
        <p class="hero-eyebrow text-sm font-semibold uppercase tracking-[0.18em] mb-5">
          Для агрономів
        </p>
        <h1 class="hero-title text-[40px] sm:text-6xl md:text-7xl font-black leading-none mb-6">
          Ваші знання —<br>ваш бізнес
        </h1>
        <p class="text-white/80 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
          Супроводжуйте ягідники, сади й виноградники онлайн: поля клієнтів, техкарти, акти огляду й консультації — в одному кабінеті
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/auth?mode=register"
            class="inline-flex items-center justify-center gap-2 bg-[#2F5233] text-white font-bold rounded-full px-8 py-3.5 text-base hover:bg-[#3d6b42] transition-colors shadow-lg shadow-black/30">
            Створити профіль →
          </NuxtLink>
          <NuxtLink to="/agronomists"
            class="inline-flex items-center justify-center border-2 border-white/70 text-white font-bold rounded-full px-8 py-3.5 text-base bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
            Подивитись агрономів
          </NuxtLink>
        </div>
      </div>
    </section>

    <LandingRoleSteps subtitle="Від профілю до постійних клієнтів — 4 кроки" :steps="steps" />

    <LandingRoleFeatures subtitle="Ягідники, сади й виноградники ваших клієнтів — поля, техкарти, огляди й консультації в одному кабінеті" :groups="groups" />

    <!-- Плани -->
    <section class="py-20 px-4 border-t border-agro-border">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-3xl font-extrabold text-agro-dark mb-4">Тарифи для агрономів</h2>
        <p class="text-agro-light mb-12">Базовий план безкоштовний. PRO виводить вас першими в пошуку та дає більше можливостей.</p>
        <div class="grid sm:grid-cols-2 gap-6">
          <!-- Базовий -->
          <div class="card text-left">
            <p class="font-bold text-agro-dark text-lg mb-1">Базовий</p>
            <p class="text-3xl font-extrabold text-agro mb-4">Безкоштовно</p>
            <ul class="space-y-2 text-sm mb-2">
              <li class="flex items-center gap-1.5 text-agro-light"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Профіль у каталозі агрономів</li>
              <li class="flex items-center gap-1.5 text-agro-light"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> До 2 клієнтів</li>
              <li class="flex items-center gap-1.5 text-agro-light"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Чати з фермерами</li>
              <li class="flex items-center gap-1.5 text-agro-light"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Доступ до полів клієнтів</li>
              <li class="flex items-center gap-1.5 text-gray-400"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Без AI агронома</li>
              <li class="flex items-center gap-1.5 text-gray-400"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Без шаблонів техкарт</li>
              <li class="flex items-center gap-1.5 text-gray-400"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Без автопідняття</li>
              <li class="flex items-center gap-1.5 text-gray-400"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Без виділення профілю</li>
            </ul>
          </div>
          <!-- PRO -->
          <div class="card text-left border-2 border-agro">
            <div class="flex items-center justify-between mb-1">
              <p class="font-bold text-agro-dark text-lg">PRO</p>
              <span class="text-xs bg-agro text-white px-2 py-0.5 rounded-full font-semibold">Популярний</span>
            </div>
            <p class="text-3xl font-extrabold text-agro mb-1">{{ fmt(proMonth) }} <span class="text-base font-medium text-agro-light">грн/міс</span></p>
            <p class="text-xs text-agro-light mb-4">або <strong class="text-agro-dark">{{ fmt(proYear) }} грн/рік</strong><template v-if="yearSaving"> — економія {{ fmt(yearSaving) }} грн</template></p>
            <ul class="space-y-2 text-sm mb-5">
              <li class="flex items-center gap-1.5 text-agro-light"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Необмежена кількість клієнтів</li>
              <li class="flex items-center gap-1.5 text-agro-light"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> AI агроном — кредити щомісяця</li>
              <li class="flex items-center gap-1.5 text-agro-light"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Шаблони техкарт для клієнтів</li>
              <li class="flex items-center gap-1.5 text-agro-light"><svg width="13" height="13" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Автопідняття вгору кожні 5 днів</li>
              <li class="flex items-center gap-1.5 text-agro-light"><svg width="13" height="13" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Виділена картка профілю</li>
              <li class="flex items-center gap-1.5 text-agro-light"><svg width="13" height="13" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Пріоритетна підтримка</li>
            </ul>
            <NuxtLink to="/auth?mode=register" class="block text-center bg-agro text-white font-bold rounded-xl px-6 py-3 hover:bg-agro-dark transition-colors text-sm">
              Почати безкоштовно →
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 px-4 bg-agro-hover border-t border-agro-border text-center">
      <p class="text-agro font-semibold mb-2">Реєстрація безкоштовна</p>
      <h2 class="text-3xl font-extrabold mb-4 text-agro-dark">Почніть консультувати вже сьогодні</h2>
      <p class="text-agro-light mb-8">Створіть профіль і отримайте перших клієнтів з платформи</p>
      <NuxtLink to="/auth?mode=register" class="bg-agro-dark text-white font-bold rounded-2xl px-10 py-4 text-lg hover:bg-agro transition-colors inline-block">
        Створити профіль →
      </NuxtLink>
    </section>
  </div>
</template>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.hero-agronomist {
  min-height: 100svh;
  background:
    linear-gradient(to bottom, rgba(8, 18, 8, 0.55) 0%, rgba(12, 24, 8, 0.45) 60%, rgba(8, 18, 8, 0.7) 100%),
    url('/role-agronomist.jpg') center/cover no-repeat;
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
const { month: proMonth, year: proYear, yearSaving, yearDiscount, fmt } = await useAgronomistPrices()
definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'АгроПростір для агрономів — супровід ягідників, садів і виноградників',
  description: 'Профіль у каталозі агрономів, угоди з фермерами, поля й техкарти клієнтів, акти огляду, нагадування і консультації в чаті.',
})

const steps = [
  {
    title: 'Створіть профіль агронома',
    desc: 'Спеціальність, освіта, досвід, культури, з якими працюєте, регіон і ставка. Профіль з фото й описом досвіду отримує більше звернень.',
    tags: ['Спеціальність і освіта', 'Культури', 'Регіон', 'Ставка'],
  },
  {
    title: 'Фермери знаходять вас',
    desc: 'Профіль з\'являється в каталозі агрономів. Фермери шукають за регіоном і культурами та пишуть вам напряму в чат.',
    tags: ['Каталог агрономів', 'Пошук за регіоном', 'Чат'],
  },
  {
    title: 'Укладіть угоду',
    desc: 'Щомісячна, сезонна або разова оплата — умови видно обом сторонам. Після підтвердження угоди ви бачите поля й насадження клієнта.',
    tags: ['Щомісячна', 'Сезонна', 'Разова'],
  },
  {
    title: 'Ведіть клієнтів',
    desc: 'Техкарти, акти огляду, нагадування й консультації — без поїздок заради кожного питання. Після завершення угоди фермер залишає відгук.',
    tags: ['Техкарти', 'Акти огляду', 'Відгуки'],
  },
]

const groups = [
  {
    icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    title: 'Профіль у каталозі',
    lead: 'Ваша візитка для фермерів усієї України.',
    can: [
      'Спеціальність, освіта, досвід роботи в полі',
      'Культури, регіон роботи і ставка за годину',
      'Позначка «приймаю нових клієнтів»',
    ],
    result: 'фермери знаходять вас самі — без реклами й сарафанного радіо.',
  },
  {
    icon: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13l2 2 4-4"/>',
    title: 'Угоди з фермерами',
    lead: 'Прозорі умови співпраці замість домовленостей на словах.',
    can: [
      'Оплата щомісячно, за сезон або разово',
      'Дати початку й завершення угоди',
      'Підтвердження — і доступ до полів клієнта відкривається',
    ],
    result: 'зрозумілі умови для обох сторін і жодних суперечок про оплату.',
  },
  {
    icon: '<path d="M3 6l4.5 2 5-4 4.5 2 4-2v12l-4 2-4.5-2-5 4-4.5-2L3 6z"/>',
    title: 'Поля клієнтів',
    lead: 'Усі господарства клієнтів — в одному списку.',
    can: [
      'Поля й насадження: культура, сорт, рік посадки, площа',
      'Фенофази й журнал обробок кожного насадження',
      'Перехід у техкарту поля одним натиском',
    ],
    result: 'точні поради без десятка уточнюючих питань.',
  },
  {
    icon: '<path d="M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM16 2v4M8 2v4M3 10h18"/><path d="M9 15l2 2 4-4"/>',
    title: 'Клієнти цього тижня',
    plan: 'Про',
    lead: 'Що потребує уваги у ваших клієнтів саме зараз.',
    can: [
      'Погодні ризики: заморозки, парша, мілдью, гнилі',
      'Обробки на черзі за фазою і строки очікування перед збором',
      'Порада клієнту в чат одним натиском',
    ],
    result: 'встигаєте попередити клієнта до того, як проблема стала збитком.',
  },
  {
    icon: '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><path d="M9 5a2 2 0 002 2h2a2 2 0 002-2 2 2 0 00-2-2h-2a2 2 0 00-2 2zM9 12h6M9 16h4"/>',
    title: 'Техкарти клієнтів',
    lead: 'Програма захисту й живлення, яку фермер бачить одразу.',
    can: [
      'Обробки по фенофазах з препаратами й нормами',
      'Правки й доповнення в техкарті клієнта',
      'Строк очікування для кожної обробки',
    ],
    result: 'ваша програма у фермера в кабінеті, а не на папірці.',
  },
  {
    icon: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/>',
    title: 'Шаблони техкарт',
    plan: 'Про',
    lead: 'Перевірені схеми — один раз склали, далі застосовуєте.',
    can: [
      'Збереження техкарти як шаблону',
      'Застосування шаблону до культури клієнта одним натиском',
      'Шаблони бачите лише ви',
    ],
    result: 'нового клієнта ведете за хвилини, а не за вечір.',
  },
  {
    icon: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    title: 'Акти огляду',
    lead: 'Огляд насадження оформлений як документ.',
    can: [
      'Дата огляду, фенофаза, знахідки зі ступенем ураження',
      'До 6 фото на кожну знахідку',
      'Рекомендації — одразу в техкарту клієнта',
    ],
    result: 'фермер бачить результат вашої роботи, а історія оглядів зберігається.',
  },
  {
    icon: '<path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>',
    title: 'Нагадування фермерам',
    lead: 'Клієнт не пропустить обробку, яку ви призначили.',
    can: [
      'Нагадування з техкарти — дзвіночок біля обробки',
      'Приходить фермеру в кабінет і в Telegram',
      'Список усіх надісланих нагадувань',
    ],
    result: 'рекомендації виконуються вчасно — і результат видно в полі.',
  },
  {
    icon: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
    title: 'Консультації в чаті',
    lead: 'Вбудований месенджер з кожним клієнтом.',
    can: [
      'Переписка з фермером без обміну номерами',
      'Фото від клієнта прямо в чаті',
      'Нові звернення від фермерів з каталогу',
    ],
    result: 'усі консультації в одному місці, а не розкидані по месенджерах.',
  },
  {
    icon: '<path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/>',
    title: 'AI агроном',
    plan: 'Про',
    lead: 'Помічник, який економить ваш час.',
    can: [
      'Аналіз фото листка чи плоду',
      'Аналіз техкарти: слабкі місця й що покращити',
      'Кредити щомісяця в тарифі Агроном Про',
    ],
    result: 'швидша перевірка гіпотез і більше клієнтів за той самий час.',
  },
  {
    icon: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    title: 'Рейтинг і відгуки',
    lead: 'Репутація, яка працює на вас.',
    can: [
      'Відгук фермера після завершення угоди',
      'Яку проблему було вирішено — у кожному відгуку',
      'Рейтинг і кількість відгуків у профілі',
    ],
    result: 'нові клієнти довіряють вам ще до першого повідомлення.',
  },
  {
    icon: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    title: 'Просування',
    plan: 'Про',
    lead: 'Більше уваги до профілю в каталозі.',
    can: [
      'Автопідняття вгору кожні 5 днів',
      'Виділена картка профілю',
      'Необмежена кількість клієнтів',
    ],
    result: 'більше звернень від фермерів і стабільний потік клієнтів.',
  },
]
</script>
