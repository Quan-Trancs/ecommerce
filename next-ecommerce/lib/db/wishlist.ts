import { query } from '@/lib/db/postgres'

export type WishlistItemRow = {
  productId: string
  createdAt: string
  name: string | null
  slug: string | null
  price: number | null
  watchedPrice: number | null
  imageUrl: string | null
  isPublished: boolean
  priceDropped: boolean
  sellerAccountId: string | null
}

type Row = {
  product_id: string
  created_at: Date | string
  name: string | null
  slug: string | null
  price: number | string | null
  watched_price: number | string | null
  image_url: string | null
  is_published: boolean | null
  seller_account_id: string | null
}

export async function listWishlistItems(
  accountId: string
): Promise<WishlistItemRow[]> {
  const result = await query<Row>(
    `SELECT w.product_id,
            w.created_at,
            w.watched_price,
            p.name,
            p.slug,
            p.price,
            p.seller_account_id,
            (
              SELECT pi.image_url
              FROM product_images pi
              WHERE pi.product_id = w.product_id
              ORDER BY pi.sort_order NULLS LAST, pi.image_url
              LIMIT 1
            ) AS image_url,
            COALESCE(p.is_published, TRUE) AS is_published
     FROM wishlist_items w
     LEFT JOIN products p ON p.id = w.product_id
     WHERE w.account_id = $1
     ORDER BY w.created_at DESC`,
    [accountId]
  )
  return result.rows.map((row) => {
    const price = row.price == null ? null : Number(row.price)
    const watchedPrice =
      row.watched_price == null ? null : Number(row.watched_price)
    return {
      productId: row.product_id,
      createdAt: new Date(row.created_at).toISOString(),
      name: row.name,
      slug: row.slug,
      price,
      watchedPrice,
      imageUrl: row.image_url,
      isPublished: row.is_published !== false,
      priceDropped:
        price != null &&
        watchedPrice != null &&
        price < watchedPrice - 0.009,
      sellerAccountId: row.seller_account_id?.trim() || null,
    }
  })
}

export async function isProductWishlisted(
  accountId: string,
  productId: string
): Promise<boolean> {
  const result = await query<{ ok: number }>(
    `SELECT 1 AS ok
     FROM wishlist_items
     WHERE account_id = $1 AND product_id = $2
     LIMIT 1`,
    [accountId, productId]
  )
  return result.rows.length > 0
}

export async function listWishlistedProductIds(
  accountId: string,
  productIds: string[]
): Promise<string[]> {
  const unique = [
    ...new Set(productIds.map((id) => id.trim()).filter(Boolean)),
  ].slice(0, 100)
  if (!unique.length) return []
  const result = await query<{ product_id: string }>(
    `SELECT product_id
     FROM wishlist_items
     WHERE account_id = $1
       AND product_id = ANY($2::varchar[])`,
    [accountId, unique]
  )
  return result.rows.map((row) => row.product_id)
}

export async function addWishlistItem(
  accountId: string,
  productId: string
): Promise<void> {
  await query(
    `INSERT INTO wishlist_items (account_id, product_id, created_at, watched_price)
     SELECT $1, $2, NOW(), p.price
     FROM products p
     WHERE p.id = $2
     ON CONFLICT (account_id, product_id) DO NOTHING`,
    [accountId, productId]
  )
}

export async function removeWishlistItem(
  accountId: string,
  productId: string
): Promise<void> {
  await query(
    `DELETE FROM wishlist_items
     WHERE account_id = $1 AND product_id = $2`,
    [accountId, productId]
  )
}

export async function productExists(productId: string): Promise<boolean> {
  const result = await query<{ ok: number }>(
    `SELECT 1 AS ok FROM products WHERE id = $1 LIMIT 1`,
    [productId]
  )
  return result.rows.length > 0
}
