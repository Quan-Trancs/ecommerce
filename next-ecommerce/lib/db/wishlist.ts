import { query } from '@/lib/db/postgres'

export type WishlistItemRow = {
  productId: string
  createdAt: string
  name: string | null
  slug: string | null
  price: number | null
  imageUrl: string | null
  isPublished: boolean
}

type Row = {
  product_id: string
  created_at: Date | string
  name: string | null
  slug: string | null
  price: number | string | null
  image_url: string | null
  is_published: boolean | null
}

export async function listWishlistItems(
  accountId: string
): Promise<WishlistItemRow[]> {
  const result = await query<Row>(
    `SELECT w.product_id,
            w.created_at,
            p.name,
            p.slug,
            p.price,
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
  return result.rows.map((row) => ({
    productId: row.product_id,
    createdAt: new Date(row.created_at).toISOString(),
    name: row.name,
    slug: row.slug,
    price: row.price == null ? null : Number(row.price),
    imageUrl: row.image_url,
    isPublished: row.is_published !== false,
  }))
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
    `INSERT INTO wishlist_items (account_id, product_id, created_at)
     VALUES ($1, $2, NOW())
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
