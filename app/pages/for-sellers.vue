<template>
  <div>
    <!-- Hero -->
    <section class="bg-white py-24 px-4 border-b border-agro-border">
      <div class="max-w-4xl mx-auto text-center">
        <span class="inline-block bg-agro-hover text-agro font-semibold text-sm px-4 py-1.5 rounded-full mb-6">🏪 Для продавців</span>
        <h1 class="text-5xl md:text-6xl font-extrabold text-agro-dark mb-6 leading-tight">
          Продавайте препарати<br>там де їх шукають
        </h1>
        <p class="text-xl text-agro-light mb-10 max-w-2xl mx-auto leading-relaxed">
          Розмістіть каталог товарів на платформі де тисячі фермерів і дачників вже шукають препарати і добрива — і отримуйте замовлення онлайн
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/auth?mode=register" class="bg-agro-dark text-white font-bold rounded-2xl px-8 py-4 text-lg hover:bg-agro transition-colors">
            Відкрити магазин →
          </NuxtLink>
          <NuxtLink to="/catalog" class="border-2 border-agro-border text-agro-dark font-bold rounded-2xl px-8 py-4 text-lg hover:bg-agro-hover transition-colors">
            Подивитись каталог
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Цифри -->
    <section class="py-14 px-4 bg-agro-hover border-b border-agro-border">
      <div class="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div>
          <p class="text-3xl font-extrabold text-agro">1000+</p>
          <p class="text-sm text-agro-light mt-1">фермерів на платформі</p>
        </div>
        <div>
          <p class="text-3xl font-extrabold text-agro">24/7</p>
          <p class="text-sm text-agro-light mt-1">приймання замовлень</p>
        </div>
        <div>
          <p class="text-3xl font-extrabold text-agro">НП + УП</p>
          <p class="text-sm text-agro-light mt-1">доставка по Україні</p>
        </div>
        <div>
          <p class="text-3xl font-extrabold text-agro">0 грн</p>
          <p class="text-sm text-agro-light mt-1">для старту</p>
        </div>
      </div>
    </section>

    <!-- Кроки -->
    <section class="py-24 px-4 max-w-5xl mx-auto">
      <h2 class="text-3xl font-extrabold text-center text-agro-dark mb-4">Як розпочати продажі</h2>
      <p class="text-center text-agro-light mb-16">Від реєстрації до першого замовлення — за один день</p>

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
      <p class="text-agro font-semibold mb-2">Старт безкоштовно</p>
      <h2 class="text-3xl font-extrabold mb-4 text-agro-dark">Відкрийте магазин вже сьогодні</h2>
      <p class="text-agro-light mb-8">Реєстрація займає 2 хвилини — і ваші товари вже в каталозі</p>
      <NuxtLink to="/auth?mode=register" class="bg-agro-dark text-white font-bold rounded-2xl px-10 py-4 text-lg hover:bg-agro transition-colors inline-block">
        Відкрити магазин →
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'АгроПорадник для продавців — продавайте препарати і добрива онлайн',
  description: 'Розмістіть каталог агрохімії на платформі де тисячі фермерів шукають препарати. Замовлення, доставка НП, управління залишками.',
})

const steps = [
  {
    icon: '🏪',
    title: 'Зареєструйтесь як продавець',
    desc: 'Оберіть роль "Продавець" при реєстрації. Заповніть профіль магазину — назва компанії, регіон, телефон і короткий опис. Це займе 2 хвилини.',
    tags: ['Назва магазину', 'Контакти', 'Регіон'],
  },
  {
    icon: '📦',
    title: 'Додайте товари',
    desc: 'Знайдіть препарат в базі каталогу і додайте свою пропозицію — ціна, кількість на складі, фото. Один препарат може мати пропозиції від кількох продавців — покупці порівнюють.',
    tags: ['База препаратів', 'Ціна і наявність', 'Фото товару'],
  },
  {
    icon: '🚚',
    title: 'Налаштуйте доставку',
    desc: 'Оберіть способи доставки — Нова Пошта, Укрпошта або самовивіз. Для самовивозу вкажіть адресу. Покупець бачить тільки доступні для вас варіанти.',
    tags: ['Нова Пошта', 'Укрпошта', 'Самовивіз'],
  },
  {
    icon: '🛒',
    title: 'Отримуйте замовлення',
    desc: 'Покупець оформлює замовлення і ви отримуєте повідомлення. В кабінеті бачите контакти покупця, адресу доставки і всі деталі. Підтвердіть або скасуйте одним кліком.',
    tags: ['Контакти покупця', 'Адреса доставки', 'Зміна статусу'],
  },
]

const features = [
  { icon: '📊', title: 'Статистика продажів', desc: 'Кількість товарів, замовлень і загальна виручка — на головній сторінці кабінету' },
  { icon: '🛒', title: 'Управління замовленнями', desc: 'Всі замовлення в одному місці з контактами покупців. Змінюйте статус одним кліком — підтверджено, відправлено, виконано' },
  { icon: '📦', title: 'Облік залишків', desc: 'Система автоматично зменшує залишок коли оформляється замовлення. Товар зникає з каталогу коли залишок = 0' },
  { icon: '🚚', title: 'Гнучка доставка', desc: 'Оберіть зручні способи доставки — НП, Укрпошта або самовивіз. Вкажіть адресу самовивозу для покупців' },
  { icon: '🔍', title: 'Видимість в каталозі', desc: 'Ваші товари відображаються в загальному каталозі препаратів який переглядають тисячі фермерів і дачників' },
  { icon: '💬', title: 'Чат з покупцями', desc: 'Покупці можуть написати вам напряму щоб уточнити наявність, ціну або домовитись про доставку' },
]
</script>
