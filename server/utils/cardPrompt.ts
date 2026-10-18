import { plantingStage, plantingStageInstructions, phasesForStage, isFruitPhase, BEARING_FROM_AGE } from '../../shared/utils/plantingStage'

const MONTHS = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень']

export interface CardPromptInput {
  cropType: string
  variety?: string
  region?: string
  areaHa?: number | null
  /** фенофази культури з довідника */
  phases?: string[]
  /** опис насадження для моделі: підщепа, схема, поточна фаза */
  planting?: string
  /** група культури (crop_catalog.group_key) і рік посадки — для стадії насадження */
  cropGroup?: string | null
  plantingYear?: number | null
  now?: Date
}

/** Стадія насадження для техкарти — лише для відомих багаторічних груп */
export function cardStage(input: Pick<CardPromptInput, 'cropGroup' | 'plantingYear' | 'now'>) {
  const group = input.cropGroup && input.cropGroup in BEARING_FROM_AGE ? input.cropGroup : null
  return { group, info: plantingStage(group, input.plantingYear, input.now) }
}

/** Фази, з яких модель будує карту: без фаз плодів і збору, якщо урожаю цього сезону немає */
export function cardPhases(input: CardPromptInput) {
  return phasesForStage(input.phases ?? [], cardStage(input).info)
}

export function buildCardPrompt(input: CardPromptInput) {
  const { group, info } = cardStage(input)
  const now = input.now ?? new Date()
  const phases = cardPhases(input)
  const cropFull = input.variety ? `${input.cropType} (${input.variety})` : input.cropType
  const areaNote = input.areaHa ? `, площа ${input.areaHa} га` : ''
  const regionNote = input.region ? `, регіон: ${input.region}` : ''
  const plantingNote = input.planting ? `\nНасадження: ${input.planting}.` : ''
  const stage = plantingStageInstructions(group, info)
  const stageNote = stage ? `\nСТАДІЯ НАСАДЖЕННЯ (обов'язково врахуй): ${stage}` : ''
  const phasesRule = phases.length
    ? `\n- Назви фаз ("name") — ТІЛЬКИ дослівно з цього списку, у його порядку: ${phases.join('; ')}`
    : ''
  const noHarvestRule = info && !info.fruiting
    ? '\n- Урожаю цього сезону немає: жодних обробок плодів/ягід, фаз дозрівання і збору, строків очікування перед збором'
    : ''

  return `Ти агроном-експерт з агрохімічного захисту та живлення рослин в Україні. Згенеруй реалістичну технологічну карту для культури: ${cropFull}${areaNote}${regionNote}.${plantingNote}${stageNote}
Поточний місяць: ${MONTHS[now.getMonth()]}. Враховуй це для визначення актуальних фаз.

ВИМОГИ:
- Всі препарати — зареєстровані та реально доступні в Україні (не вигадані назви)
- Дози — реалістичні для українських умов і площі${input.areaHa ? ` ${input.areaHa} га` : ''}
- Фази — у хронологічному порядку реального циклу вирощування цієї культури
- 3–5 фаз, кожна 1–3 обробки з балансом захисту і живлення${phasesRule}${noHarvestRule}
- В полі notes — коротко (до 8 слів): клас препарату і проти чого (фунгіцид, інсектицид, гербіцид, протруйник, мікродобриво, стимулятор тощо)
- JSON без пробілів і переносів рядків — відповідь має бути компактною

Поверни ТІЛЬКИ валідний JSON — без тексту до або після, без \`\`\`json маркерів:
{
  "phases": [
    {
      "name": "Назва фази",
      "treatments": [
        {
          "type": "захист або підживлення або обробка або полив",
          "product_name": "Реальна назва препарату або добрива",
          "dosage": "норма внесення (наприклад: 1.5 л/га або 200 кг/га)",
          "active_ingredient": "діюча речовина українською (для добрив — склад), наприклад: азоксистробін + ципроконазол",
          "notes": "клас і призначення: фунгіцид проти борошнистої роси тощо"
        }
      ]
    }
  ]
}

Значення поля "type" — ТІЛЬКИ одне з: "захист", "підживлення", "обробка", "полив"`
}

/**
 * Відповідь моделі → фази з довідника: назви зводяться до ключів довідника,
 * а якщо урожаю цього сезону немає — фази плодів і збору прибираються, навіть якщо модель їх додала.
 */
export function normalizeCardPhases<T extends { name: string }>(phases: T[], input: CardPromptInput, match: (name: string, allowed: string[]) => string) {
  const allowed = cardPhases(input)
  const { info } = cardStage(input)
  return phases
    .map(p => (allowed.length ? { ...p, name: match(p.name, allowed) } : p))
    .filter(p => !(info && !info.fruiting && isFruitPhase(p.name)))
}
