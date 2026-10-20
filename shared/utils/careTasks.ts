// Роботи з догляду за багаторічними насадженнями, крім захисту й підживлення з техкарти: обрізка, побілка,
// підв'язка, мульчування, укриття. Вікна — орієнтовні для Центральної України (на півдні раніше навесні й
// пізніше восени); їх варто звіряти з агрономом.

import type { PlantingStageInfo, PlantingStageKey } from './plantingStage'

export interface CareTask {
  key: string
  title: string
  advice: string
  /** вікна [від, до] у форматі mm-dd; вікно може переходити через Новий рік */
  windows: [string, string][]
  groups: string[]
  /** лише для культур, назва яких підходить (малина, лохина…) */
  crops?: RegExp
  /** без цих культур (ремонтантна малина тощо обробляється інакше) */
  notCrops?: RegExp
  /** якщо фазу насадження відомо — лише на цих фазах */
  phases?: string[]
  /** лише для цих стадій; якщо рік посадки невідомий — не показуємо */
  stages?: PlantingStageKey[]
  /** лише для насаджень з урожаєм цього сезону */
  fruiting?: boolean
}

const TREES = ['fruit_pome', 'fruit_stone', 'nut']
const ALL = ['berry_shrub', 'berry_herb', 'grape', 'fruit_pome', 'fruit_stone', 'nut']

