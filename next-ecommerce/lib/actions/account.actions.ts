'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import {
  findUserById,
  normalizeOrderNoteEmailMode,
  updateLowStockPreferences,
  updateOrderNoteNotificationPreferences,
  type OrderNoteEmailMode,
} from '@/lib/db/users'
import { flushOrderNoteDigestsForEmail } from '@/lib/email/order-notifications'
import {
  clampHour,
  isInQuietHours,
  normalizeTimezone,
} from '@/lib/email/quiet-hours'
import { normalizePhoneE164 } from '@/lib/notify/sms'
import { formatError } from '@/lib/utils'

export async function getNotificationPreferences(): Promise<{
  notifyOrderNotes: boolean
  orderNoteEmailMode: OrderNoteEmailMode
  quietHoursEnabled: boolean
  quietHoursStart: number
  quietHoursEnd: number
  quietHoursTimezone: string
  phoneE164: string
  notifyOrderNotesSms: boolean
  notifyOrderNotesPush: boolean
  notifyInAppOrderNotes: boolean
  notifyLowStock: boolean
  lowStockThreshold: number
  vapidPublicKey: string | null
} | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await findUserById(session.user.id)
  if (!user) return null
  return {
    notifyOrderNotes: user.notifyOrderNotes,
    orderNoteEmailMode: user.orderNoteEmailMode,
    quietHoursEnabled: user.quietHoursEnabled,
    quietHoursStart: user.quietHoursStart,
    quietHoursEnd: user.quietHoursEnd,
    quietHoursTimezone: user.quietHoursTimezone,
    phoneE164: user.phoneE164 || '',
    notifyOrderNotesSms: user.notifyOrderNotesSms,
    notifyOrderNotesPush: user.notifyOrderNotesPush,
    notifyInAppOrderNotes: user.notifyInAppOrderNotes,
    notifyLowStock: user.notifyLowStock,
    lowStockThreshold: user.lowStockThreshold,
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null,
  }
}

export async function setOrderNoteNotificationPreferences(input: {
  notifyOrderNotes: boolean
  orderNoteEmailMode: OrderNoteEmailMode | string
  quietHoursEnabled: boolean
  quietHoursStart: number | string
  quietHoursEnd: number | string
  quietHoursTimezone: string
  phoneE164?: string
  notifyOrderNotesSms?: boolean
  notifyOrderNotesPush?: boolean
  notifyInAppOrderNotes?: boolean
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const mode = normalizeOrderNoteEmailMode(input.orderNoteEmailMode)
    const quietHoursStart = clampHour(input.quietHoursStart, 22)
    const quietHoursEnd = clampHour(input.quietHoursEnd, 8)
    const quietHoursTimezone = normalizeTimezone(input.quietHoursTimezone)
    const quietHoursEnabled = Boolean(input.quietHoursEnabled)
    const notifyOrderNotesSms = Boolean(input.notifyOrderNotesSms)
    const notifyOrderNotesPush = Boolean(input.notifyOrderNotesPush)
    const notifyInAppOrderNotes =
      input.notifyInAppOrderNotes === undefined
        ? true
        : Boolean(input.notifyInAppOrderNotes)
    const phoneE164 = normalizePhoneE164(input.phoneE164 || '')

    if (quietHoursEnabled && quietHoursStart === quietHoursEnd) {
      return {
        success: false,
        message: 'Quiet hours start and end must differ',
      }
    }
    if (notifyOrderNotesSms && !phoneE164) {
      return {
        success: false,
        message: 'Enter a valid phone number (E.164) to enable SMS',
      }
    }

    const updated = await updateOrderNoteNotificationPreferences(
      session.user.id,
      {
        notifyOrderNotes: Boolean(input.notifyOrderNotes),
        orderNoteEmailMode: mode,
        quietHoursEnabled,
        quietHoursStart,
        quietHoursEnd,
        quietHoursTimezone,
        phoneE164,
        notifyOrderNotesSms,
        notifyOrderNotesPush,
        notifyInAppOrderNotes,
      }
    )
    if (!updated) {
      return { success: false, message: 'Account not found' }
    }

    const inQuiet = isInQuietHours({
      enabled: updated.quietHoursEnabled,
      startHour: updated.quietHoursStart,
      endHour: updated.quietHoursEnd,
      timezone: updated.quietHoursTimezone,
    })

    if (
      updated.notifyOrderNotes &&
      !inQuiet &&
      (updated.orderNoteEmailMode === 'IMMEDIATE' || !quietHoursEnabled)
    ) {
      await flushOrderNoteDigestsForEmail(updated.email, {
        ignoreQuietHours: true,
      })
    }

    revalidatePath('/account/settings')
    revalidatePath('/account')
    return {
      success: true,
      message: !updated.notifyOrderNotes
        ? 'Order note emails disabled'
        : 'Notification preferences saved',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function setLowStockPreferences(input: {
  notifyLowStock: boolean
  lowStockThreshold: number | string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const threshold = Math.max(
      0,
      Math.min(9999, Math.floor(Number(input.lowStockThreshold) || 5))
    )
    const updated = await updateLowStockPreferences(session.user.id, {
      notifyLowStock: Boolean(input.notifyLowStock),
      lowStockThreshold: threshold,
    })
    if (!updated) return { success: false, message: 'Account not found' }
    revalidatePath('/account/settings')
    revalidatePath('/seller/products')
    return { success: true, message: 'Low-stock alert preferences saved' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
