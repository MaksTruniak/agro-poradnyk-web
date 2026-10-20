// Урожайність і собівартість насадження по роках: урожай — з ручного запису (planting_yields) або з обліку
// збору (harvest_records сезонів, прив'язаних до насадження); витрати — з обліку витрат поля за культурою;
// виручка — з продажів, прив'язаних до насадження.

export interface YieldYear {
  year: number
  kg: number
  source: 'manual' | 'harvest'
  /** т/га; null — площа невідома */
  tPerHa: number | null
  expenses: number
  revenue: number
  /** грн/кг; null — немає витрат або врожаю */
  costPerKg: number | null
  /** зміна врожаю до попереднього року з даними, % */
  change: number | null
  note?: string | null
}

const yearOf = (iso: string | null | undefined) => (iso ? Number(String(iso).slice(0, 4)) : NaN)

export function plantingYields(opts: {
  areaHa: number | null | undefined
  manual: { year: number; yield_kg: number | string; note?: string | null }[]
  harvest: { weight_kg: number | string | null; recorded_at: string | null }[]
  expenses: { amount_uah: number | string | null; expense_date: string | null }[]
  sales: { total: number | string | null; date: string | null }[]
}): YieldYear[] {
  const area = Number(opts.areaHa) > 0 ? Number(opts.areaHa) : null
  const harvestKg: Record<number, number> = {}
  for (const r of opts.harvest) {
    const y = yearOf(r.recorded_at)
    if (y) harvestKg[y] = (harvestKg[y] ?? 0) + (Number(r.weight_kg) || 0)
  }
  const sum = (rows: { v: unknown; d: string | null }[]) => {
    const out: Record<number, number> = {}
    for (const r of rows) {
      const y = yearOf(r.d)
      if (y) out[y] = (out[y] ?? 0) + (Number(r.v) || 0)
    }
    return out
  }
  const expenses = sum(opts.expenses.map(e => ({ v: e.amount_uah, d: e.expense_date })))
  const revenue = sum(opts.sales.map(s => ({ v: s.total, d: s.date })))
  const manual = Object.fromEntries(opts.manual.map(m => [m.year, m]))

  const years = [...new Set([...Object.keys(harvestKg), ...Object.keys(manual)].map(Number))].sort((a, b) => a - b)
  const rows: YieldYear[] = []
  let prevKg: number | null = null
  for (const year of years) {
    const m = manual[year]
    const kg = m ? Number(m.yield_kg) || 0 : harvestKg[year] ?? 0
    const exp = Math.round(expenses[year] ?? 0)
    rows.push({
      year, kg,
      source: m ? 'manual' : 'harvest',
      tPerHa: area ? Math.round((kg / 1000 / area) * 100) / 100 : null,
      expenses: exp,
      revenue: Math.round(revenue[year] ?? 0),
      costPerKg: exp > 0 && kg > 0 ? Math.round((exp / kg) * 100) / 100 : null,
      change: prevKg ? Math.round(((kg - prevKg) / prevKg) * 100) : null,
      note: m?.note ?? null,
    })
    if (kg > 0) prevKg = kg
  }
  return rows.reverse()
}

/** «3,2 т» або «850 кг» */
export const formatKg = (kg: number) =>
  kg >= 1000
    ? `${(Math.round(kg / 100) / 10).toLocaleString('uk-UA')} т`
    : `${Math.round(kg).toLocaleString('uk-UA')} кг`
