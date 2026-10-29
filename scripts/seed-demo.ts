// Демо-господарство для живих презентацій: ягідник, сад і ягідне поле у Львівській області,
// з фенофазами, техкартами, журналом обробок, врожаями за роки, угодою з агрономом, оглядом і розмовами з AI.
// Акаунти: фермер DEMO_FARMER_EMAIL, агроном DEMO_AGRONOMIST_EMAIL. Повторний запуск спершу прибирає попередні демо-дані.
// Запуск: set -a; source .env; set +a; npx vite-node scripts/seed-demo.ts
import { createClient } from '@supabase/supabase-js'
import { getCatalog, findByName } from '../server/utils/agroCatalog'

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const catalog = await getCatalog()
const today = new Date()
const iso = (d: Date) => d.toISOString().slice(0, 10)
const daysFromNow = (n: number) => new Date(today.getTime() + n * 864e5)
const pastOnly = <T extends { date: string }>(rows: T[]) => rows.filter(r => r.date <= iso(today))

async function must<T>(p: PromiseLike<{ data: T; error: any }>, what: string): Promise<T> {
  const { data, error } = await p
  if (error) throw new Error(`${what}: ${error.message}`)
  return data
}
async function userId(email: string | undefined, role: string) {
  if (!email) throw new Error(`Немає email для ${role} у .env`)
  const rows = await must(db.from('users').select('id, name').eq('email', email), `користувач ${role}`)
  if (!rows?.length) throw new Error(`Користувача ${role} не знайдено`)
  return rows[0]! as { id: string; name: string }
}

const farmer = await userId(process.env.DEMO_FARMER_EMAIL, 'фермер')
const agronomist = await userId(process.env.DEMO_AGRONOMIST_EMAIL, 'агроном')

// ── Прибирання попередніх демо-даних ─────────────────────────────────────────
const oldFarms = (await must(db.from('farms').select('id').eq('user_id', farmer.id), 'поля')).map((f: any) => f.id)
const oldCrops = oldFarms.length ? (await must(db.from('farm_crops').select('id').in('farm_id', oldFarms), 'насадження')).map((c: any) => c.id) : []
if (oldCrops.length) {
  const programs = (await must(db.from('protection_programs').select('id').in('farm_crop_id', oldCrops), 'техкарти')).map((p: any) => p.id)
  if (programs.length) await must(db.from('program_treatments').delete().in('program_id', programs), 'обробки техкарт')
  const inspections = (await must(db.from('planting_inspections').select('id').in('farm_crop_id', oldCrops), 'огляди')).map((i: any) => i.id)
  if (inspections.length) {
    await must(db.from('inspection_findings').delete().in('inspection_id', inspections), 'знахідки')
    await must(db.from('inspection_recommendations').delete().in('inspection_id', inspections), 'рекомендації')
  }
  for (const t of ['planting_inspections', 'protection_programs', 'planting_blocks', 'planting_phases', 'planting_plant_events', 'planting_yields', 'planting_care_log'])
    await must(db.from(t).delete().in('farm_crop_id', oldCrops), t)
}
const oldChats = (await must(db.from('ai_chats').select('id').eq('user_id', farmer.id), 'чати AI')).map((c: any) => c.id)
if (oldChats.length) {
  await must(db.from('ai_messages').delete().in('chat_id', oldChats), 'повідомлення AI')
  await must(db.from('ai_chats').delete().in('id', oldChats), 'чати AI')
}
const humanChats = (await must(db.from('chats').select('id').eq('farmer_id', farmer.id).eq('agronomist_id', agronomist.id), 'чати з агрономом')).map((c: any) => c.id)
if (humanChats.length) {
  await must(db.from('messages').delete().in('chat_id', humanChats), 'повідомлення агронома')
  await must(db.from('chats').delete().in('id', humanChats), 'чати з агрономом')
}
await must(db.from('reminders').delete().eq('user_id', farmer.id), 'нагадування')
for (const t of ['field_treatments', 'expenses', 'manual_sales', 'ai_memory']) await must(db.from(t).delete().eq('user_id', farmer.id), t)
await must(db.from('agreements').delete().eq('farmer_id', farmer.id).eq('agronomist_id', agronomist.id), 'угоди')
if (oldCrops.length) await must(db.from('farm_crops').delete().in('id', oldCrops), 'насадження')
if (oldFarms.length) await must(db.from('farms').delete().in('id', oldFarms), 'поля')

// ── Профіль і тариф ──────────────────────────────────────────────────────────
await must(db.from('users').update({ region: 'Львівська область', city: 'Городок', company_name: 'ФГ «Труняк»' }).eq('id', farmer.id), 'профіль')
await must(db.from('subscriptions').update({ plan: 'business', status: 'active', expires_at: '2027-09-29T22:00:00Z', trial_started_at: null })
  .eq('user_id', farmer.id).eq('profile', 'farmer'), 'тариф')

