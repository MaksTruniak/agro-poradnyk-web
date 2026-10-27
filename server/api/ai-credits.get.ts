// Кредити AI (тариф + AI-пакети) й вартість дій — для лічильника на сторінках.
export default defineEventHandler(async (event) => {
  const costs = Object.fromEntries(Object.entries(AI_ACTIONS).map(([k, v]) => [k, { credits: v.credits, label: v.label }]))
  try {
    const access = await requireAiAccess(event)
    const wallets = access.wallets.map(({ kind, label, credits, used, capReached, expiresAt }) => ({ kind, label, credits, used, capReached, expiresAt }))
    return { ...access.credits, plan: access.plan, wallets, trialAiEnded: access.trialAiEnded, costs, fallbackDaily: AI_FALLBACK.dailyLimit }
  } catch (e: any) {
    if (e?.statusCode === 403) return { allowance: 0, used: 0, remaining: 0, wallets: [], trialAiEnded: !!e.data?.trialAiEnded, costs, fallbackDaily: 0 }
    throw e
  }
})
