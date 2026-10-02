import { test, expect } from '@playwright/test'
import { account, anonClient, asUser, hasAccount, serviceClient } from './helpers'

// Команда: фермер запрошує заготівельника; агроном — сторонній.
// Потрібна міграція 20261002_team_invites.sql. ПИШЕ в базу, тому лише з E2E_WRITE=1;
// тимчасове запрошення прибирається сервісним ключем.

test.describe('Команда: запрошення', () => {
  test.skip(process.env.E2E_WRITE !== '1', 'увімкніть E2E_WRITE=1 (тест створює і видаляє записи)')
  test.skip(!hasAccount('farmer') || !hasAccount('buyer') || !hasAccount('agronomist'), 'потрібні фермер, заготівельник і агроном')
  test.describe.configure({ mode: 'serial' })

  const inviteeEmail = account('buyer').email.toLowerCase()
  const otherEmail = `e2e-team-${Date.now()}@example.invalid`
  let token = ''
  let inviteId = ''

  test.beforeAll(async () => {
    const { userId } = await asUser('farmer')
    const { data } = await serviceClient().from('team_members').select('id').eq('owner_id', userId).eq('email', inviteeEmail)
    test.skip(!!data?.length, 'заготівельник уже в команді тестового фермера')
  })

  test.afterAll(async () => {
    const { userId } = await asUser('farmer')
    await serviceClient().from('team_members').delete().eq('owner_id', userId).in('email', [inviteeEmail, otherEmail])
  })

  test('запрошувати й змінювати ролі може лише власник', async () => {
    const farmer = await asUser('farmer')
    const stranger = await asUser('agronomist')

    // team.vue → sendInvite
    const r = await farmer.client.rpc('upsert_team_member', { p_owner_id: farmer.userId, p_email: inviteeEmail, p_role: 'viewer', p_position: null })
    expect(r.error).toBeNull()
    const { data: row } = await serviceClient().from('team_members').select('id, token, role, status').eq('owner_id', farmer.userId).eq('email', inviteeEmail).single()
    expect(row).toMatchObject({ role: 'viewer', status: 'pending' })
    inviteId = row!.id
    token = row!.token

    const promote = await stranger.client.rpc('upsert_team_member', { p_owner_id: farmer.userId, p_email: inviteeEmail, p_role: 'editor', p_position: 'зламано' })
    expect(promote.error, 'сторонній змінив роль у чужій команді').not.toBeNull()
    const create = await stranger.client.rpc('upsert_team_member', { p_owner_id: farmer.userId, p_email: otherEmail, p_role: 'editor', p_position: null })
    expect(create.error, 'сторонній створив запрошення в чужу команду').not.toBeNull()
    const { data: still } = await serviceClient().from('team_members').select('role, position').eq('id', inviteId).single()
    expect(still).toMatchObject({ role: 'viewer', position: null })

    // Власник не може сам «прийняти» запрошення за учасника
    await farmer.client.from('team_members').update({ member_id: stranger.userId, status: 'active' }).eq('id', inviteId)
    const { data: notAccepted } = await serviceClient().from('team_members').select('member_id, status').eq('id', inviteId).single()
    expect(notAccepted, 'власник сам додав учасника').toMatchObject({ member_id: null, status: 'pending' })
  })

  test('запрошення за токеном: видно без входу, прийняти — лише адресат', async () => {
    const farmer = await asUser('farmer')
    const invitee = await asUser('buyer')
    const stranger = await asUser('agronomist')

    const { data: byToken, error } = await anonClient().rpc('team_invite_by_token', { p_token: token })
    expect(error).toBeNull()
    expect(byToken?.[0]).toMatchObject({ email: inviteeEmail, role: 'viewer', status: 'pending', owner_id: farmer.userId })
    const { data: guess } = await anonClient().rpc('team_invite_by_token', { p_token: token.slice(0, 10) })
    expect(guess ?? [], 'запрошення знайдено за неповним токеном').toEqual([])

    const wrong = await stranger.client.rpc('accept_team_invite', { p_token: token, p_name: null })
    expect(wrong.error, 'запрошення прийняв не адресат').not.toBeNull()

    // invite.vue → submit
    const ok = await invitee.client.rpc('accept_team_invite', { p_token: token, p_name: null })
    expect(ok.error).toBeNull()
    expect(ok.data).toBe(farmer.userId)
    const { data: accepted } = await serviceClient().from('team_members').select('member_id, status').eq('id', inviteId).single()
    expect(accepted).toMatchObject({ member_id: invitee.userId, status: 'active' })

    // Учасник бачить поля власника, але не може сам підняти собі роль
    const { data: farms } = await invitee.client.from('farms').select('id').eq('user_id', farmer.userId)
    expect(farms?.length, 'учасник команди не бачить поля власника').toBeGreaterThan(0)
    await invitee.client.from('team_members').update({ role: 'editor' }).eq('id', inviteId)
    const { data: role } = await serviceClient().from('team_members').select('role').eq('id', inviteId).single()
    expect(role!.role, 'учасник сам підняв собі роль').toBe('viewer')
  })

  test('сторінка запрошення відкривається без входу', async ({ page }) => {
    // Окреме запрошення, ще не прийняте
    const farmer = await asUser('farmer')
    await farmer.client.rpc('upsert_team_member', { p_owner_id: farmer.userId, p_email: otherEmail, p_role: 'editor', p_position: null })
    const { data } = await serviceClient().from('team_members').select('token').eq('owner_id', farmer.userId).eq('email', otherEmail).single()
    await page.goto(`/invite?token=${data!.token}`)
    await expect(page.getByText('Запрошення до команди').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('input[type="email"]')).toHaveValue(otherEmail)
    await expect(page.getByText('Запрошення недійсне')).toHaveCount(0)
  })
})
