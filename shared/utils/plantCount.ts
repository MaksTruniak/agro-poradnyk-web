// Скільки рослин живих: висаджено (у кварталах або в насадженні) − випади + підсадка.

export interface PlantBlock { id: string; name: string; plants_count: number; rows_from?: number | null; rows_to?: number | null }
export interface PlantEvent { block_id?: string | null; event_date: string; kind: 'loss' | 'replant'; count: number; reason?: string | null }

export const LOSS_REASONS: Record<string, string> = {
  frost: 'Вимерзання', disease: 'Хвороба', pests: 'Шкідники, гризуни', drought: 'Посуха', mechanical: 'Механічні пошкодження', other: 'Інше',
}

export interface PlantCount {
  /** висаджено за кварталами або за насадженням */
  planted: number
  lost: number
  replanted: number
  alive: number
  /** частка випадів від висаджених, % (null — якщо висаджено невідомо) */
  lossPct: number | null
  /** випади цього року */
  lostThisYear: number
  byBlock: { block: PlantBlock; lost: number; replanted: number; alive: number }[]
  /** кількість у кварталах не збігається з кількістю в насадженні */
  mismatch: boolean
}

export function plantCount(cropPlants: number | null | undefined, blocks: PlantBlock[], events: PlantEvent[], year = new Date().getFullYear()): PlantCount {
  const sum = (kind: PlantEvent['kind'], blockId?: string) =>
    events.filter(e => e.kind === kind && (blockId === undefined || e.block_id === blockId)).reduce((s, e) => s + e.count, 0)
  const blocksTotal = blocks.reduce((s, b) => s + (b.plants_count || 0), 0)
  const planted = blocks.length ? blocksTotal : (cropPlants || 0)
  const lost = sum('loss'), replanted = sum('replant')
  return {
    planted,
    lost,
    replanted,
    alive: Math.max(0, planted - lost + replanted),
    lossPct: planted > 0 ? Math.round(lost / planted * 1000) / 10 : null,
    lostThisYear: events.filter(e => e.kind === 'loss' && e.event_date.startsWith(String(year))).reduce((s, e) => s + e.count, 0),
    byBlock: blocks.map(b => {
      const l = sum('loss', b.id), r = sum('replant', b.id)
      return { block: b, lost: l, replanted: r, alive: Math.max(0, (b.plants_count || 0) - l + r) }
    }),
    mismatch: blocks.length > 0 && !!cropPlants && blocksTotal !== cropPlants,
  }
}

/** «Ряди 1–20», «ряд 5» або '' */
export const blockRows = (b: Pick<PlantBlock, 'rows_from' | 'rows_to'>) =>
  b.rows_from && b.rows_to && b.rows_to !== b.rows_from ? `ряди ${b.rows_from}–${b.rows_to}` : b.rows_from ? `ряд ${b.rows_from}` : ''