export const CARE_TASKS: CareTask[] = [
  {
    key: 'winter_pruning', title: 'Обрізка в період спокою',
    advice: 'Санітарна й формувальна обрізка до початку сокоруху: прибрати сухі, загущувальні й уражені гілки, зрізи понад 2 см замазати.',
    windows: [['02-01', '03-31']], groups: ['fruit_pome', 'berry_shrub', 'grape', 'nut'],
    notCrops: /малин|ожин/i,
    phases: ['Спокій', 'Проростання / Набрякання бруньок', 'Сокорух / Набрякання бруньок'],
  },
  {
    key: 'stone_pruning', title: 'Обрізка кісточкових',
    advice: 'Кісточкові обрізають на початку вегетації, у суху погоду — так менше камедетечі й моніліозу; зрізи одразу замазати.',
    windows: [['03-20', '04-30']], groups: ['fruit_stone'],
  },
  {
    key: 'whitewash_spring', title: 'Оновити побілку штамбів',
    advice: 'Лютневе сонце й нічні морози дають морозобоїни на південному боці штамба — побілка відбиває сонце.',
    windows: [['02-10', '03-10']], groups: TREES,
  },
  {
    key: 'raspberry_spring', title: 'Весняна обрізка малини',
    advice: 'Прибрати підмерзлі верхівки до здорової бруньки, вирізати слабкі пагони, залишити 8–12 пагонів на погонний метр.',
    windows: [['03-25', '04-25']], groups: ['berry_shrub'], crops: /малин|ожин/i,
  },
  {
    key: 'strawberry_spring', title: 'Весняне прибирання полуниці',
    advice: 'Зняти зимове укриття, прибрати сухе й уражене листя з ділянки — це джерело сірої гнилі та плямистостей.',
    windows: [['03-20', '04-25']], groups: ['berry_herb'],
  },
  {
    key: 'grape_tie_dry', title: 'Суха підв\'язка лози',
    advice: 'Після відкриття й обрізки підв\'язати плодові стрілки до нижнього дроту шпалери до розпускання бруньок.',
    windows: [['04-01', '05-10']], groups: ['grape'],
    phases: ['Спокій', 'Сокорух / Набрякання бруньок', 'Розпускання бруньок'],
  },
  {
    key: 'formative_young', title: 'Формування молодих рослин',
    advice: 'Формувальна обрізка за обраною схемою крони чи куща, підв\'язка до опори; квітки на молодих рослинах краще видалити.',
    windows: [['03-01', '04-20']], groups: ['fruit_pome', 'fruit_stone', 'nut', 'berry_shrub'],
    stages: ['establishment', 'young'],
  },
  {
    key: 'blueberry_ph', title: 'Перевірити pH ґрунту під лохиною',
    advice: 'Лохині потрібен pH 4,0–5,5. Якщо вище — підкислення (сірка, кислі добрива), мульча з хвойної кори чи тирси.',
    windows: [['04-01', '05-15'], ['09-01', '09-30']], groups: ['berry_shrub'], crops: /лохин|чорниц|журавлин/i,
  },
  {
    key: 'mulch', title: 'Мульчування рядів',
    advice: 'Мульча 5–8 см (солома, кора, тирса) тримає вологу й стримує бур\'яни; від штамба й кореневої шийки відступити 5–10 см.',
    windows: [['04-20', '05-31']], groups: ['berry_shrub', 'fruit_pome', 'fruit_stone'],
  },
  {
    key: 'grape_green', title: 'Зелені операції на винограднику',
    advice: 'Обламати зайві й подвійні пагони, підв\'язати зелені пагони до шпалери, видалити поросль зі штамба.',
    windows: [['05-10', '06-30']], groups: ['grape'],
    phases: ['Розвиток листя та пагонів', 'Поява суцвіть', 'Цвітіння', 'Формування ягід'],
  },
  {
    key: 'fruit_thinning', title: 'Нормування зав\'язі',
    advice: 'Після червневого обсипання прорідити зав\'язь: на яблуні — 1–2 плоди в суцвітті, на персику й абрикосі — 10–15 см між плодами. Так плоди крупніші, а наступного року не буде «відпочинку».',
    windows: [['05-25', '06-30']], groups: ['fruit_pome', 'fruit_stone'], notCrops: /вишн|черешн|кизил/i,
    phases: ['Після цвітіння', 'Формування плодів'], fruiting: true,
  },
  {
    key: 'strawberry_runners', title: 'Видалення вусів полуниці',
    advice: 'Вуса виснажують кущі й закладку квіткових бруньок на наступний рік. Залишати лише на маточних рядах для розсади.',
    windows: [['06-15', '09-15']], groups: ['berry_herb'],
  },
  {
    key: 'grape_summer', title: 'Карбування й пасинкування',
    advice: 'Вкоротити верхівки пагонів вище шпалери, прибрати пасинки й частину листя в зоні ґрон для провітрювання — менше мілдью й сірої гнилі.',
    windows: [['07-01', '08-15']], groups: ['grape'],
  },
  {
    key: 'strawberry_renovation', title: 'Оновлення полуниці після збору',
    advice: 'Скосити старе листя (не чіпаючи сердечок), прибрати його з ділянки, розпушити міжряддя й підживити — кущі закладають урожай наступного року.',
    windows: [['07-01', '08-10']], groups: ['berry_herb'], fruiting: true,
  },
  {
    key: 'branch_props', title: 'Підпори під гілки з урожаєм',
    advice: 'Під перевантажені плодами гілки поставити підпори, щоб не було розломів.',
    windows: [['07-15', '08-31']], groups: ['fruit_pome', 'fruit_stone'], fruiting: true,
  },
  {
    key: 'raspberry_canes', title: 'Вирізати відплодоносні пагони малини',
    advice: 'Пагони, що відплодоносили, вирізати біля землі й винести з ділянки — разом з ними йдуть шкідники й хвороби. Ремонтантну малину на однорічний урожай скошують повністю пізньої осені.',
    windows: [['08-01', '10-31']], groups: ['berry_shrub'], crops: /малин|ожин/i,
  },
  {
    key: 'autumn_pk', title: 'Осіннє внесення фосфору й калію',
    advice: 'Фосфорні й калійні добрива — під осінній обробіток, краще за аналізом ґрунту. Азот восени не вносити: пагони не визріють до морозів.',
    windows: [['09-15', '10-31']], groups: ALL, fruiting: true,
  },
  {
    key: 'leaf_cleanup', title: 'Прибирання листя й падалиці',
    advice: 'Опале листя й муміфіковані плоди — головне джерело парші, моніліозу й плямистостей навесні. Прибрати або обробити по листю 5% сечовиною і закласти в ґрунт.',
    windows: [['10-01', '11-30']], groups: ['fruit_pome', 'fruit_stone', 'berry_shrub', 'grape', 'nut'],
  },
  {
    key: 'water_recharge', title: 'Вологозарядковий полив',
    advice: 'Якщо осінь суха — після листопаду 400–600 м³/га (30–50 л під дерево, 10–20 л під кущ). Насичений вологою ґрунт краще захищає коріння від морозу.',
    windows: [['10-10', '11-20']], groups: ALL,
  },
  {
    key: 'whitewash_autumn', title: 'Побілка штамбів',
    advice: 'Побілити штамби й основи скелетних гілок — захист від морозобоїн і сонячних опіків наприкінці зими, а також від зимуючих шкідників у корі.',
    windows: [['10-20', '11-30']], groups: TREES,
  },
  {
    key: 'rodent_guard', title: 'Захист штамбів від гризунів',
    advice: 'Обв\'язати штамби сіткою чи захисною плівкою на висоту 50–70 см, прибрати бур\'яни біля штамбів, де ховаються миші. Особливо важливо для молодих дерев.',
    windows: [['11-01', '12-15']], groups: ['fruit_pome', 'fruit_stone'],
  },
  {
    key: 'grape_cover', title: 'Укриття винограду на зиму',
    advice: 'Укривні сорти — після перших заморозків −2…−4 °C: зняти лозу зі шпалери, пригнути й укрити ґрунтом чи агроволокном. Неукривним сортам у вашій зоні це не потрібно.',
    windows: [['10-25', '11-30']], groups: ['grape'],
  },
  {
    key: 'strawberry_mulch', title: 'Мульчування полуниці на зиму',
    advice: 'Після встановлення морозів −3…−5 °C укрити ряди соломою чи агроволокном 50–60 г/м² — захист від вимерзання в безсніжну зиму.',
    windows: [['11-10', '12-10']], groups: ['berry_herb'],
  },
]

