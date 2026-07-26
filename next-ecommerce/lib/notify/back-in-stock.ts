import { findUserById } from '@/lib/db/users'
import { createInAppNotification } from '@/lib/db/in-app-notifications'
import {
  clearStockAlertSubscriptions,
  listRestockedProductsWithSubscribers,
  listStockAlertSubscribers,
} from '@/lib/db/stock-alerts'
import { sendBackInStockEmail } from '@/emails'

/**
 * Notify buyers who subscribed while a product was out of stock.
 * One-shot: subscriptions are cleared after notify attempts.
 */
export async function checkAndNotifyBackInStock(
  productIds: string[]
): Promise<void> {
  try {
    const products = await listRestockedProductsWithSubscribers(productIds)
    for (const product of products) {
      const subscribers = await listStockAlertSubscribers(product.productId)
      for (const { accountId } of subscribers) {
        const user = await findUserById(accountId)
        if (!user || !user.active) continue
        if (user.notifyBackInStock === false) continue

        const href = `/product/${product.slug}`
        await createInAppNotification({
          accountId,
          type: 'BACK_IN_STOCK',
          title: 'Back in stock',
          body: `${product.name} is available again.`,
          href,
        })

        if (user.email) {
          await sendBackInStockEmail({
            to: user.email,
            displayName: user.name,
            productName: product.name,
            productSlug: product.slug,
            imageUrl: product.imageUrl,
            price: product.price,
          })
        }
      }
      await clearStockAlertSubscriptions(product.productId)
    }
  } catch (error) {
    console.error('checkAndNotifyBackInStock failed:', error)
  }
}
