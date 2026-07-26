import {
  findSellerQaDigestCandidates,
  markSellerQaDigestSent,
} from '@/lib/db/seller-qa-digest'
import { sendProductQaDigestEmail } from '@/emails/index'

export async function flushSellerQaDigests(options?: {
  intervalHours?: number
  limitSellers?: number
}): Promise<{ scanned: number; sent: number; skipped: number }> {
  const candidates = await findSellerQaDigestCandidates({
    intervalHours: options?.intervalHours,
    limitSellers: options?.limitSellers ?? 50,
  })

  let sent = 0
  let skipped = 0

  for (const seller of candidates) {
    if (!seller.questions.length) {
      skipped++
      continue
    }
    const result = await sendProductQaDigestEmail({
      to: seller.email,
      displayName: seller.displayName,
      unansweredCount: seller.unansweredCount,
      questions: seller.questions,
    })
    if (!result.sent) {
      skipped++
      continue
    }
    await markSellerQaDigestSent(seller.sellerAccountId)
    sent++
  }

  return { scanned: candidates.length, sent, skipped }
}
