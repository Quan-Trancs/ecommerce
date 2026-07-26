import { findUserById } from '@/lib/db/users'
import { createInAppNotification } from '@/lib/db/in-app-notifications'
import { listShopFollowerAccountIds } from '@/lib/db/shop-follows'
import { getSellerShop, shopHref } from '@/lib/db/seller-shop'
import { sendShopNewListingEmail } from '@/emails/index'
import { query } from '@/lib/db/postgres'

/**
 * Notify shop followers when a seller publishes a new product.
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

    const imageResult = await query<{ image_url: string | null }>(
      `SELECT pi.image_url
       FROM product_images pi
       WHERE pi.product_id = $1
       ORDER BY pi.sort_order NULLS LAST, pi.image_url
       LIMIT 1`,
      [input.productId]
    )
    const imageUrl = imageResult.rows[0]?.image_url || null

    const followers = await listShopFollowerAccountIds(sellerId)
    const productHref = `/product/${input.productSlug}`
    const shopPath = shopHref(shop)

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
        await sendShopNewListingEmail({
          to: user.email,
          displayName: user.name,
          shopName: shop.shopName,
          shopSlug: shop.shopSlug,
          shopHref: shopPath,
          productName: input.productName,
          productSlug: input.productSlug,
          imageUrl,
          price: input.price ?? null,
        })
      }
    }
  } catch (error) {
    console.error('notifyShopFollowersOfNewListing failed:', error)
  }
}
