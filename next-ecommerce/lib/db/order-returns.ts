import { query, withClient } from '@/lib/db/postgres'
import {
  RETURN_REASONS,
  type ReturnReason,
} from '@/lib/returns/constants'

export type ReturnStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export type { ReturnReason }
export { RETURN_REASONS }

export type OrderReturnItem = {
  orderItemId: number
  quantity: number
  name?: string | null
}

export type OrderReturnRequest = {
  id: number
  orderId: string
  accountId: string
  status: ReturnStatus
  reason: string
  note: string | null
  reviewNote: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  refundAmount: number | null
  refundId: string | null
  refundStatus: string | null
  refundSkipped: boolean
  createdAt: string
  updatedAt: string
  buyerEmail?: string | null
  buyerName?: string | null
  items: OrderReturnItem[]
}

type RequestRow = {
  id: number | string
  order_id: string
  account_id: string
  status: string
  reason: string
  note: string | null
  review_note: string | null
  reviewed_by: string | null
  reviewed_at: Date | string | null
  refund_amount?: number | string | null
  refund_id?: string | null
  refund_status?: string | null
  refund_skipped?: boolean | null
  created_at: Date | string
  updated_at: Date | string
  buyer_email?: string | null
  buyer_name?: string | null
}

function mapRequest(
  row: RequestRow,
  items: OrderReturnItem[] = []
): OrderReturnRequest {
  return {
    id: Number(row.id),
    orderId: row.order_id,
    accountId: row.account_id,
    status: String(row.status || 'REQUESTED').toUpperCase() as ReturnStatus,
    reason: row.reason,
    note: row.note,
    reviewNote: row.review_note,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at
      ? new Date(row.reviewed_at).toISOString()
      : null,
    refundAmount:
      row.refund_amount == null ? null : Number(row.refund_amount),
    refundId: row.refund_id || null,
    refundStatus: row.refund_status || null,
    refundSkipped: Boolean(row.refund_skipped),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    buyerEmail: row.buyer_email,
    buyerName: row.buyer_name,
    items,
  }
}

async function loadItemsForReturns(
  returnIds: number[]
): Promise<Map<number, OrderReturnItem[]>> {
  const map = new Map<number, OrderReturnItem[]>()
  if (!returnIds.length) return map
  const result = await query<{
    return_id: number | string
    order_item_id: number | string
    quantity: number | string
    name: string | null
  }>(
    `SELECT ri.return_id, ri.order_item_id, ri.quantity, oi.name
     FROM order_return_items ri
     LEFT JOIN store_order_items oi ON oi.id = ri.order_item_id
     WHERE ri.return_id = ANY($1::bigint[])
     ORDER BY ri.order_item_id`,
    [returnIds]
  )
  for (const row of result.rows) {
    const id = Number(row.return_id)
    const list = map.get(id) || []
    list.push({
      orderItemId: Number(row.order_item_id),
      quantity: Number(row.quantity) || 0,
      name: row.name,
    })
    map.set(id, list)
  }
  return map
}

export async function listReturnsForOrder(
  orderId: string
): Promise<OrderReturnRequest[]> {
  const result = await query<RequestRow>(
    `SELECT r.*
     FROM order_return_requests r
     WHERE r.order_id = $1
     ORDER BY r.created_at DESC`,
    [orderId]
  )
  const ids = result.rows.map((r) => Number(r.id))
  const itemsMap = await loadItemsForReturns(ids)
  return result.rows.map((row) =>
    mapRequest(row, itemsMap.get(Number(row.id)) || [])
  )
}

export async function listOpenReturnRequests(options?: {
  limit?: number
}): Promise<OrderReturnRequest[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 100))
  const result = await query<RequestRow>(
    `SELECT r.*, a.email AS buyer_email, a.display_name AS buyer_name
     FROM order_return_requests r
     LEFT JOIN accounts a ON a.id = r.account_id
     WHERE UPPER(r.status) = 'REQUESTED'
     ORDER BY r.created_at ASC
     LIMIT $1`,
    [limit]
  )
  const ids = result.rows.map((r) => Number(r.id))
  const itemsMap = await loadItemsForReturns(ids)
  return result.rows.map((row) =>
    mapRequest(row, itemsMap.get(Number(row.id)) || [])
  )
}

