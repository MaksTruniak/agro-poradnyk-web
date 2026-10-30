<template>
  <div>
    <!-- Hero -->
    <section class="hero-buyer relative flex flex-col items-center justify-center text-center px-4 sm:px-14 py-[88px] overflow-hidden">
      <div class="absolute inset-0" style="background: linear-gradient(rgba(20,32,17,0.55) 0%, rgba(20,32,17,0.62) 55%, rgba(20,32,17,0.78) 100%);"></div>
      <div class="relative z-10 flex flex-col items-center">
        <span class="inline-flex items-center gap-2 px-[18px] py-2 rounded-full bg-white/14 backdrop-blur-sm text-[13px] font-extrabold tracking-[0.06em] text-[#E5C48C] uppercase mb-[22px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 20h16M6 20V10l-2-4h16l-2 4v10M9 10V6M15 10V6" stroke="#E5C48C" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Для заготівельників
        </span>
        <h1 class="hero-title text-[38px] sm:text-[60px] leading-[1.08] tracking-[-0.02em] font-extrabold text-white max-w-[820px] mb-[22px]">
          Знаходьте продукцію — напряму від фермерів
        </h1>
        <p class="text-[17px] sm:text-[19px] leading-relaxed text-[rgb(237,239,230)] max-w-[640px] mb-9">
          Бачте, коли й де фермери збиратимуть ягоди, фрукти й виноград, домовляйтесь заздалегідь і отримуйте паспорт партії до кожної угоди
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

    <LandingRoleSteps subtitle="Від профілю до першої угоди — 4 кроки" :steps="steps" />

    <LandingRoleFeatures subtitle="Ягоди, фрукти й виноград напряму від фермерів — зі строками збору й історією вирощування" :groups="groups" />

    <!-- CTA -->
    <section class="px-4 sm:px-14 py-[100px] text-center" style="background: linear-gradient(rgb(238,241,227), rgb(220,230,203));">
      <span class="text-[13px] font-extrabold tracking-[0.1em] text-[#C98A3C] uppercase">Безкоштовна реєстрація</span>
      <h2 class="bitter text-[32px] sm:text-[38px] font-bold text-[rgb(27,46,27)] mt-4 mb-3.5">Почніть закуповувати напряму</h2>
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
</style>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'АгроПростір для заготівельників — ягоди, фрукти й виноград напряму від фермерів',
  description: 'Строки збору урожаю у фермерів, закупівельні потреби, угоди в чаті і паспорт партії з історією обробок.',
})

const steps = [
  {
    title: 'Заповніть профіль заготівельника',
    desc: 'Назва підприємства, регіон роботи і контакти. Профіль бачать фермери, а після угод у ньому з\'являються рейтинг і статистика закупівель.',
    tags: ['Назва підприємства', 'Регіон', 'Контакти'],
  },
  {
    title: 'Вкажіть, що закуповуєте',
    desc: 'Ягоди, фрукти, виноград — з обсягами й умовами закупівлі. Фермери бачать, що саме вам потрібно.',
    tags: ['Культури', 'Обсяги', 'Умови'],
  },
  {
    title: 'Знаходьте урожай заздалегідь',
    desc: 'У розділі «Скоро урожай» видно, коли й де фермери збиратимуть: культура, сорт, площа, регіон. Домовляйтесь до початку збору.',
    tags: ['Строки збору', 'Сорт і площа', 'Регіон'],
  },
  {
    title: 'Укладайте угоди',
    desc: 'Обговорюйте кількість і ціну в чаті та підтверджуйте угоду. Паспорт партії покаже, як вирощено продукцію.',
    tags: ['Чат з фермером', 'Угода', 'Паспорт партії'],
  },
]

const groups = [
  {
    icon: '<path d="M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    title: 'Скоро урожай',
    lead: 'Коли й де фермери збиратимуть ягоди, фрукти й виноград.',
    can: [
      'Строки збору за сортом і фазою насадження',
      'Культура, сорт, площа і регіон господарства',
      'Фільтр: 30 днів, 2 місяці або весь сезон, за культурою й областю',
    ],
    result: 'домовляєтесь про обсяги до збору, а не шукаєте товар в останній момент.',
  },
  {
    icon: '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><path d="M9 5a2 2 0 002 2h2a2 2 0 002-2 2 2 0 00-2-2h-2a2 2 0 00-2 2zM9 12h6M9 16h4"/>',
    title: 'Що закуповую',
    lead: 'Ваша закупівельна потреба, яку бачать фермери.',
    can: [
      'Кілька культур з різними обсягами',
      'Опис умов закупівлі для кожної культури',
      'Зміна списку в будь-який момент сезону',
    ],
    result: 'фермери пропонують саме те, що вам потрібно.',
  },
  {
    icon: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>',
    title: 'Каталог фермерів',
    lead: 'Постачальники з усієї України.',
    can: [
      'Пошук за культурою і регіоном',
      'Профіль фермера з його культурами',
      'Перехід у чат з фермером одним натиском',
    ],
    result: 'нові постачальники без посередників і зайвих дзвінків.',
  },
  {
    icon: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
    title: 'Чат і пропозиції',
    lead: 'Переговори напряму з фермером.',
    can: [
      'Пропозиція з кількістю і ціною прямо в чаті',
      'Обговорення умов, строків і доставки',
      'Уся історія переговорів збережена',
    ],
    result: 'домовляєтесь швидко, без прихованих комісій і зайвих ланок.',
  },
  {
    icon: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13l2 2 4-4"/>',
    title: 'Угоди і рейтинг',
    lead: 'Усі закупівлі — в одному архіві.',
    can: [
      'Підтверджені угоди з обсягами і сумами',
      'Оцінка угоди після завершення',
      'Рейтинг, кількість угод і закуплені тонни у вашому профілі',
    ],
    result: 'повна історія закупівель без таблиць і паперових папок.',
  },
  {
    icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
    title: 'Паспорт партії',
    lead: 'Як вирощено продукцію, яку ви купуєте.',
    can: [
      'Обробки за сезон: препарат, дата, строк очікування',
      'Фенофази насадження і огляди агронома',
      'Друк або PDF для ваших покупців',
    ],
    result: 'впевненість у безпечності продукції і аргумент для вашого покупця.',
  },
]
</script>
