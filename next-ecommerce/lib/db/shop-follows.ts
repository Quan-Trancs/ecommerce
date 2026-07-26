import { query } from '@/lib/db/postgres'

export type ShopFollowRow = {
  sellerAccountId: string
  shopSlug: string
  shopName: string
  bio: string | null
  verified: boolean
  productCount: number
  followedAt: string
}

export async function isFollowingShop(
  accountId: string,
  sellerAccountId: string
): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM shop_follows
     WHERE account_id = $1 AND seller_account_id = $2
     LIMIT 1`,
    [accountId, sellerAccountId]
  )
  return (result.rowCount || 0) > 0
}

export async function followShop(input: {
  accountId: string
  sellerAccountId: string
}): Promise<boolean> {
  if (input.accountId === input.sellerAccountId) return false
  const result = await query(
    `INSERT INTO shop_follows (account_id, seller_account_id, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT DO NOTHING`,
    [input.accountId, input.sellerAccountId]
  )
  return (result.rowCount || 0) > 0
}

export async function unfollowShop(input: {
  accountId: string
  sellerAccountId: string
}): Promise<boolean> {
  const result = await query(
    `DELETE FROM shop_follows
     WHERE account_id = $1 AND seller_account_id = $2`,
    [input.accountId, input.sellerAccountId]
  )
  return (result.rowCount || 0) > 0
}

export async function countShopFollowers(
  sellerAccountId: string
): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM shop_follows
     WHERE seller_account_id = $1`,
    [sellerAccountId]
  )
  return Number(result.rows[0]?.count || 0)
}

export async function listShopFollowerAccountIds(
  sellerAccountId: string
): Promise<string[]> {
  const result = await query<{ account_id: string }>(
    `SELECT f.account_id
     FROM shop_follows f
     JOIN accounts a ON a.id = f.account_id
     WHERE f.seller_account_id = $1
       AND COALESCE(a.active, TRUE) = TRUE
       AND COALESCE(a.notify_shop_follows, TRUE) = TRUE`,
    [sellerAccountId]
  )
  return result.rows.map((row) => row.account_id)
}

export async function listFollowedShops(
  accountId: string
): Promise<ShopFollowRow[]> {
  const result = await query<{
    seller_account_id: string
    shop_slug: string | null
    shop_name: string
    bio: string | null
    verified: boolean
    product_count: string
    created_at: Date | string
  }>(
    `SELECT f.seller_account_id,
            sp.shop_slug,
            sp.shop_name,
            sp.bio,
            COALESCE(sp.verified, FALSE) AS verified,
            (
              SELECT COUNT(*)::text
              FROM products p
              WHERE p.seller_account_id = f.seller_account_id
                AND COALESCE(p.is_published, TRUE) = TRUE
            ) AS product_count,
            f.created_at
     FROM shop_follows f
     JOIN seller_profiles sp ON sp.account_id = f.seller_account_id
     JOIN accounts a ON a.id = f.seller_account_id
     WHERE f.account_id = $1
       AND COALESCE(a.active, TRUE) = TRUE
     ORDER BY f.created_at DESC`,
    [accountId]
  )
  return result.rows.map((row) => ({
    sellerAccountId: row.seller_account_id,
    shopSlug: row.shop_slug?.trim() || row.seller_account_id,
    shopName: row.shop_name?.trim() || 'Shop',
    bio: row.bio?.trim() || null,
    verified: Boolean(row.verified),
    productCount: Number(row.product_count) || 0,
    followedAt: new Date(row.created_at).toISOString(),
  }))
}

export async function sellerProfileExists(
  sellerAccountId: string
): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM seller_profiles sp
     JOIN accounts a ON a.id = sp.account_id
     WHERE sp.account_id = $1
       AND COALESCE(a.active, TRUE) = TRUE
     LIMIT 1`,
    [sellerAccountId]
  )
  return (result.rowCount || 0) > 0
}
