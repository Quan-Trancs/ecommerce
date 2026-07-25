import { query } from '@/lib/db/postgres'

export type QueuedOrderNoteEmail = {
  id: number
  recipientEmail: string
  orderId: string
  authorLabel: string
  authorRoleLabel: string
  body: string
  createdAt: Date
}

type QueueRow = {
  id: number | string
  recipient_email: string
  order_id: string
  author_label: string
  author_role_label: string
  body: string
  created_at: Date
}

function mapRow(row: QueueRow): QueuedOrderNoteEmail {
  return {
    id: Number(row.id),
    recipientEmail: row.recipient_email,
    orderId: row.order_id,
    authorLabel: row.author_label,
    authorRoleLabel: row.author_role_label,
    body: row.body,
    createdAt: row.created_at,
  }
}

export async function enqueueOrderNoteEmail(input: {
  recipientEmail: string
  orderId: string
  authorLabel: string
  authorRoleLabel: string
  body: string
}): Promise<void> {
  await query(
    `INSERT INTO order_note_email_queue
       (recipient_email, order_id, author_label, author_role_label, body, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [
      input.recipientEmail.trim().toLowerCase(),
      input.orderId,
      input.authorLabel.slice(0, 200),
      input.authorRoleLabel.slice(0, 50),
      input.body,
    ]
  )
}

export async function listPendingOrderNoteEmails(): Promise<
  QueuedOrderNoteEmail[]
> {
  const result = await query<QueueRow>(
    `SELECT id, recipient_email, order_id, author_label, author_role_label, body, created_at
     FROM order_note_email_queue
     WHERE sent_at IS NULL
     ORDER BY recipient_email ASC, created_at ASC
     LIMIT 500`
  )
  return result.rows.map(mapRow)
}

export async function markOrderNoteEmailsSent(ids: number[]): Promise<void> {
  if (!ids.length) return
  await query(
    `UPDATE order_note_email_queue
     SET sent_at = NOW()
     WHERE id = ANY($1::bigint[]) AND sent_at IS NULL`,
    [ids]
  )
}

export function getDigestWindowMinutes(): number {
  const raw = Number(process.env.ORDER_NOTE_DIGEST_MINUTES)
  if (Number.isFinite(raw) && raw >= 0) return raw
  return 15
}

export function getDigestMaxBatch(): number {
  const raw = Number(process.env.ORDER_NOTE_DIGEST_MAX_BATCH)
  if (Number.isFinite(raw) && raw >= 1) return Math.min(raw, 50)
  return 10
}

/** True when digests are disabled and notes should email immediately. */
export function isImmediateOrderNoteEmail(): boolean {
  return getDigestWindowMinutes() === 0
}
