<template>
  <div class="p-8">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        Користувачі
      </h1>
      <p class="text-agro-light mt-1">{{ total }} зареєстровано</p>
    </div>

    <!-- Пошук -->
    <div class="flex items-center gap-3 mb-5">
      <div class="relative flex-1 max-w-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-agro-light"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input v-model="search" class="input pl-9 text-sm" placeholder="Пошук за email..." />
      </div>
    </div>

    <!-- Список -->
    <div v-if="loading" class="card overflow-hidden p-0">
      <div v-for="i in 12" :key="i" class="flex items-center gap-4 px-5 py-3.5 border-b border-agro-border animate-pulse">
        <div class="w-10 h-10 rounded-full bg-agro-bg shrink-0"></div>
        <div class="flex-1"><div class="h-4 bg-agro-bg rounded w-1/3 mb-1.5"></div><div class="h-3 bg-agro-bg rounded w-1/4"></div></div>
      </div>
    </div>

    <div v-else class="card overflow-hidden p-0">
      <div class="divide-y divide-agro-border">
        <div v-for="user in filtered" :key="user.id" class="flex items-center gap-3 px-5 py-3 hover:bg-agro-bg transition-colors">
          <div class="w-10 h-10 rounded-full bg-agro-hover flex items-center justify-center shrink-0 text-agro font-bold text-sm">
            {{ (user.email || '?')[0].toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-agro-dark truncate text-sm">{{ user.email }}</p>
            <p class="text-xs text-agro-light truncate">
              {{ user.user_metadata?.full_name || user.user_metadata?.name || '' }}
              <span v-if="user.user_metadata?.role" class="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
                :class="user.user_metadata.role === 'agronomist' ? 'bg-agro-hover text-agro' : 'bg-agro-bg text-agro-light'">
                {{ roleLabel(user.user_metadata.role) }}
              </span>
            </p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-xs text-agro-light">{{ formatDate(user.created_at) }}</p>
            <p class="text-[10px] mt-0.5" :class="user.confirmed_at ? 'text-green-500' : 'text-amber-500'">
              {{ user.confirmed_at ? 'Підтверджено' : 'Не підтверджено' }}
            </p>
          </div>
        </div>
      </div>
      <div v-if="!filtered.length" class="text-center py-12 text-agro-light text-sm">Нічого не знайдено</div>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-between mt-4">
      <p class="text-sm text-agro-light">Сторінка {{ page }} з {{ totalPages }}</p>
      <div class="flex gap-2">
        <button @click="changePage(page - 1)" :disabled="page === 1" class="btn-outline text-sm py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed">← Назад</button>
        <button @click="changePage(page + 1)" :disabled="page >= totalPages" class="btn-outline text-sm py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed">Далі →</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Користувачі — Адмін' })
definePageMeta({ layout: 'admin', middleware: 'admin' })

const LIMIT = 50
const page = ref(1)
const total = ref(0)
const users = ref<any[]>([])
const loading = ref(true)
const search = ref('')

const totalPages = computed(() => Math.ceil(total.value / LIMIT))
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u => u.email?.toLowerCase().includes(q) || u.user_metadata?.full_name?.toLowerCase().includes(q))
})

const load = async () => {
  loading.value = true
  const data = await $fetch('/api/admin/users', { query: { page: page.value, limit: LIMIT } }) as any
  users.value = data.users || []
  total.value = data.total || 0
  loading.value = false
}

const changePage = (p: number) => {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  load()
}

const roleLabel = (role: string) => {
  const map: Record<string, string> = { agronomist: 'Агроном', farmer: 'Фермер', seller: 'Продавець', admin: 'Адмін' }
  return map[role] || role
}

const formatDate = (iso: string) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(load)
</script>
