import { findUserById } from '@/lib/db/users'
import { createInAppNotification } from '@/lib/db/in-app-notifications'
import {
  clearWishlistPriceAlertsIfRecovered,
  listWishlistPriceDropCandidates,
  markWishlistPriceAlerted,
} from '@/lib/db/wishlist-price-drops'
import { sendPriceDropEmail } from '@/emails/index'
import { formatCurrency } from '@/lib/utils'

/**
 * Notify wishlist owners when a product price drops below their watched baseline
 * (and below any previously alerted price).
 */
export async function checkAndNotifyPriceDrops(
  productIds: string[]
): Promise<void> {
  try {
    await clearWishlistPriceAlertsIfRecovered(productIds)
    const candidates = await listWishlistPriceDropCandidates(productIds)
    for (const watch of candidates) {
      const user = await findUserById(watch.accountId)
      if (!user || !user.active || user.notifyPriceDrops === false) continue

      const href = `/product/${watch.productSlug}`
      const body = `${watch.productName} dropped from ${formatCurrency(
        watch.watchedPrice
      )} to ${formatCurrency(watch.currentPrice)}.`

      await createInAppNotification({
        accountId: watch.accountId,
        type: 'PRICE_DROP',
        title: 'Price drop',
        body,
        href,
      })

      if (user.email) {
        await sendPriceDropEmail({
          to: user.email,
          displayName: user.name,
          productName: watch.productName,
          productSlug: watch.productSlug,
          imageUrl: watch.imageUrl,
          oldPrice: watch.watchedPrice,
          newPrice: watch.currentPrice,
        })
      }

      await markWishlistPriceAlerted({
        accountId: watch.accountId,
        productId: watch.productId,
        alertedPrice: watch.currentPrice,
      })
    }
  } catch (error) {
    console.error('checkAndNotifyPriceDrops failed:', error)
  }
}
