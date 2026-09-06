<template>
  <div class="p-8 max-w-2xl">
    <div class="mb-7">
      <h1 class="text-2xl font-extrabold text-agro-dark flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        Знижки лояльності
      </h1>
      <p class="text-agro-light mt-1">Знижки за роками підписки (рахуються на сервері)</p>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="card animate-pulse h-16" />
    </div>

    <template v-else>
      <div v-for="role in ['farmer', 'agronomist']" :key="role" class="mb-8">
        <h2 class="font-bold text-agro-dark mb-3 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-agro inline-block" />
          {{ role === 'farmer' ? 'Фермери' : 'Агрономи' }}
        </h2>
        <div class="card p-0 overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-agro-border bg-agro-bg">
                <th class="text-left px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide">Рік підписки</th>
                <th class="text-left px-5 py-3.5 text-agro-light font-semibold text-xs uppercase tracking-wide w-40">Знижка (%)</th>
                <th class="px-5 py-3.5 w-24"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rowsByRole(role)" :key="`${row.role}-${row.renewal_year}`"
                class="border-b border-agro-border last:border-0">
                <td class="px-5 py-4 text-agro-dark font-semibold">
                  {{ row.renewal_year === 1 ? '1-й рік' : row.renewal_year === 2 ? '2-й рік' : '3-й рік і далі' }}
                </td>
                <td class="px-5 py-4">
                  <input v-model.number="row.discount_percent" type="number" min="0" max="100"
                    class="input text-sm py-1.5 w-full font-mono" />
                </td>
                <td class="px-5 py-4 text-right">
                  <button @click="saveRow(row)"
                    :disabled="saving === `${row.role}-${row.renewal_year}`"
                    class="text-xs font-semibold text-agro hover:text-agro-dark transition-colors disabled:opacity-50">
                    {{ saving === `${row.role}-${row.renewal_year}` ? 'Збереження...' : 'Зберегти' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="saved" class="text-green-600 text-sm font-semibold text-center">✓ Збережено</p>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'Знижки лояльності — Адмін' })

const supabase = useSupabaseClient()
const loading = ref(true)
const saving = ref<string | null>(null)
const saved = ref(false)

interface DiscountRow {
  role: string
  renewal_year: number
  discount_percent: number
}

const rows = ref<DiscountRow[]>([])

const rowsByRole = (role: string) => rows.value.filter(r => r.role === role).sort((a, b) => a.renewal_year - b.renewal_year)

const { data } = await supabase.from('loyalty_discounts').select('*').order('role').order('renewal_year')
rows.value = data ?? []
loading.value = false

async function saveRow(row: DiscountRow) {
  const key = `${row.role}-${row.renewal_year}`
  saving.value = key
  await supabase.from('loyalty_discounts')
    .update({ discount_percent: row.discount_percent })
    .eq('role', row.role)
    .eq('renewal_year', row.renewal_year)
  saving.value = null
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}
</script>
