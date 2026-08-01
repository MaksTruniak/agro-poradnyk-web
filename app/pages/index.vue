<template>
  <div>
    <!-- Hero -->
    <section class="hero-section relative flex items-center justify-center text-center">
      <div class="hero-overlay absolute inset-0"></div>
      <div class="relative z-10 px-4 py-32 md:py-40 max-w-3xl mx-auto">
        <p class="hero-eyebrow text-sm font-semibold uppercase tracking-[0.18em] mb-5">
          Цифровий помічник аграрія
        </p>
        <h1 class="hero-title text-6xl md:text-7xl font-black leading-none mb-6">
          АгроПростір
        </h1>
        <p class="text-white/80 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
          Керуйте полями, отримуйте консультації агрономів та замовляйте препарати — все в одному місці
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/auth?mode=register"
            class="inline-flex items-center justify-center gap-2 bg-[#2F5233] text-white font-bold rounded-full px-8 py-3.5 text-base hover:bg-[#3d6b42] transition-colors shadow-lg shadow-black/30">
            Почати безкоштовно →
          </NuxtLink>
          <NuxtLink to="/pesticides"
            class="inline-flex items-center justify-center border-2 border-white/70 text-white font-bold rounded-full px-8 py-3.5 text-base bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
            Каталог препаратів
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Для кого -->
    <section class="py-20 px-6 bg-[#EEF0E5]">
      <div class="max-w-6xl mx-auto">
        <h2 class="bitter text-4xl font-black text-center text-[rgb(27,46,27)] mb-12">Для кого АгроПростір?</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <NuxtLink v-for="role in roles" :key="role.title" :to="role.link"
            class="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
            <div class="aspect-[16/9] overflow-hidden bg-[#d8ddd0]">
              <img v-if="role.img" :src="role.img" :alt="role.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
              <div v-else class="w-full h-full flex items-center justify-center text-6xl">{{ role.emoji }}</div>
            </div>
            <div class="p-6 flex flex-col flex-1">
              <h3 class="bitter font-black text-xl text-[rgb(27,46,27)] mb-2">{{ role.title }}</h3>
              <p class="text-[rgb(27,46,27)]/60 text-sm leading-relaxed mb-4 flex-1">{{ role.desc }}</p>
              <span class="text-[#2F5233] font-semibold text-sm group-hover:underline">Дізнатись більше →</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Функції -->
    <section class="py-20 px-6 bg-[#fbf6ec]">
      <div class="max-w-6xl mx-auto">
        <h2 class="bitter text-4xl font-black text-center text-[rgb(27,46,27)] mb-16">Що вміє АгроПростір?</h2>
        <div class="grid md:grid-cols-3 gap-x-12 gap-y-10">
          <div v-for="feat in features" :key="feat.title" class="flex items-start gap-4">
            <div class="shrink-0 w-12 h-12 rounded-xl bg-[#E8EDE4] flex items-center justify-center text-[#2F5233]">
              <component :is="feat.icon" :size="22" :stroke-width="1.5"/>
            </div>
            <div>
              <h3 class="font-bold text-[rgb(27,46,27)] mb-1">{{ feat.title }}</h3>
              <p class="text-[rgb(27,46,27)]/60 text-sm leading-relaxed">{{ feat.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Культури -->
    <section class="py-20 px-4 bg-[#FAF6EC] border-t border-[#e2ddd0]">
      <div class="max-w-7xl mx-auto">
        <h2 class="bitter text-4xl font-black text-center text-[rgb(27,46,27)] mb-3">Що вирощують фермери</h2>
        <p class="text-center text-[rgb(27,46,27)]/50 mb-12">Найпоширеніші культури серед учасників платформи</p>
        <div v-if="cropStats.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <NuxtLink v-for="c in cropStats" :key="c.crop_type" :to="`/farmers/${cropToSlug(c.crop_type)}`"
            class="bg-white rounded-2xl p-5 text-center hover:shadow-md transition-all group">
            <div class="mb-3 flex justify-center">
              <img
                :src="`/crops/${cropToSlug(c.crop_type)}.svg`"
                :alt="c.crop_type"
                class="w-16 h-16"
                @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
              />
            </div>
            <p class="font-semibold text-[rgb(27,46,27)] text-sm leading-tight">{{ c.crop_type }}</p>
            <p class="text-xs text-[rgb(27,46,27)]/40 mt-1">{{ c.count }} {{ pluralFarmer(c.count) }}</p>
          </NuxtLink>
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div v-for="i in 12" :key="i" class="bg-white rounded-2xl h-36 animate-pulse"></div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-24 px-4 bg-[#ecf0df] text-center">
      <h2 class="bitter text-4xl font-black mb-4 text-[rgb(27,46,27)]">Готові почати?</h2>
      <p class="text-[rgb(27,46,27)]/60 mb-10 text-lg">Реєстрація безкоштовна. Перші кроки — за хвилину.</p>
      <NuxtLink to="/auth?mode=register"
        class="inline-block bg-[#2F5233] text-white font-bold rounded-full px-10 py-4 text-lg hover:bg-[#3d6b42] transition-colors shadow-lg shadow-black/20">
        Зареєструватись →
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Image, User, Sparkles, ShoppingBag, ClipboardList, Bell } from 'lucide-vue-next'
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'АгроПростір — цифровий помічник агрария',
  description: 'Керуйте полями, консультуйтесь з агрономами та замовляйте препарати онлайн.',
  ogTitle: 'АгроПростір',
  ogDescription: 'Цифровий помічник для фермерів, дачників, агрономів і продавців агрохімії.',
})