// ── Поля й насадження ────────────────────────────────────────────────────────
const CROP_IDS: Record<string, string> = {}
for (const c of await must(db.from('crop_catalog').select('id, name'), 'культури')) CROP_IDS[(c as any).name] = (c as any).id

interface Treatment { phase: string; type: string; product: string; dosage: string; notes: string; waiting?: number; date?: string }
interface Planting {
  field: string; crop: string; variety: string; area: number; year: number; rootstock?: string
  row: number; plant: number; trellis?: string; irrigation?: 'drip' | 'none'; notes?: string; plannedT: number
  blocks: [string, number, number, number][]; phases: [string, string][]; yields: [number, number, string?][]
  program: Treatment[]; care?: [string, string, string][]; events?: [string, 'loss' | 'replant', number, string | null, string][]
}

const FIELDS = [
  { key: 'berry', name: 'Ягідник біля ставка', hectares: 4, city: 'Городок', cadastral: '4620982000:03:000:0412' },
  { key: 'orchard', name: 'Сад «Мостиська»', hectares: 10, city: 'Мостиська', cadastral: '4622710100:02:004:0087' },
  { key: 'field', name: 'Ягідне поле «Жовква»', hectares: 4, city: 'Жовква', cadastral: '4622710400:01:001:0153' },
]

