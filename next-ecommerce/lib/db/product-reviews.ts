import { query, withClient } from '@/lib/db/postgres'

export type ProductReview = {
  id: number
  productId: string
  accountId: string
  orderId: string | null
  rating: number
  title: string | null
  body: string
  authorName: string
  createdAt: string
  updatedAt: string
}

type ReviewRow = {
  id: number | string
  product_id: string
  account_id: string
  order_id: string | null
  rating: number
  title: string | null
  body: string
  author_name: string | null
  author_email: string | null
  created_at: Date | string
  updated_at: Date | string
}

function mapReview(row: ReviewRow): ProductReview {
  const email = row.author_email || ''
  const authorName =
    row.author_name?.trim() ||
    (email.includes('@') ? email.split('@')[0] : 'Customer')
  return {
    id: Number(row.id),
    productId: row.product_id,
    accountId: row.account_id,
    orderId: row.order_id,
    rating: Number(row.rating),
    title: row.title,
    body: row.body,
    authorName,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

/** Paid (non-cancelled) order containing the product for this buyer. */
export async function findPaidPurchaseForProduct(
  accountId: string,
  productId: string
): Promise<{ orderId: string } | null> {
  const result = await query<{ order_id: string }>(
    `SELECT o.id AS order_id
     FROM store_orders o
     JOIN store_order_items i ON i.order_id = o.id
     WHERE o.user_id = $1
       AND i.product_id = $2
       AND o.is_paid = TRUE
       AND UPPER(COALESCE(o.status, '')) <> 'CANCELLED'
     ORDER BY o.created_at DESC
     LIMIT 1`,
    [accountId, productId]
  )
  const orderId = result.rows[0]?.order_id
  return orderId ? { orderId } : null
}

export async function listProductReviews(
  productId: string,
  options?: { limit?: number }
): Promise<ProductReview[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 40, 100))
  const result = await query<ReviewRow>(
    `SELECT r.id, r.product_id, r.account_id, r.order_id, r.rating, r.title, r.body,
            r.created_at, r.updated_at,
            a.display_name AS author_name, a.email AS author_email
     FROM product_reviews r
     LEFT JOIN accounts a ON a.id = r.account_id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2`,
    [productId, limit]
  )
  return result.rows.map(mapReview)
}

export async function getProductReviewByAccount(
  productId: string,
  accountId: string
): Promise<ProductReview | null> {
  const result = await query<ReviewRow>(
    `SELECT r.id, r.product_id, r.account_id, r.order_id, r.rating, r.title, r.body,
            r.created_at, r.updated_at,
            a.display_name AS author_name, a.email AS author_email
     FROM product_reviews r
     LEFT JOIN accounts a ON a.id = r.account_id
     WHERE r.product_id = $1 AND r.account_id = $2
     LIMIT 1`,
    [productId, accountId]
  )
  return result.rows[0] ? mapReview(result.rows[0]) : null
}

export async function getProductRatingStats(productId: string): Promise<{
  avgRating: number
  numReviews: number
  ratingDistribution: { rating: number; count: number }[]
}> {
  const result = await query<{ rating: number; count: string | number }>(
    `SELECT rating, COUNT(*)::int AS count
     FROM product_reviews
     WHERE product_id = $1
     GROUP BY rating`,
    [productId]
  )
  const distribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: 0,
  }))
  let total = 0
  let sum = 0
  for (const row of result.rows) {
    const rating = Number(row.rating)
    const count = Number(row.count) || 0
    const bucket = distribution.find((d) => d.rating === rating)
    if (bucket) bucket.count = count
    total += count
    sum += rating * count
  }
  return {
    avgRating: total ? Math.round((sum / total) * 10) / 10 : 0,
    numReviews: total,
    ratingDistribution: distribution,
  }
}

async function refreshProductAggregates(productId: string) {
  const stats = await getProductRatingStats(productId)
  await query(
    `UPDATE products
     SET avg_rating = $2, num_reviews = $3, updated_at = NOW()
     WHERE id = $1`,
    [productId, stats.avgRating, stats.numReviews]
  )
  return stats
}

export async function upsertProductReview(input: {
  productId: string
  accountId: string
  orderId: string
  rating: number
  title?: string | null
  body: string
}): Promise<ProductReview> {
  const rating = Math.max(1, Math.min(5, Math.round(input.rating)))
  const title = input.title?.trim().slice(0, 200) || null
  const body = input.body.trim()
  if (!body) throw new Error('Review text is required')

  await withClient(async (client) => {
    await client.query('BEGIN')
    try {
      await client.query(
        `INSERT INTO product_reviews
           (product_id, account_id, order_id, rating, title, body, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (account_id, product_id) DO UPDATE
           SET rating = EXCLUDED.rating,
               title = EXCLUDED.title,
               body = EXCLUDED.body,
               order_id = EXCLUDED.order_id,
               updated_at = NOW()`,
        [
          input.productId,
          input.accountId,
          input.orderId,
          rating,
          title,
          body,
        ]
      )
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })

  await refreshProductAggregates(input.productId)
  const saved = await getProductReviewByAccount(input.productId, input.accountId)
  if (!saved) throw new Error('Failed to save review')
  return saved
}

export async function deleteProductReview(
  productId: string,
  accountId: string
): Promise<boolean> {
  const result = await query(
    `DELETE FROM product_reviews
     WHERE product_id = $1 AND account_id = $2`,
    [productId, accountId]
  )
  const deleted = (result.rowCount || 0) > 0
  if (deleted) await refreshProductAggregates(productId)
  return deleted
}
