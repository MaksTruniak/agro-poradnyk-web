<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark">🌾 Насіння</h1>
      <p class="text-agro-light mt-1">{{ total }} сортів у базі</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Сайдбар культур -->
      <aside class="lg:w-56 shrink-0">
        <div class="card p-3">
          <p class="text-xs font-semibold text-agro-light uppercase tracking-wide px-2 mb-2">Культура</p>
          <button
            @click="activeCrop = ''; offset = 0; load()"
            class="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5"
            :class="!activeCrop ? 'bg-agro text-white' : 'text-agro-light hover:bg-agro-hover hover:text-agro-dark'"
          >Всі культури</button>
          <button
            v-for="c in CROPS"
            :key="c.name"
            @click="activeCrop = c.name; offset = 0; load()"
            class="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5 flex items-center gap-2"
            :class="activeCrop === c.name ? 'bg-agro text-white' : 'text-agro-light hover:bg-agro-hover hover:text-agro-dark'"
          >
            <span>{{ c.emoji }}</span><span>{{ c.name }}</span>
          </button>
        </div>
      </aside>

      <!-- Основний контент -->
      <div class="flex-1 min-w-0">
        <div class="relative mb-5">
          <input v-model="search" @input="onSearch" class="input pl-10" placeholder="Пошук сорту або гібриду..." />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light">🔍</span>
          <button v-if="search" @click="search = ''; load()" class="absolute right-3 top-1/2 -translate-y-1/2 text-agro-light hover:text-agro-dark">✕</button>
        </div>

        <div v-if="loading" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="i in 12" :key="i" class="card animate-pulse h-32"></div>
        </div>

        <div v-else-if="items.length" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <NuxtLink
            v-for="item in items"
            :key="item.id"
            :to="`/catalog/${item.slug}`"
            class="card hover:shadow-md transition-shadow group flex flex-col gap-2"
          >
            <div class="flex items-start gap-3">
              <div v-if="item.source_image_url" class="w-10 h-10 rounded-xl overflow-hidden bg-agro-hover shrink-0">
                <img :src="item.source_image_url" :alt="item.name" class="w-full h-full object-contain p-1" loading="lazy" />
              </div>
              <div v-else class="w-10 h-10 rounded-xl bg-agro-hover flex items-center justify-center text-xl shrink-0">
                {{ cropEmoji(item.seed_crop) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-agro-dark text-sm group-hover:text-agro transition-colors leading-snug">{{ item.name }}</p>
                <p v-if="item.manufacturer?.name" class="text-xs text-agro-light mt-0.5 truncate">{{ item.manufacturer.name }}</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-1">
              <span v-if="item.seed_crop" class="text-xs bg-agro-bg text-agro-light px-2 py-0.5 rounded-full">{{ item.seed_crop }}</span>
              <span v-if="item.seed_maturity_group" class="text-xs bg-agro-bg text-agro-light px-2 py-0.5 rounded-full">{{ item.seed_maturity_group }}</span>
              <span v-if="item.seed_yield_potential" class="text-xs bg-agro-bg text-agro-light px-2 py-0.5 rounded-full">{{ item.seed_yield_potential }} т/га</span>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="card text-center py-16">
          <p class="text-4xl mb-3">🌾</p>
          <p class="font-bold text-agro-dark">Нічого не знайдено</p>
          <p class="text-agro-light text-sm mt-1">Спробуйте інший запит або культуру</p>
        </div>

        <div v-if="total > LIMIT" class="flex items-center justify-center gap-2 mt-8">
          <button @click="prevPage" :disabled="offset === 0"
            class="px-4 py-2 rounded-xl border border-agro-border text-sm font-medium text-agro-dark hover:bg-agro-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors">← Назад</button>
          <span class="text-sm text-agro-light px-2">{{ currentPage }} / {{ totalPages }}</span>
          <button @click="nextPage" :disabled="offset + LIMIT >= total"
            class="px-4 py-2 rounded-xl border border-agro-border text-sm font-medium text-agro-dark hover:bg-agro-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Далі →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Насіння — АгроПорадник' })

const CROPS = [
  { name: 'Кукурудза',       emoji: '🌽' },
  { name: 'Соняшник',        emoji: '🌻' },
  { name: 'Пшениця озима',   emoji: '🌾' },
  { name: 'Пшениця яра',     emoji: '🌾' },
  { name: 'Ріпак озимий',    emoji: '🟡' },
  { name: 'Ріпак ярий',      emoji: '🟡' },
  { name: 'Буряк цукровий',  emoji: '🟣' },
  { name: 'Соя',             emoji: '🫘' },
  { name: 'Картопля',        emoji: '🥔' },
  { name: 'Ячмінь ярий',     emoji: '🌾' },
  { name: 'Ячмінь озимий',   emoji: '🌾' },
  { name: 'Горох',           emoji: '🫛' },
  { name: 'Жито озиме',      emoji: '🌾' },
  { name: 'Сорго',           emoji: '🌿' },
  { name: 'Тритикале озиме', emoji: '🌾' },
  { name: 'Овес',            emoji: '🌾' },
  { name: 'Льон',            emoji: '💙' },
  { name: 'Просо',           emoji: '🌿' },
  { name: 'Вика',            emoji: '🌿' },
  { name: 'Гречка',          emoji: '⬛' },
  { name: 'Гірчиця',         emoji: '🟤' },
  { name: 'Квасоля',         emoji: '🫘' },
  { name: 'Кавун',           emoji: '🍉' },
  { name: 'Нут',             emoji: '🫘' },
  { name: 'Гарбузи',         emoji: '🎃' },
  { name: 'Рис',             emoji: '🍚' },
  { name: 'Коноплі',         emoji: '🌿' },
  { name: 'Люпин',           emoji: '🌿' },
  { name: 'Рижій',           emoji: '🌿' },
  { name: 'Сориз',           emoji: '🌿' },
  { name: 'Амарант',         emoji: '🌺' },
  { name: 'Буряк кормовий',  emoji: '🟣' },
  { name: 'Люцерна',         emoji: '🌿' },
  { name: 'Чина',            emoji: '🌿' },
  { name: 'Кінські боби',    emoji: '🫘' },
  { name: 'Спельта',         emoji: '🌾' },
  { name: 'Гірчиця біла',    emoji: '🟤' },
  { name: 'Цибуля',          emoji: '🧅' },
  { name: 'Сочевиця',        emoji: '🫘' },
  { name: 'Морква',          emoji: '🥕' },
  { name: 'Часник',          emoji: '🧄' },
]

const cropEmojiMap = Object.fromEntries(CROPS.map(c => [c.name, c.emoji]))
const cropEmoji = (name: string) => cropEmojiMap[name] || '🌾'

const api = useAgroApi()
const LIMIT = 40

const search = ref('')
const activeCrop = ref('')
const offset = ref(0)
const items = ref<any[]>([])
const total = ref(0)
const loading = ref(true)
let searchTimer: any = null

const currentPage = computed(() => Math.floor(offset.value / LIMIT) + 1)
const totalPages = computed(() => Math.ceil(total.value / LIMIT))

const load = async () => {
  loading.value = true
  const data = await api.getProducts({
    search: search.value || undefined,
    includeTypes: ['seed'],
    seedCrop: activeCrop.value || undefined,
    limit: LIMIT,
    page: currentPage.value,
  })
  items.value = data.items || data.data || []
  total.value = data.meta?.total || data.total || 0
  loading.value = false
}

const onSearch = () => {
  clearTimeout(searchTimer)
  offset.value = 0
  searchTimer = setTimeout(load, 300)
}

const nextPage = () => { offset.value += LIMIT; load() }
const prevPage = () => { offset.value = Math.max(0, offset.value - LIMIT); load() }

onMounted(load)
</script>
