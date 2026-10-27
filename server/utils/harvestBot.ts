import type { SupabaseClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import type { SeasonStats } from '~~/shared/utils/harvestBot'

// Дані для Telegram-бота збирача: хто він, його сезони, підсумки, QR. Лише сервер (service role).

export interface BotWorker { id: string; owner_id: string; first_name: string; last_name: string | null; auth_user_id: string }
export interface WorkerSeason extends SeasonStats { seasonId: string; status: string }

/** Збирач, прив'язаний до акаунту (harvest_workers.auth_user_id) */
export async function workerByAuth(db: SupabaseClient, authUserId: string): Promise<BotWorker | null> {
  const { data } = await db.from('harvest_workers').select('id, owner_id, first_name, last_name, auth_user_id')
    .eq('auth_user_id', authUserId).limit(1).maybeSingle()
  return data as BotWorker | null
}

/** Сезони збирача з підсумками: сьогодні (за Києвом), за сезон, виплати */
export async function workerSeasons(db: SupabaseClient, workerId: string): Promise<WorkerSeason[]> {
  const { data: links } = await db.from('harvest_season_workers')
    .select('season_id, custom_price_per_kg, is_active, harvest_seasons(id, crop, variety, price_per_kg, status, created_at)')
    .eq('worker_id', workerId)
  const rows = (links || []).filter((l: any) => l.harvest_seasons && l.is_active !== false)
  if (!rows.length) return []
  const ids = rows.map((l: any) => l.season_id)
  const { start } = kyivDayBounds()
  const [{ data: records }, { data: payments }] = await Promise.all([
    db.from('harvest_records').select('season_id, weight_kg, amount, recorded_at').eq('worker_id', workerId).in('season_id', ids),
    db.from('harvest_payments').select('season_id, amount, status').eq('worker_id', workerId).in('season_id', ids),
  ])
  return rows.map((l: any): WorkerSeason => {
    const s = l.harvest_seasons
    const recs = (records || []).filter((r: any) => r.season_id === l.season_id)
    const today = recs.filter((r: any) => new Date(r.recorded_at) >= start)
    const pays = (payments || []).filter((p: any) => p.season_id === l.season_id)
    const sum = (xs: any[], k: string) => xs.reduce((a, x) => a + (Number(x[k]) || 0), 0)
    return {
      seasonId: s.id, status: s.status, crop: s.crop, variety: s.variety,
      pricePerKg: Number(l.custom_price_per_kg ?? s.price_per_kg) || 0,
      todayKg: sum(today, 'weight_kg'), todayAmount: sum(today, 'amount'),
      seasonKg: sum(recs, 'weight_kg'), seasonAmount: sum(recs, 'amount'),
      paidConfirmed: sum(pays.filter((p: any) => p.status === 'confirmed'), 'amount'),
      paidPending: sum(pays.filter((p: any) => p.status === 'pending'), 'amount'),
    }
  }).sort((a, b) => Number(b.status === 'active') - Number(a.status === 'active'))
}

/** Посилання з QR збирача — бригадир сканує його й відкриває зважування цього збирача в сезоні */
export const weighUrl = (seasonId: string, workerId: string) => `${SITE_URL}/dashboard/harvest/${seasonId}?weigh=${workerId}`
export const qrPng = (url: string) => QRCode.toBuffer(url, { width: 480, margin: 2 })

/** Надіслати збирачу (за акаунтом); якщо заблокував бота — відв'язати чат. true — надіслано */
export async function sendToWorker(db: SupabaseClient, authUserId: string, html: string, replyMarkup?: Record<string, unknown>) {
  if (!telegramEnabled()) return false
  const { data: link } = await db.from('telegram_links').select('chat_id').eq('user_id', authUserId).maybeSingle()
  if (!link?.chat_id) return false
  try {
    if (replyMarkup) await sendTelegramMarkup(link.chat_id, html, replyMarkup)
    else await sendTelegram(link.chat_id, html)
    return true
  } catch (e: any) {
    if (e?.telegram?.error_code === 403) await db.from('telegram_links').delete().eq('user_id', authUserId)
    else console.error('[harvest bot]', authUserId, e?.message ?? e)
    return false
  }
}

/** Фермер (власник збирача) або активний член його команди */
export async function canManageWorkers(db: SupabaseClient, userId: string, ownerId: string) {
  if (userId === ownerId) return true
  const { data } = await db.from('team_members').select('id').eq('owner_id', ownerId).eq('member_id', userId).eq('status', 'active').maybeSingle()
  return !!data
}
