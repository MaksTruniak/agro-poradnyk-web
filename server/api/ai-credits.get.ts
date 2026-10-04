// Кредити AI поточного місяця й вартість дій — для лічильника на сторінках.
export default defineEventHandler(async (event) => {
  const costs = Object.fromEntries(Object.entries(AI_ACTIONS).map(([k, v]) => [k, { credits: v.credits, label: v.label }]))
  try {
    const access = await requireAiAccess(event)
    return { ...access.credits, plan: access.plan, costs, fallbackDaily: AI_FALLBACK.dailyLimit }
  } catch (e: any) {
    if (e?.statusCode === 403) return { allowance: 0, used: 0, remaining: 0, costs, fallbackDaily: 0 }
    throw e
  }
})
