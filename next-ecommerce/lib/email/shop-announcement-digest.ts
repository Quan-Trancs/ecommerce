import {
  clearShopAnnouncementDigestQueue,
  findShopAnnouncementDigestCandidates,
} from '@/lib/db/shop-announcement-digest'
import { sendShopAnnouncementDigestEmail } from '@/emails/index'

export async function flushShopAnnouncementDigests(options?: {
  limitFollowers?: number
}): Promise<{ scanned: number; sent: number; skipped: number }> {
  const candidates = await findShopAnnouncementDigestCandidates({
    limitFollowers: options?.limitFollowers ?? 50,
  })

  let sent = 0
  let skipped = 0

  for (const follower of candidates) {
    const result = await sendShopAnnouncementDigestEmail({
      to: follower.email,
      displayName: follower.displayName,
      announcements: follower.announcements,
    })
    if (!result.sent) {
      skipped++
      continue
    }
    await clearShopAnnouncementDigestQueue(
      follower.followerAccountId,
      follower.announcements.map((item) => item.announcementId)
    )
    sent++
  }

  return { scanned: candidates.length, sent, skipped }
}
