import { query } from '@/lib/db/postgres'

export type SellerShop = {
  accountId: string
  shopName: string
  bio: string | null
  verified: boolean
  productCount: number
}

export async function getSellerShop(
  accountId: string
): Promise<SellerShop | null> {
  const id = accountId.trim()
  if (!id) return null

  const result = await query<{
    account_id: string
    shop_name: string
    bio: string | null
    verified: boolean
    product_count: string
  }>(
    `SELECT sp.account_id,
            sp.shop_name,
            sp.bio,
            COALESCE(sp.verified, FALSE) AS verified,
            (
              SELECT COUNT(*)::text
              FROM products p
              WHERE p.seller_account_id = sp.account_id
                AND COALESCE(p.is_published, TRUE) = TRUE
            ) AS product_count
     FROM seller_profiles sp
     JOIN accounts a ON a.id = sp.account_id
     WHERE sp.account_id = $1
       AND COALESCE(a.active, TRUE) = TRUE
     LIMIT 1`,
    [id]
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    accountId: row.account_id,
    shopName: row.shop_name?.trim() || 'Shop',
    bio: row.bio?.trim() || null,
    verified: Boolean(row.verified),
    productCount: Number(row.product_count) || 0,
  }
}

/** Published product ids for a seller shop (newest first). */
export async function listSellerShopProductIds(
  accountId: string,
  options?: { limit?: number }
): Promise<string[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 48, 100))
  const result = await query<{ id: string }>(
    `SELECT id
     FROM products
     WHERE seller_account_id = $1
       AND COALESCE(is_published, TRUE) = TRUE
     ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
     LIMIT $2`,
    [accountId, limit]
  )
  return result.rows.map((row) => row.id)
}

export async function updateSellerShopProfile(input: {
  accountId: string
  shopName: string
  bio?: string | null
}): Promise<SellerShop | null> {
  const shopName = input.shopName.trim().slice(0, 200)
  if (!shopName) return null
  const bio = (input.bio || '').trim().slice(0, 500) || null

  await query(
    `UPDATE seller_profiles
     SET shop_name = $2,
         bio = $3,
         updated_at = NOW()
     WHERE account_id = $1`,
    [input.accountId, shopName, bio]
  )
  return getSellerShop(input.accountId)
}
