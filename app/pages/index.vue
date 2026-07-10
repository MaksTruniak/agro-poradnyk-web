<template>
  <div>
    <!-- Hero -->
    <section class="bg-white py-24 px-4 border-b border-agro-border">
      <div class="max-w-4xl mx-auto text-center">
        <p class="text-agro font-semibold mb-4 text-sm uppercase tracking-widest">Цифровий помічник аграрія</p>
        <h1 class="text-5xl md:text-6xl font-extrabold mb-6 leading-tight text-agro-dark">
          АгроПорадник
        </h1>
        <p class="text-xl text-agro-light mb-10 max-w-2xl mx-auto leading-relaxed">
          Керуйте полями, отримуйте консультації агрономів та замовляйте препарати — все в одному місці
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/auth?mode=register" class="bg-agro-dark text-white font-bold rounded-2xl px-8 py-4 text-lg hover:bg-agro transition-colors">
            Почати безкоштовно →
          </NuxtLink>
          <NuxtLink to="/catalog" class="border-2 border-agro-border text-agro-dark font-bold rounded-2xl px-8 py-4 text-lg hover:bg-agro-hover transition-colors">
            Каталог препаратів
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Для кого -->
    <section class="py-20 px-4 max-w-7xl mx-auto">
      <h2 class="text-3xl font-extrabold text-center text-agro-dark mb-12">Для кого АгроПорадник?</h2>
      <div class="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <NuxtLink v-for="role in roles" :key="role.title" :to="role.link" class="card text-center hover:shadow-md transition-shadow group">
          <div class="text-5xl mb-4">{{ role.emoji }}</div>
          <h3 class="font-bold text-lg text-agro-dark mb-2">{{ role.title }}</h3>
          <p class="text-agro-light text-sm leading-relaxed mb-3">{{ role.desc }}</p>
          <span v-if="role.link" class="text-xs text-agro font-semibold group-hover:underline">Дізнатись більше →</span>
        </NuxtLink>
      </div>
    </section>

    <!-- Функції -->
    <section class="py-20 px-4 bg-white">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl font-extrabold text-center text-agro-dark mb-12">Що вміє АгроПорадник?</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div v-for="feat in features" :key="feat.title" class="flex gap-4">
            <div class="text-3xl shrink-0">{{ feat.icon }}</div>
            <div>
              <h3 class="font-bold text-agro-dark mb-1">{{ feat.title }}</h3>
              <p class="text-agro-light text-sm leading-relaxed">{{ feat.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Культури і регіони -->
    <section class="py-20 px-4 bg-white border-t border-agro-border">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl font-extrabold text-center text-agro-dark mb-3">🌾 Що вирощують фермери</h2>
        <p class="text-center text-agro-light mb-12">Найпоширеніші культури серед учасників платформи</p>
        <div v-if="cropStats.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <NuxtLink v-for="c in cropStats" :key="c.crop_type" :to="`/farmers/${cropToSlug(c.crop_type)}`"
            class="card text-center hover:shadow-md transition-all hover:border-agro border-2 border-transparent">
            <div class="text-4xl mb-2">{{ c.emoji }}</div>
            <p class="font-semibold text-agro-dark text-sm">{{ c.crop_type }}</p>
            <p class="text-xs text-agro mt-1 font-medium">{{ c.count }} {{ pluralFarmer(c.count) }}</p>
          </NuxtLink>
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div v-for="i in 12" :key="i" class="card animate-pulse h-24"></div>
        </div>
      </div>
    </section>

    <!-- Бренди -->
    <section class="py-16 px-4 border-t border-agro-border">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-2xl font-extrabold text-center text-agro-dark mb-2">Провідні виробники</h2>
        <p class="text-center text-agro-light mb-10">Препарати і добрива від світових брендів</p>
        <div v-if="brands.length" class="flex flex-wrap justify-center gap-3">
          <NuxtLink v-for="b in brands.slice(0, 18)" :key="b.slug" :to="`/brand/${b.slug}`"
            class="px-5 py-3 bg-white border-2 border-agro-border rounded-2xl text-sm font-semibold text-agro-dark hover:border-agro hover:text-agro transition-colors">
            {{ b.name }}
          </NuxtLink>
        </div>
        <div v-else class="flex flex-wrap justify-center gap-3">
          <div v-for="i in 12" :key="i" class="h-11 w-28 bg-agro-bg rounded-2xl animate-pulse"></div>
        </div>
        <div class="text-center mt-8">
          <NuxtLink to="/catalog" class="text-agro font-semibold hover:underline text-sm">Весь каталог препаратів →</NuxtLink>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 px-4 bg-agro-hover border-t border-agro-border text-center">
      <h2 class="text-3xl font-extrabold mb-4 text-agro-dark">Готові почати?</h2>
      <p class="text-agro-light mb-8 text-lg">Реєстрація безкоштовна. Перші кроки — за хвилину.</p>
      <NuxtLink to="/auth?mode=register" class="bg-agro-dark text-white font-bold rounded-2xl px-10 py-4 text-lg hover:bg-agro transition-colors inline-block">
        Зареєструватись →
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'АгроПорадник — цифровий помічник агрария',
  description: 'Керуйте полями, консультуйтесь з агрономами та замовляйте препарати онлайн.',
  ogTitle: 'АгроПорадник',
  ogDescription: 'Цифровий помічник для фермерів, дачників, агрономів і продавців агрохімії.',
})

