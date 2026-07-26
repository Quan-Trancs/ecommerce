'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { hasSellerAccess } from '@/lib/auth/roles'
import { formatError } from '@/lib/utils'
import { getSellerShop, shopHref } from '@/lib/db/seller-shop'
import {
  countShopAnnouncementsToday,
  createShopAnnouncement,
  deleteShopAnnouncement,
  listShopAnnouncements,
  type ShopAnnouncement,
} from '@/lib/db/shop-announcements'
import { notifyShopFollowersOfAnnouncement } from '@/lib/notify/shop-announcement'

export type { ShopAnnouncement }

const MAX_PER_DAY = 5

export async function getMyShopAnnouncements(): Promise<ShopAnnouncement[]> {
  const session = await auth()
  if (!session?.user?.id || !hasSellerAccess(session.user.role)) return []
  const rows = await listShopAnnouncements(session.user.id, { limit: 10 })
  return JSON.parse(JSON.stringify(rows))
}

export async function getPublicShopAnnouncements(
  sellerAccountId: string
): Promise<ShopAnnouncement[]> {
  const id = sellerAccountId?.trim()
  if (!id) return []
  const rows = await listShopAnnouncements(id, { limit: 5 })
  return JSON.parse(JSON.stringify(rows))
}

export async function postMyShopAnnouncement(input: {
  title: string
  body: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
      return { success: false, message: 'Seller access required' }
    }

    const title = (input.title || '').trim()
    const body = (input.body || '').trim()
    if (!title || title.length < 2) {
      return { success: false, message: 'Title required' }
    }
    if (!body || body.length < 2) {
      return { success: false, message: 'Message required' }
    }

    const shop = await getSellerShop(session.user.id)
    if (!shop) {
      return { success: false, message: 'Shop profile not found' }
    }

    const todayCount = await countShopAnnouncementsToday(session.user.id)
    if (todayCount >= MAX_PER_DAY) {
      return {
        success: false,
        message: `Limit of ${MAX_PER_DAY} announcements per day reached`,
      }
    }

    const announcement = await createShopAnnouncement({
      sellerAccountId: session.user.id,
      title: title.slice(0, 120),
      body: body.slice(0, 500),
    })

    await notifyShopFollowersOfAnnouncement({
      sellerAccountId: session.user.id,
      title: announcement.title,
      body: announcement.body,
    })

    revalidatePath(shopHref(shop))
    revalidatePath(`/shop/${shop.accountId}`)
    revalidatePath('/seller')
    return { success: true, message: 'Announcement posted to followers' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function deleteMyShopAnnouncement(
  id: number
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
      return { success: false, message: 'Seller access required' }
    }
    const announcementId = Number(id)
    if (!Number.isFinite(announcementId) || announcementId <= 0) {
      return { success: false, message: 'Invalid announcement' }
    }

    const shop = await getSellerShop(session.user.id)
    const deleted = await deleteShopAnnouncement({
      id: announcementId,
      sellerAccountId: session.user.id,
    })
    if (!deleted) {
      return { success: false, message: 'Announcement not found' }
    }
    if (shop) {
      revalidatePath(shopHref(shop))
      revalidatePath(`/shop/${shop.accountId}`)
    }
    revalidatePath('/seller')
    return { success: true, message: 'Announcement deleted' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
