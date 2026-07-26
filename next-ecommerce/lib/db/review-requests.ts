import { query } from '@/lib/db/postgres'

export type ReviewRequestProduct = {
  productId: string
  name: string
  slug: string
  image: string
  price: number
}

export type ReviewRequestCandidate = {
  orderId: string
  userId: string
  email: string
  displayName: string | null
  fullyShippedAt: string
  products: ReviewRequestProduct[]
}

type HeadRow = {
  order_id: string
  user_id: string
  email: string
  display_name: string | null
  fully_shipped_at: Date | string
}

type ProductRow = {
  order_id: string
  product_id: string
  name: string
  slug: string | null
  image: string | null
  price: number | string
}

/**
 * Fully shipped paid orders old enough to ask for reviews, with at least one
 * line product the buyer has not reviewed yet.
 */
export async function findReviewRequestCandidates(options?: {
  delayDays?: number
  limit?: number
}): Promise<ReviewRequestCandidate[]> {
  const delayDays = Math.max(1, options?.delayDays ?? 7)
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 200))

  const heads = await query<HeadRow>(
    `SELECT o.id AS order_id,
            o.user_id,
            a.email,
            a.display_name,
            MAX(i.shipped_at) AS fully_shipped_at
     FROM store_orders o
     JOIN accounts a ON a.id = o.user_id
     JOIN store_order_items i ON i.order_id = o.id
     WHERE UPPER(COALESCE(o.status, '')) = 'SHIPPED'
       AND o.is_paid = TRUE
       AND COALESCE(a.active, TRUE) = TRUE
       AND COALESCE(a.notify_review_requests, TRUE) = TRUE
       AND a.email IS NOT NULL
       AND TRIM(a.email) <> ''
       AND NOT EXISTS (
         SELECT 1 FROM order_review_request_emails e
         WHERE e.order_id = o.id
       )
       AND EXISTS (
         SELECT 1
         FROM store_order_items oi
         WHERE oi.order_id = o.id
           AND NOT EXISTS (
             SELECT 1 FROM product_reviews r
             WHERE r.account_id = o.user_id
               AND r.product_id = oi.product_id
           )
       )
     GROUP BY o.id, o.user_id, a.email, a.display_name
     HAVING MAX(i.shipped_at) IS NOT NULL
        AND MAX(i.shipped_at) < NOW() - ($1::text || ' days')::interval
     ORDER BY MAX(i.shipped_at) ASC
     LIMIT $2`,
    [String(delayDays), limit]
  )

  if (heads.rows.length === 0) return []

  const orderIds = heads.rows.map((row) => row.order_id)
  const products = await query<ProductRow>(
    `SELECT DISTINCT ON (i.order_id, i.product_id)
            i.order_id,
            i.product_id,
            i.name,
            i.slug,
            i.image,
            i.price
     FROM store_order_items i
     JOIN store_orders o ON o.id = i.order_id
     WHERE i.order_id = ANY($1::varchar[])
       AND NOT EXISTS (
         SELECT 1 FROM product_reviews r
         WHERE r.account_id = o.user_id
           AND r.product_id = i.product_id
       )
     ORDER BY i.order_id, i.product_id, i.id`,
    [orderIds]
  )

  const byOrder = new Map<string, ReviewRequestProduct[]>()
  for (const row of products.rows) {
    const list = byOrder.get(row.order_id) || []
    list.push({
      productId: row.product_id,
      name: row.name,
      slug: row.slug?.trim() || row.product_id,
      image: row.image?.trim() || '/images/placeholder.svg',
      price: Number(row.price) || 0,
    })
    byOrder.set(row.order_id, list)
  }

  return heads.rows
    .map((row) => ({
      orderId: row.order_id,
      userId: row.user_id,
      email: row.email,
      displayName: row.display_name,
      fullyShippedAt: new Date(row.fully_shipped_at).toISOString(),
      products: byOrder.get(row.order_id) || [],
    }))
    .filter((c) => c.products.length > 0)
}

export async function markReviewRequestSent(orderId: string): Promise<void> {
  await query(
    `INSERT INTO order_review_request_emails (order_id, sent_at)
     VALUES ($1, NOW())
     ON CONFLICT (order_id) DO NOTHING`,
    [orderId]
  )
}