const PLANTINGS: Planting[] = [
  {
    field: 'berry', crop: 'Лохина', variety: 'Блюкроп', area: 3, year: 2021, row: 3, plant: 1, irrigation: 'drip', plannedT: 18,
    blocks: [['Блок А, ряди 1–20', 1, 20, 5000], ['Блок Б, ряди 21–40', 21, 40, 4880]],
    phases: [['Спокій', '2026-03-05'], ['Проростання / Набрякання бруньок', '2026-03-28'], ['Розвиток листя', '2026-04-14'], ['Цвітіння', '2026-05-02'],
      ['Після цвітіння', '2026-05-24'], ['Формування плодів', '2026-06-02'], ['Дозрівання', '2026-07-06'], ['Збір урожаю', '2026-07-12'],
      ['Після збору', '2026-08-28'], ['Підготовка до зими', '2026-10-20'], ['Спокій', '2026-11-25']],
    yields: [[2023, 4200, 'перший товарний урожай'], [2024, 9800], [2025, 14500, 'весняні приморозки в цвітіння'], [2026, 16800]],
    program: [
      { phase: 'Проростання / Набрякання бруньок', type: 'захист', product: 'Купроксат', dosage: '4 л/га', notes: 'фунгіцид — профілактика раку стебел', date: '2026-03-30' },
      { phase: 'Розвиток листя', type: 'підживлення', product: 'Брексил Zn', dosage: '1 кг/га', notes: 'мікродобриво — цинк перед цвітінням', date: '2026-04-18' },
      { phase: 'Цвітіння', type: 'захист', product: 'Світч', dosage: '1 кг/га', notes: 'фунгіцид проти сірої гнилі', waiting: 7, date: '2026-05-06' },
      { phase: 'Після цвітіння', type: 'захист', product: 'Тельдор', dosage: '1.5 кг/га', notes: 'фунгіцид проти сірої гнилі ягід', waiting: 3, date: '2026-05-26' },
      { phase: 'Формування плодів', type: 'захист', product: 'Моспілан', dosage: '0.25 кг/га', notes: 'інсектицид проти попелиці', waiting: 14, date: '2026-06-04' },
      { phase: 'Формування плодів', type: 'підживлення', product: 'Брексил Ca', dosage: '2 кг/га', notes: 'кальцій — щільність ягід', date: '2026-06-10' },
      { phase: 'Після збору', type: 'захист', product: 'Скор', dosage: '0.3 л/га', notes: 'фунгіцид проти плямистостей листя', waiting: 21, date: '2026-08-30' },
      { phase: 'Підготовка до зими', type: 'підживлення', product: 'Солюбор', dosage: '1 кг/га', notes: 'бор — закладання квіткових бруньок', date: '2026-10-02' },
    ],
    care: [['blueberry_ph', '2026-04', '2026-04-20'], ['mulch', '2026-05', '2026-05-12'], ['autumn_pk', '2026-09', '2026-09-15']],
    events: [['2026-03-12', 'loss', 120, 'frost', 'після безсніжних морозів, блок А'], ['2026-04-08', 'replant', 120, null, 'підсадка саджанцями Блюкроп 2 роки']],
  },
  {
    field: 'berry', crop: 'Малина', variety: 'Полана (ремонтантна)', area: 1, year: 2022, row: 3, plant: 0.5, trellis: 'одноплощинна', irrigation: 'drip', plannedT: 9,
    blocks: [['Ряди 1–34', 1, 34, 6600]],
    phases: [['Розвиток пагонів / Кущіння', '2026-05-10'], ['Цвітіння', '2026-07-01'], ['Збір урожаю', '2026-08-05'], ['Після збору', '2026-10-10'], ['Підготовка до зими', '2026-10-28']],
    yields: [[2023, 3500], [2024, 7200], [2025, 8100], [2026, 8900]],
    program: [
      { phase: 'Розвиток пагонів / Кущіння', type: 'захист', product: 'Топаз', dosage: '0.3 л/га', notes: 'фунгіцид проти борошнистої роси', waiting: 20, date: '2026-05-20' },
      { phase: 'Цвітіння', type: 'захист', product: 'Світч', dosage: '1 кг/га', notes: 'фунгіцид проти сірої гнилі', waiting: 7, date: '2026-07-04' },
      { phase: 'Цвітіння', type: 'захист', product: 'Каліпсо', dosage: '0.25 л/га', notes: 'інсектицид проти малинового жука', waiting: 14, date: '2026-07-08' },
      { phase: 'Після збору', type: 'обробка', product: 'Скошування пагонів під корінь', dosage: '—', notes: 'ремонтантна — врожай на однорічних пагонах', date: '2026-10-25' },
    ],
    care: [['raspberry_canes', '2026-10', '2026-10-25']],
  },
  {
    field: 'orchard', crop: 'Яблуня', variety: 'Гала', area: 6, year: 2019, rootstock: 'М9', row: 3.5, plant: 1, trellis: 'з протиградовою сіткою', irrigation: 'drip', plannedT: 240,
    blocks: [['Квартал 1, ряди 1–30', 1, 30, 8600], ['Квартал 2, ряди 31–58', 31, 58, 8400]],
    phases: [['Спокій', '2026-03-01'], ['Проростання / Набрякання бруньок', '2026-03-24'], ['Розвиток листя', '2026-04-08'], ['Цвітіння', '2026-04-28'],
      ['Після цвітіння', '2026-05-12'], ['Формування плодів', '2026-05-25'], ['Налив плодів', '2026-07-01'], ['Дозрівання', '2026-08-15'],
      ['Збір урожаю', '2026-08-28'], ['Після збору', '2026-09-25'], ['Підготовка до зими', '2026-10-25'], ['Спокій', '2026-11-28']],
    yields: [[2022, 60000], [2023, 135000], [2024, 190000], [2025, 165000, 'град 14 червня, 12% плодів пошкоджено'], [2026, 228000]],
    program: [
      { phase: 'Проростання / Набрякання бруньок', type: 'захист', product: 'Косайд 2000', dosage: '2.5 кг/га', notes: 'фунгіцид — мідь по зеленому конусу', date: '2026-03-26' },
      { phase: 'Розвиток листя', type: 'захист', product: 'Хорус', dosage: '0.3 кг/га', notes: 'фунгіцид проти парші', waiting: 28, date: '2026-04-12' },
      { phase: 'Цвітіння', type: 'підживлення', product: 'Солюбор', dosage: '1 кг/га', notes: 'бор — запилення й зав’язування', date: '2026-04-29' },
      { phase: 'Після цвітіння', type: 'захист', product: 'Скор', dosage: '0.2 л/га', notes: 'фунгіцид проти парші', waiting: 20, date: '2026-05-14' },
      { phase: 'Після цвітіння', type: 'захист', product: 'Моспілан', dosage: '0.2 кг/га', notes: 'інсектицид проти яблуневої плодожерки', waiting: 14, date: '2026-05-20' },
      { phase: 'Формування плодів', type: 'захист', product: 'Луна Експіріенс', dosage: '0.75 л/га', notes: 'фунгіцид проти парші й борошнистої роси', waiting: 14, date: '2026-06-02' },
      { phase: 'Формування плодів', type: 'підживлення', product: 'Брексил Ca', dosage: '3 кг/га', notes: 'кальцій проти гіркої ямчастості', date: '2026-06-10' },
      { phase: 'Налив плодів', type: 'захист', product: 'Делан', dosage: '0.7 кг/га', notes: 'фунгіцид — контактний захист від парші', waiting: 28, date: '2026-07-05' },
      { phase: 'Налив плодів', type: 'захист', product: 'Каліпсо', dosage: '0.25 л/га', notes: 'інсектицид — друге покоління плодожерки', waiting: 14, date: '2026-07-14' },
      { phase: 'Дозрівання', type: 'захист', product: 'Белліс', dosage: '0.8 кг/га', notes: 'фунгіцид проти гнилей на зберіганні', waiting: 7, date: '2026-08-12' },
      { phase: 'Після збору', type: 'обробка', product: 'Сечовина 5% по опалому листю', dosage: '50 кг/га', notes: 'зменшення запасу парші', date: '2026-10-30' },
    ],
    care: [['winter_pruning', '2026-02', '2026-03-10'], ['fruit_thinning', '2026-06', '2026-06-08'], ['whitewash_autumn', '2026-10', '2026-11-05']],
  },
  {
    field: 'orchard', crop: 'Яблуня', variety: 'Голден Делішес', area: 4, year: 2016, rootstock: 'ММ106', row: 4, plant: 2, irrigation: 'none', plannedT: 130,
    blocks: [['Ряди 1–25', 1, 25, 5000]],
    phases: [['Цвітіння', '2026-04-30'], ['Формування плодів', '2026-05-28'], ['Збір урожаю', '2026-09-18'], ['Після збору', '2026-10-12'], ['Підготовка до зими', '2026-10-25']],
    yields: [[2023, 120000], [2024, 110000], [2025, 95000, 'град'], [2026, 128000]],
    program: [
      { phase: 'Розвиток листя', type: 'захист', product: 'Хорус', dosage: '0.3 кг/га', notes: 'фунгіцид проти парші', waiting: 28, date: '2026-04-14' },
      { phase: 'Після цвітіння', type: 'захист', product: 'Скор', dosage: '0.2 л/га', notes: 'фунгіцид проти парші', waiting: 20, date: '2026-05-15' },
      { phase: 'Формування плодів', type: 'захист', product: 'Делан', dosage: '0.7 кг/га', notes: 'фунгіцид — без міді, Голден схильний до сітки', waiting: 28, date: '2026-06-05' },
      { phase: 'Налив плодів', type: 'захист', product: 'Моспілан', dosage: '0.2 кг/га', notes: 'інсектицид проти плодожерки', waiting: 14, date: '2026-07-10' },
    ],
  },
  {
    field: 'field', crop: 'Полуниця', variety: 'Клері', area: 2, year: 2025, row: 1.2, plant: 0.3, irrigation: 'drip', notes: 'мульча агроволокно', plannedT: 20,
    blocks: [['Гряди 1–60', 1, 60, 54000]],
    phases: [['Розвиток листя', '2026-04-05'], ['Цвітіння', '2026-05-01'], ['Збір урожаю', '2026-05-28'], ['Після збору', '2026-07-01'], ['Підготовка до зими', '2026-10-28']],
    yields: [[2026, 14000, 'перший повний урожай']],
    program: [
      { phase: 'Розвиток листя', type: 'захист', product: 'Топаз', dosage: '0.3 л/га', notes: 'фунгіцид проти борошнистої роси', waiting: 20, date: '2026-04-08' },
      { phase: 'Цвітіння', type: 'захист', product: 'Світч', dosage: '1 кг/га', notes: 'фунгіцид проти сірої гнилі', waiting: 7, date: '2026-05-03' },
      { phase: 'Цвітіння', type: 'захист', product: 'Сігнум', dosage: '1.5 кг/га', notes: 'фунгіцид проти сірої гнилі (чергування)', waiting: 3, date: '2026-05-13' },
      { phase: 'Після збору', type: 'захист', product: 'Вертимек Нео', dosage: '1 л/га', notes: 'акарицид проти суничного кліща', waiting: 3, date: '2026-07-06' },
      { phase: 'Після збору', type: 'підживлення', product: 'Мегафол', dosage: '2 л/га', notes: 'біостимулятор — відновлення після покосу листя', date: '2026-07-10' },
    ],
    care: [['strawberry_renovation', '2026-07', '2026-07-02'], ['strawberry_runners', '2026-08', '2026-08-10']],
  },
  {
    field: 'field', crop: 'Смородина чорна', variety: 'Бен Тіран', area: 2, year: 2020, row: 3, plant: 0.7, irrigation: 'drip', plannedT: 12,
    blocks: [['Ряди 1–24', 1, 24, 9500]],
    phases: [['Цвітіння', '2026-04-25'], ['Формування плодів', '2026-05-20'], ['Збір урожаю', '2026-07-08'], ['Після збору', '2026-08-01'], ['Підготовка до зими', '2026-10-22']],
    yields: [[2023, 9000], [2024, 10500], [2025, 7800, 'весняні приморозки'], [2026, 11200]],
    program: [
      { phase: 'Проростання / Набрякання бруньок', type: 'захист', product: 'Купроксат', dosage: '4 л/га', notes: 'фунгіцид — антракноз, септоріоз', date: '2026-03-28' },
      { phase: 'Розвиток пагонів / Кущіння', type: 'захист', product: 'Вертимек Нео', dosage: '1 л/га', notes: 'акарицид проти бруньковго кліща', waiting: 7, date: '2026-04-15' },
      { phase: 'Після збору', type: 'захист', product: 'Тіовіт Джет', dosage: '4 кг/га', notes: 'фунгіцид проти борошнистої роси', date: '2026-07-20' },
    ],
  },
]

