import {
  clearShopListingDigestQueue,
  findShopListingDigestCandidates,
} from '@/lib/db/shop-listing-digest'
import { sendShopFollowDigestEmail } from '@/emails/index'

export async function flushShopFollowDigests(options?: {
  limitFollowers?: number
}): Promise<{ scanned: number; sent: number; skipped: number }> {
  const candidates = await findShopListingDigestCandidates({
    limitFollowers: options?.limitFollowers ?? 50,
  })

  let sent = 0
  let skipped = 0

  for (const follower of candidates) {
    const result = await sendShopFollowDigestEmail({
      to: follower.email,
      displayName: follower.displayName,
      listings: follower.listings,
    })
    if (!result.sent) {
      skipped++
      continue
    }
    await clearShopListingDigestQueue(
      follower.followerAccountId,
      follower.listings.map((item) => item.productId)
    )
    sent++
  }

  return { scanned: candidates.length, sent, skipped }
}
