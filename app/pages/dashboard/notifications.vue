<template>
  <div class="dash-page">
    <div class="dash-head">
      <div class="dash-icon-box shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="dash-title bitter">Сповіщення</h1>
        <p class="dash-subtitle">Системні повідомлення</p>
      </div>
      <button v-if="items.length" @click="markAllRead" class="shrink-0 text-sm text-agro hover:underline font-medium">
        Позначити всі прочитаними
      </button>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="card animate-pulse h-20"></div>
    </div>

    <div v-else-if="!items.length" class="card text-center py-16">
      <div class="dash-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
        </svg>
      </div>
      <p class="font-bold text-agro-dark text-lg mb-2">Сповіщень немає</p>
      <p class="text-agro-light mt-1">Все під контролем</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="n in items" :key="n.id"
        class="card flex items-start gap-4 transition-all"
        :class="!n.is_read ? 'border-l-4 border-l-amber-400' : 'opacity-70'">
        <div class="text-2xl shrink-0 mt-0.5">
          {{ n.type === 'inventory_low' ? '🧪' : '📋' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-agro-dark text-sm">{{ n.title }}</p>
          <p v-if="n.body" class="text-agro-light text-sm mt-0.5">{{ n.body }}</p>
          <p class="text-xs text-agro-light mt-1">{{ formatDate(n.created_at) }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <NuxtLink v-if="n.type === 'inventory_low'" to="/dashboard/inventory"
            class="text-xs text-agro hover:underline font-medium">
            До складу →
          </NuxtLink>
          <button v-if="!n.is_read" @click="markRead(n)"
            class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-agro-hover text-agro-light hover:text-agro transition-colors"
            title="Позначити прочитаним">
            <Check :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Сповіщення — Кабінет' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const items = ref<any[]>([])
const loading = ref(true)

const formatDate = (d: string) => new Date(d).toLocaleString('uk-UA', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
})

async function load() {
  loading.value = true
  const { data } = await supabase
    .from('farm_notifications')
    .select('*')
    .eq('user_id', user.value!.id)
    .order('created_at', { ascending: false })
    .limit(50)
  items.value = data || []
  loading.value = false
}

async function markRead(n: any) {
  await supabase.from('farm_notifications').update({ is_read: true }).eq('id', n.id)
  n.is_read = true
}

async function markAllRead() {
  await supabase.from('farm_notifications')
    .update({ is_read: true })
    .eq('user_id', user.value!.id)
    .eq('is_read', false)
  items.value.forEach(n => n.is_read = true)
}

onMounted(load)
</script>

<style scoped>
.bitter { font-family: 'Bitter', Georgia, serif; }
.dash-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgb(238,241,227); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
</style>
