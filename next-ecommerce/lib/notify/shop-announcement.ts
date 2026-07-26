import { createInAppNotification } from '@/lib/db/in-app-notifications'
import { listShopFollowerAccountIds } from '@/lib/db/shop-follows'
import { getSellerShop, shopHref } from '@/lib/db/seller-shop'
import { enqueueShopAnnouncementDigest } from '@/lib/db/shop-announcement-digest'
import { findUserById } from '@/lib/db/users'

/**
 * Notify shop followers of a seller announcement:
 * - immediate in-app notification
 * - email queued for batched digest (cron)
 */
export async function notifyShopFollowersOfAnnouncement(input: {
  sellerAccountId: string
  announcementId: number
  title: string
  body: string
}): Promise<void> {
  try {
    const sellerId = input.sellerAccountId?.trim()
    if (!sellerId) return

    const shop = await getSellerShop(sellerId)
    if (!shop) return

    const followers = await listShopFollowerAccountIds(sellerId)
    const href = shopHref(shop)
    const bodyPreview = input.body.replace(/\s+/g, ' ').trim().slice(0, 120)

    for (const accountId of followers) {
      const user = await findUserById(accountId)
      if (!user || !user.active || user.notifyShopFollows === false) continue

      await createInAppNotification({
        accountId,
        type: 'SHOP_ANNOUNCEMENT',
        title: `${shop.shopName}: ${input.title}`.slice(0, 120),
        body: bodyPreview || input.title,
        href,
      })

      if (user.email) {
        await enqueueShopAnnouncementDigest({
          followerAccountId: accountId,
          sellerAccountId: sellerId,
          announcementId: input.announcementId,
        })
      }
    }
  } catch (error) {
    console.error('notifyShopFollowersOfAnnouncement failed:', error)
  }
}
