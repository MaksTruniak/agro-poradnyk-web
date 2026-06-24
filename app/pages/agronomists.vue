<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-agro-dark">👨‍🌾 Агрономи</h1>
      <p class="text-agro-light mt-1">Знайдіть фахового агронома для консультації</p>
    </div>

    <!-- Пошук -->
    <div class="relative mb-8 max-w-xl">
      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-agro-light">🔍</span>
      <input v-model="search" class="input pl-11" placeholder="Пошук за ім'ям або спеціалізацією..." />
    </div>

    <div v-if="loading" class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="i in 6" :key="i" class="card animate-pulse h-40"></div>
    </div>

    <div v-else-if="filtered.length === 0" class="text-center py-20">
      <p class="text-5xl mb-4">🔍</p>
      <p class="font-bold text-agro-dark text-lg">Нічого не знайдено</p>
    </div>

    <div v-else class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="agro in filtered" :key="agro.id" class="card hover:shadow-md transition-all">
        <!-- Шапка -->
        <div class="flex items-start gap-4 mb-4">
          <div class="w-14 h-14 rounded-2xl bg-agro-hover flex items-center justify-center font-bold text-agro text-xl shrink-0">
            {{ agro.name?.[0]?.toUpperCase() || '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-bold text-agro-dark">{{ agro.name }}</h3>
              <span v-if="agro.promotion_plan === 'top'" class="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">⭐ Топ</span>
            </div>
            <p v-if="agro.specialization" class="text-sm text-agro-light mt-0.5">{{ agro.specialization }}</p>
          </div>
          <!-- Рейтинг -->
          <div v-if="agro.rating" class="text-right shrink-0">
            <p class="font-bold text-agro">{{ agro.rating.toFixed(1) }}</p>
            <p class="text-xs text-agro-light">⭐ рейтинг</p>
          </div>
        </div>

        <!-- Культури -->
        <div v-if="agro.crops?.length" class="flex flex-wrap gap-1.5 mb-4">
          <span v-for="c in agro.crops.slice(0,5)" :key="c" class="text-xs bg-agro-bg text-agro-dark px-2 py-0.5 rounded-full border border-agro-border">
            {{ c }}
          </span>
          <span v-if="agro.crops.length > 5" class="text-xs text-agro-light">+{{ agro.crops.length - 5 }}</span>
        </div>

        <!-- Статистика -->
        <div class="flex gap-4 text-xs text-agro-light mb-5">
          <span>👥 {{ agro.clients_count || 0 }} клієнтів</span>
          <span v-if="agro.region">📍 {{ agro.region }}</span>
        </div>

        <!-- Кнопка -->
        <button @click="startChat(agro)" :disabled="starting === agro.id" class="btn-primary w-full text-sm py-2.5">
          {{ starting === agro.id ? '...' : '💬 Написати' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({ title: 'Агрономи' })

const supabase = useSupabaseClient()
const router = useRouter()

const loading = ref(true)
const agronomists = ref<any[]>([])
const search = ref('')
const starting = ref('')

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

// Завантажуємо агрономів
const { data: profiles } = await supabase
  .from('agronomist_profiles')
  .select('*, users(id, name)')
  .order('promotion_plan', { ascending: false }) // top спочатку

agronomists.value = (profiles || []).map((p: any) => ({
  id: p.id,
  user_id: p.users?.id,
  name: p.users?.name || 'Агроном',
  specialization: p.specialization,
  crops: p.crops || [],
  region: p.region,
  rating: p.rating,
  promotion_plan: p.promotion_plan,
  clients_count: p.clients_count || 0,
}))

loading.value = false

const filtered = computed(() => {
  if (!search.value.trim()) return agronomists.value
  const q = search.value.toLowerCase()
  return agronomists.value.filter(a =>
    a.name?.toLowerCase().includes(q) ||
    a.specialization?.toLowerCase().includes(q) ||
    a.crops?.some((c: string) => c.toLowerCase().includes(q))
  )
})

const startChat = async (agro: any) => {
  if (!uid) { navigateTo('/auth'); return }
  starting.value = agro.id

  // Перевіряємо чи є вже чат
  const { data: existing } = await supabase
    .from('chats')
    .select('id')
    .eq('farmer_id', uid)
    .eq('agronomist_id', agro.user_id)
    .eq('type', 'human')
    .single()

  if (existing) {
    router.push(`/dashboard/chats/${existing.id}`)
    return
  }

  // Створюємо новий чат
  const { data: newChat } = await supabase
    .from('chats')
    .insert({ farmer_id: uid, agronomist_id: agro.user_id, type: 'human', is_unlocked: false })
    .select().single()

  starting.value = ''
  if (newChat) router.push(`/dashboard/chats/${newChat.id}`)
}
</script>
