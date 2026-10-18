// Стадія багаторічного насадження за віком: від неї залежать техкарта, поради AI і набір фенофаз.
// Вік — повних сезонів після посадки (0 — рік посадки). Межі орієнтовні, для типових українських умов;
// їх варто звіряти з агрономом.

export type PlantingStageKey = 'establishment' | 'young' | 'bearing'

export interface PlantingStageInfo {
  stage: PlantingStageKey
  /** повних сезонів після посадки; 0 — рік посадки */
  age: number
  /** чи є (хоч невеликий) урожай цього сезону */
  fruiting: boolean
}

/** З якого віку насадження вважається плодоносним */
export const BEARING_FROM_AGE: Record<string, number> = {
  berry_herb: 1,   // полуниця: повний урожай з наступного року
  berry_shrub: 2,  // смородина, лохина, малина: перший урожай на 2-й рік, повний — з 3-го
  grape: 3,
  fruit_stone: 3,
  fruit_pome: 4,
  nut: 6,
}

/** Чи дає молоде (ще не плодоносне) насадження перший невеликий урожай */
const YOUNG_FRUITS: Record<string, boolean> = { berry_shrub: true }

export function plantingStage(group: string | null | undefined, plantingYear: number | null | undefined, now = new Date()): PlantingStageInfo | null {
  if (!group || !(group in BEARING_FROM_AGE) || !plantingYear) return null
  const age = now.getFullYear() - plantingYear
  if (age < 0) return null
  if (age === 0) return { stage: 'establishment', age, fruiting: false }
  if (age < BEARING_FROM_AGE[group]!) return { stage: 'young', age, fruiting: !!YOUNG_FRUITS[group] }
  return { stage: 'bearing', age, fruiting: true }
}

/** Коротко для картки й контексту AI: «рік посадки, урожаю немає» */
export function plantingStageLabel(info: PlantingStageInfo | null) {
  if (!info) return null
  const season = info.age + 1
  if (info.stage === 'establishment') return 'рік посадки, урожаю немає'
  if (info.stage === 'young') return `${season}-й рік вегетації, формування${info.fruiting ? ', перший невеликий урожай' : ', урожаю ще немає'}`
  return `плодоносне, ${season}-й рік вегетації`
}

// Фази плодів і збору — для насаджень без урожаю їх у техкарті немає
const FRUIT_PHASE = /плод|ягід|налив|дозрів|достиг|стиглість|збір|збору|змикання ґрон/i

export const isFruitPhase = (phaseKey: string) => FRUIT_PHASE.test(phaseKey)

export function phasesForStage(phases: string[], info: PlantingStageInfo | null) {
  return info && !info.fruiting ? phases.filter(p => !isFruitPhase(p)) : phases
}

const ESTABLISHMENT_BY_GROUP: Record<string, string> = {
  berry_shrub: 'Квітки на молодих кущах видаляти, щоб рослина не виснажувалась.',
  berry_herb: 'Квітконоси після весняної посадки видаляти; вуса — лише якщо потрібен посадковий матеріал.',
  grape: 'Формування: один сильний пагін, підв\'язаний до кілка; пасинки прищипувати.',
  fruit_pome: 'Формувальна обрізка крони, захист штамба, підв\'язка до опори.',
  fruit_stone: 'Формувальна обрізка крони, захист штамба від сонячних опіків і гризунів.',
  nut: 'Формувальна обрізка, захист штамба, регулярний полив.',
}

const YOUNG_BY_GROUP: Record<string, string> = {
  berry_shrub: 'Формування куща: залишати сильні прикореневі пагони, слабкі вирізати; урожай нормувати, щоб не гальмувати ріст.',
  grape: 'Формування рукавів і штамба за обраною схемою; суцвіття видаляти або залишати 1–2 для перевірки сорту.',
  fruit_pome: 'Формування крони; квіти й зав\'язь видаляти, якщо дерево слабке.',
  fruit_stone: 'Формування крони; перші квіти краще видаляти.',
  nut: 'Формування крони, захист від бактеріозу.',
}

/** Вимоги до техкарти/поради залежно від стадії — текст для AI */
export function plantingStageInstructions(group: string | null | undefined, info: PlantingStageInfo | null) {
  if (!info || !group) return null
  const season = info.age + 1
  if (info.stage === 'establishment') {
    return [
      'Насадження першого року (рік посадки): урожаю немає і його не плануй.',
      'Мета — приживлення, ріст коренів і пагонів.',
      'Не включай обробки проти хвороб і шкідників плодів/ягід та нічого, пов\'язаного зі збором урожаю.',
      'Добрива — знижені дози, без надлишку азоту; акцент на укорінення, полив і чисту від бур\'янів пристовбурну смугу.',
      ESTABLISHMENT_BY_GROUP[group] ?? '',
    ].filter(Boolean).join(' ')
  }
  if (info.stage === 'young') {
    return [
      `Молоде насадження, ${season}-й рік вегетації, ще не повністю плодоносне.`,
      info.fruiting
        ? 'Урожай невеликий: захист плодів — мінімальний, з урахуванням строків очікування.'
        : 'Урожаю ще немає: без обробок плодів і без збору.',
      'Пріоритет — здоров\'я листя й пагонів і формування рослини; дози помірні, нижчі ніж для дорослого насадження.',
      YOUNG_BY_GROUP[group] ?? '',
    ].filter(Boolean).join(' ')
  }
  return `Плодоносне насадження, ${season}-й рік вегетації: повна схема захисту і живлення з урахуванням урожаю і строків очікування перед збором.`
}

export const PLANTING_STAGE_NAMES: Record<PlantingStageKey, string> = {
  establishment: 'Рік посадки',
  young: 'Молоде',
  bearing: 'Плодоносне',
}

/** Чи підходить порада (phase_tips.stages) насадженню; без стадії (рік не вказано) — усі поради */
export const tipFitsStage = (tipStages: string[] | null | undefined, info: PlantingStageInfo | null) =>
  !tipStages?.length || !info || tipStages.includes(info.stage)
