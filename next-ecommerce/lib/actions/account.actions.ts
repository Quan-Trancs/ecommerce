'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import {
  findUserById,
  updateNotifyOrderNotes,
} from '@/lib/db/users'
import { formatError } from '@/lib/utils'

export async function getNotificationPreferences(): Promise<{
  notifyOrderNotes: boolean
} | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await findUserById(session.user.id)
  if (!user) return null
  return { notifyOrderNotes: user.notifyOrderNotes }
}

export async function setNotifyOrderNotes(
  notifyOrderNotes: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const updated = await updateNotifyOrderNotes(
      session.user.id,
      Boolean(notifyOrderNotes)
    )
    if (!updated) {
      return { success: false, message: 'Account not found' }
    }
    revalidatePath('/account/settings')
    revalidatePath('/account')
    return {
      success: true,
      message: updated.notifyOrderNotes
        ? 'Order note emails enabled'
        : 'Order note emails disabled',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
