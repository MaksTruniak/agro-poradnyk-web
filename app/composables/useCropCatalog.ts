// Єдине джерело списку культур — таблиці crop_categories + crop_catalog
// Кешується на рівні додатку, завантажується один раз

let _promise: Promise<void> | null = null

const _categories = ref<{ name: string; emoji: string }[]>([])
const _crops = ref<{ name: string; emoji: string; category: string }[]>([])

export const useCropCatalog = () => {
  const supabase = useSupabaseClient()

  const load = () => {
    if (_promise) return _promise
    _promise = (async () => {
      const [catsRes, cropsRes] = await Promise.all([
        supabase.from('crop_categories').select('name, emoji').order('order_num', { ascending: true }),
        supabase.from('crop_catalog').select('name, emoji, crop_categories(name)').order('name'),
      ])
      _categories.value = catsRes.data || []
      _crops.value = (cropsRes.data || []).map((c: any) => ({
        name: c.name,
        emoji: c.emoji || '🌱',
        category: c.crop_categories?.name || '',
      }))
    })()
    return _promise
  }

  // Емодзі за назвою культури
  const emojiFor = (name: string) =>
    _crops.value.find(c => c.name.toLowerCase() === name?.toLowerCase())?.emoji || '🌱'

  // Культури відфільтровані по категорії
  const cropsByCategory = (category: string) =>
    _crops.value.filter(c => c.category === category)

  // Всі імена для дачника (без категоріальних фільтрів)
  const allCropNames = computed(() => _crops.value.map(c => c.name))

  return {
    load,
    categories: _categories,
    crops: _crops,
    emojiFor,
    cropsByCategory,
    allCropNames,
  }
}
