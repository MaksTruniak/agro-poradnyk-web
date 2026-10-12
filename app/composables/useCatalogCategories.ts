// Категорії каталогу (типи пестицидів, біопрепаратів, групи добрив). Перелік і значки — в коді сторінки,
// а назву й видимість задає адмін на сторінці «Категорії» (таблиця agro_categories, розділ section).
export const useCatalogCategories = async <T extends { slug: string; name: string }>(
  section: 'pesticide' | 'bio' | 'fertilizer',
  defaults: T[] | Ref<T[]>,
) => {
  const supabase = useSupabaseClient()
  const { data } = await useAsyncData(`catalog-categories-${section}`, async () => {
    const { data } = await supabase.from('agro_categories').select('slug, name, is_active').eq('section', section)
    return (data || []) as { slug: string; name: string | null; is_active: boolean | null }[]
  })
  return computed(() => {
    const bySlug = new Map((data.value || []).map(r => [r.slug, r]))
    return unref(defaults)
      .filter(d => bySlug.get(d.slug)?.is_active !== false)
      .map(d => ({ ...d, name: bySlug.get(d.slug)?.name?.trim() || d.name }))
  })
}
