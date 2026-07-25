import { query } from '@/lib/db/postgres'
import { publishInAppNotification } from '@/lib/notify/notification-bus'

export type InAppNotification = {
  id: number
  accountId: string
  type: string
  title: string
  body: string
  href: string
  orderId: string | null
  noteId: number | null
  urgent: boolean
  readAt: string | null
  createdAt: string
}

type Row = {
  id: number | string
  account_id: string
  type: string
  title: string
  body: string
  href: string
  order_id: string | null
  note_id: number | string | null
  urgent: boolean
  read_at: Date | string | null
  created_at: Date | string
}

function mapRow(row: Row): InAppNotification {
  return {
    id: Number(row.id),
    accountId: row.account_id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    orderId: row.order_id,
    noteId: row.note_id == null ? null : Number(row.note_id),
    urgent: Boolean(row.urgent),
    readAt: row.read_at ? new Date(row.read_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export async function createInAppNotification(input: {
  accountId: string
  type?: string
  title: string
  body: string
  href: string
  orderId?: string | null
  noteId?: number | null
  urgent?: boolean
}): Promise<void> {
  await query(
    `INSERT INTO in_app_notifications
       (account_id, type, title, body, href, order_id, note_id, urgent, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [
      input.accountId,
      input.type || 'ORDER_NOTE',
      input.title.slice(0, 200),
      input.body,
      input.href.slice(0, 500),
      input.orderId || null,
      input.noteId ?? null,
      Boolean(input.urgent),
    ]
  )
  publishInAppNotification(input.accountId)
}

export async function listInAppNotifications(
  accountId: string,
  options?: { limit?: number; unreadOnly?: boolean }
): Promise<InAppNotification[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 40, 100))
  const unreadOnly = Boolean(options?.unreadOnly)
  const result = await query<Row>(
    `SELECT id, account_id, type, title, body, href, order_id, note_id, urgent, read_at, created_at
     FROM in_app_notifications
     WHERE account_id = $1
       ${unreadOnly ? 'AND read_at IS NULL' : ''}
     ORDER BY created_at DESC
     LIMIT $2`,
    [accountId, limit]
  )
  return result.rows.map(mapRow)
}

export async function countUnreadInAppNotifications(
  accountId: string
): Promise<number> {
  const result = await query<{ count: string | number }>(
    `SELECT COUNT(*)::int AS count
     FROM in_app_notifications
     WHERE account_id = $1 AND read_at IS NULL`,
    [accountId]
  )
  return Number(result.rows[0]?.count || 0)
}

export async function markInAppNotificationRead(
  accountId: string,
  notificationId: number
): Promise<boolean> {
  const result = await query(
    `UPDATE in_app_notifications
     SET read_at = NOW()
     WHERE id = $1 AND account_id = $2 AND read_at IS NULL`,
    [notificationId, accountId]
  )
  const updated = (result.rowCount || 0) > 0
  if (updated) publishInAppNotification(accountId)
  return updated
}

export async function markAllInAppNotificationsRead(
  accountId: string
): Promise<number> {
  const result = await query(
    `UPDATE in_app_notifications
     SET read_at = NOW()
     WHERE account_id = $1 AND read_at IS NULL`,
    [accountId]
  )
  const count = result.rowCount || 0
  if (count > 0) publishInAppNotification(accountId)
  return count
}
