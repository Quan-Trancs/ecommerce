import { query } from '@/lib/db/postgres'

export type ShopDigestAnnouncement = {
  announcementId: number
  title: string
  body: string
  sellerAccountId: string
  shopName: string
  shopSlug: string
  queuedAt: string
}

export type ShopAnnouncementDigestCandidate = {
  followerAccountId: string
  email: string
  displayName: string | null
  announcements: ShopDigestAnnouncement[]
}

export async function enqueueShopAnnouncementDigest(input: {
  followerAccountId: string
  sellerAccountId: string
  announcementId: number
}): Promise<void> {
  await query(
    `INSERT INTO shop_announcement_digest_queue
       (follower_account_id, seller_account_id, announcement_id, created_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (follower_account_id, announcement_id) DO NOTHING`,
    [input.followerAccountId, input.sellerAccountId, input.announcementId]
  )
}

export async function findShopAnnouncementDigestCandidates(options?: {
  limitFollowers?: number
  maxAnnouncementsPerFollower?: number
}): Promise<ShopAnnouncementDigestCandidate[]> {
  const limitFollowers = Math.max(
    1,
    Math.min(options?.limitFollowers ?? 50, 200)
  )
  const maxItems = Math.max(
    1,
    Math.min(options?.maxAnnouncementsPerFollower ?? 20, 40)
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
     FROM shop_announcement_digest_queue q
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
  const items = await query<{
    follower_account_id: string
    announcement_id: number | string
    title: string
    body: string
    seller_account_id: string
    shop_name: string
    shop_slug: string | null
    created_at: Date | string
  }>(
    `SELECT q.follower_account_id,
            q.announcement_id,
            an.title,
            an.body,
            q.seller_account_id,
            sp.shop_name,
            sp.shop_slug,
            q.created_at
     FROM shop_announcement_digest_queue q
     JOIN shop_announcements an ON an.id = q.announcement_id
     JOIN seller_profiles sp ON sp.account_id = q.seller_account_id
     WHERE q.follower_account_id = ANY($1::varchar[])
     ORDER BY q.follower_account_id, q.created_at ASC`,
    [followerIds]
  )

  const byFollower = new Map<string, ShopDigestAnnouncement[]>()
  for (const row of items.rows) {
    const list = byFollower.get(row.follower_account_id) || []
    if (list.length >= maxItems) continue
    list.push({
      announcementId: Number(row.announcement_id),
      title: row.title,
      body: row.body,
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
      announcements: byFollower.get(row.follower_account_id) || [],
    }))
    .filter((c) => c.announcements.length > 0)
}

export async function clearShopAnnouncementDigestQueue(
  followerAccountId: string,
  announcementIds: number[]
): Promise<void> {
  if (!announcementIds.length) return
  await query(
    `DELETE FROM shop_announcement_digest_queue
     WHERE follower_account_id = $1
       AND announcement_id = ANY($2::bigint[])`,
    [followerAccountId, announcementIds]
  )
}
