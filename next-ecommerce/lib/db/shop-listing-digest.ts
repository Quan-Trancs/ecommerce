import { query } from '@/lib/db/postgres'

export type ShopDigestListing = {
  productId: string
  productName: string
  productSlug: string
  price: number | null
  imageUrl: string | null
  sellerAccountId: string
  shopName: string
  shopSlug: string
  queuedAt: string
}

export type ShopDigestCandidate = {
  followerAccountId: string
  email: string
  displayName: string | null
  listings: ShopDigestListing[]
}

export async function enqueueShopListingDigest(input: {
  followerAccountId: string
  sellerAccountId: string
  productId: string
}): Promise<void> {
  await query(
    `INSERT INTO shop_listing_digest_queue
       (follower_account_id, seller_account_id, product_id, created_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (follower_account_id, product_id) DO NOTHING`,
    [input.followerAccountId, input.sellerAccountId, input.productId]
  )
}

export async function findShopListingDigestCandidates(options?: {
  limitFollowers?: number
  maxListingsPerFollower?: number
}): Promise<ShopDigestCandidate[]> {
  const limitFollowers = Math.max(
    1,
    Math.min(options?.limitFollowers ?? 50, 200)
  )
  const maxListings = Math.max(
    1,
    Math.min(options?.maxListingsPerFollower ?? 20, 40)
  )

  const heads = await query<{
    follower_account_id: string
    email: string
    display_name: string | null
  }>(
    `SELECT DISTINCT ON (q.follower_account_id)
            q.follower_account_id,
            a.email,
            a.display_name
     FROM shop_listing_digest_queue q
     JOIN accounts a ON a.id = q.follower_account_id
     WHERE COALESCE(a.active, TRUE) = TRUE
       AND COALESCE(a.notify_shop_follows, TRUE) = TRUE
       AND a.email IS NOT NULL
       AND TRIM(a.email) <> ''
     ORDER BY q.follower_account_id, q.created_at ASC
     LIMIT $1`,
    [limitFollowers]
  )

  if (!heads.rows.length) return []

  const followerIds = heads.rows.map((row) => row.follower_account_id)
  const listings = await query<{
    follower_account_id: string
    product_id: string
    product_name: string
    product_slug: string
    price: number | string | null
    image_url: string | null
    seller_account_id: string
    shop_name: string
    shop_slug: string | null
    created_at: Date | string
  }>(
    `SELECT q.follower_account_id,
            q.product_id,
            p.name AS product_name,
            p.slug AS product_slug,
            p.price,
            (
              SELECT pi.image_url
              FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.sort_order NULLS LAST, pi.image_url
              LIMIT 1
            ) AS image_url,
            q.seller_account_id,
            sp.shop_name,
            sp.shop_slug,
            q.created_at
     FROM shop_listing_digest_queue q
     JOIN products p ON p.id = q.product_id
     JOIN seller_profiles sp ON sp.account_id = q.seller_account_id
     WHERE q.follower_account_id = ANY($1::varchar[])
       AND COALESCE(p.is_published, TRUE) = TRUE
     ORDER BY q.follower_account_id, q.created_at ASC`,
    [followerIds]
  )

  const byFollower = new Map<string, ShopDigestListing[]>()
  for (const row of listings.rows) {
    const list = byFollower.get(row.follower_account_id) || []
    if (list.length >= maxListings) continue
    list.push({
      productId: row.product_id,
      productName: row.product_name,
      productSlug: row.product_slug,
      price: row.price == null ? null : Number(row.price),
      imageUrl: row.image_url,
      sellerAccountId: row.seller_account_id,
      shopName: row.shop_name?.trim() || 'Shop',
      shopSlug: row.shop_slug?.trim() || row.seller_account_id,
      queuedAt: new Date(row.created_at).toISOString(),
    })
    byFollower.set(row.follower_account_id, list)
  }

  return heads.rows
    .map((row) => ({
      followerAccountId: row.follower_account_id,
      email: row.email,
      displayName: row.display_name,
      listings: byFollower.get(row.follower_account_id) || [],
    }))
    .filter((c) => c.listings.length > 0)
}

export async function clearShopListingDigestQueue(
  followerAccountId: string,
  productIds: string[]
): Promise<void> {
  if (!productIds.length) return
  await query(
    `DELETE FROM shop_listing_digest_queue
     WHERE follower_account_id = $1
       AND product_id = ANY($2::varchar[])`,
    [followerAccountId, productIds]
  )
}
