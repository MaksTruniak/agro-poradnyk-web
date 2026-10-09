import { test, expect } from '@playwright/test'
import { asUser, collectErrors, expectNoErrors, hasAccount, login, serviceClient } from './helpers'

// Заготівельник: «Що закуповую», публічні сторінки /buyers, статистика угод, чат із заготівельником.
// ПИШЕ в базу, тому лише з E2E_WRITE=1; прибирається сервісним ключем. Потрібна міграція 20261008_buyer_crops_stats.sql.

const TAG = `E2E ${Date.now()}`

test.describe('Заготівельник', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('buyer') || !hasAccount('farmer'), 'потрібні E2E_BUYER_* і E2E_FARMER_*')
  test.describe.configure({ mode: 'serial' })

  const chatIds: string[] = []
  let dealId = ''

  test.afterAll(async () => {
    const admin = serviceClient()
    const buyer = await asUser('buyer')
    const farmer = await asUser('farmer')
    await admin.from('buyer_crops').delete().eq('user_id', buyer.userId).like('notes', `${TAG}%`)
    if (dealId) await admin.from('deals').delete().eq('id', dealId)
    const { data: chats } = await admin.from('chats').select('id')
      .or(`and(farmer_id.eq.${farmer.userId},agronomist_id.eq.${buyer.userId}),and(farmer_id.eq.${buyer.userId},agronomist_id.eq.${farmer.userId})`)
      .gte('created_at', new Date(Date.now() - 3600e3).toISOString())
    const ids = [...new Set([...chatIds, ...(chats || []).map(c => c.id)])]
    if (ids.length) {
      await admin.from('messages').delete().in('chat_id', ids)
      await admin.from('chats').delete().in('id', ids)
    }
  })

  test('«Що закуповую»: перевірка даних і ролі', async ({ request }) => {
    const buyer = await asUser('buyer')
    const farmer = await asUser('farmer')
    const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

    const ok = await request.post('/api/buyer-crops', { headers: auth(buyer.token), data: { crop_type: ' Пшениця ', min_qty: 10, max_qty: 100, unit: 'т', notes: `${TAG} клас 2` } })
    expect(ok.status()).toBe(200)
    expect((await ok.json()).crop_type).toBe('Пшениця')

    const empty = await request.post('/api/buyer-crops', { headers: auth(buyer.token), data: { crop_type: '  ' } })
    expect(empty.status()).toBe(400)
    const reversed = await request.post('/api/buyer-crops', { headers: auth(buyer.token), data: { crop_type: 'Кукурудза', min_qty: 100, max_qty: 10, notes: TAG } })
    expect(reversed.status()).toBe(400)
    const negative = await request.post('/api/buyer-crops', { headers: auth(buyer.token), data: { crop_type: 'Кукурудза', min_qty: -5, notes: TAG } })
    expect(negative.status()).toBe(400)
    const notBuyer = await request.post('/api/buyer-crops', { headers: auth(farmer.token), data: { crop_type: 'Кукурудза', notes: TAG } })
    expect(notBuyer.status()).toBe(403)

    // Те саме перевіряє база (запис напряму, повз сервер)
    const direct = await buyer.client.from('buyer_crops').insert({ user_id: buyer.userId, crop_type: 'Кукурудза', min_qty: -1, notes: TAG })
    expect(direct.error, 'від\'ємний обсяг напряму в базу').not.toBeNull()
  })

  test('статистика угод на сторінці — для всіх, без сум', async ({ page }) => {
    const buyer = await asUser('buyer')
    const farmer = await asUser('farmer')
    const admin = serviceClient()

    const before = await serviceClient().rpc('buyer_public_stats', { p_buyer: buyer.userId })
    const base = before.data as { deals: number; tons: number }
    const { data: deal, error } = await admin.from('deals').insert({
      farmer_id: farmer.userId, buyer_id: buyer.userId, proposed_by: farmer.userId, crop_type: 'Пшениця',
      quantity_tons: 12.5, price_per_ton: 9000, status: 'confirmed',
    }).select('id').single()
    expect(error).toBeNull()
    dealId = deal!.id

    const { createClient } = await import('@supabase/supabase-js')
    const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!, { auth: { persistSession: false } })
    const { data: stats } = await anon.rpc('buyer_public_stats', { p_buyer: buyer.userId })
    expect(stats).toMatchObject({ deals: base.deals + 1 })
    expect(Number((stats as any).tons)).toBeCloseTo(Number(base.tons) + 12.5, 1)
    expect(JSON.stringify(stats)).not.toContain('9000')

    const errors = collectErrors(page)
    await page.goto(`/buyers/${buyer.userId}`)
    await expect(page.getByText('тонн закуплено')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(`${TAG} клас 2`)).toBeVisible()
    await expectNoErrors(errors, 'сторінці заготівельника')
  })

  test('фермер пропонує продаж, «Написати» не плодить чатів', async ({ page }) => {
    const buyer = await asUser('buyer')
    const farmer = await asUser('farmer')
    const admin = serviceClient()

    // Уже є чат-пропозиція (з назвою) — раніше через нього пошук чату падав і створювався новий щоразу
    const { data: offerChat } = await farmer.client.from('chats')
      .insert({ farmer_id: farmer.userId, agronomist_id: buyer.userId, type: 'human', is_unlocked: true, title: 'Пропозиція продажу: Пшениця' })
      .select('id').single()
    chatIds.push(offerChat!.id)

    await login(page, 'farmer')
    const errors = collectErrors(page)
    await page.goto(`/buyers/${buyer.userId}`)
    await expect(page.getByRole('button', { name: /Запропонувати/ }).first()).toBeVisible({ timeout: 15000 })

    for (let i = 0; i < 2; i++) {
      await page.goto(`/buyers/${buyer.userId}`)
      await page.waitForLoadState('networkidle')  // кнопка з серверного рендеру оживає після гідрації
      await page.getByRole('button', { name: 'Написати' }).click()
      await page.waitForURL(/\/dashboard\/chats\//)
    }
    const { data: plain } = await admin.from('chats').select('id')
      .eq('farmer_id', farmer.userId).eq('agronomist_id', buyer.userId).is('title', null)
    expect(plain?.length).toBe(1)
    chatIds.push(...(plain || []).map(c => c.id))
    await expectNoErrors(errors, 'сторінці заготівельника (фермер)')
  })

  test('агроном не бачить «Запропонувати»', async ({ page }) => {
    test.skip(!hasAccount('agronomist'), 'потрібні E2E_AGRONOMIST_*')
    const buyer = await asUser('buyer')
    await login(page, 'agronomist')
    await page.goto(`/buyers/${buyer.userId}`)
    await expect(page.getByText(`${TAG} клас 2`)).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: /Запропонувати/ })).toHaveCount(0)
  })
})
