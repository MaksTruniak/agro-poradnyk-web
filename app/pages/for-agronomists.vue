<template>
  <div>
    <!-- Hero -->
    <section class="hero-agronomist relative flex items-center justify-center text-center">
      <div class="hero-overlay absolute inset-0"></div>
      <div class="relative z-10 px-4 py-32 md:py-40 max-w-3xl mx-auto">
        <p class="hero-eyebrow text-sm font-semibold uppercase tracking-[0.18em] mb-5">
          Для агрономів
        </p>
        <h1 class="hero-title text-6xl md:text-7xl font-black leading-none mb-6">
          Ваші знання —<br>ваш бізнес
        </h1>
        <p class="text-white/80 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
          Консультуйте фермерів онлайн, ведіть базу клієнтів і заробляйте на своїх знаннях — без поїздок і паперової роботи
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

    <!-- Кроки -->
    <section class="px-14 py-[110px] bg-[rgb(238,241,227)]">
      <div class="max-w-[920px] mx-auto">
        <div class="text-center mb-16">
          <h2 class="bitter text-[38px] font-bold text-[rgb(27,46,27)] mb-3">Як це працює</h2>
          <p class="text-base text-[rgb(91,107,83)]">Від реєстрації до першого клієнта — 4 кроки</p>
        </div>

        <div class="flex flex-col gap-11">

          <div class="flex gap-6">
            <div class="shrink-0 w-11 h-11 rounded-xl bg-[#2F5233] text-[#FAF6EC] flex items-center justify-center bitter font-bold text-lg">1</div>
            <div>
              <div class="flex items-center gap-2.5 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="10" cy="9" r="4.5" stroke="#2F5233" stroke-width="1.6"/><path d="M20 20c0-3.3-4-5-6-5M4 20c0-3.9 2.7-6 6-6" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round"/></svg>
                <h3 class="text-[19px] font-bold text-[rgb(27,46,27)]">Створіть профіль агронома</h3>
              </div>
              <p class="text-[15px] leading-relaxed text-[rgb(91,107,83)] mb-3.5">Вкажіть спеціалізацію, досвід, регіон роботи і культури з якими працюєте. Завантажте фото — профілі з фото отримують вдвічі більше звернень.</p>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="tag in ['Спеціалізація', 'Досвід', 'Культури', 'Регіон']" :key="tag" class="step-tag">{{ tag }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-6">
            <div class="shrink-0 w-11 h-11 rounded-xl bg-[#2F5233] text-[#FAF6EC] flex items-center justify-center bitter font-bold text-lg">2</div>
            <div>
              <div class="flex items-center gap-2.5 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#2F5233" stroke-width="1.6"/><path d="M16.2 16.2L21 21" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round"/></svg>
                <h3 class="text-[19px] font-bold text-[rgb(27,46,27)]">Фермери знаходять вас</h3>
              </div>
              <p class="text-[15px] leading-relaxed text-[rgb(91,107,83)] mb-3.5">Ваш профіль відображається в каталозі агрономів. Фермери шукають за регіоном і культурами і пишуть напряму в чат.</p>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="tag in ['Каталог агрономів', 'Пошук за регіоном', 'Пошук за культурою']" :key="tag" class="step-tag">{{ tag }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-6">
            <div class="shrink-0 w-11 h-11 rounded-xl bg-[#2F5233] text-[#FAF6EC] flex items-center justify-center bitter font-bold text-lg">3</div>
            <div>
              <div class="flex items-center gap-2.5 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#2F5233" stroke-width="1.6"/><path d="M3 14l5-4 4 3 4-5 5 4" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <h3 class="text-[19px] font-bold text-[rgb(27,46,27)]">Отримайте доступ до полів клієнта</h3>
              </div>
              <p class="text-[15px] leading-relaxed text-[rgb(91,107,83)] mb-3.5">Фермер може поділитись полями з вами. Ви бачите всі культури, сорти і площі — і можете давати точніші рекомендації без зайвих запитань.</p>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="tag in ['Поля клієнта', 'Культури і сорти', 'Площі']" :key="tag" class="step-tag">{{ tag }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-6">
            <div class="shrink-0 w-11 h-11 rounded-xl bg-[#2F5233] text-[#FAF6EC] flex items-center justify-center bitter font-bold text-lg">4</div>
            <div>
              <div class="flex items-center gap-2.5 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 5h16v11H8l-4 4V5z" stroke="#2F5233" stroke-width="1.6" stroke-linejoin="round"/></svg>
                <h3 class="text-[19px] font-bold text-[rgb(27,46,27)]">Консультуйте в чаті</h3>
              </div>
              <p class="text-[15px] leading-relaxed text-[rgb(91,107,83)] mb-3.5">Спілкуйтесь з фермерами у вбудованому чаті. Рекомендуйте препарати, схеми обробки, терміни проведення робіт — все в одному місці.</p>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="tag in ['Чат', 'Рекомендації препаратів', 'Схеми обробки']" :key="tag" class="step-tag">{{ tag }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Фічі -->
    <section class="py-20 px-4 bg-white border-t border-agro-border">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl font-extrabold text-center text-agro-dark mb-12">Ваші інструменти</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="f in features" :key="f.title" class="card hover:shadow-md transition-shadow">
            <div class="mb-3"><span v-html="f.icon"></span></div>
            <h3 class="font-bold text-agro-dark mb-2">{{ f.title }}</h3>
            <p class="text-agro-light text-sm leading-relaxed">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

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
              <li class="flex items-center gap-1.5 text-agro-light"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> AI агроном (10 запитів/міс, до 2 фото)</li>
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
            <p class="text-3xl font-extrabold text-agro mb-1">350 <span class="text-base font-medium text-agro-light">грн/міс</span></p>
            <p class="text-xs text-agro-light mb-4">або <strong class="text-agro-dark">3 500 грн/рік</strong> — економія 700 грн</p>
            <ul class="space-y-2 text-sm mb-5">
              <li class="flex items-center gap-1.5 text-agro-light"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Необмежена кількість клієнтів</li>
              <li class="flex items-center gap-1.5 text-agro-light"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> AI агроном (500 запитів/міс + 60 фото)</li>
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
.step-tag {
  padding: 7px 14px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid rgb(225, 219, 198);
  font-size: 13px;
  font-weight: 600;
  color: rgb(62, 79, 59);
}
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
definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'АгроПростір для агрономів — консультуйте фермерів онлайн',
  description: 'Створіть профіль агронома, консультуйте фермерів у чаті і розвивайте клієнтську базу онлайн.',
})

const steps = [
  {
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-3"/><rect x="9" y="1" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>',
    title: 'Створіть профіль агронома',
    desc: 'Вкажіть спеціалізацію, досвід, регіон роботи і культури з якими працюєте. Завантажте фото — профілі з фото отримують вдвічі більше звернень.',
    tags: ['Спеціалізація', 'Досвід', 'Культури', 'Регіон'],
  },
  {
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>',
    title: 'Фермери знаходять вас',
    desc: 'Ваш профіль відображається в каталозі агрономів. Фермери шукають за регіоном і культурами і пишуть напряму в чат.',
    tags: ['Каталог агрономів', 'Пошук за регіоном', 'Пошук за культурою'],
  },
  {
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l4.5 2 5-4 4.5 2 4-2v12l-4 2-4.5-2-5 4-4.5-2L3 6z"/></svg>',
    title: 'Отримайте доступ до полів клієнта',
    desc: 'Фермер може поділитись полями з вами. Ви бачите всі культури, сорти і площі — і можете давати точніші рекомендації без зайвих запитань.',
    tags: ['Поля клієнта', 'Культури і сорти', 'Площі'],
  },
  {
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    title: 'Консультуйте в чаті',
    desc: 'Спілкуйтесь з фермерами у вбудованому чаті. Рекомендуйте препарати, схеми обробки, терміни проведення робіт — все в одному місці.',
    tags: ['Чат', 'Рекомендації препаратів', 'Схеми обробки'],
  },
]

const features = [
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>', title: 'Чат з клієнтами', desc: 'Вбудований месенджер для консультацій — без сторонніх програм і передачі номерів телефонів' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l4.5 2 5-4 4.5 2 4-2v12l-4 2-4.5-2-5 4-4.5-2L3 6z"/></svg>', title: 'Поля клієнтів', desc: 'Фермери діляться полями і ви бачите всі дані — культури, сорти, площі по кожному полю' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', title: 'Програми захисту', desc: 'Складайте схеми обробки для клієнтів прямо в системі — по фазах розвитку культури' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L19 7"/></svg>', title: 'Топ-просування', desc: 'Виходьте першими в результатах пошуку і отримуйте більше звернень від фермерів' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>', title: 'Статистика профілю', desc: 'Бачте скільки фермерів переглянули ваш профіль і написали в чат' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/><path d="M12 14c0 0-3-1-4-4M12 14c0 0 3-1 4-4"/></svg>', title: 'Власні поля', desc: 'Ведіть облік власного господарства паралельно з консультаційною діяльністю' },
]
</script>
