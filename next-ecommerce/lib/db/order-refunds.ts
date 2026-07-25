import { query } from '@/lib/db/postgres'

export async function recordOrderRefund(input: {
  orderId: string
  processor?: string | null
  refundId?: string | null
  refundStatus?: string | null
  amount: number
  recordedBy?: string | null
  note?: string | null
  lines: Array<{
    orderItemId: number
    quantity: number
    unitPrice: number
    lineAmount: number
  }>
}): Promise<number> {
  const insert = await query<{ id: number | string }>(
    `INSERT INTO order_refunds
       (order_id, processor, refund_id, refund_status, amount, recorded_by, note, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING id`,
    [
      input.orderId,
      input.processor || null,
      input.refundId || null,
      input.refundStatus || null,
      input.amount,
      input.recordedBy || null,
      input.note || null,
    ]
  )
  const refundRowId = Number(insert.rows[0]?.id)
  for (const line of input.lines) {
    await query(
      `INSERT INTO order_refund_items
         (refund_id, order_item_id, quantity, unit_price, line_amount)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        refundRowId,
        line.orderItemId,
        line.quantity,
        line.unitPrice,
        line.lineAmount,
      ]
    )
  }
  return refundRowId
}

export async function listOrderRefunds(orderId: string) {
  const result = await query<{
    id: number | string
    amount: number | string
    processor: string | null
    refund_id: string | null
    refund_status: string | null
    note: string | null
    created_at: Date | string
  }>(
    `SELECT id, amount, processor, refund_id, refund_status, note, created_at
     FROM order_refunds
     WHERE order_id = $1
     ORDER BY created_at DESC`,
    [orderId]
  )
  return result.rows.map((row) => ({
    id: Number(row.id),
    amount: Number(row.amount) || 0,
    processor: row.processor,
    refundId: row.refund_id,
    refundStatus: row.refund_status,
    note: row.note,
    createdAt: new Date(row.created_at).toISOString(),
  }))
}
