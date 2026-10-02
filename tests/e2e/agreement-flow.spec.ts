import { test, expect } from '@playwright/test'
import { asUser, hasAccount, serviceClient } from './helpers'

// Співпраця фермер ↔ агроном і доступ агронома до поля; заготівельник — сторонній користувач.
// ПИШЕ в базу, тому лише з E2E_WRITE=1; після тесту все прибирається сервісним ключем.

test.describe('Співпраця: фермер ↔ агроном', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('agronomist'), 'потрібні E2E_FARMER_* і E2E_AGRONOMIST_*')
  test.describe.configure({ mode: 'serial' })

  let agreementId = ''
  let shareId = ''
  let farmId = ''

  test.afterAll(async () => {
    const admin = serviceClient()
    if (shareId) await admin.from('field_shares').delete().eq('id', shareId)
    if (agreementId) await admin.from('agreements').delete().eq('id', agreementId)
  })

  test('без співпраці агроном не бачить полів фермера', async () => {
    const farmer = await asUser('farmer')
    const agronomist = await asUser('agronomist')

    const { data: own } = await farmer.client.from('farms').select('id').limit(1)
    test.skip(!own?.length, 'у тестового фермера немає поля')
    farmId = own![0]!.id

    const { data: existing } = await serviceClient().from('agreements').select('id')
      .eq('farmer_id', farmer.userId).eq('agronomist_id', agronomist.userId).in('status', ['pending', 'active'])
    test.skip(!!existing?.length, 'між тестовими акаунтами вже є співпраця')

    const { data: hidden } = await agronomist.client.from('farms').select('id, cadastral_number').eq('id', farmId)
    expect(hidden ?? []).toEqual([])
  })

  test('статуси співпраці контролює база', async () => {
    const farmer = await asUser('farmer')
    const agronomist = await asUser('agronomist')

    // Браузер просить одразу «active» з відгуком — база ставить pending без відгуку
    const { data: created, error } = await farmer.client.from('agreements').insert({
      farmer_id: farmer.userId, agronomist_id: agronomist.userId, message: 'E2E тест',
      price: 1000, price_period: 'monthly', farm_id: farmId || null,
      status: 'active', farmer_review: 'накрутка', farmer_rating: 5,
    }).select('id, status, started_at, farmer_review, farmer_rating').single()
    expect(error).toBeNull()
    expect(created).toMatchObject({ status: 'pending', started_at: null, farmer_review: null, farmer_rating: null })
    agreementId = created!.id

    if (hasAccount('buyer')) {
      const stranger = await asUser('buyer')
      const { data: hidden } = await stranger.client.from('agreements').select('id').eq('id', agreementId)
      expect(hidden ?? []).toEqual([])
    }

    // Поки співпраця pending — агроном бачить поле фермера
    if (farmId) {
      const { data: visible } = await agronomist.client.from('farms').select('id').eq('id', farmId)
      expect(visible?.length).toBe(1)
    }

    const selfStart = await farmer.client.from('agreements').update({ status: 'active' }).eq('id', agreementId)
    expect(selfStart.error, 'фермер сам починає співпрацю').not.toBeNull()

    const start = await agronomist.client.from('agreements')
      .update({ status: 'active', farmer_rating: 5, farmer_review: 'від агронома' })
      .eq('id', agreementId).select('status, started_at, farmer_rating, farmer_review').single()
    expect(start.error).toBeNull()
    expect(start.data).toMatchObject({ status: 'active', farmer_rating: null, farmer_review: null })
    expect(start.data!.started_at).toBeTruthy()

    const done = await farmer.client.from('agreements')
      .update({ status: 'completed', farmer_rating: 5, farmer_review: 'Дякую' })
      .eq('id', agreementId).select('status, ended_at, farmer_rating').single()
    expect(done.error).toBeNull()
    expect(done.data).toMatchObject({ status: 'completed', farmer_rating: 5 })
    expect(done.data!.ended_at).toBeTruthy()

    const reopen = await agronomist.client.from('agreements').update({ status: 'active' }).eq('id', agreementId)
    expect(reopen.error, 'завершену співпрацю відкрито знову').not.toBeNull()
  })

  test('доступ до поля створює фермер, приймає агроном', async () => {
    test.skip(!farmId, 'у тестового фермера немає поля')
    const farmer = await asUser('farmer')
    const agronomist = await asUser('agronomist')

    // Агроном не може сам «отримати» доступ до чужого поля
    const forged = await agronomist.client.from('field_shares')
      .insert({ farm_id: farmId, farmer_id: farmer.userId, agronomist_id: agronomist.userId, status: 'accepted' })
    expect(forged.error, 'агроном створив доступ до чужого поля').not.toBeNull()

    const { data: share, error } = await farmer.client.from('field_shares')
      .insert({ farm_id: farmId, farmer_id: farmer.userId, agronomist_id: agronomist.userId, status: 'accepted' })
      .select('id, status').single()
    expect(error).toBeNull()
    expect(share!.status).toBe('pending')
    shareId = share!.id

    if (hasAccount('buyer')) {
      const stranger = await asUser('buyer')
      const { data: hidden } = await stranger.client.from('field_shares').select('id').eq('id', shareId)
      expect(hidden ?? []).toEqual([])
    }

    const selfAccept = await farmer.client.from('field_shares').update({ status: 'accepted' }).eq('id', shareId)
    expect(selfAccept.error, 'фермер сам прийняв доступ').not.toBeNull()

    const accept = await agronomist.client.from('field_shares')
      .update({ status: 'accepted', agronomist_id: farmer.userId })
      .eq('id', shareId).select('status, agronomist_id').single()
    expect(accept.error).toBeNull()
    expect(accept.data).toMatchObject({ status: 'accepted', agronomist_id: agronomist.userId })

    const revokeByAgronomist = await agronomist.client.from('field_shares').delete().eq('id', shareId).select('id')
    expect(revokeByAgronomist.data ?? [], 'агроном видалив доступ фермера').toEqual([])

    const revoke = await farmer.client.from('field_shares').delete().eq('id', shareId).select('id')
    expect(revoke.error).toBeNull()
    expect(revoke.data?.length).toBe(1)
    shareId = ''
  })
})
