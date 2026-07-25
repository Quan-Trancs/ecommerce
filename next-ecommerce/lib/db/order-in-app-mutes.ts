import { query } from '@/lib/db/postgres'

export async function isOrderInAppMuted(
  accountId: string,
  orderId: string
): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM order_in_app_mutes
       WHERE account_id = $1 AND order_id = $2
     ) AS exists`,
    [accountId, orderId]
  )
  return Boolean(result.rows[0]?.exists)
}

export async function listMutedOrderIdsForAccounts(
  accountIds: string[],
  orderId: string
): Promise<Set<string>> {
  if (accountIds.length === 0) return new Set()
  const result = await query<{ account_id: string }>(
    `SELECT account_id
     FROM order_in_app_mutes
     WHERE order_id = $1 AND account_id = ANY($2::varchar[])`,
    [orderId, accountIds]
  )
  return new Set(result.rows.map((row) => row.account_id))
}

export async function setOrderInAppMuted(
  accountId: string,
  orderId: string,
  muted: boolean
): Promise<void> {
  if (muted) {
    await query(
      `INSERT INTO order_in_app_mutes (account_id, order_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (account_id, order_id) DO NOTHING`,
      [accountId, orderId]
    )
    return
  }
  await query(
    `DELETE FROM order_in_app_mutes
     WHERE account_id = $1 AND order_id = $2`,
    [accountId, orderId]
  )
}
