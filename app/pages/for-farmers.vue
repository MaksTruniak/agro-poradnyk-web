<template>
  <div>
    <!-- Hero -->
    <section class="bg-white py-24 px-4 border-b border-agro-border">
      <div class="max-w-4xl mx-auto text-center">
        <span class="inline-block bg-agro-hover text-agro font-semibold text-sm px-4 py-1.5 rounded-full mb-6">🌾 Для фермерів</span>
        <h1 class="text-5xl md:text-6xl font-extrabold text-agro-dark mb-6 leading-tight">
          Все господарство —<br>в одному місці
        </h1>
        <p class="text-xl text-agro-light mb-10 max-w-2xl mx-auto leading-relaxed">
          Облік полів і культур, програми захисту, консультації агрономів і замовлення препаратів — без паперів і зайвих дзвінків
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/auth?mode=register" class="bg-agro-dark text-white font-bold rounded-2xl px-8 py-4 text-lg hover:bg-agro transition-colors">
            Почати безкоштовно →
          </NuxtLink>
          <NuxtLink to="/farmers" class="border-2 border-agro-border text-agro-dark font-bold rounded-2xl px-8 py-4 text-lg hover:bg-agro-hover transition-colors">
            Подивитись фермерів
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Кроки -->
    <section class="py-24 px-4 max-w-5xl mx-auto">
      <h2 class="text-3xl font-extrabold text-center text-agro-dark mb-4">Як це працює</h2>
      <p class="text-center text-agro-light mb-16">4 кроки до повного обліку господарства</p>

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
        <h2 class="text-3xl font-extrabold text-center text-agro-dark mb-12">Що ви отримуєте</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="f in features" :key="f.title" class="card hover:shadow-md transition-shadow">
            <div class="text-3xl mb-3">{{ f.icon }}</div>
            <h3 class="font-bold text-agro-dark mb-2">{{ f.title }}</h3>
            <p class="text-agro-light text-sm leading-relaxed">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 px-4 bg-agro-hover border-t border-agro-border text-center">
      <p class="text-agro font-semibold mb-2">Безкоштовно для фермерів</p>
      <h2 class="text-3xl font-extrabold mb-4 text-agro-dark">Реєстрація займе 1 хвилину</h2>
      <p class="text-agro-light mb-8">Додайте перше поле вже сьогодні</p>
      <NuxtLink to="/auth?mode=register" class="bg-agro-dark text-white font-bold rounded-2xl px-10 py-4 text-lg hover:bg-agro transition-colors inline-block">
        Зареєструватись →
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'АгроПорадник для фермерів — облік полів і культур',
  description: 'Ведіть облік полів, культур і сортів, отримуйте консультації агрономів і замовляйте препарати онлайн.',
})

const steps = [
  {
    icon: '🗺️',
    title: 'Додайте свої поля',
    desc: 'Введіть назву поля, площу в гектарах і регіон. Вкажіть кадастровий номер якщо є. Можна додати скільки завгодно полів.',
    tags: ['Назва і площа', 'Кадастровий номер', 'Регіон'],
  },
  {
    icon: '🌱',
    title: 'Вкажіть культури і сорти',
    desc: 'Для кожного поля додайте що вирощуєте — пшеницю, кукурудзу, соняшник тощо. Обирайте сорти з бази або додавайте свої. Система перевірить щоб сума площ не перевищувала площу поля.',
    tags: ['База культур', 'Сорти', 'Площа культури'],
  },
  {
    icon: '🛡️',
    title: 'Отримайте програму захисту',
    desc: 'Для кожної культури сформуйте схему обробки — фунгіциди, інсектициди, гербіциди по фазах розвитку. Або запитайте агронома напряму в чаті.',
    tags: ['Схема обробки', 'Фази розвитку', 'Чат з агрономом'],
  },
  {
    icon: '🛒',
    title: 'Замовляйте препарати онлайн',
    desc: 'Знайдіть потрібний препарат в каталозі, порівняйте пропозиції продавців і замовте з доставкою Новою Поштою або Укрпоштою.',
    tags: ['Тисячі препаратів', 'Порівняння цін', 'Доставка НП'],
  },
]

const features = [
  { icon: '📊', title: 'Аналітика господарства', desc: 'Загальна площа, розбивка по культурах, порівняння по роках — все на одному екрані' },
  { icon: '🔔', title: 'Нагадування про обробки', desc: 'Встановіть дату і отримайте нагадування — більше ніяких пропущених обробок' },
  { icon: '🤖', title: 'AI агроном 24/7', desc: 'Задайте питання AI-асистенту і отримайте відповідь одразу — в будь-який час доби' },
  { icon: '👨‍🌾', title: 'Живий агроном', desc: 'Знайдіть перевіреного агронома у вашому регіоні і консультуйтесь у чаті' },
  { icon: '🤝', title: 'Поділіться полями з агрономом', desc: 'Надайте агроному доступ до ваших полів щоб він бачив культури і міг давати точніші рекомендації' },
  { icon: '🔄', title: 'Журнал сівозміни', desc: 'Ведіть облік культур по роках на кожному полі і відстежуйте врожайність т/га' },
]
</script>
