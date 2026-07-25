import { query } from '@/lib/db/postgres'
import { roundToTwoDecimals } from '@/lib/utils'

export type SellerPayout = {
  id: number
  sellerAccountId: string
  sellerEmail?: string
  sellerName?: string
  amount: number
  currency: string
  note: string | null
  recordedBy: string | null
  paidAt: string
  createdAt: string
}

type PayoutRow = {
  id: number | string
  seller_account_id: string
  amount: number | string
  currency: string
  note: string | null
  recorded_by: string | null
  paid_at: Date | string
  created_at: Date | string
  seller_email?: string | null
  seller_name?: string | null
}

function mapPayout(row: PayoutRow): SellerPayout {
  return {
    id: Number(row.id),
    sellerAccountId: row.seller_account_id,
    sellerEmail: row.seller_email || undefined,
    sellerName: row.seller_name || undefined,
    amount: Number(row.amount),
    currency: row.currency || 'USD',
    note: row.note,
    recordedBy: row.recorded_by,
    paidAt: new Date(row.paid_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
  }
}

/**
 * Gross revenue for a seller from paid, non-cancelled order lines.
 * Matches seller analytics paid filter: is_paid OR status PAID/SHIPPED.
 */
export async function getSellerGrossRevenue(
  sellerAccountId: string
): Promise<number> {
  const result = await query<{ gross: number | string | null }>(
    `SELECT COALESCE(SUM(i.price * (i.quantity - COALESCE(i.refunded_quantity, 0))), 0) AS gross
     FROM store_order_items i
     JOIN store_orders o ON o.id = i.order_id
     JOIN products p ON p.id = i.product_id
     WHERE p.seller_account_id = $1
       AND UPPER(COALESCE(o.status, '')) <> 'CANCELLED'
       AND (
         o.is_paid = TRUE
         OR UPPER(COALESCE(o.status, '')) IN ('PAID', 'SHIPPED')
       )
       AND (i.quantity - COALESCE(i.refunded_quantity, 0)) > 0`,
    [sellerAccountId]
  )
  return roundToTwoDecimals(Number(result.rows[0]?.gross) || 0)
}

export async function getSellerPaidOutTotal(
  sellerAccountId: string
): Promise<number> {
  const result = await query<{ paid: number | string | null }>(
    `SELECT COALESCE(SUM(amount), 0) AS paid
     FROM seller_payouts
     WHERE seller_account_id = $1`,
    [sellerAccountId]
  )
  return roundToTwoDecimals(Number(result.rows[0]?.paid) || 0)
}

export async function getSellerEarningsSummary(sellerAccountId: string) {
  const [grossRevenue, paidOut] = await Promise.all([
    getSellerGrossRevenue(sellerAccountId),
    getSellerPaidOutTotal(sellerAccountId),
  ])
  const available = roundToTwoDecimals(Math.max(0, grossRevenue - paidOut))
  return { grossRevenue, paidOut, available }
}

export async function listSellerPayouts(
  sellerAccountId: string,
  options?: { limit?: number }
): Promise<SellerPayout[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 5000))
  const result = await query<PayoutRow>(
    `SELECT id, seller_account_id, amount, currency, note, recorded_by, paid_at, created_at
     FROM seller_payouts
     WHERE seller_account_id = $1
     ORDER BY paid_at DESC
     LIMIT $2`,
    [sellerAccountId, limit]
  )
  return result.rows.map(mapPayout)
}

export async function listRecentPayouts(options?: {
  limit?: number
}): Promise<SellerPayout[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 40, 5000))
  const result = await query<PayoutRow>(
    `SELECT sp.id, sp.seller_account_id, sp.amount, sp.currency, sp.note,
            sp.recorded_by, sp.paid_at, sp.created_at,
            a.email AS seller_email, a.display_name AS seller_name
     FROM seller_payouts sp
     LEFT JOIN accounts a ON a.id = sp.seller_account_id
     ORDER BY sp.paid_at DESC
     LIMIT $1`,
    [limit]
  )
  return result.rows.map(mapPayout)
}

export async function listRecentSellerEarningLines(
  sellerAccountId: string,
  options?: { limit?: number }
): Promise<
  Array<{
    orderId: string
    productName: string
    quantity: number
    lineTotal: number
    paidAt: string | null
    createdAt: string
  }>
> {
  const limit = Math.max(1, Math.min(options?.limit ?? 20, 50))
  const result = await query<{
    order_id: string
    product_name: string
    quantity: number
    line_total: number | string
    paid_at: Date | string | null
    created_at: Date | string
  }>(
    `SELECT o.id AS order_id,
            i.name AS product_name,
            i.quantity,
            (i.price * (i.quantity - COALESCE(i.refunded_quantity, 0))) AS line_total,
            o.paid_at,
            o.created_at
     FROM store_order_items i
     JOIN store_orders o ON o.id = i.order_id
     JOIN products p ON p.id = i.product_id
     WHERE p.seller_account_id = $1
       AND UPPER(COALESCE(o.status, '')) <> 'CANCELLED'
       AND (
         o.is_paid = TRUE
         OR UPPER(COALESCE(o.status, '')) IN ('PAID', 'SHIPPED')
       )
       AND (i.quantity - COALESCE(i.refunded_quantity, 0)) > 0
     ORDER BY COALESCE(o.paid_at, o.created_at) DESC
     LIMIT $2`,
    [sellerAccountId, limit]
  )
  return result.rows.map((row) => ({
    orderId: row.order_id,
    productName: row.product_name,
    quantity: Number(row.quantity) || 0,
    lineTotal: roundToTwoDecimals(Number(row.line_total) || 0),
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
  }))
}

export async function recordSellerPayout(input: {
  sellerAccountId: string
  amount: number
  note?: string | null
  recordedBy?: string | null
}): Promise<SellerPayout> {
  const amount = roundToTwoDecimals(input.amount)
  if (!(amount > 0)) throw new Error('Payout amount must be positive')

  const summary = await getSellerEarningsSummary(input.sellerAccountId)
  if (amount > summary.available + 0.001) {
    throw new Error(
      `Amount exceeds available balance ($${summary.available.toFixed(2)})`
    )
  }

  const result = await query<PayoutRow>(
    `INSERT INTO seller_payouts
       (seller_account_id, amount, currency, note, recorded_by, paid_at, created_at)
     VALUES ($1, $2, 'USD', $3, $4, NOW(), NOW())
     RETURNING id, seller_account_id, amount, currency, note, recorded_by, paid_at, created_at`,
    [
      input.sellerAccountId,
      amount,
      input.note?.trim() || null,
      input.recordedBy || null,
    ]
  )
  return mapPayout(result.rows[0])
}
