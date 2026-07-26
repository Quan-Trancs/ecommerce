import { createInAppNotification } from '@/lib/db/in-app-notifications'
import { listShopFollowerAccountIds } from '@/lib/db/shop-follows'
import { getSellerShop } from '@/lib/db/seller-shop'
import { enqueueShopListingDigest } from '@/lib/db/shop-listing-digest'
import { findUserById } from '@/lib/db/users'

/**
 * Notify shop followers of a new listing:
 * - immediate in-app notification
 * - email queued for batched digest (cron)
 */
export async function notifyShopFollowersOfNewListing(input: {
  sellerAccountId: string
  productId: string
  productName: string
  productSlug: string
  price?: number | null
}): Promise<void> {
  try {
    const sellerId = input.sellerAccountId?.trim()
    if (!sellerId) return

    const shop = await getSellerShop(sellerId)
    if (!shop) return

    const followers = await listShopFollowerAccountIds(sellerId)
    const productHref = `/product/${input.productSlug}`

    for (const accountId of followers) {
      const user = await findUserById(accountId)
      if (!user || !user.active || user.notifyShopFollows === false) continue

      await createInAppNotification({
        accountId,
        type: 'SHOP_NEW_LISTING',
        title: `New from ${shop.shopName}`,
        body: `${input.productName} was just listed.`,
        href: productHref,
      })

      if (user.email) {
        await enqueueShopListingDigest({
          followerAccountId: accountId,
          sellerAccountId: sellerId,
          productId: input.productId,
        })
      }
    }
  } catch (error) {
    console.error('notifyShopFollowersOfNewListing failed:', error)
  }
}
