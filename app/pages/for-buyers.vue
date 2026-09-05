<template>
  <div>
    <!-- Hero -->
    <section class="hero-buyer relative flex flex-col items-center justify-center text-center px-14 py-[88px] overflow-hidden">
      <div class="absolute inset-0" style="background: linear-gradient(rgba(20,32,17,0.55) 0%, rgba(20,32,17,0.62) 55%, rgba(20,32,17,0.78) 100%);"></div>
      <div class="relative z-10 flex flex-col items-center">
        <span class="inline-flex items-center gap-2 px-[18px] py-2 rounded-full bg-white/14 backdrop-blur-sm text-[13px] font-extrabold tracking-[0.06em] text-[#E5C48C] uppercase mb-[22px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 20h16M6 20V10l-2-4h16l-2 4v10M9 10V6M15 10V6" stroke="#E5C48C" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Для заготівельників
        </span>
        <h1 class="hero-title text-[60px] leading-[1.08] tracking-[-0.02em] font-extrabold text-white max-w-[820px] mb-[22px]">
          Знаходьте продукцію — напряму від фермерів
        </h1>
        <p class="text-[19px] leading-relaxed text-[rgb(237,239,230)] max-w-[640px] mb-9">
          Розміщуйте закупівельні оголошення, отримуйте пропозиції від фермерів і укладайте угоди без посередників
        </p>
        <div class="flex gap-4 flex-wrap justify-center">
          <NuxtLink to="/auth?mode=register"
            class="flex items-center gap-2 px-[30px] py-4 rounded-full bg-[#2F5233] text-[#FAF6EC] font-bold text-base shadow-[0_12px_28px_-10px_rgba(0,0,0,0.5)] hover:bg-[#3d6b42] transition-colors">
            Почати безкоштовно
            <svg width="16" height="12" viewBox="0 0 18 12" fill="none"><path d="M1 6h15M11 1l6 5-6 5" stroke="#FAF6EC" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </NuxtLink>
          <NuxtLink to="/farmers"
            class="px-[30px] py-4 rounded-full border-[1.5px] border-white/70 text-white font-bold text-base bg-white/8 backdrop-blur-sm hover:bg-white/20 transition-colors">
            Переглянути фермерів
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Кроки -->
    <section class="px-14 py-[110px] bg-[rgb(238,241,227)]">
      <div class="max-w-[920px] mx-auto">
        <div class="text-center mb-16">
          <h2 class="bitter text-[38px] font-bold text-[rgb(27,46,27)] mb-3">Як це працює</h2>
          <p class="text-base text-[rgb(91,107,83)]">Від реєстрації до першої угоди — кілька простих кроків</p>
        </div>

        <div class="flex flex-col gap-11">

          <div class="flex gap-6">
            <div class="shrink-0 w-11 h-11 rounded-xl bg-[#2F5233] text-[#FAF6EC] flex items-center justify-center bitter font-bold text-lg">1</div>
            <div>
              <div class="flex items-center gap-2.5 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="14" rx="2" stroke="#2F5233" stroke-width="1.6"/><path d="M8 6V4h8v2" stroke="#2F5233" stroke-width="1.6"/></svg>
                <h3 class="text-[19px] font-bold text-[rgb(27,46,27)]">Заповніть профіль заготівельника</h3>
              </div>
              <p class="text-[15px] leading-relaxed text-[rgb(91,107,83)] mb-3.5">Вкажіть назву підприємства, регіон роботи і контактні дані. Це допоможе фермерам знайти вас в каталозі.</p>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="tag in ['Назва підприємства', 'Регіон', 'Контакти']" :key="tag" class="step-tag">{{ tag }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-6">
            <div class="shrink-0 w-11 h-11 rounded-xl bg-[#2F5233] text-[#FAF6EC] flex items-center justify-center bitter font-bold text-lg">2</div>
            <div>
              <div class="flex items-center gap-2.5 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z" stroke="#2F5233" stroke-width="1.6" stroke-linejoin="round"/></svg>
                <h3 class="text-[19px] font-bold text-[rgb(27,46,27)]">Вкажіть що закуповуєте</h3>
              </div>
              <p class="text-[15px] leading-relaxed text-[rgb(91,107,83)] mb-3.5">Додайте культури які вас цікавлять, бажані обсяги і умови закупівлі. Фермери побачать ваш профіль і зможуть надіслати пропозицію.</p>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="tag in ['Культури', 'Обсяги', 'Умови']" :key="tag" class="step-tag">{{ tag }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-6">
            <div class="shrink-0 w-11 h-11 rounded-xl bg-[#2F5233] text-[#FAF6EC] flex items-center justify-center bitter font-bold text-lg">3</div>
            <div>
              <div class="flex items-center gap-2.5 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 5h16v11H8l-4 4V5z" stroke="#2F5233" stroke-width="1.6" stroke-linejoin="round"/></svg>
                <h3 class="text-[19px] font-bold text-[rgb(27,46,27)]">Отримайте пропозиції в чаті</h3>
              </div>
              <p class="text-[15px] leading-relaxed text-[rgb(91,107,83)] mb-3.5">Фермери надсилають пропозиції з кількістю і ціною прямо в чат. Обговорюйте деталі і домовляйтесь на вигідних умовах.</p>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="tag in ['Чат з фермером', 'Картка угоди', 'Переговори']" :key="tag" class="step-tag">{{ tag }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-6">
            <div class="shrink-0 w-11 h-11 rounded-xl bg-[#2F5233] text-[#FAF6EC] flex items-center justify-center bitter font-bold text-lg">4</div>
            <div>
              <div class="flex items-center gap-2.5 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12l4-8h8l4 8-4 8H8l-4-8z" stroke="#2F5233" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <h3 class="text-[19px] font-bold text-[rgb(27,46,27)]">Підтверджуйте угоди</h3>
              </div>
              <p class="text-[15px] leading-relaxed text-[rgb(91,107,83)] mb-3.5">Підтверджена угода зберігається в системі — ви бачите всю історію закупівель, обсяги і суми в одному місці.</p>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="tag in ['Підтвердження', 'Архів угод', 'Статистика']" :key="tag" class="step-tag">{{ tag }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Фічі -->
    <section class="px-14 py-[110px]">
      <div class="max-w-[1180px] mx-auto">
        <h2 class="bitter text-[38px] font-bold text-[rgb(27,46,27)] text-center mb-16">Що ви отримуєте</h2>
        <div class="grid grid-cols-3 gap-x-14 gap-y-12">

          <div class="flex gap-[18px]">
            <div class="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 8l2-3h14l2 3M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8M3 8h18" stroke="#2F5233" stroke-width="1.6" stroke-linejoin="round"/></svg>
            </div>
            <div>
              <h3 class="text-[17px] font-bold text-[rgb(27,46,27)] mt-0.5 mb-2">Каталог культур</h3>
              <p class="text-[14.5px] leading-relaxed text-[rgb(91,107,83)]">Вказуйте декілька культур з різними обсягами — фермери бачать точно що вам потрібно</p>
            </div>
          </div>

          <div class="flex gap-[18px]">
            <div class="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 20V13a6 6 0 0112 0v7" stroke="#2F5233" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 20h16" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round"/></svg>
            </div>
            <div>
              <h3 class="text-[17px] font-bold text-[rgb(27,46,27)] mt-0.5 mb-2">Пропозиції в реальному часі</h3>
              <p class="text-[14.5px] leading-relaxed text-[rgb(91,107,83)]">Фермери надсилають пропозиції напряму у ваш чат — жодних пропущених зв'язків</p>
            </div>
          </div>

          <div class="flex gap-[18px]">
            <div class="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 20V10M12 20V4M18 20v-7" stroke="#2F5233" stroke-width="1.8" stroke-linecap="round"/></svg>
            </div>
            <div>
              <h3 class="text-[17px] font-bold text-[rgb(27,46,27)] mt-0.5 mb-2">Статистика закупівель</h3>
              <p class="text-[14.5px] leading-relaxed text-[rgb(91,107,83)]">Кількість угод і загальний обсяг закуплених тонн відображаються у вашому профілі</p>
            </div>
          </div>

          <div class="flex gap-[18px]">
            <div class="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#2F5233" stroke-width="1.6"/><path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9z" stroke="#2F5233" stroke-width="1.4"/></svg>
            </div>
            <div>
              <h3 class="text-[17px] font-bold text-[rgb(27,46,27)] mt-0.5 mb-2">Фермери з усієї України</h3>
              <p class="text-[14.5px] leading-relaxed text-[rgb(91,107,83)]">Знаходьте постачальників у потрібному регіоні — фільтруйте за культурою і областю</p>
            </div>
          </div>

          <div class="flex gap-[18px]">
            <div class="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2.5l2.4 6.3 6.7.5-5.1 4.4 1.6 6.5L12 16.8 6.4 20.2 8 13.7 2.9 9.3l6.7-.5L12 2.5z" stroke="#2F5233" stroke-width="1.5" stroke-linejoin="round"/></svg>
            </div>
            <div>
              <h3 class="text-[17px] font-bold text-[rgb(27,46,27)] mt-0.5 mb-2">Рейтинг і відгуки</h3>
              <p class="text-[14.5px] leading-relaxed text-[rgb(91,107,83)]">Репутація формується на основі завершених угод — чесно і прозоро для обох сторін</p>
            </div>
          </div>

          <div class="flex gap-[18px]">
            <div class="shrink-0 w-[52px] h-[52px] rounded-[14px] bg-[rgb(238,241,227)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0113.5-5.7M20 12a8 8 0 01-13.5 5.7" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round"/><path d="M17.5 3v3.5H14M6.5 21v-3.5H10" stroke="#2F5233" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div>
              <h3 class="text-[17px] font-bold text-[rgb(27,46,27)] mt-0.5 mb-2">Без посередників</h3>
              <p class="text-[14.5px] leading-relaxed text-[rgb(91,107,83)]">Пряма комунікація з фермером — ніяких зайвих ланок і прихованих комісій</p>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="px-14 py-[100px] text-center" style="background: linear-gradient(rgb(238,241,227), rgb(220,230,203));">
      <span class="text-[13px] font-extrabold tracking-[0.1em] text-[#C98A3C] uppercase">Безкоштовна реєстрація</span>
      <h2 class="bitter text-[38px] font-bold text-[rgb(27,46,27)] mt-4 mb-3.5">Почніть закуповувати напряму</h2>
      <p class="text-[17px] text-[rgb(76,90,70)] mb-8">Без посередників і зайвих переплат</p>
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
.hero-buyer {
  min-height: 600px;
  background:
    linear-gradient(rgba(20,32,17,0.55) 0%, rgba(20,32,17,0.62) 55%, rgba(20,32,17,0.78) 100%),
    url('/role-buyer.jpg') center/cover no-repeat;
  background-color: #0d1a08;
}
.hero-title {
  font-family: 'Bitter', Georgia, serif;
}
.step-tag {
  padding: 7px 14px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid rgb(225, 219, 198);
  font-size: 13px;
  font-weight: 600;
  color: rgb(62, 79, 59);
}
</style>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'АгроПростір для заготівельників — закупівля зерна напряму від фермерів',
  description: 'Розміщуйте закупівельні оголошення, отримуйте пропозиції від фермерів і укладайте угоди без посередників.',
})

const steps = [
  {
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-3"/><rect x="9" y="1" width="6" height="4" rx="1"/></svg>',
    title: 'Заповніть профіль заготівельника',
    desc: 'Вкажіть назву підприємства, регіон роботи і контактні дані. Це допоможе фермерам знайти вас в каталозі.',
    tags: ['Назва підприємства', 'Регіон', 'Контакти'],
  },
  {
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V10M12 10C12 10 8 9 6 6c2 0 4.5.5 6 4zM12 10c0 0 4-1 6-4-2 0-4.5.5-6 4z"/><path d="M12 14c0 0-3-1-4-4M12 14c0 0 3-1 4-4"/></svg>',
    title: 'Вкажіть що закуповуєте',
    desc: 'Додайте культури які вас цікавлять, бажані обсяги і умови закупівлі. Фермери побачать ваш профіль і зможуть надіслати пропозицію.',
    tags: ['Культури', 'Обсяги', 'Умови'],
  },
  {
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    title: 'Отримуйте пропозиції в чаті',
    desc: 'Фермери надсилають пропозиції з кількістю і ціною прямо в чат. Обговорюйте деталі і домовляйтесь на вигідних умовах.',
    tags: ['Чат з фермером', 'Картка угоди', 'Переговори'],
  },
  {
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
    title: 'Підтверджуйте угоди',
    desc: 'Підтверджена угода зберігається в системі — ви бачите всю історію закупівель, обсяги і суми в одному місці.',
    tags: ['Підтвердження', 'Архів угод', 'Статистика'],
  },
]

const features = [
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-3"/><rect x="9" y="1" width="6" height="4" rx="1"/></svg>', title: 'Каталог культур', desc: 'Вказуйте декілька культур з різними обсягами — фермери бачать точно що вам потрібно' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>', title: 'Пропозиції в реальному часі', desc: 'Фермери надсилають пропозиції напряму у ваш чат — жодних пропущених зв\'язків' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>', title: 'Статистика закупівель', desc: 'Кількість угод і загальний обсяг закуплених тонн відображаються у вашому профілі' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>', title: 'Фермери з усієї України', desc: 'Знаходьте постачальників у потрібному регіоні — фільтруйте за культурою і областю' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="rgb(180,130,40)" stroke="rgb(180,130,40)" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>', title: 'Рейтинг і відгуки', desc: 'Репутація формується на основі завершених угод — чесно і прозоро для обох сторін' },
  { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>', title: 'Без посередників', desc: 'Пряма комунікація з фермером — ніяких зайвих ланок і прихованих комісій' },
]
</script>
