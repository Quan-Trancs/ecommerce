import {
  findAbandonedCartCandidates,
  markAbandonedCartEmailed,
} from '@/lib/db/abandoned-carts'
import { sendAbandonedCartEmail } from '@/emails/index'

export async function flushAbandonedCartReminders(options?: {
  staleHours?: number
  limit?: number
}): Promise<{ scanned: number; sent: number; skipped: number }> {
  const staleHours = Math.max(
    1,
    Number(options?.staleHours ?? process.env.ABANDONED_CART_HOURS ?? 24) || 24
  )
  const candidates = await findAbandonedCartCandidates({
    staleHours,
    limit: options?.limit ?? 50,
  })

  let sent = 0
  let skipped = 0

  for (const cart of candidates) {
    const result = await sendAbandonedCartEmail({
      to: cart.email,
      displayName: cart.displayName,
      items: cart.items,
      itemsTotal: cart.itemsTotal,
    })
    if (!result.sent) {
      skipped++
      continue
    }
    await markAbandonedCartEmailed(cart.cartId)
    sent++
  }

  return { scanned: candidates.length, sent, skipped }
}
