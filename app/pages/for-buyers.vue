<template>
  <div>
    <!-- Hero -->
    <section class="bg-white py-24 px-4 border-b border-agro-border">
      <div class="max-w-4xl mx-auto text-center">
        <span class="inline-block bg-agro-hover text-agro font-semibold text-sm px-4 py-1.5 rounded-full mb-6">🏭 Для заготівельників</span>
        <h1 class="text-5xl md:text-6xl font-extrabold text-agro-dark mb-6 leading-tight">
          Знаходьте продукцію —<br>напряму від фермерів
        </h1>
        <p class="text-xl text-agro-light mb-10 max-w-2xl mx-auto leading-relaxed">
          Розміщуйте закупівельні оголошення, отримуйте пропозиції від фермерів і укладайте угоди без посередників
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/auth?mode=register" class="bg-agro-dark text-white font-bold rounded-2xl px-8 py-4 text-lg hover:bg-agro transition-colors">
            Почати безкоштовно →
          </NuxtLink>
          <NuxtLink to="/farmers" class="border-2 border-agro-border text-agro-dark font-bold rounded-2xl px-8 py-4 text-lg hover:bg-agro-hover transition-colors">
            Переглянути фермерів
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Кроки -->
    <section class="py-24 px-4 max-w-5xl mx-auto">
      <h2 class="text-3xl font-extrabold text-center text-agro-dark mb-4">Як це працює</h2>
      <p class="text-center text-agro-light mb-16">Від реєстрації до першої угоди — кілька простих кроків</p>

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

    <!-- Плани -->
    <section class="py-20 px-4 border-t border-agro-border">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-3xl font-extrabold text-agro-dark mb-4">Тарифи</h2>
        <p class="text-agro-light mb-12">Базовий план безкоштовний. Топ виводить вас першими серед заготівельників.</p>
        <div class="grid sm:grid-cols-2 gap-6 mb-10">
          <div class="card text-left">
            <p class="font-bold text-agro-dark text-lg mb-1">Базовий</p>
            <p class="text-3xl font-extrabold text-agro mb-4">Безкоштовно</p>
            <ul class="space-y-2 text-sm text-agro-light">
              <li>✅ Профіль заготівельника</li>
              <li>✅ До 3 культур в закупівлях</li>
              <li>✅ Чат з фермерами</li>
              <li>✅ До 5 угод на місяць</li>
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
              <li>✅ Необмежена кількість культур</li>
              <li>✅ Необмежена кількість угод</li>
              <li>⭐ Перші в пошуку заготівельників</li>
              <li>⭐ Більше показів профілю</li>
            </ul>
          </div>
        </div>

        <!-- Верифікація -->
        <div class="card text-left border-2 border-amber-200 bg-amber-50">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">✅</span>
            <div>
              <p class="font-bold text-agro-dark">Значок "Перевірений заготівельник"</p>
              <p class="text-xs text-agro-light">Безкоштовно — видається за репутацію, не за гроші</p>
            </div>
          </div>
          <ul class="space-y-2 text-sm text-agro-light">
            <li>📄 Верифікація підприємства (ЄДРПОУ / документи)</li>
            <li>🤝 Мінімум 10 підтверджених угод на платформі</li>
            <li>⭐ Рейтинг не нижче 4.5</li>
            <li>🚫 Жодної скасованої угоди</li>
          </ul>
          <p class="text-xs text-agro-light mt-3">Фермери бачать цей значок у профілі і можуть довіряти перевіреному закупівельнику</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 px-4 bg-agro-hover border-t border-agro-border text-center">
      <p class="text-agro font-semibold mb-2">Безкоштовна реєстрація</p>
      <h2 class="text-3xl font-extrabold mb-4 text-agro-dark">Почніть закуповувати напряму</h2>
      <p class="text-agro-light mb-8">Без посередників і зайвих переплат</p>
      <NuxtLink to="/auth?mode=register" class="bg-agro-dark text-white font-bold rounded-2xl px-10 py-4 text-lg hover:bg-agro transition-colors inline-block">
        Зареєструватись →
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'АгроПростір для заготівельників — закупівля зерна напряму від фермерів',
  description: 'Розміщуйте закупівельні оголошення, отримуйте пропозиції від фермерів і укладайте угоди без посередників.',
})

const steps = [
  {
    icon: '📋',
    title: 'Заповніть профіль заготівельника',
    desc: 'Вкажіть назву підприємства, регіон роботи і контактні дані. Це допоможе фермерам знайти вас в каталозі.',
    tags: ['Назва підприємства', 'Регіон', 'Контакти'],
  },
  {
    icon: '🌾',
    title: 'Вкажіть що закуповуєте',
    desc: 'Додайте культури які вас цікавлять, бажані обсяги і умови закупівлі. Фермери побачать ваш профіль і зможуть надіслати пропозицію.',
    tags: ['Культури', 'Обсяги', 'Умови'],
  },
  {
    icon: '💬',
    title: 'Отримуйте пропозиції в чаті',
    desc: 'Фермери надсилають пропозиції з кількістю і ціною прямо в чат. Обговорюйте деталі і домовляйтесь на вигідних умовах.',
    tags: ['Чат з фермером', 'Картка угоди', 'Переговори'],
  },
  {
    icon: '🤝',
    title: 'Підтверджуйте угоди',
    desc: 'Підтверджена угода зберігається в системі — ви бачите всю історію закупівель, обсяги і суми в одному місці.',
    tags: ['Підтвердження', 'Архів угод', 'Статистика'],
  },
]

const features = [
  { icon: '🗂️', title: 'Каталог культур', desc: 'Вказуйте декілька культур з різними обсягами — фермери бачать точно що вам потрібно' },
  { icon: '🔔', title: 'Пропозиції в реальному часі', desc: 'Фермери надсилають пропозиції напряму у ваш чат — жодних пропущених зв\'язків' },
  { icon: '📊', title: 'Статистика закупівель', desc: 'Кількість угод і загальний обсяг закуплених тонн відображаються у вашому профілі' },
  { icon: '🌍', title: 'Фермери з усієї України', desc: 'Знаходьте постачальників у потрібному регіоні — фільтруйте за культурою і областю' },
  { icon: '⭐', title: 'Рейтинг і відгуки', desc: 'Репутація формується на основі завершених угод — чесно і прозоро для обох сторін' },
  { icon: '🚀', title: 'Без посередників', desc: 'Пряма комунікація з фермером — ніяких зайвих ланок і прихованих комісій' },
]
</script>
