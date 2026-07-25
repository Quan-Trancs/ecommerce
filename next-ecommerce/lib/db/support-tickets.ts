import { query } from '@/lib/db/postgres'

export type SupportTicketFilters = {
  urgentOnly?: boolean
  awaitingStaff?: boolean
  status?: string | null
  limit?: number
}

export type SupportTicketRow = {
  orderId: string
  orderStatus: string
  isPaid: boolean
  buyerEmail: string | null
  buyerName: string | null
  lastNoteAt: string
  lastNoteBody: string
  lastAuthorRole: string
  lastAuthorUserId: string
  urgent: boolean
  awaitingStaff: boolean
  publicNoteCount: number
}

type Row = {
  order_id: string
  order_status: string
  is_paid: boolean
  buyer_email: string | null
  buyer_name: string | null
  last_note_at: Date | string
  last_note_body: string
  last_author_role: string
  last_author_user_id: string
  has_urgent: boolean
  awaiting_staff: boolean
  public_note_count: number | string
}

/**
 * One row per order that has at least one PUBLIC note.
 * "Awaiting staff" = latest PUBLIC note author is not SUPPORT/ADMIN.
 */
export async function listSupportTickets(
  filters?: SupportTicketFilters
): Promise<SupportTicketRow[]> {
  const limit = Math.max(1, Math.min(filters?.limit ?? 50, 100))
  const status = filters?.status?.trim().toUpperCase() || null
  const urgentOnly = Boolean(filters?.urgentOnly)
  const awaitingStaff = Boolean(filters?.awaitingStaff)

  const result = await query<Row>(
    `WITH public_notes AS (
       SELECT n.*
       FROM store_order_notes n
       WHERE UPPER(COALESCE(n.visibility, 'PUBLIC')) = 'PUBLIC'
     ),
     latest AS (
       SELECT DISTINCT ON (order_id)
              order_id,
              created_at AS last_note_at,
              body AS last_note_body,
              author_role AS last_author_role,
              author_user_id AS last_author_user_id
       FROM public_notes
       ORDER BY order_id, created_at DESC
     ),
     agg AS (
       SELECT order_id,
              COUNT(*)::int AS public_note_count,
              BOOL_OR(COALESCE(urgent, FALSE)) AS has_urgent
       FROM public_notes
       GROUP BY order_id
     )
     SELECT o.id AS order_id,
            COALESCE(o.status, '') AS order_status,
            COALESCE(o.is_paid, FALSE) AS is_paid,
            a.email AS buyer_email,
            a.display_name AS buyer_name,
            l.last_note_at,
            l.last_note_body,
            l.last_author_role,
            l.last_author_user_id,
            agg.has_urgent,
            (
              UPPER(COALESCE(l.last_author_role, '')) NOT IN ('SUPPORT', 'ADMIN')
            ) AS awaiting_staff,
            agg.public_note_count
     FROM latest l
     JOIN agg ON agg.order_id = l.order_id
     JOIN store_orders o ON o.id = l.order_id
     LEFT JOIN accounts a ON a.id = o.user_id
     WHERE ($1::text IS NULL OR UPPER(COALESCE(o.status, '')) = $1)
       AND ($2::boolean = FALSE OR agg.has_urgent = TRUE)
       AND (
         $3::boolean = FALSE
         OR UPPER(COALESCE(l.last_author_role, '')) NOT IN ('SUPPORT', 'ADMIN')
       )
     ORDER BY
       CASE WHEN agg.has_urgent THEN 0 ELSE 1 END,
       CASE
         WHEN UPPER(COALESCE(l.last_author_role, '')) NOT IN ('SUPPORT', 'ADMIN')
         THEN 0 ELSE 1
       END,
       l.last_note_at DESC
     LIMIT $4`,
    [status, urgentOnly, awaitingStaff, limit]
  )

  return result.rows.map((row) => ({
    orderId: row.order_id,
    orderStatus: row.order_status,
    isPaid: Boolean(row.is_paid),
    buyerEmail: row.buyer_email,
    buyerName: row.buyer_name,
    lastNoteAt: new Date(row.last_note_at).toISOString(),
    lastNoteBody: row.last_note_body,
    lastAuthorRole: row.last_author_role,
    lastAuthorUserId: row.last_author_user_id,
    urgent: Boolean(row.has_urgent),
    awaitingStaff: Boolean(row.awaiting_staff),
    publicNoteCount: Number(row.public_note_count) || 0,
  }))
}