export const careTaskByKey = (key: string) => CARE_TASKS.find(t => t.key === key) ?? null

export interface DueCareTask {
  key: string
  title: string
  advice: string
  /** місяць початку поточного вікна, yyyy-mm — для позначки «виконано» */
  period: string
  /** останній день вікна, yyyy-mm-dd */
  until: string
}

/** Поточне вікно роботи на дату `today` (yyyy-mm-dd) або null */
export function careWindow(task: CareTask, today: string): { period: string; until: string } | null {
  const year = Number(today.slice(0, 4))
  const md = today.slice(5)
  for (const [from, to] of task.windows) {
    if (from <= to) {
      if (md >= from && md <= to) return { period: `${year}-${from.slice(0, 2)}`, until: `${year}-${to}` }
    } else if (md >= from) {
      return { period: `${year}-${from.slice(0, 2)}`, until: `${year + 1}-${to}` }
    } else if (md <= to) {
      return { period: `${year - 1}-${from.slice(0, 2)}`, until: `${year}-${to}` }
    }
  }
  return null
}

/**
 * Роботи з догляду, актуальні для насадження на дату `today`. `phaseKey` — поточна фаза (відмічена або
 * орієнтовна), якщо відома; `done` — виконані роботи у форматі `${task_key}:${period}`.
 */
export function careTasksDue(opts: {
  group: string | null | undefined
  cropType: string
  phaseKey?: string | null
  stage?: PlantingStageInfo | null
  today: string
  done?: Set<string>
}): DueCareTask[] {
  const { group, cropType, phaseKey, stage, today, done } = opts
  if (!group) return []
  const out: DueCareTask[] = []
  for (const t of CARE_TASKS) {
    if (!t.groups.includes(group)) continue
    if (t.crops && !t.crops.test(cropType)) continue
    if (t.notCrops?.test(cropType)) continue
    if (t.phases && phaseKey && !t.phases.includes(phaseKey)) continue
    if (t.stages && (!stage || !t.stages.includes(stage.stage))) continue
    if (t.fruiting && stage && !stage.fruiting) continue
    const w = careWindow(t, today)
    if (!w || done?.has(`${t.key}:${w.period}`)) continue
    out.push({ key: t.key, title: t.title, advice: t.advice, ...w })
  }
  return out
}