/** Quantities already reserved by REQUESTED or APPROVED returns for an order. */
export async function getReservedReturnQuantities(
  orderId: string
): Promise<Map<number, number>> {
  const result = await query<{
    order_item_id: number | string
    qty: number | string
  }>(
    `SELECT ri.order_item_id, COALESCE(SUM(ri.quantity), 0) AS qty
     FROM order_return_items ri
     JOIN order_return_requests r ON r.id = ri.return_id
     WHERE r.order_id = $1
       AND UPPER(r.status) IN ('REQUESTED', 'APPROVED')
     GROUP BY ri.order_item_id`,
    [orderId]
  )
  const map = new Map<number, number>()
  for (const row of result.rows) {
    map.set(Number(row.order_item_id), Number(row.qty) || 0)
  }
  return map
}

export async function createReturnRequest(input: {
  orderId: string
  accountId: string
  reason: string
  note?: string | null
  lines: Array<{ orderItemId: number; quantity: number }>
}): Promise<OrderReturnRequest> {
  return withClient(async (client) => {
    await client.query('BEGIN')
    try {
      const inserted = await client.query<RequestRow>(
        `INSERT INTO order_return_requests
           (order_id, account_id, status, reason, note, created_at, updated_at)
         VALUES ($1, $2, 'REQUESTED', $3, $4, NOW(), NOW())
         RETURNING *`,
        [
          input.orderId,
          input.accountId,
          input.reason.slice(0, 80),
          input.note?.trim()?.slice(0, 1000) || null,
        ]
      )
      const row = inserted.rows[0]
      if (!row) throw new Error('Failed to create return request')
      const returnId = Number(row.id)

      for (const line of input.lines) {
        await client.query(
          `INSERT INTO order_return_items (return_id, order_item_id, quantity)
           VALUES ($1, $2, $3)`,
          [returnId, line.orderItemId, line.quantity]
        )
      }

      await client.query('COMMIT')
      const itemsMap = await loadItemsForReturns([returnId])
      return mapRequest(row, itemsMap.get(returnId) || input.lines)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
}

export async function cancelReturnRequest(input: {
  returnId: number
  accountId: string
}): Promise<boolean> {
  const result = await query(
    `UPDATE order_return_requests
     SET status = 'CANCELLED', updated_at = NOW()
     WHERE id = $1
       AND account_id = $2
       AND UPPER(status) = 'REQUESTED'`,
    [input.returnId, input.accountId]
  )
  return (result.rowCount || 0) > 0
}

export async function reviewReturnRequest(input: {
  returnId: number
  reviewerId: string
  status: 'APPROVED' | 'REJECTED'
  reviewNote?: string | null
  refundAmount?: number | null
  refundId?: string | null
  refundStatus?: string | null
  refundSkipped?: boolean | null
}): Promise<OrderReturnRequest | null> {
  const result = await query<RequestRow>(
    `UPDATE order_return_requests
     SET status = $2,
         review_note = $3,
         reviewed_by = $4,
         reviewed_at = NOW(),
         updated_at = NOW(),
         refund_amount = COALESCE($5, refund_amount),
         refund_id = COALESCE($6, refund_id),
         refund_status = COALESCE($7, refund_status),
         refund_skipped = CASE
           WHEN $8::boolean IS NULL THEN refund_skipped
           ELSE $8
         END
     WHERE id = $1
       AND UPPER(status) = 'REQUESTED'
     RETURNING *`,
    [
      input.returnId,
      input.status,
      input.reviewNote?.trim()?.slice(0, 1000) || null,
      input.reviewerId,
      input.refundAmount ?? null,
      input.refundId ?? null,
      input.refundStatus ?? null,
      input.refundSkipped ?? null,
    ]
  )
  const row = result.rows[0]
  if (!row) return null
  const itemsMap = await loadItemsForReturns([Number(row.id)])
  return mapRequest(row, itemsMap.get(Number(row.id)) || [])
}

export async function getReturnById(
  returnId: number
): Promise<OrderReturnRequest | null> {
  const result = await query<RequestRow>(
    `SELECT r.*, a.email AS buyer_email, a.display_name AS buyer_name
     FROM order_return_requests r
     LEFT JOIN accounts a ON a.id = r.account_id
     WHERE r.id = $1`,
    [returnId]
  )
  const row = result.rows[0]
  if (!row) return null
  const itemsMap = await loadItemsForReturns([Number(row.id)])
  return mapRequest(row, itemsMap.get(Number(row.id)) || [])
}
