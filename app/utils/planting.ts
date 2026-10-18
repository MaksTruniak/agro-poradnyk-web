// Параметри багаторічного насадження (farm_crops.planting_year, rootstock, row_spacing_m, ...)

export const IRRIGATION_OPTIONS = [
  { value: '', label: 'Не вказано' },
  { value: 'none', label: 'Без зрошення' },
  { value: 'drip', label: 'Крапельне' },
  { value: 'sprinkler', label: 'Дощування' },
  { value: 'other', label: 'Інше' },
]

export const irrigationLabel = (v: string | null | undefined) =>
  IRRIGATION_OPTIONS.find(o => o.value === v && v)?.label ?? null

// Рослин на площі за схемою посадки (міжряддя × відстань у ряду)
export const plantsFromScheme = (areaHa: number | null | undefined, rowM: number | null | undefined, plantM: number | null | undefined) => {
  if (!areaHa || !rowM || !plantM || areaHa <= 0 || rowM <= 0 || plantM <= 0) return null
  return Math.round((areaHa * 10000) / (rowM * plantM))
}

export const plantingAge = (year: number | null | undefined, now = new Date()) => {
  if (!year) return null
  const age = now.getFullYear() - year
  return age >= 0 ? age : null
}

const yearsWord = (n: number) => {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'рік'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'роки'
  return 'років'
}

const num = (v: number) => String(v).replace('.', ',')

// Короткий опис насадження для картки: «посадка 2019 (7 років) · М9 · 3×1 м · 3 333 рослин · крапельне»
export const plantingSummary = (crop: any, now = new Date()) => {
  const parts: string[] = []
  const age = plantingAge(crop.planting_year, now)
  if (crop.planting_year) parts.push(age ? `посадка ${crop.planting_year} (${age} ${yearsWord(age)})` : `посадка ${crop.planting_year} (цього року)`)
  if (crop.rootstock) parts.push(`підщепа ${crop.rootstock}`)
  if (crop.row_spacing_m && crop.plant_spacing_m) parts.push(`${num(crop.row_spacing_m)}×${num(crop.plant_spacing_m)} м`)
  if (crop.plants_count) parts.push(`${crop.plants_count.toLocaleString('uk-UA')} рослин`)
  if (crop.trellis) parts.push(`шпалера: ${crop.trellis}`)
  const irr = irrigationLabel(crop.irrigation)
  if (irr) parts.push(irr.toLowerCase())
  return parts.join(' · ')
}

export interface PlantingForm {
  planting_year: string
  rootstock: string
  row_spacing_m: string
  plant_spacing_m: string
  plants_count: string
  trellis: string
  irrigation: string
}

export const emptyPlantingForm = (): PlantingForm => ({
  planting_year: '', rootstock: '', row_spacing_m: '', plant_spacing_m: '', plants_count: '', trellis: '', irrigation: '',
})

export const plantingFormFrom = (crop: any): PlantingForm => ({
  planting_year: crop.planting_year ? String(crop.planting_year) : '',
  rootstock: crop.rootstock || '',
  row_spacing_m: crop.row_spacing_m ? String(crop.row_spacing_m) : '',
  plant_spacing_m: crop.plant_spacing_m ? String(crop.plant_spacing_m) : '',
  plants_count: crop.plants_count != null ? String(crop.plants_count) : '',
  trellis: crop.trellis || '',
  irrigation: crop.irrigation || '',
})

const posNum = (v: string) => {
  const n = parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

// Значення для farm_crops; кількість рослин — введена або порахована зі схеми
export const plantingPayload = (f: PlantingForm, areaHa: number | null) => {
  const year = parseInt(f.planting_year, 10)
  const row = posNum(f.row_spacing_m)
  const plant = posNum(f.plant_spacing_m)
  const count = parseInt(f.plants_count, 10)
  return {
    planting_year: Number.isFinite(year) && year >= 1900 && year <= 2100 ? year : null,
    rootstock: f.rootstock.trim().slice(0, 100) || null,
    row_spacing_m: row && row <= 20 ? row : null,
    plant_spacing_m: plant && plant <= 20 ? plant : null,
    plants_count: Number.isFinite(count) && count >= 0 ? count : plantsFromScheme(areaHa, row, plant),
    trellis: f.trellis.trim().slice(0, 100) || null,
    irrigation: f.irrigation || null,
  }
}
