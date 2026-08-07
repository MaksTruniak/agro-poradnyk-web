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
      <nav class="flex-1 p-3 space-y-1">
        <NuxtLink to="/admin"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="$route.path === '/admin' ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Верифікація агрономів
        </NuxtLink>
        <NuxtLink to="/admin/brands"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="$route.path === '/admin/brands' ? 'bg-agro-hover text-agro' : 'text-agro-light hover:bg-agro-bg hover:text-agro-dark'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg>
          Бренди
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
