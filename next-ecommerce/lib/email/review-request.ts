import {
  findReviewRequestCandidates,
  markReviewRequestSent,
} from '@/lib/db/review-requests'
import { sendReviewRequestEmail } from '@/emails/index'

export async function flushReviewRequestEmails(options?: {
  delayDays?: number
  limit?: number
}): Promise<{ scanned: number; sent: number; skipped: number }> {
  const delayDays = Math.max(
    1,
    Number(options?.delayDays ?? process.env.REVIEW_REQUEST_DAYS ?? 7) || 7
  )
  const candidates = await findReviewRequestCandidates({
    delayDays,
    limit: options?.limit ?? 50,
  })

  let sent = 0
  let skipped = 0

  for (const order of candidates) {
    const result = await sendReviewRequestEmail({
      to: order.email,
      displayName: order.displayName,
      orderId: order.orderId,
      products: order.products,
    })
    if (!result.sent) {
      skipped++
      continue
    }
    await markReviewRequestSent(order.orderId)
    sent++
  }

  return { scanned: candidates.length, sent, skipped }
}
