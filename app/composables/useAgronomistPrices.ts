// Ціни PRO агронома з таблиці plans (редагуються в адмінці «Тарифи»); до завантаження — поточні значення
export const useAgronomistPrices = async () => {
  const supabase = useSupabaseClient()
  const { data } = await useAsyncData('agronomist-pro-prices', async () => {
    const { data } = await supabase.from('plans').select('id, price_uah').in('id', ['agronomist_pro_month', 'agronomist_pro_year'])
    return (data || []) as { id: string; price_uah: number | null }[]
  })
  const month = computed(() => Number(data.value?.find(p => p.id === 'agronomist_pro_month')?.price_uah) || 350)
  const year = computed(() => Number(data.value?.find(p => p.id === 'agronomist_pro_year')?.price_uah) || 3500)
  const yearSaving = computed(() => Math.max(0, month.value * 12 - year.value))
  const yearDiscount = computed(() => Math.round((yearSaving.value / (month.value * 12)) * 100))
  const fmt = (n: number) => n.toLocaleString('uk-UA')
  return { month, year, yearSaving, yearDiscount, fmt }
}
