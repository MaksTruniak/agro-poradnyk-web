<template>
  <div>
    <!-- Hero -->
    <section class="bg-white py-24 px-4 border-b border-agro-border">
      <div class="max-w-4xl mx-auto text-center">
        <span class="inline-block bg-agro-hover text-agro font-semibold text-sm px-4 py-1.5 rounded-full mb-6">🏡 Для дачників</span>
        <h1 class="text-5xl md:text-6xl font-extrabold text-agro-dark mb-6 leading-tight">
          Здоровий город —<br>без хімічних помилок
        </h1>
        <p class="text-xl text-agro-light mb-10 max-w-2xl mx-auto leading-relaxed">
          Підберіть правильні препарати для вашого саду і городу, дізнайтесь коли і як обробляти — і отримайте відповідь від агронома якщо щось не так
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/auth?mode=register" class="bg-agro-dark text-white font-bold rounded-2xl px-8 py-4 text-lg hover:bg-agro transition-colors">
            Спробувати безкоштовно →
          </NuxtLink>
          <NuxtLink to="/catalog" class="border-2 border-agro-border text-agro-dark font-bold rounded-2xl px-8 py-4 text-lg hover:bg-agro-hover transition-colors">
            Каталог препаратів
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Кроки -->
    <section class="py-24 px-4 max-w-5xl mx-auto">
      <h2 class="text-3xl font-extrabold text-center text-agro-dark mb-4">Як це працює</h2>
      <p class="text-center text-agro-light mb-16">Від реєстрації до здорового врожаю — просто і зрозуміло</p>

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

    <!-- Культури -->
    <section class="py-20 px-4 bg-white border-t border-agro-border">
      <div class="max-w-5xl mx-auto text-center">
        <h2 class="text-3xl font-extrabold text-agro-dark mb-4">Які культури підтримуються</h2>
        <p class="text-agro-light mb-10">Для кожної культури — схема обробки і підбір препаратів</p>
        <div class="flex flex-wrap justify-center gap-3">
          <span v-for="c in crops" :key="c.name"
            class="flex items-center gap-2 px-4 py-2.5 bg-agro-bg border border-agro-border rounded-2xl text-sm font-medium text-agro-dark">
            <span>{{ c.emoji }}</span> {{ c.name }}
          </span>
        </div>
      </div>
    </section>

    <!-- Фічі -->
    <section class="py-20 px-4 border-t border-agro-border">
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
      <p class="text-agro font-semibold mb-2">Повністю безкоштовно</p>
      <h2 class="text-3xl font-extrabold mb-4 text-agro-dark">Здоровий врожай цього сезону</h2>
      <p class="text-agro-light mb-8">Зареєструйтесь і додайте свої культури — це займе 2 хвилини</p>
      <NuxtLink to="/auth?mode=register" class="bg-agro-dark text-white font-bold rounded-2xl px-10 py-4 text-lg hover:bg-agro transition-colors inline-block">
        Спробувати безкоштовно →
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'АгроПорадник для дачників — схеми обробки саду і городу',
  description: 'Підберіть препарати для городу і саду, отримайте схему обробки і консультацію агронома онлайн.',
})

const steps = [
  {
    icon: '🌱',
    title: 'Додайте свої культури',
    desc: 'Оберіть що вирощуєте — томати, огірки, картоплю, полуницю, яблука або інші культури. Вкажіть сорт якщо знаєте — рекомендації будуть точнішими.',
    tags: ['Овочі', 'Фрукти', 'Ягоди', 'Зелень'],
  },
  {
    icon: '🛡️',
    title: 'Отримайте схему обробки',
    desc: 'Для кожної культури система підбере схему захисту від хвороб і шкідників по фазах розвитку — що коли застосовувати і в якій дозі.',
    tags: ['Від хвороб', 'Від шкідників', 'Дози і терміни'],
  },
  {
    icon: '🤖',
    title: 'Запитайте AI агронома',
    desc: 'Побачили хворобу або шкідника? Опишіть симптоми AI агроному і отримайте діагноз і рекомендацію препарату — відповідь за секунди в будь-який час.',
    tags: ['Діагностика хвороб', 'Визначення шкідників', 'Відповідь за секунди'],
  },
  {
    icon: '🛒',
    title: 'Замовте препарати з доставкою',
    desc: 'Знайдіть рекомендований препарат в каталозі і замовте з доставкою Новою Поштою прямо до вашого відділення — без поїздок в магазин.',
    tags: ['Тисячі препаратів', 'Порівняння цін', 'Доставка додому'],
  },
]

const features = [
  { icon: '🤖', title: 'AI агроном 24/7', desc: 'Опишіть проблему — AI визначить хворобу або шкідника і порекомендує що застосувати' },
  { icon: '🛡️', title: 'Схема обробки', desc: 'Готовий календар обробок по фазах розвитку культури — коли що і в якій дозі застосовувати' },
  { icon: '🔔', title: 'Нагадування', desc: 'Встановіть нагадування про обробку і не пропустіть потрібний момент сезону' },
  { icon: '💬', title: 'Живий агроном', desc: 'Якщо AI не дає відповіді — зверніться до живого агронома в чаті за мінімальну оплату' },
  { icon: '🛒', title: 'Каталог препаратів', desc: 'Тисячі препаратів і добрив з пропозиціями продавців, описами і відгуками' },
  { icon: '📖', title: 'База знань', desc: 'Інструкції по застосуванню, поради по догляду і відповіді на часті питання' },
]

const crops = [
  { emoji: '🍅', name: 'Томати' }, { emoji: '🥒', name: 'Огірки' }, { emoji: '🥔', name: 'Картопля' },
  { emoji: '🥕', name: 'Морква' }, { emoji: '🧅', name: 'Цибуля' }, { emoji: '🧄', name: 'Часник' },
  { emoji: '🥬', name: 'Капуста' }, { emoji: '🌶️', name: 'Перець' }, { emoji: '🍆', name: 'Баклажан' },
  { emoji: '🌽', name: 'Кукурудза' }, { emoji: '🍓', name: 'Полуниця' }, { emoji: '🫐', name: 'Смородина' },
  { emoji: '🍒', name: 'Малина' }, { emoji: '🍇', name: 'Виноград' }, { emoji: '🍎', name: 'Яблука' },
  { emoji: '🍐', name: 'Груші' }, { emoji: '🍑', name: 'Черешня' }, { emoji: '🍑', name: 'Слива' },
]
</script>
