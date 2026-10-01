import { test, expect } from '@playwright/test'
import { asUser, hasAccount, serviceClient } from './helpers'

// Повний шлях угоди з реальними правами фермера і заготівельника.
// ПИШЕ в базу, тому лише з E2E_WRITE=1; після тесту все прибирається сервісним ключем.

test.describe('Угода: фермер ↔ заготівельник', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('buyer'), 'потрібні E2E_FARMER_* і E2E_BUYER_*')
  test.describe.configure({ mode: 'serial' })

  let chatId = ''
  let dealId = ''

  test.afterAll(async () => {
    const admin = serviceClient()
    if (dealId) {
      await admin.from('deal_reviews').delete().eq('deal_id', dealId)
      await admin.from('deals').delete().eq('id', dealId)
    }
    if (chatId) {
      await admin.from('messages').delete().eq('chat_id', chatId)
      await admin.from('chats').delete().eq('id', chatId)
    }
    if (hasAccount('farmer')) {
      const { userId } = await asUser('farmer')
      await admin.rpc('recalc_deal_ratings', { p_user: userId })
    }
  })

  test('чат і повідомлення бачать лише учасники', async () => {
    const farmer = await asUser('farmer')
    const buyer = await asUser('buyer')

    const { data: chat, error } = await farmer.client.from('chats')
      .insert({ farmer_id: farmer.userId, agronomist_id: buyer.userId, type: 'human', is_unlocked: true, title: 'E2E тест' })
      .select('id').single()
    expect(error).toBeNull()
    chatId = chat!.id

    const msg = await farmer.client.from('messages').insert({ chat_id: chatId, role: 'user', content: '<img src=x onerror=alert(1)> e2e' })
    expect(msg.error).toBeNull()

    const { data: seen } = await buyer.client.from('messages').select('content').eq('chat_id', chatId)
    expect(seen?.length).toBe(1)

    if (hasAccount('agronomist')) {
      const stranger = await asUser('agronomist')
      const { data: hidden } = await stranger.client.from('messages').select('id').eq('chat_id', chatId)
      expect(hidden ?? []).toEqual([])
    }
  })

  test('статуси угоди контролює база', async () => {
    const farmer = await asUser('farmer')
    const buyer = await asUser('buyer')

    // Браузер просить одразу «completed» — база ставить pending
    const { data: deal, error } = await farmer.client.from('deals').insert({
      chat_id: chatId, farmer_id: farmer.userId, buyer_id: buyer.userId, proposed_by: farmer.userId,
      crop_type: 'Пшениця озима', quantity_tons: 10, price_per_ton: 8000, total_price: 80000, status: 'completed',
    }).select('id, status').single()
    expect(error).toBeNull()
    expect(deal!.status).toBe('pending')
    dealId = deal!.id

    const selfConfirm = await farmer.client.from('deals').update({ status: 'confirmed' }).eq('id', dealId)
    expect(selfConfirm.error, 'автор підтверджує власну пропозицію').not.toBeNull()

    const confirm = await buyer.client.from('deals').update({ status: 'confirmed', price_per_ton: 1 }).eq('id', dealId).select('status, price_per_ton, confirmed_at').single()
    expect(confirm.error).toBeNull()
    expect(confirm.data).toMatchObject({ status: 'confirmed', price_per_ton: 8000 })
    expect(confirm.data!.confirmed_at).toBeTruthy()

    const farmerComplete = await farmer.client.from('deals').update({ status: 'completed' }).eq('id', dealId)
    expect(farmerComplete.error, 'фермер завершує замість заготівельника').not.toBeNull()

    const complete = await buyer.client.from('deals').update({ status: 'completed' }).eq('id', dealId).select('status').single()
    expect(complete.data?.status).toBe('completed')
  })

  test('реквізити й відгук лише для учасників, рейтинг рахує база', async () => {
    const farmer = await asUser('farmer')
    const buyer = await asUser('buyer')

    const { data: parties, error } = await buyer.client.rpc('deal_party_details', { p_deal_id: dealId })
    expect(error).toBeNull()
    expect(parties?.length).toBe(2)
    if (hasAccount('agronomist')) {
      const stranger = await asUser('agronomist')
      const denied = await stranger.client.rpc('deal_party_details', { p_deal_id: dealId })
      expect(denied.error).not.toBeNull()
    }

    const review = await buyer.client.from('deal_reviews').insert({ deal_id: dealId, reviewer_id: buyer.userId, reviewee_id: farmer.userId, rating: 5 })
    expect(review.error).toBeNull()
    const again = await buyer.client.from('deal_reviews').insert({ deal_id: dealId, reviewer_id: buyer.userId, reviewee_id: farmer.userId, rating: 1 })
    expect(again.error, 'повторний відгук').not.toBeNull()

    const { data: profile } = await buyer.client.from('public_profiles').select('farmer_reviews_count').eq('id', farmer.userId).single()
    expect(profile!.farmer_reviews_count).toBeGreaterThanOrEqual(1)
  })
})
