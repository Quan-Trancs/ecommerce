import { query } from '@/lib/db/postgres'

export type WishlistPriceDropWatch = {
  accountId: string
  productId: string
  watchedPrice: number
  lastAlertedPrice: number | null
  productName: string
  productSlug: string
  currentPrice: number
  imageUrl: string | null
}

/** Wishlists watching products whose price dropped below the saved baseline. */
export async function listWishlistPriceDropCandidates(
  productIds: string[]
): Promise<WishlistPriceDropWatch[]> {
  const unique = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))]
  if (!unique.length) return []

  const result = await query<{
    account_id: string
    product_id: string
    watched_price: number | string
    last_alerted_price: number | string | null
    name: string
    slug: string
    current_price: number | string
    image_url: string | null
  }>(
    `SELECT w.account_id,
            w.product_id,
            w.watched_price,
            w.last_alerted_price,
            p.name,
            p.slug,
            p.price AS current_price,
            (
              SELECT pi.image_url
              FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.sort_order NULLS LAST, pi.image_url
              LIMIT 1
            ) AS image_url
     FROM wishlist_items w
     JOIN products p ON p.id = w.product_id
     JOIN accounts a ON a.id = w.account_id
     WHERE w.product_id = ANY($1::varchar[])
       AND w.watched_price IS NOT NULL
       AND p.price IS NOT NULL
       AND COALESCE(p.is_published, TRUE) = TRUE
       AND COALESCE(a.active, TRUE) = TRUE
       AND COALESCE(a.notify_price_drops, TRUE) = TRUE
       AND a.email IS NOT NULL
       AND TRIM(a.email) <> ''
       AND p.price < w.watched_price - 0.009
       AND (
         w.last_alerted_price IS NULL
         OR p.price < w.last_alerted_price - 0.009
       )`,
    [unique]
  )

  return result.rows.map((row) => ({
    accountId: row.account_id,
    productId: row.product_id,
    watchedPrice: Number(row.watched_price),
    lastAlertedPrice:
      row.last_alerted_price == null ? null : Number(row.last_alerted_price),
    productName: row.name,
    productSlug: row.slug,
    currentPrice: Number(row.current_price),
    imageUrl: row.image_url,
  }))
}

export async function markWishlistPriceAlerted(input: {
  accountId: string
  productId: string
  alertedPrice: number
}): Promise<void> {
  await query(
    `UPDATE wishlist_items
     SET last_alerted_price = $3,
         last_price_alert_at = NOW()
     WHERE account_id = $1
       AND product_id = $2`,
    [input.accountId, input.productId, input.alertedPrice]
  )
}

/** When price recovers to/above baseline, allow a future drop to alert again. */
export async function clearWishlistPriceAlertsIfRecovered(
  productIds: string[]
): Promise<void> {
  const unique = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))]
  if (!unique.length) return
  await query(
    `UPDATE wishlist_items w
     SET last_alerted_price = NULL,
         last_price_alert_at = NULL
     FROM products p
     WHERE w.product_id = p.id
       AND w.product_id = ANY($1::varchar[])
       AND w.watched_price IS NOT NULL
       AND p.price IS NOT NULL
       AND p.price >= w.watched_price - 0.009
       AND w.last_alerted_price IS NOT NULL`,
    [unique]
  )
}