const farmIds: Record<string, string> = {}
for (const f of FIELDS) {
  const row = await must(db.from('farms').insert({ user_id: farmer.id, name: f.name, region: 'Львівська область', city: f.city, hectares: f.hectares, cadastral_number: f.cadastral })
    .select('id').single(), `поле ${f.name}`)
  farmIds[f.key] = (row as any).id
}

const cropIds: string[] = []
const cropByKey: Record<string, { id: string; farmId: string }> = {}
for (const p of PLANTINGS) {
  const farmId = farmIds[p.field]!
  const plants = p.blocks.reduce((s, b) => s + b[3], 0)
  const crop: any = await must(db.from('farm_crops').insert({
    farm_id: farmId, crop_type: p.crop, variety: p.variety, area_ha: p.area, catalog_id: CROP_IDS[p.crop] || null,
    planting_year: p.year, rootstock: p.rootstock || null, row_spacing_m: p.row, plant_spacing_m: p.plant, plants_count: plants,
    trellis: p.trellis || null, irrigation: p.irrigation || null, notes: p.notes || null, planned_yield_t: p.plannedT, show_in_catalog: true,
  }).select('id').single(), `насадження ${p.crop}`)
  cropIds.push(crop.id)
  cropByKey[`${p.crop}|${p.variety}`] = { id: crop.id, farmId }

  await must(db.from('planting_blocks').insert(p.blocks.map(([name, from, to, count], i) => ({
    farm_crop_id: crop.id, name, rows_from: from, rows_to: to, plants_count: count, sort_order: i, created_by: farmer.id,
  }))), 'блоки')
  const phases = pastOnly(p.phases.map(([phase_key, date]) => ({ phase_key, date })))
  await must(db.from('planting_phases').insert(phases.map(ph => ({ farm_crop_id: crop.id, phase_key: ph.phase_key, observed_at: ph.date, created_by: farmer.id }))), 'фенофази')
  await must(db.from('planting_yields').insert(p.yields.map(([year, kg, note]) => ({ farm_crop_id: crop.id, year, yield_kg: kg, note: note || null, created_by: farmer.id }))), 'врожаї')
  if (p.care?.length) await must(db.from('planting_care_log').insert(pastOnly(p.care.map(([task_key, period, date]) => ({ task_key, period, date })))
    .map(c => ({ farm_crop_id: crop.id, task_key: c.task_key, period: c.period, done_at: c.date, created_by: farmer.id }))), 'роботи догляду')
  if (p.events?.length) await must(db.from('planting_plant_events').insert(p.events.map(([event_date, kind, count, reason, note]) => ({
    farm_crop_id: crop.id, block_id: null, event_date, kind, count, reason, note, created_by: farmer.id,
  }))), 'втрати й підсадка')

  // Техкарта: виконані обробки мають дату, решта — у плані
  const program: any = await must(db.from('protection_programs').insert({
    farm_crop_id: crop.id, name: `Техкарта: ${p.crop} ${p.variety}, сезон 2026`, description: 'Захист і живлення за фенофазами', active_phases: [...new Set(p.program.map(t => t.phase))],
  }).select('id').single(), 'техкарта')
  const order = [...new Set(p.program.map(t => t.phase))]
  await must(db.from('program_treatments').insert(p.program.map(t => {
    const product = findByName(catalog, t.product)
    const done = !!t.date && t.date <= iso(today)
    return {
      program_id: program.id, type: t.type, product_name: product?.name || t.product, dosage: t.dosage, notes: t.notes,
      phase: t.phase, phase_order: order.indexOf(t.phase), catalog_product_slug: product?.slug || null,
      status: done ? 'done' : 'pending', done_at: done ? t.date : null, waiting_days: t.waiting ?? null,
    }
  })), 'обробки техкарти')

  // Журнал обробок: виконані обробки препаратами
  const journal = p.program.filter(t => t.date && t.date <= iso(today) && t.type !== 'обробка')
  const farmName = FIELDS.find(f => f.key === p.field)!.name
  await must(db.from('field_treatments').insert(journal.map((t) => {
    const dose = Number.parseFloat(t.dosage.replace(',', '.'))
    const unit = /л/.test(t.dosage) ? 'л' : 'кг'
    return {
      user_id: farmer.id, farm_id: farmId, farm_name: farmName, crop_type: p.crop, treatment_date: t.date, product_name: findByName(catalog, t.product)?.name || t.product,
      product_type: t.type, dose_per_ha: Number.isFinite(dose) ? dose : null, area_ha: p.area, total_amount: Number.isFinite(dose) ? Math.round(dose * p.area * 100) / 100 : null,
      unit, notes: t.notes, waiting_days: t.waiting ?? null,
    }
  })), 'журнал обробок')
}

