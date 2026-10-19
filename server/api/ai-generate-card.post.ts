import type { CatalogProduct } from '../utils/agroCatalog'
import type { CardPromptInput } from '../utils/cardPrompt'

const TREATMENT_TYPES = ['захист', 'підживлення', 'обробка', 'полив']

/** Відповідь моделі → перевірена структура техкарти (браузер вставляє її в базу як є) */
function parseCard(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  let parsed: any
  try { parsed = JSON.parse(jsonMatch[0]) } catch { return null }
  if (!Array.isArray(parsed?.phases)) return null
  const phases = parsed.phases.slice(0, 8).map((p: any) => ({
    name: clampText(p?.name, 100).trim(),
    treatments: (Array.isArray(p?.treatments) ? p.treatments : []).slice(0, 6).map((t: any) => ({
      type: TREATMENT_TYPES.includes(t?.type) ? t.type : 'обробка',
      product_name: clampText(t?.product_name, 150).trim(),
      dosage: clampText(t?.dosage, 100).trim(),
      notes: clampText(t?.notes, 300).trim(),
      active_ingredient: clampText(t?.active_ingredient, 200).trim(),
      waiting_days: Number.isInteger(t?.waiting_days) && t.waiting_days >= 0 && t.waiting_days <= 365 ? t.waiting_days : null,
    })).filter((t: any) => t.product_name),
  })).filter((p: any) => p.name && p.treatments.length)
  return phases.length ? { phases } : null
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const cropType = clampText(body?.cropType, 100).trim()
  const variety = clampText(body?.variety, 100).trim()
  const region = clampText(body?.region, 100).trim()
  const areaHa = Number(body?.areaHa) > 0 ? Number(body.areaHa) : null
  // Фенофази культури з довідника — карта має використовувати саме їх (тоді видно, яка фаза поточна)
  const allowedPhases: string[] = (Array.isArray(body?.phases) ? body.phases : [])
    .map((p: unknown) => clampText(p, 80).trim()).filter(Boolean).slice(0, 20)
  // Опис насадження: вік, підщепа, схема, поточна фаза
  const planting = clampText(body?.planting, 300).trim()

  if (!cropType) {
    await requireAiAccess(event)  // без входу — 401, а не 400
    throw createError({ statusCode: 400, message: 'cropType required' })
  }

  const access = await requireAiAccess(event, 'card')

  const promptInput: CardPromptInput = {
    cropType, variety, region, areaHa, phases: allowedPhases, planting,
    cropGroup: clampText(body?.cropGroup, 40).trim() || null,
    plantingYear: Number.isInteger(Number(body?.plantingYear)) ? Number(body.plantingYear) : null,
  }
  const prompt = buildCardPrompt(promptInput)

  let card: ReturnType<typeof parseCard> = null
  try {
    // Міркування моделі (<think>) прибирає провайдерний шар — інакше дужки з них ламали пошук JSON
    const res = await aiComplete(access.route!, {
      system: 'Ти агроном-експерт. Відповідаєш лише валідним JSON без пояснень.',
      messages: [{ role: 'user', content: prompt }],
    }, 'ai-generate-card')
    card = parseCard(res.text)
    if (card) {
      const phases = normalizeCardPhases(card.phases as { name: string; treatments: any[] }[], promptInput, matchPhase)
      card = phases.length ? { phases } : null
    }
    await recordAiRequest(access, res.usage, card ? 'ok' : res.refused ? 'refused' : 'error')
  } catch (err) {
    await releaseAiUsage(access)
    await recordAiRequest(access, null, 'error')
    throw err
  }
  if (!card) {
    await releaseAiUsage(access)
    throw createError({ statusCode: 502, message: 'AI повернув некоректну карту. Спробуйте ще раз.' })
  }
  return { ...(await verifyCard(card)), credits: access.credits }
})

/**
 * Звірка з каталогом платформи (модель може вигадати назву препарату):
 * знайдено за назвою → назва з каталогу; немає → препарат каталогу з тією самою діючою речовиною;
 * загальна назва добрива (сечовина, КАС…) — без змін; інакше — позначка «немає в каталозі».
 */
async function verifyCard(card: NonNullable<ReturnType<typeof parseCard>>) {
  const catalog = await getCatalog()
  const stats = { catalog: 0, replaced: 0, generic: 0, missing: 0, operations: 0 }
  const phases = card.phases.map((phase: { name: string; treatments: any[] }) => ({
    name: phase.name,
    treatments: phase.treatments.map((t: any) => {
      // catalog_product_id у program_treatments посилається на іншу таблицю (не agro_products) — зберігаємо лише slug
      const base = { type: t.type, product_name: t.product_name, dosage: t.dosage, notes: t.notes, waiting_days: t.waiting_days, catalog_product_slug: null as string | null }
      const link = (p: CatalogProduct) => p.kind === 'product' ? { catalog_product_slug: p.slug } : {}
      if (isFieldOperation(t.type, t.product_name, t.active_ingredient)) { stats.operations++; return base }
      const byName = findByName(catalog, t.product_name)
      if (byName) { stats.catalog++; return { ...base, product_name: byName.name, ...link(byName) } }
      if (isGenericFertilizer(t.product_name)) { stats.generic++; return base }
      const byIngredient = t.active_ingredient ? findByIngredient(catalog, t.active_ingredient, `${t.notes} ${t.type}`) : null
      if (byIngredient) {
        stats.replaced++
        // Строк очікування аналога може відрізнятись — фермер вносить його з етикетки
        return { ...base, product_name: byIngredient.name, ...link(byIngredient), waiting_days: null, notes: clampText(`Аналог з каталогу (AI запропонував «${t.product_name}», д.р. ${t.active_ingredient}). ${t.notes}`, 400) }
      }
      stats.missing++
      return { ...base, notes: clampText(`⚠ Немає в каталозі АгроПростір — перевірте реєстрацію в Україні. ${t.notes}`, 400) }
    }),
  }))
  return { phases, verification: stats }
}
