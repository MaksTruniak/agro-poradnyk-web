<template>
  <div>
    <!-- Hero -->
    <section class="bg-white py-24 px-4 border-b border-agro-border">
      <div class="max-w-4xl mx-auto text-center">
        <span class="inline-block bg-agro-hover text-agro font-semibold text-sm px-4 py-1.5 rounded-full mb-6">🔬 Для агрономів</span>
        <h1 class="text-5xl md:text-6xl font-extrabold text-agro-dark mb-6 leading-tight">
          Ваші знання —<br>ваш бізнес
        </h1>
        <p class="text-xl text-agro-light mb-10 max-w-2xl mx-auto leading-relaxed">
          Консультуйте фермерів онлайн, ведіть базу клієнтів і заробляйте на своїх знаннях — без поїздок і паперової роботи
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/auth?mode=register" class="bg-agro-dark text-white font-bold rounded-2xl px-8 py-4 text-lg hover:bg-agro transition-colors">
            Створити профіль →
          </NuxtLink>
          <NuxtLink to="/agronomists" class="border-2 border-agro-border text-agro-dark font-bold rounded-2xl px-8 py-4 text-lg hover:bg-agro-hover transition-colors">
            Подивитись агрономів
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Кроки -->
    <section class="py-24 px-4 max-w-5xl mx-auto">
      <h2 class="text-3xl font-extrabold text-center text-agro-dark mb-4">Як це працює</h2>
      <p class="text-center text-agro-light mb-16">Від реєстрації до першого клієнта — 4 кроки</p>

      <div class="space-y-8">
        <div v-for="(step, i) in steps" :key="i" class="flex gap-6 md:gap-10 items-start">
          <div class="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-extrabold"
            :class="i % 2 === 0 ? 'bg-agro text-white' : 'bg-agro-hover text-agro'">
            {{ i + 1 }}
          </div>
          <div class="flex-1 pt-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-2xl">{{ step.icon }}</span>
              <h3 class="text-xl font-bold text-agro-dark">{{ step.title }}</h3>
            </div>
            <p class="text-agro-light leading-relaxed">{{ step.desc }}</p>
            <div class="flex flex-wrap gap-2 mt-3">
              <span v-for="tag in step.tags" :key="tag"
                class="text-xs bg-agro-bg text-agro-dark px-3 py-1 rounded-full border border-agro-border font-medium">
                {{ tag }}
              </span>
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
            <div class="text-3xl mb-3">{{ f.icon }}</div>
            <h3 class="font-bold text-agro-dark mb-2">{{ f.title }}</h3>
            <p class="text-agro-light text-sm leading-relaxed">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Плани -->
    <section class="py-20 px-4 border-t border-agro-border">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-3xl font-extrabold text-agro-dark mb-4">Просування профілю</h2>
        <p class="text-agro-light mb-12">Базовий план безкоштовний. Топ-просування виводить вас першими в пошуку.</p>
        <div class="grid sm:grid-cols-2 gap-6">
          <div class="card text-left">
            <p class="font-bold text-agro-dark text-lg mb-1">Базовий</p>
            <p class="text-3xl font-extrabold text-agro mb-4">Безкоштовно</p>
            <ul class="space-y-2 text-sm text-agro-light">
              <li>✅ Профіль агронома</li>
              <li>✅ Чати з фермерами</li>
              <li>✅ Доступ до полів клієнтів</li>
              <li>✅ Необмежена кількість клієнтів</li>
            </ul>
          </div>
          <div class="card text-left border-2 border-agro">
            <div class="flex items-center justify-between mb-1">
              <p class="font-bold text-agro-dark text-lg">Топ</p>
              <span class="text-xs bg-agro text-white px-2 py-0.5 rounded-full font-semibold">Популярний</span>
            </div>
            <p class="text-3xl font-extrabold text-agro mb-4">299 <span class="text-base font-medium text-agro-light">грн/міс</span></p>
            <ul class="space-y-2 text-sm text-agro-light">
              <li>✅ Все з базового</li>
              <li>⭐ Перші в пошуку агрономів</li>
              <li>⭐ Значок "Топ агроном"</li>
              <li>⭐ Більше показів профілю</li>
            </ul>
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

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'АгроПорадник для агрономів — консультуйте фермерів онлайн',
  description: 'Створіть профіль агронома, консультуйте фермерів у чаті і розвивайте клієнтську базу онлайн.',
})

const steps = [
  {
    icon: '🔬',
    title: 'Створіть профіль агронома',
    desc: 'Вкажіть спеціалізацію, досвід, регіон роботи і культури з якими працюєте. Завантажте фото — профілі з фото отримують вдвічі більше звернень.',
    tags: ['Спеціалізація', 'Досвід', 'Культури', 'Регіон'],
  },
  {
    icon: '👨‍🌾',
    title: 'Фермери знаходять вас',
    desc: 'Ваш профіль відображається в каталозі агрономів. Фермери шукають за регіоном і культурами і пишуть напряму в чат.',
    tags: ['Каталог агрономів', 'Пошук за регіоном', 'Пошук за культурою'],
  },
  {
    icon: '🗺️',
    title: 'Отримайте доступ до полів клієнта',
    desc: 'Фермер може поділитись полями з вами. Ви бачите всі культури, сорти і площі — і можете давати точніші рекомендації без зайвих запитань.',
    tags: ['Поля клієнта', 'Культури і сорти', 'Площі'],
  },
  {
    icon: '💬',
    title: 'Консультуйте в чаті',
    desc: 'Спілкуйтесь з фермерами у вбудованому чаті. Рекомендуйте препарати, схеми обробки, терміни проведення робіт — все в одному місці.',
    tags: ['Чат', 'Рекомендації препаратів', 'Схеми обробки'],
  },
]

const features = [
  { icon: '💬', title: 'Чат з клієнтами', desc: 'Вбудований месенджер для консультацій — без сторонніх програм і передачі номерів телефонів' },
  { icon: '🗺️', title: 'Поля клієнтів', desc: 'Фермери діляться полями і ви бачите всі дані — культури, сорти, площі по кожному полю' },
  { icon: '🛡️', title: 'Програми захисту', desc: 'Складайте схеми обробки для клієнтів прямо в системі — по фазах розвитку культури' },
  { icon: '🚀', title: 'Топ-просування', desc: 'Виходьте першими в результатах пошуку і отримуйте більше звернень від фермерів' },
  { icon: '📊', title: 'Статистика профілю', desc: 'Бачте скільки фермерів переглянули ваш профіль і написали в чат' },
  { icon: '🌾', title: 'Власні поля', desc: 'Ведіть облік власного господарства паралельно з консультаційною діяльністю' },
]
</script>
