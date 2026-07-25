'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import {
  findUserById,
  normalizeOrderNoteEmailMode,
  updateOrderNoteNotificationPreferences,
  type OrderNoteEmailMode,
} from '@/lib/db/users'
import { flushOrderNoteDigestsForEmail } from '@/lib/email/order-notifications'
import {
  clampHour,
  isInQuietHours,
  normalizeTimezone,
} from '@/lib/email/quiet-hours'
import { formatError } from '@/lib/utils'

export async function getNotificationPreferences(): Promise<{
  notifyOrderNotes: boolean
  orderNoteEmailMode: OrderNoteEmailMode
  quietHoursEnabled: boolean
  quietHoursStart: number
  quietHoursEnd: number
  quietHoursTimezone: string
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
  }
}

export async function setOrderNoteNotificationPreferences(input: {
  notifyOrderNotes: boolean
  orderNoteEmailMode: OrderNoteEmailMode | string
  quietHoursEnabled: boolean
  quietHoursStart: number | string
  quietHoursEnd: number | string
  quietHoursTimezone: string
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

    if (
      quietHoursEnabled &&
      quietHoursStart === quietHoursEnd
    ) {
      return {
        success: false,
        message: 'Quiet hours start and end must differ',
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

    // Flush queued mail when leaving quiet hours or choosing immediate outside quiet.
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
