<template>
  <div class="max-w-4xl mx-auto px-4 py-16">
    <div class="text-center mb-16">
      <span class="mb-4 flex justify-center"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/><path d="M12 14c0 0-3-1-4-4M12 14c0 0 3-1 4-4"/></svg></span>
      <h1 class="text-4xl font-extrabold text-agro-dark mb-4">Про АгроПростір</h1>
      <p class="text-xl text-agro-light max-w-2xl mx-auto leading-relaxed">
        Цифрова платформа що об'єднує фермерів, агрономів і продавців агрохімії в одній екосистемі
      </p>
    </div>

    <div class="space-y-12">
      <div class="card">
        <h2 class="text-2xl font-bold text-agro-dark mb-4">Наша місія</h2>
        <p class="text-agro-light leading-relaxed">
          Ми створили АгроПростір щоб зробити сучасні агрономічні знання доступними для кожного — від великого фермера до власника невеликого городу. Ми віримо що правильне застосування препаратів і своєчасні консультації агронома дозволяють отримати кращий врожай при менших витратах.
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div class="card text-center">
          <div class="mb-3 flex justify-center"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/><path d="M12 14c0 0-3-1-4-4M12 14c0 0 3-1 4-4"/></svg></div>
          <h3 class="font-bold text-agro-dark mb-2">Фермерам</h3>
          <p class="text-sm text-agro-light">Облік полів і культур, технологічні карти, консультації агрономів</p>
        </div>
        <div class="card text-center">
          <div class="w-12 h-12 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-3"/><rect x="9" y="1" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>
          </div>
          <h3 class="font-bold text-agro-dark mb-2">Агрономам</h3>
          <p class="text-sm text-agro-light">Кабінет консультанта, база клієнтів, просування профілю</p>
        </div>
        <div class="card text-center">
          <div class="w-12 h-12 rounded-2xl bg-[rgb(238,241,227)] flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <h3 class="font-bold text-agro-dark mb-2">Продавцям</h3>
          <p class="text-sm text-agro-light">Каталог товарів, онлайн-замовлення, управління залишками</p>
        </div>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold text-agro-dark mb-4">Наша команда</h2>
        <p class="text-agro-light leading-relaxed">
          АгроПростір розробляється командою розробників і агрономів які розуміють реальні потреби аграрного сектору України. Ми постійно розвиваємо платформу на основі відгуків наших користувачів.
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
useSeoMeta({ title: 'Про нас — АгроПростір', description: 'Цифрова платформа що об\'єднує фермерів, агрономів і продавців агрохімії.' })
</script>
