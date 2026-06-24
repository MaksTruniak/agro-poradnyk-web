<template>
  <div class="max-w-4xl mx-auto px-4 py-16">
    <div class="text-center mb-16">
      <span class="text-5xl mb-4 block">🌾</span>
      <h1 class="text-4xl font-extrabold text-agro-dark mb-4">Про АгроПорадник</h1>
      <p class="text-xl text-agro-light max-w-2xl mx-auto leading-relaxed">
        Цифрова платформа що об'єднує фермерів, агрономів і продавців агрохімії в одній екосистемі
      </p>
    </div>

    <div class="space-y-12">
      <div class="card">
        <h2 class="text-2xl font-bold text-agro-dark mb-4">Наша місія</h2>
        <p class="text-agro-light leading-relaxed">
          Ми створили АгроПорадник щоб зробити сучасні агрономічні знання доступними для кожного — від великого фермера до власника невеликого городу. Ми віримо що правильне застосування препаратів і своєчасні консультації агронома дозволяють отримати кращий врожай при менших витратах.
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div class="card text-center">
          <div class="text-4xl mb-3">🌾</div>
          <h3 class="font-bold text-agro-dark mb-2">Фермерам</h3>
          <p class="text-sm text-agro-light">Облік полів і культур, програми захисту, консультації агрономів</p>
        </div>
        <div class="card text-center">
          <div class="text-4xl mb-3">🔬</div>
          <h3 class="font-bold text-agro-dark mb-2">Агрономам</h3>
          <p class="text-sm text-agro-light">Кабінет консультанта, база клієнтів, просування профілю</p>
        </div>
        <div class="card text-center">
          <div class="text-4xl mb-3">🏪</div>
          <h3 class="font-bold text-agro-dark mb-2">Продавцям</h3>
          <p class="text-sm text-agro-light">Каталог товарів, онлайн-замовлення, управління залишками</p>
        </div>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold text-agro-dark mb-4">Наша команда</h2>
        <p class="text-agro-light leading-relaxed">
          АгроПорадник розробляється командою розробників і агрономів які розуміють реальні потреби аграрного сектору України. Ми постійно розвиваємо платформу на основі відгуків наших користувачів.
        </p>
      </div>

      <div class="text-center">
        <NuxtLink to="/auth?mode=register" class="btn-primary inline-block px-10 py-4 text-lg">
          Приєднатись до платформи →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Про нас — АгроПорадник', description: 'Цифрова платформа що об\'єднує фермерів, агрономів і продавців агрохімії.' })
</script>