// ── Економіка: витрати й продажі сезону ──────────────────────────────────────
const EXPENSES: [string, string, string, number, string][] = [
  ['2026-02-20', 'fertilizer', 'Сульфат амонію, сірка гранульована — лохина', 38400, 'Лохина'],
  ['2026-03-15', 'labor', 'Обрізка саду, 6 працівників × 12 днів', 86400, 'Яблуня'],
  ['2026-03-25', 'chemicals', 'Мідні препарати на весну (Купроксат, Косайд)', 27600, ''],
  ['2026-04-10', 'machinery', 'Ремонт і калібрування обприскувача', 14500, ''],
  ['2026-04-28', 'chemicals', 'Фунгіциди: Хорус, Скор, Світч', 64200, ''],
  ['2026-05-05', 'fuel', 'Дизельне паливо, травень', 21800, ''],
  ['2026-06-05', 'fertilizer', 'Брексил Ca, Солюбор — листкові підживлення', 31700, ''],
  ['2026-06-20', 'chemicals', 'Інсектициди: Моспілан, Каліпсо', 22900, ''],
  ['2026-07-15', 'labor', 'Збір лохини й смородини, 22 збиральники', 312000, 'Лохина'],
  ['2026-08-30', 'labor', 'Збір яблук Гала', 245000, 'Яблуня'],
  ['2026-09-10', 'other', 'Тара й пакування (ящики, клапани)', 54000, ''],
  ['2026-10-05', 'fuel', 'Дизельне паливо, вересень–жовтень', 26400, ''],
]
await must(db.from('expenses').insert(pastOnly(EXPENSES.map(([date, category, description, amount, crop]) => ({ date, category, description, amount, crop })))
  .map(e => ({ user_id: farmer.id, farm_id: null, crop_type: e.crop || null, category: e.category, description: e.description, amount_uah: e.amount, expense_date: e.date }))), 'витрати')

