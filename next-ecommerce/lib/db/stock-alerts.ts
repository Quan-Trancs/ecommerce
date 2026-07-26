import { query } from '@/lib/db/postgres'

export type StockAlertProduct = {
  productId: string
  name: string
  slug: string
  stockQuantity: number
  imageUrl: string | null
  price: number | null
}

export async function isStockAlertSubscribed(
  accountId: string,
  productId: string
): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM stock_alert_subscriptions
     WHERE account_id = $1 AND product_id = $2
     LIMIT 1`,
    [accountId, productId]
  )
  return (result.rowCount || 0) > 0
}

export async function subscribeStockAlert(input: {
  accountId: string
  productId: string
}): Promise<boolean> {
  const result = await query(
    `INSERT INTO stock_alert_subscriptions (account_id, product_id, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT DO NOTHING`,
    [input.accountId, input.productId]
  )
  return (result.rowCount || 0) > 0
}

export async function unsubscribeStockAlert(input: {
  accountId: string
  productId: string
}): Promise<boolean> {
  const result = await query(
    `DELETE FROM stock_alert_subscriptions
     WHERE account_id = $1 AND product_id = $2`,
    [input.accountId, input.productId]
  )
  return (result.rowCount || 0) > 0
}

export async function getProductStockForAlert(
  productId: string
): Promise<{
  productId: string
  name: string
  slug: string
  stockQuantity: number
} | null> {
  const result = await query<{
    id: string
    name: string
    slug: string
    stock_quantity: number
  }>(
    `SELECT id, name, slug, COALESCE(stock_quantity, 0) AS stock_quantity
     FROM products
     WHERE id = $1
     LIMIT 1`,
    [productId]
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    productId: row.id,
    name: row.name,
    slug: row.slug,
    stockQuantity: Number(row.stock_quantity) || 0,
  }
}

/** Products that are back in stock and have pending notify subscriptions. */
export async function listRestockedProductsWithSubscribers(
  productIds: string[]
): Promise<StockAlertProduct[]> {
  if (!productIds.length) return []
  const unique = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))]
  if (!unique.length) return []

  const result = await query<{
    id: string
    name: string
    slug: string
    stock_quantity: number
    image_url: string | null
    price: number | string | null
  }>(
    `SELECT p.id, p.name, p.slug,
            COALESCE(p.stock_quantity, 0) AS stock_quantity,
            p.price,
            (
              SELECT pi.image_url
              FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.sort_order NULLS LAST, pi.image_url
              LIMIT 1
            ) AS image_url
     FROM products p
     WHERE p.id = ANY($1::varchar[])
       AND COALESCE(p.stock_quantity, 0) > 0
       AND EXISTS (
         SELECT 1 FROM stock_alert_subscriptions s
         WHERE s.product_id = p.id
       )`,
    [unique]
  )
  return result.rows.map((row) => ({
    productId: row.id,
    name: row.name,
    slug: row.slug,
    stockQuantity: Number(row.stock_quantity) || 0,
    imageUrl: row.image_url,
    price: row.price == null ? null : Number(row.price),
  }))
}

export async function listStockAlertSubscribers(
  productId: string
): Promise<Array<{ accountId: string }>> {
  const result = await query<{ account_id: string }>(
    `SELECT account_id
     FROM stock_alert_subscriptions
     WHERE product_id = $1`,
    [productId]
  )
  return result.rows.map((row) => ({ accountId: row.account_id }))
}

/** One-shot: remove all subscriptions for a product after notifying. */
export async function clearStockAlertSubscriptions(
  productId: string
): Promise<number> {
  const result = await query(
    `DELETE FROM stock_alert_subscriptions WHERE product_id = $1`,
    [productId]
  )
  return result.rowCount || 0
}
