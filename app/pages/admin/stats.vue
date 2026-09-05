<template>
  <div class="p-8">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        Статистика
      </h1>
      <p class="text-agro-light mt-1">Реєстрації користувачів</p>
    </div>

    <!-- Картки по ролях -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="card py-3 px-4 animate-pulse h-16"></div>
      </template>
      <template v-else>
        <div v-for="r in (stats?.roles || [])" :key="r.role" class="card py-3 px-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" :class="roleColor(r.role)">
            <span class="text-lg">{{ roleIcon(r.role) }}</span>
          </div>
          <div>
            <p class="text-2xl font-extrabold text-agro-dark leading-none">{{ r.count }}</p>
            <p class="text-xs text-agro-light mt-0.5">{{ roleLabel(r.role) }}</p>
          </div>
        </div>
        <div class="card py-3 px-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-agro-hover flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div>
            <p class="text-2xl font-extrabold text-agro-dark leading-none">{{ stats?.total ?? 0 }}</p>
            <p class="text-xs text-agro-light mt-0.5">Всього</p>
          </div>
        </div>
      </template>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Помісячно -->
      <div class="card">
        <p class="text-xs font-bold uppercase tracking-widest text-agro-light mb-5">Реєстрації за 12 місяців</p>
        <div v-if="loading" class="h-40 flex items-end gap-1.5 animate-pulse">
          <div v-for="i in 12" :key="i" class="flex-1 bg-agro-bg rounded-t" style="height: 40%"></div>
        </div>
        <div v-else-if="stats?.months?.length" class="h-40 flex items-end gap-1.5">
          <div v-for="m in stats.months" :key="m.key" class="flex-1 flex flex-col items-center gap-1 group min-w-0">
            <span class="text-[10px] text-agro font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{{ m.count }}</span>
            <div class="w-full rounded-t transition-all duration-300"
              :style="`height:${monthBarHeight(m.count)}px; background:rgb(47,82,51); opacity:${m.count ? 0.55 + (m.count / monthMax) * 0.45 : 0.12}`">
            </div>
            <span class="text-[9px] text-agro-light truncate w-full text-center leading-tight">{{ m.label }}</span>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-agro-border flex justify-between text-xs text-agro-light">
          <span>Цього місяця: <strong class="text-agro-dark">{{ currentMonthCount }}</strong></span>
          <span>Минулого: <strong class="text-agro-dark">{{ prevMonthCount }}</strong></span>
        </div>
      </div>

      <!-- По роках -->
      <div class="card">
        <p class="text-xs font-bold uppercase tracking-widest text-agro-light mb-5">По роках</p>
        <div v-if="loading" class="space-y-3 animate-pulse">
          <div v-for="i in 3" :key="i" class="h-9 bg-agro-bg rounded-xl"></div>
        </div>
        <div v-else-if="stats?.years?.length" class="space-y-3">
          <div v-for="y in stats.years" :key="y.year" class="flex items-center gap-3">
            <span class="text-sm font-bold text-agro-dark w-12 shrink-0">{{ y.year }}</span>
            <div class="flex-1 bg-agro-bg rounded-full h-7 overflow-hidden">
              <div class="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                :style="`width:${Math.max(10, (y.count / yearMax) * 100)}%; background:rgb(47,82,51)`">
                <span class="text-[11px] text-white font-bold">{{ y.count }}</span>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-agro-light">Немає даних</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Статистика — Адмін' })
definePageMeta({ layout: 'admin', middleware: 'admin' })

const loading = ref(true)
const stats = ref<any>(null)

const monthMax = computed(() => Math.max(1, ...((stats.value?.months || []).map((m: any) => m.count))))
const yearMax = computed(() => Math.max(1, ...((stats.value?.years || []).map((y: any) => y.count))))
const monthBarHeight = (count: number) => count ? Math.max(4, (count / monthMax.value) * 120) : 4

const currentMonthCount = computed(() => stats.value?.months?.at(-1)?.count ?? 0)
const prevMonthCount = computed(() => stats.value?.months?.at(-2)?.count ?? 0)

const roleLabel = (role: string) => {
  const map: Record<string, string> = { agronomist: 'Агрономи', farmer: 'Фермери', seller: 'Продавці', admin: 'Адміни', unknown: 'Без ролі' }
  return map[role] || role
}
const roleIcon = (role: string) => {
  const map: Record<string, string> = { agronomist: '🌿', farmer: '🚜', seller: '🛒', admin: '🛡', unknown: '👤' }
  return map[role] || '👤'
}
const roleColor = (role: string) => {
  const map: Record<string, string> = { agronomist: 'bg-agro-hover', farmer: 'bg-amber-50', seller: 'bg-blue-50', admin: 'bg-red-50', unknown: 'bg-agro-bg' }
  return map[role] || 'bg-agro-bg'
}

onMounted(async () => {
  stats.value = await $fetch('/api/admin/user-stats') as any
  loading.value = false
})
</script>