const SALES: [string, string, number, number, string][] = [
  ['2026-06-10', 'Полуниця', 11.5, 72000, 'ТОВ «Львівські ягоди»'],
  ['2026-07-25', 'Лохина', 15.2, 135000, 'ТОВ «Берріс Експорт»'],
  ['2026-07-20', 'Смородина чорна', 10.4, 38000, 'ФОП Гнатишин'],
  ['2026-09-15', 'Яблуня', 180, 14500, 'ТОВ «Фрут Логістик»'],
]
await must(db.from('manual_sales').insert(pastOnly(SALES.map(([date, crop, t, price, buyer]) => ({ date, crop, t, price, buyer })))
  .map(s => ({ user_id: farmer.id, crop_type: s.crop, quantity_tons: s.t, price_per_ton: s.price, sold_at: s.date, buyer_name: s.buyer, status: 'active', deduct_from_stock: false }))), 'продажі')

// ── Агроном: угода, чат, огляд лохини, нагадування ───────────────────────────
const berryFarm = farmIds.berry!
const blueberry = cropByKey['Лохина|Блюкроп']!
await must(db.from('agreements').insert({
  farmer_id: farmer.id, agronomist_id: agronomist.id, farm_id: berryFarm, status: 'active', price: 4500, price_period: 'monthly',
  message: 'Потрібен супровід ягідника й саду: техкарти на сезон, огляди раз на місяць, консультації в чаті.',
  created_at: '2026-03-02T09:00:00Z', started_at: '2026-03-03T10:00:00Z',
}), 'угода')
const chat: any = await must(db.from('chats').insert({ farmer_id: farmer.id, agronomist_id: agronomist.id, farm_id: berryFarm, type: 'human', is_unlocked: true, is_active: true, created_at: '2026-03-03T10:05:00Z' })
  .select('id').single(), 'чат з агрономом')
const CHAT: [string, 'user' | 'assistant', string][] = [
  ['2026-03-03T10:10:00Z', 'user', 'Доброго дня! Після безсніжних морозів на лохині в блоці А частина кущів підмерзла. Що робити?'],
  ['2026-03-03T11:02:00Z', 'assistant', 'Добрий день! Дочекайтеся набрякання бруньок, тоді буде видно межу живої тканини. Пошкоджені пагони виріжте до здорової деревини, а повністю загиблі кущі запишіть як втрати — навесні підсадимо. По зеленому конусу — мідь, Купроксат 4 л/га.'],
  ['2026-04-08T16:20:00Z', 'user', 'Підсадили 120 кущів Блюкроп. Внесли в журнал.'],
  ['2026-04-08T17:05:00Z', 'assistant', 'Чудово. Слідкуйте за поливом підсадки, перші 3 тижні — щодня потроху. Перед цвітінням додамо цинк, я вже внесла в техкарту.'],
  ['2026-10-20T15:40:00Z', 'assistant', 'Надіслала звіт огляду лохини. Головне — міжжилковий хлороз у блоці Б: перевірте pH поливної води, ймовірно, вода підлужує ґрунт.'],
  ['2026-10-21T08:15:00Z', 'user', 'Дякую! Виміряли — pH води 7.6. Будемо підкислювати.'],
]
await must(db.from('messages').insert(pastOnly(CHAT.map(([date, role, content]) => ({ date, role, content })))
  .map(m => ({ chat_id: chat.id, role: m.role, content: m.content, created_at: m.date, is_read: true, free_chars: 0 }))), 'повідомлення з агрономом')

