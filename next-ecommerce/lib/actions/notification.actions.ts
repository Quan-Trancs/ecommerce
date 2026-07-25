'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import {
  countUnreadInAppNotifications,
  listInAppNotifications,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
  type InAppNotification,
} from '@/lib/db/in-app-notifications'
import {
  isOrderInAppMuted,
  setOrderInAppMuted,
} from '@/lib/db/order-in-app-mutes'
import { formatError } from '@/lib/utils'

export type { InAppNotification }

export async function getInAppNotificationSummary(): Promise<{
  unreadCount: number
  recent: InAppNotification[]
} | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const [unreadCount, recent] = await Promise.all([
    countUnreadInAppNotifications(session.user.id),
    listInAppNotifications(session.user.id, { limit: 8 }),
  ])
  return JSON.parse(JSON.stringify({ unreadCount, recent }))
}

export async function getInAppNotifications(): Promise<InAppNotification[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const rows = await listInAppNotifications(session.user.id, { limit: 50 })
  return JSON.parse(JSON.stringify(rows))
}

export async function markNotificationRead(
  notificationId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    await markInAppNotificationRead(session.user.id, notificationId)
    revalidatePath('/')
    revalidatePath('/account/notifications')
    return { success: true, message: 'Marked read' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function markAllNotificationsRead(): Promise<{
  success: boolean
  message: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const count = await markAllInAppNotificationsRead(session.user.id)
    revalidatePath('/')
    revalidatePath('/account/notifications')
    return {
      success: true,
      message: count ? `Marked ${count} read` : 'No unread notifications',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function getOrderInAppMuteState(
  orderId: string
): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id || !orderId) return false
  return isOrderInAppMuted(session.user.id, orderId)
}

export async function setOrderInAppMute(
  orderId: string,
  muted: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    if (!orderId?.trim()) {
      return { success: false, message: 'Order required' }
    }
    await setOrderInAppMuted(session.user.id, orderId.trim(), Boolean(muted))
    revalidatePath(`/account/orders/${orderId}`)
    revalidatePath('/account/settings')
    return {
      success: true,
      message: muted
        ? 'Muted in-app alerts for this order'
        : 'Unmuted in-app alerts for this order',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
