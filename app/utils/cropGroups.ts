// Група культури визначає набір фенофаз (growth_phases.crop_groups).
// Основне джерело — crop_catalog.group_key; цей словник лише для культур,
// вписаних вручну (немає в каталозі) — шукає за назвою або її частиною.
const CROP_GROUPS: Record<string, string> = {
  // grain – зернові
  'пшениця': 'grain', 'ячмінь': 'grain', 'жито': 'grain', 'овес': 'grain',
  'тритикале': 'grain', 'просо': 'grain', 'сорго': 'grain', 'гречка': 'grain',
  // corn – кукурудза
  'кукурудза': 'corn',
  // oilseed – олійні
  'соняшник': 'oilseed', 'ріпак': 'oilseed',
  // legume – бобові
  'соя': 'legume', 'горох': 'legume', 'квасоля': 'legume', 'боби': 'legume',
  'нут': 'legume', 'сочевиця': 'legume', 'люпин': 'legume',
  // technical – технічні
  'льон': 'technical', 'цукровий буряк': 'technical', 'коноплі': 'technical',
  'хміль': 'technical', 'тютюн': 'technical', 'лаванда': 'technical',
  "м'ята": 'technical', 'меліса': 'technical',
  // veg_nightshade – пасльонові
  'томат': 'veg_nightshade', 'помідор': 'veg_nightshade', 'перець': 'veg_nightshade',
  'баклажан': 'veg_nightshade', 'картопля': 'veg_nightshade',
  // veg_cucurbit – гарбузові
  'огірок': 'veg_cucurbit', 'кабачок': 'veg_cucurbit', 'гарбуз': 'veg_cucurbit',
  'кавун': 'veg_cucurbit', 'диня': 'veg_cucurbit', 'патисон': 'veg_cucurbit',
  // veg_brassica – капустяні
  'капуста': 'veg_brassica', 'броколі': 'veg_brassica', 'кольрабі': 'veg_brassica',
  // veg_allium – цибулеві
  'цибуля': 'veg_allium', 'часник': 'veg_allium', 'порей': 'veg_allium',
  // veg_root – коренеплоди
  'морква': 'veg_root', 'пастернак': 'veg_root', 'редиска': 'veg_root',
  'редька': 'veg_root', 'ріпа': 'veg_root', 'буряк': 'veg_root',
  // veg_leaf – листові/зелень
  'салат': 'veg_leaf', 'шпинат': 'veg_leaf', 'кріп': 'veg_leaf',
  'петрушка': 'veg_leaf', 'базилік': 'veg_leaf', 'селера': 'veg_leaf',
  'спаржа': 'veg_leaf', 'артишок': 'veg_leaf',
  // berry_shrub – ягідні кущові
  'смородина': 'berry_shrub', 'аґрус': 'berry_shrub', 'агрус': 'berry_shrub',
  'малина': 'berry_shrub', 'ожина': 'berry_shrub', 'лохина': 'berry_shrub', 'чорниця': 'berry_shrub',
  'журавлина': 'berry_shrub', 'жимолость': 'berry_shrub', 'йошта': 'berry_shrub', 'аронія': 'berry_shrub',
  'калина': 'berry_shrub', 'горобина': 'berry_shrub', 'шипшина': 'berry_shrub', 'обліпиха': 'berry_shrub',
  // berry_herb – ягідні трав'янисті
  'полуниця': 'berry_herb', 'суниця': 'berry_herb',
  // grape – виноград
  'виноград': 'grape',
  // fruit_pome – зерняткові
  'яблуня': 'fruit_pome', 'яблука': 'fruit_pome', 'груша': 'fruit_pome', 'айва': 'fruit_pome',
  // fruit_stone – кісточкові
  'вишня': 'fruit_stone', 'черешня': 'fruit_stone', 'слива': 'fruit_stone',
  'персик': 'fruit_stone', 'нектарин': 'fruit_stone', 'абрикос': 'fruit_stone',
  'алича': 'fruit_stone', 'кизил': 'fruit_stone', 'хурма': 'fruit_stone', 'інжир': 'fruit_stone',
  // nut – горіхові
  'горіх': 'nut', 'ліщина': 'nut', 'каштан': 'nut', 'фундук': 'nut', 'мигдаль': 'nut',
}

export const PERENNIAL_GROUPS = ['berry_shrub', 'berry_herb', 'grape', 'fruit_pome', 'fruit_stone', 'nut']

export const isPerennialGroup = (group: string | null | undefined) =>
  !!group && PERENNIAL_GROUPS.includes(group)

export const guessCropGroup = (crop: string | null | undefined): string | null => {
  if (!crop) return null
  const lower = crop.toLowerCase().trim()
  // Точний збіг спочатку (для "цукровий буряк" vs "буряк")
  for (const [key, group] of Object.entries(CROP_GROUPS)) {
    if (lower === key) return group
  }
  // Потім пошук підрядка
  for (const [key, group] of Object.entries(CROP_GROUPS)) {
    if (lower.includes(key)) return group
  }
  return null
}

export const PERENNIAL_GROUP_LABELS: Record<string, string> = {
  berry_shrub: 'Ягідні кущі',
  berry_herb: 'Полуниця, суниця',
  grape: 'Виноград',
  fruit_pome: 'Зерняткові',
  fruit_stone: 'Кісточкові',
  nut: 'Горіхові',
}