const inspection: any = await must(db.from('planting_inspections').insert({
  farm_crop_id: blueberry.id, visited_at: '2026-10-20', phase_key: 'Підготовка до зими', condition: 'attention',
  summary: 'Насадження в доброму стані, приріст сезону хороший. У блоці Б на 15% кущів міжжилковий хлороз молодого листя — причина в лужній поливній воді. Поодинокі плями антракнозу на нижньому листі.',
  sent_at: '2026-10-20T15:35:00Z', created_by: agronomist.id,
}).select('id').single(), 'огляд')
await must(db.from('inspection_findings').insert([
  { inspection_id: inspection.id, farm_crop_id: blueberry.id, kind: 'nutrition', name: 'Залізний хлороз', severity: 'medium', affected_pct: 15, note: 'Блок Б, молоде листя; pH ґрунту 5.8', photos: [], sort_order: 0 },
  { inspection_id: inspection.id, farm_crop_id: blueberry.id, kind: 'disease', name: 'Антракноз', severity: 'low', affected_pct: 3, note: 'Нижнє листя, рядки 22–26', photos: [], sort_order: 1 },
]), 'знахідки огляду')
await must(db.from('inspection_recommendations').insert([
  { inspection_id: inspection.id, farm_crop_id: blueberry.id, type: 'полив', product_name: 'Підкислення поливної води до pH 5.0–5.5', dosage: 'азотна кислота, за титруванням', due_date: '2026-11-01', note: 'Перевіряти pH води щотижня', sort_order: 0 },
  { inspection_id: inspection.id, farm_crop_id: blueberry.id, type: 'підживлення', product_name: 'Хелат заліза Fe-EDDHA', dosage: '3 кг/га через крапельне', due_date: '2027-04-15', note: 'Навесні, з початком вегетації', sort_order: 1 },
  { inspection_id: inspection.id, farm_crop_id: blueberry.id, type: 'захист', product_name: findByName(catalog, 'Купроксат')?.name || 'Купроксат', dosage: '4 л/га', due_date: '2027-03-25', note: 'По набряканню бруньок, проти антракнозу', sort_order: 2 },
]), 'рекомендації огляду')

// Нагадування: від агронома на найближчі тижні після запуску і власні фермера
const REMINDERS: { days: number; type: string; description: string; crop?: string; agronomist?: boolean }[] = [
  { days: 3, type: 'обробка', description: 'Перевірити pH поливної води лохини (ціль 5.0–5.5)', crop: 'Лохина|Блюкроп', agronomist: true },
  { days: 6, type: 'обробка', description: 'Огляд штамбів яблуні після відлиги: пошкодження гризунами, захисні сітки', crop: 'Яблуня|Гала', agronomist: true },
  { days: 10, type: 'обробка', description: 'Замовити ЗЗР на сезон 2027 за техкартами (знижка дистриб’ютора до 20.12)' },
  { days: 14, type: 'обробка', description: 'Калібрування обприскувача перед сезоном', agronomist: false },
  { days: 21, type: 'обробка', description: 'Перевірити укриття полуниці агроволокном після снігу', crop: 'Полуниця|Клері', agronomist: true },
]
await must(db.from('reminders').insert(REMINDERS.map((r) => {
  const crop = r.crop ? cropByKey[r.crop] : null
  const at = daysFromNow(r.days)
  at.setHours(8, 0, 0, 0)
  return {
    user_id: farmer.id, created_by: r.agronomist ? agronomist.id : farmer.id, from_agronomist: !!r.agronomist, created_for: farmer.id,
    farm_id: crop?.farmId || null, farm_crop_id: crop?.id || null, type: r.type, description: r.description, scheduled_date: at.toISOString(), is_sent: false, is_done: false,
  }
})), 'нагадування')

