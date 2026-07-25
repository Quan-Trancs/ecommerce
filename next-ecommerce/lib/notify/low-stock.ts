import { query } from '@/lib/db/postgres'
import { findUserById } from '@/lib/db/users'
import { createInAppNotification } from '@/lib/db/in-app-notifications'

export type LowStockProduct = {
  productId: string
  name: string
  slug: string
  stockQuantity: number
  sellerAccountId: string
}

const DEFAULT_THRESHOLD = 5

export async function listLowStockProductsForSeller(
  sellerAccountId: string,
  threshold?: number
): Promise<LowStockProduct[]> {
  const limit = Math.max(0, threshold ?? DEFAULT_THRESHOLD)
  const result = await query<{
    id: string
    name: string
    slug: string
    stock_quantity: number
    seller_account_id: string
  }>(
    `SELECT id, name, slug, COALESCE(stock_quantity, 0) AS stock_quantity, seller_account_id
     FROM products
     WHERE seller_account_id = $1
       AND COALESCE(stock_quantity, 0) <= $2
     ORDER BY stock_quantity ASC, name ASC`,
    [sellerAccountId, limit]
  )
  return result.rows.map((row) => ({
    productId: row.id,
    name: row.name,
    slug: row.slug,
    stockQuantity: Number(row.stock_quantity) || 0,
    sellerAccountId: row.seller_account_id,
  }))
}

export async function loadProductsStockSnapshot(
  productIds: string[]
): Promise<LowStockProduct[]> {
  if (productIds.length === 0) return []
  const unique = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))]
  if (!unique.length) return []
  const result = await query<{
    id: string
    name: string
    slug: string
    stock_quantity: number
    seller_account_id: string | null
  }>(
    `SELECT id, name, slug, COALESCE(stock_quantity, 0) AS stock_quantity, seller_account_id
     FROM products
     WHERE id = ANY($1::varchar[])`,
    [unique]
  )
  return result.rows
    .filter((row) => row.seller_account_id)
    .map((row) => ({
      productId: row.id,
      name: row.name,
      slug: row.slug,
      stockQuantity: Number(row.stock_quantity) || 0,
      sellerAccountId: row.seller_account_id!,
    }))
}

async function clearAlertState(productId: string) {
  await query(`DELETE FROM low_stock_alert_state WHERE product_id = $1`, [
    productId,
  ])
}

async function getAlertState(productId: string) {
  const result = await query<{ last_alerted_stock: number }>(
    `SELECT last_alerted_stock FROM low_stock_alert_state WHERE product_id = $1`,
    [productId]
  )
  const row = result.rows[0]
  return row ? { lastAlertedStock: Number(row.last_alerted_stock) } : null
}

async function upsertAlertState(
  productId: string,
  sellerAccountId: string,
  stock: number
) {
  await query(
    `INSERT INTO low_stock_alert_state
       (product_id, seller_account_id, last_alerted_stock, last_alerted_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (product_id) DO UPDATE
       SET last_alerted_stock = EXCLUDED.last_alerted_stock,
           last_alerted_at = NOW(),
           seller_account_id = EXCLUDED.seller_account_id`,
    [productId, sellerAccountId, stock]
  )
}

/**
 * Notify sellers when owned products are at/below their threshold.
 * Dedupes until stock drops further or recovers above threshold.
 */
export async function checkAndNotifyLowStock(
  productIds: string[]
): Promise<void> {
  try {
    const products = await loadProductsStockSnapshot(productIds)
    for (const product of products) {
      const seller = await findUserById(product.sellerAccountId)
      if (!seller) continue
      if (seller.notifyLowStock === false) {
        await clearAlertState(product.productId)
        continue
      }
      const threshold = Math.max(
        0,
        Number(seller.lowStockThreshold ?? DEFAULT_THRESHOLD)
      )

      if (product.stockQuantity > threshold) {
        await clearAlertState(product.productId)
        continue
      }

      const prior = await getAlertState(product.productId)
      if (
        prior &&
        prior.lastAlertedStock <= product.stockQuantity &&
        prior.lastAlertedStock <= threshold
      ) {
        // Already alerted at this stock level (or lower stock was alerted before restock-partial)
        // Re-alert only if stock dropped further than last alert.
        if (product.stockQuantity >= prior.lastAlertedStock) continue
      }

      const title =
        product.stockQuantity <= 0 ? 'Out of stock' : 'Low stock alert'
      const body =
        product.stockQuantity <= 0
          ? `${product.name} is out of stock.`
          : `${product.name} has ${product.stockQuantity} left (threshold ${threshold}).`

      await createInAppNotification({
        accountId: product.sellerAccountId,
        type: 'LOW_STOCK',
        title,
        body,
        href: `/seller/products`,
        urgent: product.stockQuantity <= 0,
      })
      await upsertAlertState(
        product.productId,
        product.sellerAccountId,
        product.stockQuantity
      )
    }
  } catch (error) {
    console.error('checkAndNotifyLowStock failed:', error)
  }
}
