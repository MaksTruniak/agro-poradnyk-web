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
      <div v-for="i in 4" :key="i" class="card animate-pulse h-16" />
    </div>

    <div v-else class="card p-0 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-agro-border bg-agro-bg">
            <th class="text-left px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide">ID</th>
            <th class="text-left px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide">Назва</th>
            <th class="text-left px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide w-36">Ціна (грн)</th>
            <th class="text-left px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide">Період</th>
            <th class="px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide text-center">Активний</th>
            <th class="px-5 py-3.5 w-24"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plan in plans" :key="plan.id" class="border-b border-agro-border last:border-0">
            <td class="px-5 py-4 text-agro-light font-mono text-xs">{{ plan.id }}</td>
            <td class="px-5 py-4">
              <input v-model="plan.label" class="input text-sm py-1.5 w-full" />
            </td>
            <td class="px-5 py-4">
              <input v-model.number="plan.price_uah" type="number" min="0" class="input text-sm py-1.5 w-full font-mono" />
            </td>
            <td class="px-5 py-4 text-agro-dark">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                :class="plan.period === 'year' ? 'bg-blue-50 text-blue-700' : 'bg-agro-bg text-agro-dark'">
                {{ plan.period === 'year' ? 'Рік' : 'Місяць' }}
              </span>
            </td>
            <td class="px-5 py-4 text-center">
              <button @click="plan.is_active = !plan.is_active"
                class="w-10 h-6 rounded-full transition-colors flex items-center px-0.5"
                :class="plan.is_active ? 'bg-agro' : 'bg-gray-200'">
                <span class="w-5 h-5 rounded-full bg-white shadow transition-transform"
                  :class="plan.is_active ? 'translate-x-4' : 'translate-x-0'" />
              </button>
            </td>
            <td class="px-5 py-4 text-right">
              <button @click="save(plan)" :disabled="saving === plan.id"
                class="btn-primary text-xs py-1.5 px-3 disabled:opacity-50">
                {{ saving === plan.id ? '...' : 'Зберегти' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
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

const { data } = await supabase.from('plans').select('*').order('price_uah')
plans.value = data || []
loading.value = false

async function save(plan: any) {
  saving.value = plan.id
  await supabase.from('plans').update({
    label: plan.label,
    price_uah: plan.price_uah,
    is_active: plan.is_active,
  }).eq('id', plan.id)
  saving.value = ''
  savedMsg.value = true
  setTimeout(() => { savedMsg.value = false }, 2000)
}
</script>
