export interface GrowthPhase {
  key: string
  emoji: string
  order: number
  crop_groups?: string[] | null
}

export function useGrowthPhases() {
  const supabase = useSupabaseClient()
  const allPhases = useState<GrowthPhase[]>('growth-phases', () => [])
  // назва культури (lower) → group_key з каталогу
  const catalogGroups = useState<Record<string, string>>('crop-catalog-groups', () => ({}))
  const loaded = useState<boolean>('growth-phases-loaded', () => false)

  const load = async () => {
    if (loaded.value) return
    // Системні фази (created_by порожній) + власні фази користувача; чужі не показуємо
    const { data: { session } } = await supabase.auth.getSession()
    const uid = session?.user?.id
    const [{ data }, { data: catalog }] = await Promise.all([
      supabase
        .from('growth_phases')
        .select('*')
        .or(uid ? `created_by.is.null,created_by.eq.${uid}` : 'created_by.is.null')
        .order('order_num', { ascending: true }),
      supabase.from('crop_catalog').select('name, group_key').not('group_key', 'is', null),
    ])
    allPhases.value = (data || []).map((p: any) => ({
      key: p.key,
      emoji: p.emoji,
      order: p.order_num,
      crop_groups: p.crop_groups ?? null,
    }))
    catalogGroups.value = Object.fromEntries((catalog || []).map((c: any) => [c.name.toLowerCase().trim(), c.group_key]))
    loaded.value = true
  }

  // Група культури: з каталогу, для вписаних вручну — за назвою
  const groupForCrop = (cropType: string | null | undefined) => {
    if (!cropType) return null
    return catalogGroups.value[cropType.toLowerCase().trim()] ?? guessCropGroup(cropType)
  }

  const phasesForCrop = (cropType: string | null | undefined) => {
    const group = groupForCrop(cropType)
    if (!group) return [...allPhases.value]
    return allPhases.value.filter(
      p => !p.crop_groups || p.crop_groups.includes(group)
    )
  }

  const emojiFor = (phaseKey: string) =>
    allPhases.value.find(p => p.key === phaseKey)?.emoji ?? '🌱'

  const orderFor = (phaseKey: string) =>
    allPhases.value.find(p => p.key === phaseKey)?.order ?? 99

  return { allPhases, load, groupForCrop, phasesForCrop, emojiFor, orderFor }
}
