<template>
  <div class="card mb-8" data-testid="ai-credits-card">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background: rgb(238,241,227)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-bold text-agro-dark">AI-кредити</p>
        <p class="text-xs text-agro-light">Оновлюються {{ resetDate }}</p>
      </div>
      <p v-if="data" class="text-right shrink-0">
        <span class="text-2xl font-extrabold" :class="data.remaining > 0 ? 'text-agro' : 'text-red-500'">{{ data.remaining }}</span>
        <span class="text-sm text-agro-light"> / {{ data.allowance }}</span>
      </p>
    </div>

    <div v-if="loading" class="h-2 bg-agro-bg rounded-full animate-pulse"></div>
    <template v-else-if="data">
      <div class="h-2 bg-agro-bg rounded-full overflow-hidden mb-2">
        <div class="h-full rounded-full transition-all" :class="usedPct >= 90 ? 'bg-red-400' : usedPct >= 70 ? 'bg-amber-400' : 'bg-agro'"
          :style="`width: ${usedPct}%`"></div>
      </div>
      <p class="text-xs text-agro-light mb-4">Використано {{ data.used }} з {{ data.allowance }} цього місяця</p>

      <p v-if="data.allowance > 0 && data.remaining <= 0" class="text-sm text-agro-dark bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
        Кредити вичерпано. Прості питання AI агроному працюють в економ-режимі — до {{ data.fallbackDaily }} на день. Фото, техкарти й звіти — з нового місяця.
      </p>
      <p v-else-if="data.allowance <= 0" class="text-sm text-agro-light mb-4">AI агроном доступний у платних тарифах.</p>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div v-for="item in costList" :key="item.key" class="bg-agro-bg rounded-xl px-3 py-2">
          <p class="text-xs text-agro-light leading-tight">{{ item.label }}</p>
          <p class="text-sm font-bold text-agro-dark">{{ item.credits }} {{ creditsWord(item.credits) }}</p>
        </div>
      </div>
      <p v-if="profile === 'farmer'" class="text-xs text-agro-light mt-3">Кількість кредитів у тарифі залежить від площі ваших полів.</p>
    </template>
    <p v-else class="text-sm text-agro-light">Не вдалося завантажити кредити.</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ profile: SubscriptionProfile }>()

interface CreditsResponse { allowance: number; used: number; remaining: number; fallbackDaily: number; costs: Record<string, { credits: number; label: string }> }

const authHeader = useAuthHeader()
const data = ref<CreditsResponse | null>(null)
const loading = ref(true)

// Дії, які бачить фермер (службова «пам'ять розмови» безкоштовна — не показуємо)
const SHOWN = ['chat', 'photo', 'card', 'report']
const costList = computed(() => SHOWN
  .map(key => ({ key, ...(data.value?.costs?.[key] || { credits: 0, label: key }) }))
  .filter(c => c.credits > 0))

const usedPct = computed(() => data.value?.allowance ? Math.min(100, Math.round((data.value.used / data.value.allowance) * 100)) : 0)

const creditsWord = (n: number) => {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'кредит'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'кредити'
  return 'кредитів'
}

const resetDate = computed(() => {
  const d = new Date()
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return next.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
})

onMounted(async () => {
  try {
    // Кредити — для профілю цієї сторінки (фермер / агроном), незалежно від активного профілю в шапці
    const headers = { ...(await authHeader()), 'X-Agro-Profile': props.profile }
    data.value = await $fetch<CreditsResponse>('/api/ai-credits', { headers })
  } catch {
    data.value = null
  } finally {
    loading.value = false
  }
})
</script>
