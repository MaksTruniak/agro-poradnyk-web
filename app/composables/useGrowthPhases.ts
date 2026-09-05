export interface GrowthPhase {
  key: string
  emoji: string
  order: number
  crop_groups?: string[] | null
}

export function useGrowthPhases() {
  const supabase = useSupabaseClient()
  const allPhases = useState<GrowthPhase[]>('growth-phases', () => [])
  const loaded = useState<boolean>('growth-phases-loaded', () => false)

  const load = async () => {
    if (loaded.value) return
    const { data } = await supabase
      .from('growth_phases')
      .select('*')
      .order('order_num', { ascending: true })
    allPhases.value = (data || []).map((p: any) => ({
      key: p.key,
      emoji: p.emoji,
      order: p.order_num,
      crop_groups: p.crop_groups ?? null,
    }))
    loaded.value = true
  }

  const phasesForCrop = (cropType: string | null | undefined) => {
    if (!cropType) return allPhases.value
    return allPhases.value.filter(
      p => !p.crop_groups || p.crop_groups.includes(cropType)
    )
  }

  const emojiFor = (phaseKey: string) =>
    allPhases.value.find(p => p.key === phaseKey)?.emoji ?? '🌱'

  const orderFor = (phaseKey: string) =>
    allPhases.value.find(p => p.key === phaseKey)?.order ?? 99

  return { allPhases, load, phasesForCrop, emojiFor, orderFor }
}
