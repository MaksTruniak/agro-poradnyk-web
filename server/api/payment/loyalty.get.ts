// Знижка лояльності для сторінки підписки — та сама, що застосує /api/payment/create
export default defineEventHandler(async (event) => {
  const { user, supabase } = await requireUser(event)
  const profile = getQuery(event).profile === 'agronomist' ? 'agronomist' : 'farmer'
  return { percent: await loyaltyDiscount(supabase, user.id, profile) }
})