// ── AI агроном: дві розмови сезону й пам'ять господарства ───────────────────
const AI_CHATS: { crop: string; at: string; turns: [string, string][] }[] = [
  {
    crop: 'Лохина|Блюкроп', at: '2026-07-14T09:20:00Z', turns: [
      ['У лохини на листі червоні плями з сірим центром, сорт Блюкроп. Що це і чим обробити?',
        '**Найімовірніше, це септоріоз (Septoria).** Дрібні плями 2-5 мм із сірим центром і червоно-бурою облямівкою, у центрі видно чорні крапки (пікніди). Він посилюється влітку у вологу погоду та при загущенні куща.\n\n**Як відрізнити:**\n- Чорні крапки в центрі плями вказують на септоріоз.\n- Плями без крапок, з рожево-червоним відтінком, можуть бути червоною плямистістю (Exobasidium).\n- Плями на листі разом з гниллю ягід вказують на антракноз.\n\n**Що робити зараз (плодоношення):**\n1. Обробіть @Тіовіт Джет 3-5 кг/га: у нього короткий період очікування. Повторіть через 10-12 днів.\n2. Якщо поширення швидке, використайте системний фунгіцид, зареєстрований на ягідних, наприклад @Скор. Перевірте на етикетці дозвіл для лохини та строк очікування до збору.\n3. Приберіть уражене листя, не змочуйте листя при поливі й проріджуйте кущі для провітрювання.\n4. Після збору врожаю проведіть повну захисну обробку.\n\nСкільки відсотків листя вже вражено і чи є плями на ягодах?\n\nREMINDER:Повторна обробка @Тіовіт Джет|10'],
      ['Вражено десь 5% листя, на ягодах чисто.',
        'Тоді ситуація під контролем. Достатньо однієї обробки @Тіовіт Джет зараз і повтору через 10–12 днів, системний фунгіцид під час збору не потрібен.\n\nПісля збору внесіть @Скор 0,3 л/га — це знизить запас інфекції на наступний рік. Восени приберіть опале листя з міжрядь.\n\nREMINDER:Обробка лохини @Скор після збору|40'],
    ],
  },
  {
    crop: 'Яблуня|Голден Делішес', at: '2026-07-10T18:05:00Z', turns: [
      ['Яблуня, парша на листі і плодах. Сорт Голден. Що зараз, у липні?',
        'Влітку парша розвивається під час дощів, а на плодах уражені плями розтріскуються. Ураження на плодах може проявитися вже на зберіганні.\n\n**Що зробити зараз:**\n- Обробіть сад @Скор 0,2 л/га (системний, очікування 20 днів). Якщо дощі тривалі, додайте контактний @Делан 0,7 кг/га.\n- Повторіть через 10–14 днів, чергуючи діючі речовини, щоб не виникла резистентність.\n- Міддю не обробляйте: Голден Делішес дає на плодах іржаву сітку й опіки.\n- Приберіть і знищте сильно уражені плоди та падалицю.\n- Восени, при листопаді, обробіть опале листя сечовиною 5%, щоб зменшити запас інфекції.\n\nПеред збором Голдена дотримуйтесь строку очікування препарату.\n\nREMINDER:Повторна обробка від парші (чергувати препарат)|12\n\nЧи з\'являються свіжі плями на молодих листках верхівок пагонів, чи вони лише на старому листі?'],
    ],
  },
]
for (const c of AI_CHATS) {
  const crop = cropByKey[c.crop]!
  const at = new Date(c.at)
  const row: any = await must(db.from('ai_chats').insert({ user_id: farmer.id, farm_id: crop.farmId, farm_crop_id: crop.id, crop_type: c.crop.split('|')[0], provider: 'anthropic', created_at: at.toISOString(), updated_at: new Date(at.getTime() + c.turns.length * 300e3).toISOString() })
    .select('id').single(), 'чат AI')
  await must(db.from('ai_messages').insert(c.turns.flatMap(([q, a], i) => [
    { chat_id: row.id, role: 'user', content: q, created_at: new Date(at.getTime() + i * 300e3).toISOString() },
    { chat_id: row.id, role: 'assistant', content: a, created_at: new Date(at.getTime() + i * 300e3 + 30e3).toISOString() },
  ])), 'повідомлення AI')
}
await must(db.from('ai_memory').upsert({
  user_id: farmer.id, farm_id: berryFarm, updated_at: new Date().toISOString(),
  summary: 'ФГ «Труняк», Львівська область: лохина Блюкроп 3 га (2021, крапельне), малина ремонтантна Полана 1 га, яблуня Гала на М9 6 га та Голден Делішес на ММ106 4 га, полуниця Клері 2 га (2025), смородина чорна Бен Тіран 2 га. Проблеми сезону 2026: вимерзання лохини в березні (120 кущів підсаджено), септоріоз лохини в липні (5% листя), парша на Голдені, хлороз лохини в блоці Б через лужну поливну воду (pH 7.6). Працює з агрономом за угодою.',
}), 'пам\'ять AI')

console.log(`Демо готове: ${FIELDS.length} поля, ${PLANTINGS.length} насаджень (${cropIds.length}), фермер ${farmer.name}, агроном ${agronomist.name}`)
