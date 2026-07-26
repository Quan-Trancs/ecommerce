'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { formatError } from '@/lib/utils'
import {
  followShop,
  isFollowingShop,
  listFollowedShops,
  sellerProfileExists,
  unfollowShop,
  type ShopFollowRow,
} from '@/lib/db/shop-follows'
import { getSellerShop, shopHref } from '@/lib/db/seller-shop'

export type { ShopFollowRow }

export async function getShopFollowStatus(sellerAccountId: string): Promise<{
  signedIn: boolean
  following: boolean
  isOwnShop: boolean
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { signedIn: false, following: false, isOwnShop: false }
  }
  const isOwnShop = session.user.id === sellerAccountId
  if (isOwnShop) {
    return { signedIn: true, following: false, isOwnShop: true }
  }
  const following = await isFollowingShop(session.user.id, sellerAccountId)
  return { signedIn: true, following, isOwnShop: false }
}

export async function toggleShopFollow(sellerAccountId: string): Promise<{
  success: boolean
  message: string
  following?: boolean
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const sellerId = sellerAccountId.trim()
    if (!sellerId) {
      return { success: false, message: 'Shop required' }
    }
    if (session.user.id === sellerId) {
      return { success: false, message: 'You cannot follow your own shop' }
    }
    if (!(await sellerProfileExists(sellerId))) {
      return { success: false, message: 'Shop not found' }
    }

    const shop = await getSellerShop(sellerId)
    const already = await isFollowingShop(session.user.id, sellerId)
    if (already) {
      await unfollowShop({
        accountId: session.user.id,
        sellerAccountId: sellerId,
      })
      if (shop) revalidatePath(shopHref(shop))
      revalidatePath('/account/following')
      return { success: true, message: 'Unfollowed shop', following: false }
    }

    await followShop({
      accountId: session.user.id,
      sellerAccountId: sellerId,
    })
    if (shop) revalidatePath(shopHref(shop))
    revalidatePath('/account/following')
    return {
      success: true,
      message: 'Following — we will notify you about new listings',
      following: true,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function getMyFollowedShops(): Promise<ShopFollowRow[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const rows = await listFollowedShops(session.user.id)
  return JSON.parse(JSON.stringify(rows))
}
