<template>
  <div class="p-8 max-w-3xl">
    <div class="mb-7">
      <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
        </svg>
        Тарифи та ціни
      </h1>
      <p class="text-agro-light mt-1">Змінюй ціни — вони одразу застосовуються при новій оплаті</p>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="card animate-pulse h-16" />
    </div>

    <div v-else class="card p-0 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-agro-border bg-agro-bg">
            <th class="text-left px-4 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide">Тариф</th>
            <th class="text-left px-4 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide w-32">База (грн/міс)</th>
            <th class="text-left px-4 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide w-32">Ставка за га</th>
            <th class="px-4 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide text-center w-24">Активний</th>
            <th class="px-4 py-3.5 w-24"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plan in plans" :key="plan.id" class="border-b border-agro-border last:border-0">
            <td class="px-4 py-4">
              <p class="font-semibold text-agro-dark">{{ plan.label }}</p>
              <p class="text-xs text-agro-light font-mono mt-0.5">{{ plan.id }}</p>
            </td>
            <td class="px-4 py-4">
              <div class="relative">
                <input v-model.number="plan.base_price" type="number" min="0" class="input text-sm py-1.5 w-full font-mono pr-10" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-agro-light">грн</span>
              </div>
            </td>
            <td class="px-4 py-4">
              <div class="relative">
                <input v-model.number="plan.ha_rate" type="number" min="0" class="input text-sm py-1.5 w-full font-mono pr-14" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-agro-light">грн/га</span>
              </div>
            </td>
            <td class="px-4 py-4 text-center">
              <button @click="plan.is_active = !plan.is_active"
                class="w-10 h-6 rounded-full transition-colors flex items-center px-0.5"
                :class="plan.is_active ? 'bg-agro' : 'bg-gray-200'">
                <span class="w-5 h-5 rounded-full bg-white shadow transition-transform"
                  :class="plan.is_active ? 'translate-x-4' : 'translate-x-0'" />
              </button>
            </td>
            <td class="px-4 py-4 text-right">
              <button @click="save(plan)" :disabled="saving === plan.id"
                class="btn-primary text-xs py-1.5 px-3 disabled:opacity-50">
                {{ saving === plan.id ? '...' : 'Зберегти' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Приклад розрахунку -->
    <div v-if="!loading" class="mt-6 card bg-agro-bg border-0">
      <p class="text-xs font-bold uppercase tracking-wide text-agro-light mb-3">Приклад розрахунку</p>
      <div class="space-y-2">
        <div v-for="plan in plans.filter(p => p.is_active)" :key="plan.id" class="flex flex-col gap-1">
          <p class="text-sm font-semibold text-agro-dark">{{ plan.label }}</p>
          <p class="text-xs text-agro-light">
            10 га → {{ ((plan.base_price || 0) + 10 * (plan.ha_rate || 0)).toLocaleString('uk-UA') }} грн/міс &nbsp;|&nbsp;
            30 га → {{ ((plan.base_price || 0) + 30 * (plan.ha_rate || 0)).toLocaleString('uk-UA') }} грн/міс &nbsp;|&nbsp;
            50 га → {{ ((plan.base_price || 0) + 50 * (plan.ha_rate || 0)).toLocaleString('uk-UA') }} грн/міс
          </p>
        </div>
      </div>
    </div>

    <p v-if="savedMsg" class="text-sm text-agro mt-4 flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      Збережено
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useHead({ title: 'Тарифи — Адмін' })

const supabase = useSupabaseClient()
const plans = ref<any[]>([])
const loading = ref(true)
const saving = ref('')
const savedMsg = ref(false)

const { data } = await supabase.from('plans').select('*').in('id', ['business', 'business_pro']).order('base_price')
plans.value = data || []
loading.value = false

async function save(plan: any) {
  saving.value = plan.id
  await supabase.from('plans').update({
    label:      plan.label,
    base_price: plan.base_price,
    ha_rate:    plan.ha_rate,
    price_uah:  plan.base_price, // для сумісності
    is_active:  plan.is_active,
  }).eq('id', plan.id)
  saving.value = ''
  savedMsg.value = true
  setTimeout(() => { savedMsg.value = false }, 2000)
}
</script>