const supabase = useSupabaseClient()

const roles = [
  { emoji: '🌾', title: 'Фермер', desc: 'Облік полів і культур, технологічні карти, консультації агрономів', link: '/for-farmers', img: '/role-farmer.jpg' },
  { emoji: '🔬', title: 'Агроном', desc: 'Кабінет консультанта, управління клієнтами, просування профілю', link: '/for-agronomists', img: '/role-agronomist.jpg' },
  { emoji: '🏭', title: 'Заготівельник', desc: 'Розміщуйте закупівлі, отримуйте пропозиції від фермерів напряму', link: '/for-buyers', img: '/role-buyer.jpg' },
]

const features = [
  { icon: Image,         title: 'Поля і культури',    desc: 'Додавайте поля, вказуйте культури і сорти, плануйте схеми живлення і захисту' },
  { icon: User,          title: 'Живий агроном',       desc: 'Знаходьте перевірених агрономів і спілкуйтесь у чаті напряму' },
  { icon: Sparkles,      title: 'AI агроном',          desc: 'Отримуйте відповіді на агрономічні питання від AI-асистента 24/7' },
  { icon: ShoppingBag,   title: 'Каталог препаратів',  desc: 'Тисячі препаратів і добрив — склад, аналоги, культури та норми витрати' },
  { icon: ClipboardList, title: 'Технологічна карта',  desc: 'Складайте календар обробок по фазах розвитку культури' },
  { icon: Bell,          title: 'Push-сповіщення',     desc: 'Нагадування про обробки, нові повідомлення та замовлення' },
]

const { cropToSlug, cropEmoji: getCropEmoji } = await import('~/utils/cropSlugs')

const pluralFarmer = (n: number) => n === 1 ? 'фермер' : n >= 2 && n <= 4 ? 'фермери' : 'фермерів'

// Завантажуємо crop stats на сервері (SSR)
const { data: cropStatsData } = await useAsyncData('crop-stats', async () => {
  const { data } = await supabase.rpc('get_crop_stats')
  return (data || []).map((row: any) => ({
    crop_type: row.crop_type,
    count: Number(row.count),
    emoji: getCropEmoji(row.crop_type),
  }))
})
const cropStats = computed(() => cropStatsData.value || [])
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.hero-section {
  min-height: 100svh;
  background:
    linear-gradient(to bottom, rgba(8, 18, 8, 0.55) 0%, rgba(12, 24, 8, 0.45) 60%, rgba(8, 18, 8, 0.7) 100%),
    url('/hero-field.png') center/cover no-repeat;
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
