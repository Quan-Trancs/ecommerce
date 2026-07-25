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
import { formatError } from '@/lib/utils'

export async function getNotificationPreferences(): Promise<{
  notifyOrderNotes: boolean
  orderNoteEmailMode: OrderNoteEmailMode
} | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await findUserById(session.user.id)
  if (!user) return null
  return {
    notifyOrderNotes: user.notifyOrderNotes,
    orderNoteEmailMode: user.orderNoteEmailMode,
  }
}

export async function setOrderNoteNotificationPreferences(input: {
  notifyOrderNotes: boolean
  orderNoteEmailMode: OrderNoteEmailMode | string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const mode = normalizeOrderNoteEmailMode(input.orderNoteEmailMode)
    const updated = await updateOrderNoteNotificationPreferences(
      session.user.id,
      {
        notifyOrderNotes: Boolean(input.notifyOrderNotes),
        orderNoteEmailMode: mode,
      }
    )
    if (!updated) {
      return { success: false, message: 'Account not found' }
    }

    // Switching to immediate: flush any queued digests for this address now.
    if (updated.notifyOrderNotes && updated.orderNoteEmailMode === 'IMMEDIATE') {
      await flushOrderNoteDigestsForEmail(updated.email)
    }

    revalidatePath('/account/settings')
    revalidatePath('/account')
    return {
      success: true,
      message: !updated.notifyOrderNotes
        ? 'Order note emails disabled'
        : updated.orderNoteEmailMode === 'IMMEDIATE'
          ? 'Immediate order note emails enabled'
          : 'Digest order note emails enabled',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
