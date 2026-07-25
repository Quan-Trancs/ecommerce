import { query } from '@/lib/db/postgres'

export type PushSubscriptionRecord = {
  id: number
  accountId: string
  endpoint: string
  p256dh: string
  auth: string
}

type Row = {
  id: number | string
  account_id: string
  endpoint: string
  p256dh: string
  auth: string
}

function mapRow(row: Row): PushSubscriptionRecord {
  return {
    id: Number(row.id),
    accountId: row.account_id,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
  }
}

export async function upsertPushSubscription(input: {
  accountId: string
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string | null
}): Promise<void> {
  await query(
    `INSERT INTO push_subscriptions
       (account_id, endpoint, p256dh, auth, user_agent, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (endpoint) DO UPDATE SET
       account_id = EXCLUDED.account_id,
       p256dh = EXCLUDED.p256dh,
       auth = EXCLUDED.auth,
       user_agent = EXCLUDED.user_agent,
       updated_at = NOW()`,
    [
      input.accountId,
      input.endpoint,
      input.p256dh,
      input.auth,
      input.userAgent || null,
    ]
  )
}

export async function deletePushSubscription(
  accountId: string,
  endpoint: string
): Promise<void> {
  await query(
    `DELETE FROM push_subscriptions WHERE account_id = $1 AND endpoint = $2`,
    [accountId, endpoint]
  )
}

export async function listPushSubscriptionsForAccount(
  accountId: string
): Promise<PushSubscriptionRecord[]> {
  const result = await query<Row>(
    `SELECT id, account_id, endpoint, p256dh, auth
     FROM push_subscriptions WHERE account_id = $1`,
    [accountId]
  )
  return result.rows.map(mapRow)
}

export async function deletePushSubscriptionByEndpoint(
  endpoint: string
): Promise<void> {
  await query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint])
}
