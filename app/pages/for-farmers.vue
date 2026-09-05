<template>
  <div>
    <!-- Hero -->
    <section class="hero-farmer relative flex items-center justify-center text-center">
      <div class="hero-overlay absolute inset-0"></div>
      <div class="relative z-10 px-4 py-32 md:py-40 max-w-3xl mx-auto">
        <p class="hero-eyebrow text-sm font-semibold uppercase tracking-[0.18em] mb-5">
          Для фермерів
        </p>
        <h1 class="hero-title text-6xl md:text-7xl font-black leading-none mb-6">
          Все господарство —<br>в одному місці
        </h1>
        <p class="text-white/80 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
          Облік полів і культур, технологічні карти, консультації агрономів і продаж врожаю — без паперів і зайвих дзвінків
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
    <section class="px-14 py-[110px] bg-[rgb(238,241,227)]">
      <div class="max-w-[920px] mx-auto">
        <div class="text-center mb-16">
          <h2 class="bitter text-[38px] font-bold text-[rgb(27,46,27)] mb-3">Як це працює</h2>
          <p class="text-base text-[rgb(91,107,83)]">4 кроки до повного обліку господарства</p>
        </div>

        <div class="flex flex-col gap-11">

          <div class="flex gap-6">
            <div class="shrink-0 w-11 h-11 rounded-xl bg-[#2F5233] text-[#FAF6EC] flex items-center justify-center bitter font-bold text-lg">1</div>
            <div>
              <div class="flex items-center gap-2.5 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#2F5233" stroke-width="1.6"/><path d="M3 14l5-4 4 3 4-5 5 4" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <h3 class="text-[19px] font-bold text-[rgb(27,46,27)]">Додайте свої поля</h3>
              </div>
              <p class="text-[15px] leading-relaxed text-[rgb(91,107,83)] mb-3.5">Введіть назву поля, площу в гектарах і регіон. Вкажіть кадастровий номер якщо є. Можна додати скільки завгодно полів.</p>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="tag in ['Назва і площа', 'Кадастровий номер', 'Регіон']" :key="tag" class="step-tag">{{ tag }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-6">
            <div class="shrink-0 w-11 h-11 rounded-xl bg-[#2F5233] text-[#FAF6EC] flex items-center justify-center bitter font-bold text-lg">2</div>
            <div>
              <div class="flex items-center gap-2.5 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z" stroke="#2F5233" stroke-width="1.6" stroke-linejoin="round"/></svg>
                <h3 class="text-[19px] font-bold text-[rgb(27,46,27)]">Вкажіть культури і сорти</h3>
              </div>
              <p class="text-[15px] leading-relaxed text-[rgb(91,107,83)] mb-3.5">Для кожного поля додайте що вирощуєте — пшеницю, кукурудзу, соняшник тощо. Обирайте сорти з бази або додавайте свої. Система перевірить щоб сума площ не перевищувала площу поля.</p>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="tag in ['База культур', 'Сорти', 'Площа культури']" :key="tag" class="step-tag">{{ tag }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-6">
            <div class="shrink-0 w-11 h-11 rounded-xl bg-[#2F5233] text-[#FAF6EC] flex items-center justify-center bitter font-bold text-lg">3</div>
            <div>
              <div class="flex items-center gap-2.5 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="17" rx="2" stroke="#2F5233" stroke-width="1.6"/><rect x="9" y="2.5" width="6" height="3" rx="1" fill="#2F5233"/><path d="M8 11h8M8 15h5" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round"/></svg>
                <h3 class="text-[19px] font-bold text-[rgb(27,46,27)]">Отримайте технологічну карту</h3>
              </div>
              <p class="text-[15px] leading-relaxed text-[rgb(91,107,83)] mb-3.5">Для кожної культури сформуйте схему обробки — фунгіциди, інсектициди, гербіциди по фазах розвитку. Або запитайте агронома напряму в чаті.</p>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="tag in ['Схема обробки', 'Фази розвитку', 'Чат з агрономом']" :key="tag" class="step-tag">{{ tag }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-6">
            <div class="shrink-0 w-11 h-11 rounded-xl bg-[#2F5233] text-[#FAF6EC] flex items-center justify-center bitter font-bold text-lg">4</div>
            <div>
              <div class="flex items-center gap-2.5 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/><path d="M12 14c0 0-3-1-4-4M12 14c0 0 3-1 4-4"/></svg>
                <h3 class="text-[19px] font-bold text-[rgb(27,46,27)]">Продавайте врожай напряму</h3>
              </div>
              <p class="text-[15px] leading-relaxed text-[rgb(91,107,83)] mb-3.5">Розміщуйте пропозиції на продаж зерна, овочів або ягід і отримуйте запити від заготівельників без посередників.</p>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="tag in ['Пропозиція на продаж', 'Прямий контакт', 'Без посередників']" :key="tag" class="step-tag">{{ tag }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Фічі -->
    <section class="px-14 py-[110px]">
      <div class="max-w-[1180px] mx-auto">
        <h2 class="bitter text-[38px] font-bold text-center text-[rgb(27,46,27)] mb-16">Що ви отримуєте</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-x-14 gap-y-12">

          <div class="flex gap-[18px]">
            <div class="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 20V10M12 20V4M18 20v-7" stroke="#2F5233" stroke-width="1.8" stroke-linecap="round"/></svg>
            </div>
            <div>
              <h3 class="text-[17px] font-bold text-[rgb(27,46,27)] mt-0.5 mb-2">Аналітика господарства</h3>
              <p class="text-[14.5px] leading-relaxed text-[rgb(91,107,83)]">Загальна площа, розбивка по культурах, порівняння по роках — все на одному екрані</p>
            </div>
          </div>

          <div class="flex gap-[18px]">
            <div class="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 20V13a6 6 0 0112 0v7" stroke="#2F5233" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 20h16" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round"/></svg>
            </div>
            <div>
              <h3 class="text-[17px] font-bold text-[rgb(27,46,27)] mt-0.5 mb-2">Нагадування про обробки</h3>
              <p class="text-[14.5px] leading-relaxed text-[rgb(91,107,83)]">Встановіть дату і отримайте нагадування — більше ніяких пропущених обробок</p>
            </div>
          </div>

          <div class="flex gap-[18px]">
            <div class="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z" stroke="#2F5233" stroke-width="1.5" stroke-linejoin="round"/></svg>
            </div>
            <div>
              <h3 class="text-[17px] font-bold text-[rgb(27,46,27)] mt-0.5 mb-2">AI агроном 24/7</h3>
              <p class="text-[14.5px] leading-relaxed text-[rgb(91,107,83)]">Задайте питання AI-асистенту і отримайте відповідь одразу — у будь-який час доби</p>
            </div>
          </div>

          <div class="flex gap-[18px]">
            <div class="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="10" cy="9" r="4.5" stroke="#2F5233" stroke-width="1.6"/><path d="M20 20c0-3.3-4-5-6-5M4 20c0-3.9 2.7-6 6-6" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round"/></svg>
            </div>
            <div>
              <h3 class="text-[17px] font-bold text-[rgb(27,46,27)] mt-0.5 mb-2">Живий агроном</h3>
              <p class="text-[14.5px] leading-relaxed text-[rgb(91,107,83)]">Знайдіть перевіреного агронома у вашому регіоні і консультуйтесь у чаті</p>
            </div>
          </div>

          <div class="flex gap-[18px]">
            <div class="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#2F5233" stroke-width="1.6"/><path d="M8 2.5v3M16 2.5v3" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round"/><path d="M8.5 14l2 2 4-4.5" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div>
              <h3 class="text-[17px] font-bold text-[rgb(27,46,27)] mt-0.5 mb-2">Поділіться полями з агрономом</h3>
              <p class="text-[14.5px] leading-relaxed text-[rgb(91,107,83)]">Надайте агроному доступ до ваших полів щоб він бачив культури і міг давати точніші рекомендації</p>
            </div>
          </div>

          <div class="flex gap-[18px]">
            <div class="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/><path d="M12 14c0 0-3-1-4-4M12 14c0 0 3-1 4-4"/></svg>
            </div>
            <div>
              <h3 class="text-[17px] font-bold text-[rgb(27,46,27)] mt-0.5 mb-2">Продаж врожаю</h3>
              <p class="text-[14.5px] leading-relaxed text-[rgb(91,107,83)]">Розміщуйте пропозиції на продаж і отримуйте запити від заготівельників напряму — без посередників</p>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Плани -->
    <section class="px-14 py-[100px] bg-[rgb(238,241,227)]">
      <div class="max-w-[900px] mx-auto text-center">
        <h2 class="bitter text-[38px] font-bold text-[rgb(27,46,27)] mb-3">Тарифи</h2>
        <p class="text-base text-[rgb(91,107,83)] mb-12">Базовий план безкоштовний. Топ-просування виводить вас першими в пошуку фермерів.</p>

        <div class="grid grid-cols-2 gap-6 text-left">

          <!-- Базовий -->
          <div class="bg-white rounded-[20px] p-[34px_32px] border border-[rgb(225,219,198)]">
            <div class="text-sm font-bold text-[rgb(91,107,83)] mb-2.5">Базовий</div>
            <div class="bitter font-extrabold text-[30px] text-[rgb(27,46,27)] mb-6">Безкоштовно</div>
            <div class="flex flex-col gap-3.5">
              <div v-for="item in ['Профіль фермера','Облік полів і культур','Чати з агрономами','AI-агроном','Каталог препаратів']" :key="item"
                class="flex gap-2.5 items-start text-[14.5px] text-[rgb(62,79,59)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="shrink-0 mt-px"><circle cx="12" cy="12" r="10" fill="#2F5233"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                {{ item }}
              </div>
            </div>
          </div>

          <!-- Топ -->
          <div class="bg-[rgb(27,46,27)] rounded-[20px] p-[34px_32px] relative shadow-[0_24px_50px_-20px_rgba(27,46,27,0.5)]">
            <span class="absolute top-[34px] right-8 px-3 py-1 rounded-full bg-[#C98A3C] text-[rgb(27,46,27)] text-xs font-extrabold">Популярний</span>
            <div class="text-sm font-bold text-[rgb(183,196,172)] mb-2.5">Топ</div>
            <div class="flex items-baseline gap-2 mb-6">
              <span class="bitter font-extrabold text-[30px] text-white">199</span>
              <span class="text-[15px] text-[rgb(183,196,172)]">грн/міс</span>
            </div>
            <div class="flex flex-col gap-3.5">
              <div class="flex gap-2.5 items-start text-[14.5px] text-[rgb(228,233,218)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="shrink-0 mt-px"><circle cx="12" cy="12" r="10" fill="#C98A3C"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#1B2E1B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Все з базового
              </div>
              <div v-for="item in ['Перші в пошуку фермерів','Значок «Топ фермер»','Більше показів профілю','Пріоритет у пропозиціях']" :key="item"
                class="flex gap-2.5 items-start text-[14.5px] text-[rgb(228,233,218)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="shrink-0 mt-px"><path d="M12 2.5l2.4 6.3 6.7.5-5.1 4.4 1.6 6.5L12 16.8 6.4 20.2 8 13.7 2.9 9.3l6.7-.5L12 2.5z" fill="#C98A3C"/></svg>
                {{ item }}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="px-14 py-[100px] text-center" style="background: linear-gradient(rgb(238,241,227), rgb(220,230,203));">
      <span class="text-[13px] font-extrabold tracking-[0.1em] text-[#C98A3C] uppercase">Безкоштовно для фермерів</span>
      <h2 class="bitter text-[38px] font-bold text-[rgb(27,46,27)] mt-4 mb-3.5">Реєстрація займе 1 хвилину</h2>
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
useSeoMeta({
  title: 'АгроПростір для фермерів — облік полів і культур',
  description: 'Ведіть облік полів, культур і сортів, отримуйте консультації агрономів і замовляйте препарати онлайн.',
})

const steps = [
  {
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l4.5 2 5-4 4.5 2 4-2v12l-4 2-4.5-2-5 4-4.5-2L3 6z"/></svg>',
    title: 'Додайте свої поля',
    desc: 'Введіть назву поля, площу в гектарах і регіон. Вкажіть кадастровий номер якщо є. Можна додати скільки завгодно полів.',
    tags: ['Назва і площа', 'Кадастровий номер', 'Регіон'],
  },
  {
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 8 10 6 7c3 0 5 1 6 5z"/><path d="M12 12c0 0 4-2 6-5-3 0-5 1-6 5z"/></svg>',
    title: 'Вкажіть культури і сорти',
    desc: 'Для кожного поля додайте що вирощуєте — пшеницю, кукурудзу, соняшник тощо. Обирайте сорти з бази або додавайте свої. Система перевірить щоб сума площ не перевищувала площу поля.',
    tags: ['База культур', 'Сорти', 'Площа культури'],
  },
  {
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    title: 'Отримайте технологічну карту',
    desc: 'Для кожної культури сформуйте схему обробки — фунгіциди, інсектициди, гербіциди по фазах розвитку. Або запитайте агронома напряму в чаті.',
    tags: ['Схема обробки', 'Фази розвитку', 'Чат з агрономом'],
  },
  {
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/><path d="M12 14c0 0-3-1-4-4M12 14c0 0 3-1 4-4"/></svg>',
    title: 'Продавайте врожай напряму',
    desc: 'Розміщуйте пропозиції на продаж зерна, овочів або ягід і отримуйте запити від заготівельників без посередників.',
    tags: ['Пропозиція на продаж', 'Прямий контакт', 'Без посередників'],
  },
]

const features = [
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>', title: 'Аналітика господарства', desc: 'Загальна площа, розбивка по культурах, порівняння по роках — все на одному екрані' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>', title: 'Нагадування про обробки', desc: 'Встановіть дату і отримайте нагадування — більше ніяких пропущених обробок' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M9 8V6a3 3 0 016 0v2"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/><path d="M9 18h6"/></svg>', title: 'AI агроном 24/7', desc: 'Задайте питання AI-асистенту і отримайте відповідь одразу — в будь-який час доби' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>', title: 'Живий агроном', desc: 'Знайдіть перевіреного агронома у вашому регіоні і консультуйтесь у чаті' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>', title: 'Поділіться полями з агрономом', desc: 'Надайте агроному доступ до ваших полів щоб він бачив культури і міг давати точніші рекомендації' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0113.5-5.7M20 12a8 8 0 01-13.5 5.7"/><path d="M17.5 3v3.5H14M6.5 21v-3.5H10"/></svg>', title: 'Журнал сівозміни', desc: 'Ведіть облік культур по роках на кожному полі і відстежуйте врожайність т/га' },
]
</script>
