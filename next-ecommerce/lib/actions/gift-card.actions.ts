'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAdminAccess } from '@/lib/auth/roles'
import { formatError, roundToTwoDecimals } from '@/lib/utils'
import { logStaffAction } from '@/lib/audit/log-staff-action'
import {
  createGiftCard,
  listGiftCards,
  setGiftCardActive,
  type GiftCard,
} from '@/lib/db/gift-cards'

export type { GiftCard }

function randomGiftCode() {
  const chunk = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X')
  return `GC-${chunk()}${chunk()}`
}

export async function adminListGiftCards(): Promise<GiftCard[]> {
  const session = await auth()
  if (!hasAdminAccess(session?.user?.role)) return []
  const rows = await listGiftCards()
  return JSON.parse(JSON.stringify(rows))
}

export async function adminCreateGiftCard(input: {
  code?: string
  initialBalance: number | string
  note?: string
}): Promise<{ success: boolean; message: string; code?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasAdminAccess(session.user.role)) {
      return { success: false, message: 'Admin required' }
    }
    const balance = roundToTwoDecimals(Number(input.initialBalance))
    if (!(balance > 0)) {
      return { success: false, message: 'Enter a positive balance' }
    }
    const code = (input.code?.trim() || randomGiftCode()).toUpperCase()
    const card = await createGiftCard({
      code,
      initialBalance: balance,
      createdBy: session.user.id,
      note: input.note,
    })
    await logStaffAction({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: 'GIFT_CARD_CREATE',
      entityType: 'gift_card',
      entityId: String(card.id),
      summary: `Created gift card ${card.code} ($${balance.toFixed(2)})`,
      metadata: { code: card.code, balance },
    })
    revalidatePath('/admin/gift-cards')
    revalidatePath('/admin/audit')
    return {
      success: true,
      message: `Created ${card.code}`,
      code: card.code,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function adminToggleGiftCard(
  id: number,
  active: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasAdminAccess(session.user.role)) {
      return { success: false, message: 'Admin required' }
    }
    await setGiftCardActive(id, active)
    await logStaffAction({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: active ? 'GIFT_CARD_ACTIVATE' : 'GIFT_CARD_DEACTIVATE',
      entityType: 'gift_card',
      entityId: String(id),
      summary: `${active ? 'Activated' : 'Deactivated'} gift card #${id}`,
    })
    revalidatePath('/admin/gift-cards')
    revalidatePath('/admin/audit')
    return {
      success: true,
      message: active ? 'Gift card activated' : 'Gift card deactivated',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
