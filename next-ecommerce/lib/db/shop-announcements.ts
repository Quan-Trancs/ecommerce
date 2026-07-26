import { query } from '@/lib/db/postgres'

export type ShopAnnouncement = {
  id: number
  sellerAccountId: string
  title: string
  body: string
  createdAt: string
}

type Row = {
  id: number | string
  seller_account_id: string
  title: string
  body: string
  created_at: Date | string
}

function mapRow(row: Row): ShopAnnouncement {
  return {
    id: Number(row.id),
    sellerAccountId: row.seller_account_id,
    title: row.title,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export async function createShopAnnouncement(input: {
  sellerAccountId: string
  title: string
  body: string
}): Promise<ShopAnnouncement> {
  const title = input.title.trim().slice(0, 120)
  const body = input.body.trim().slice(0, 500)
  const result = await query<Row>(
    `INSERT INTO shop_announcements (seller_account_id, title, body, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING id, seller_account_id, title, body, created_at`,
    [input.sellerAccountId, title, body]
  )
  return mapRow(result.rows[0])
}

export async function listShopAnnouncements(
  sellerAccountId: string,
  options?: { limit?: number }
): Promise<ShopAnnouncement[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 5, 20))
  const result = await query<Row>(
    `SELECT id, seller_account_id, title, body, created_at
     FROM shop_announcements
     WHERE seller_account_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [sellerAccountId, limit]
  )
  return result.rows.map(mapRow)
}

export async function countShopAnnouncementsToday(
  sellerAccountId: string
): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM shop_announcements
     WHERE seller_account_id = $1
       AND created_at >= date_trunc('day', NOW())`,
    [sellerAccountId]
  )
  return Number(result.rows[0]?.count || 0)
}

export async function deleteShopAnnouncement(input: {
  id: number
  sellerAccountId: string
}): Promise<boolean> {
  const result = await query(
    `DELETE FROM shop_announcements
     WHERE id = $1 AND seller_account_id = $2`,
    [input.id, input.sellerAccountId]
  )
  return (result.rowCount || 0) > 0
}
