<template>
  <div class="min-h-screen bg-agro-bg flex">
    <aside class="hidden lg:flex w-60 bg-white border-r border-agro-border flex-col fixed h-full z-40">
      <div class="p-5 border-b border-agro-border">
        <NuxtLink to="/" class="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0">
            <clipPath id="logo-clip-admin"><rect width="32" height="32" rx="8"/></clipPath>
            <g clip-path="url(#logo-clip-admin)">
              <rect width="32" height="32" fill="#B5D4F4"/>
              <ellipse cx="8" cy="8" rx="5" ry="2.5" fill="white" opacity="0.8"/>
              <ellipse cx="22" cy="6" rx="4" ry="2" fill="white" opacity="0.7"/>
              <rect x="0" y="16" width="32" height="3" fill="#3B6D11"/>
              <rect x="0" y="19" width="32" height="13" fill="#A0622A"/>
              <rect x="0" y="25" width="32" height="7" fill="#7A4620"/>
              <line x1="0" y1="19" x2="32" y2="19" stroke="#5C3310" stroke-width="0.5"/>
            </g>
          </svg>
          <span class="font-bold text-agro-dark">АгроПростір</span>
        </NuxtLink>
      </div>
      <div class="p-4 border-b border-agro-border">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-agro-hover flex items-center justify-center text-agro font-bold text-sm shrink-0">🛡</div>
          <p class="text-sm font-semibold text-agro-dark">Адміністратор</p>
        </div>
      </div>
      <nav class="flex-1 p-3 overflow-y-auto">
        <!-- Користувачі -->
        <p class="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-agro-light/60">Користувачі</p>
        <NuxtLink to="/admin/stats"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="$route.path === '/admin/stats' ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Статистика
        </NuxtLink>
        <NuxtLink to="/admin/users"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="$route.path === '/admin/users' ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          Всі користувачі
        </NuxtLink>
        <NuxtLink to="/admin"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="$route.path === '/admin' ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Верифікація агрономів
        </NuxtLink>

        <NuxtLink to="/admin/plans"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="$route.path === '/admin/plans' ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
          </svg>
          Тарифи
        </NuxtLink>

        <NuxtLink to="/admin/ai-limits"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="$route.path === '/admin/ai-limits' ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/>
          </svg>
          AI Ліміти
        </NuxtLink>

        <!-- Продукти -->
        <p class="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-agro-light/60">Продукти</p>
        <NuxtLink to="/admin/products"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="$route.path === '/admin/products' ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
          Товари
        </NuxtLink>
        <NuxtLink to="/admin/brands"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="$route.path === '/admin/brands' ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg>
          Бренди
        </NuxtLink>
        <NuxtLink to="/admin/categories"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="$route.path === '/admin/categories' ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Категорії
        </NuxtLink>
        <NuxtLink to="/admin/ingredients"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="$route.path === '/admin/ingredients' ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-3"/><rect x="9" y="1" width="6" height="4" rx="1"/></svg>
          Діючі речовини
        </NuxtLink>

        <!-- База знань -->
        <p class="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-agro-light/60">База знань</p>
        <NuxtLink to="/admin/weeds"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="$route.path === '/admin/weeds' ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 7 9 5 5c4 0 6 2 7 7z"/><path d="M12 12c0 0 5-3 7-7-4 0-6 2-7 7z"/></svg>
          Бур'яни
        </NuxtLink>
        <NuxtLink to="/admin/diseases"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="$route.path === '/admin/diseases' ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>
          Хвороби
        </NuxtLink>
        <NuxtLink to="/admin/pests"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="$route.path === '/admin/pests' ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="13" rx="5" ry="6"/><path d="M12 7V3"/><path d="M7 14H4M20 14h-3"/></svg>
          Шкідники
        </NuxtLink>
      </nav>
      <div class="p-3 border-t border-agro-border">
        <NuxtLink to="/" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-agro-light hover:bg-agro-bg hover:text-agro-dark transition-colors mb-1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          На головну
        </NuxtLink>
        <button @click="logout" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          Вийти
        </button>
      </div>
    </aside>

    <div class="lg:ml-60 flex-1 min-h-screen">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const router = useRouter()
const logout = async () => {
  await supabase.auth.signOut()
  router.push('/auth')
}
</script>