const supabase = useSupabaseClient()
const api = useAgroApi()

const MARKETPLACE = false

const roles = [
  { emoji: '🌾', title: 'Фермер', desc: 'Облік полів і культур, програми захисту, консультації агрономів', link: '/for-farmers' },
  { emoji: '🔬', title: 'Агроном', desc: 'Кабінет консультанта, управління клієнтами, просування профілю', link: '/for-agronomists' },
]

const features = [
  { icon: '🗺️', title: 'Поля і культури', desc: 'Додавайте поля, вказуйте культури і сорти, плануйте схеми живлення і захисту' },
  { icon: '👨‍🌾', title: 'Живий агроном', desc: 'Знаходьте перевірених агрономів і спілкуйтесь у чаті напряму' },
  { icon: '🤖', title: 'AI агроном', desc: 'Отримуйте відповіді на агрономічні питання від AI-асистента 24/7' },
  { icon: '🛒', title: 'Каталог препаратів', desc: 'Тисячі препаратів і добрив — склад, аналоги, культури та норми витрати' },
  { icon: '🛡️', title: 'Програма захисту', desc: 'Складайте календар обробок по фазах розвитку культури' },
  { icon: '🔔', title: 'Push-сповіщення', desc: 'Нагадування про обробки, нові повідомлення та замовлення' },
]

const CROP_EMOJI: Record<string, string> = {
  'Пшениця': '🌾', 'Кукурудза': '🌽', 'Соняшник': '🌻', 'Ріпак': '🌿',
  'Соя': '🫘', 'Ячмінь': '🌾', 'Жито': '🌾', 'Буряк': '🫚',
  'Картопля': '🥔', 'Томати': '🍅', 'Огірки': '🥒', 'Морква': '🥕',
  'Цибуля': '🧅', 'Часник': '🧄', 'Капуста': '🥬', 'Перець': '🌶️',
  'Полуниця': '🍓', 'Смородина': '🫐', 'Малина': '🍒', 'Виноград': '🍇',
  'Яблука': '🍎', 'Груші': '🍐', 'Черешня': '🍒', 'Слива': '🍑',
}

const pluralFarmer = (n: number) => n === 1 ? 'фермер' : n >= 2 && n <= 4 ? 'фермери' : 'фермерів'

const CROP_SLUG: Record<string, string> = {
  'Пшениця': 'pshenytsia', 'Кукурудза': 'kukurudza', 'Соняшник': 'soniashnyk',
  'Ріпак': 'ripak', 'Соя': 'soia', 'Ячмінь': 'yachmin', 'Жито': 'zhyto',
  'Буряк': 'buryak', 'Картопля': 'kartoplia', 'Томати': 'tomaty',
  'Огірки': 'ohirky', 'Морква': 'morkva', 'Цибуля': 'tsybulya',
  'Часник': 'chasnyk', 'Капуста': 'kapusta', 'Перець': 'perets',
  'Полуниця': 'polunytsia', 'Смородина': 'smorodyna', 'Малина': 'malyna',
  'Виноград': 'vynograd', 'Яблука': 'yabluka', 'Груші': 'hrushi',
  'Черешня': 'chereshnia', 'Слива': 'slyva',
}
const cropToSlug = (crop: string) => CROP_SLUG[crop] || crop.toLowerCase().replace(/\s+/g, '-')

const cropStats = ref<any[]>([])
const brands = ref<any[]>([])

onMounted(async () => {
  const [cropsRes, brandsRes] = await Promise.all([
    supabase.from('farm_crops').select('crop_type'),
    api.getManufacturers().catch(() => ({ items: [] })),
  ])

  // Підраховуємо унікальних фермерів по культурі
  const map: Record<string, number> = {}
  for (const row of (cropsRes.data || [])) {
    map[row.crop_type] = (map[row.crop_type] || 0) + 1
  }
  cropStats.value = Object.entries(map)
    .map(([crop_type, count]) => ({ crop_type, count, emoji: CROP_EMOJI[crop_type] || '🌱' }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  brands.value = (brandsRes.items || []).sort((a: any, b: any) => a.name.localeCompare(b.name, 'uk'))
})
</script>
