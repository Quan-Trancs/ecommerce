import { query } from '@/lib/db/postgres'

export type SellerQaDigestItem = {
  questionId: number
  productName: string
  productSlug: string
  body: string
  askerName: string
  createdAt: string
}

export type SellerQaDigestCandidate = {
  sellerAccountId: string
  email: string
  displayName: string | null
  unansweredCount: number
  questions: SellerQaDigestItem[]
}

function displayName(
  name: string | null | undefined,
  email: string | null | undefined
) {
  const trimmed = name?.trim()
  if (trimmed) return trimmed
  if (email?.includes('@')) return email.split('@')[0]
  return 'Customer'
}

/**
 * Sellers with unanswered (visible) Q&A who are due for a digest email.
 * Interval: PRODUCT_QA_DIGEST_HOURS (default 24). Min age of oldest open Q: same.
 */
export async function findSellerQaDigestCandidates(options?: {
  intervalHours?: number
  limitSellers?: number
  questionsPerSeller?: number
}): Promise<SellerQaDigestCandidate[]> {
  const intervalHours = Math.max(
    1,
    Number(
      options?.intervalHours ?? process.env.PRODUCT_QA_DIGEST_HOURS ?? 24
    ) || 24
  )
  const limitSellers = Math.max(
    1,
    Math.min(options?.limitSellers ?? 50, 200)
  )
  const questionsPerSeller = Math.max(
    1,
    Math.min(options?.questionsPerSeller ?? 8, 20)
  )

  const sellers = await query<{
    seller_account_id: string
    email: string
    display_name: string | null
    unanswered_count: string
  }>(
    `SELECT p.seller_account_id,
            a.email,
            a.display_name,
            COUNT(*)::text AS unanswered_count
     FROM product_questions q
     JOIN products p ON p.id = q.product_id
     JOIN accounts a ON a.id = p.seller_account_id
     LEFT JOIN seller_qa_digest_state s ON s.seller_account_id = p.seller_account_id
     WHERE p.seller_account_id IS NOT NULL
       AND q.answer_body IS NULL
       AND q.hidden_at IS NULL
       AND COALESCE(a.active, TRUE) = TRUE
       AND COALESCE(a.notify_qa_digest, TRUE) = TRUE
       AND a.email IS NOT NULL
       AND TRIM(a.email) <> ''
       AND (
         s.last_sent_at IS NULL
         OR s.last_sent_at < NOW() - ($1 * INTERVAL '1 hour')
       )
       AND EXISTS (
         SELECT 1
         FROM product_questions q2
         JOIN products p2 ON p2.id = q2.product_id
         WHERE p2.seller_account_id = p.seller_account_id
           AND q2.answer_body IS NULL
           AND q2.hidden_at IS NULL
           AND q2.created_at < NOW() - ($1 * INTERVAL '1 hour')
       )
     GROUP BY p.seller_account_id, a.email, a.display_name
     ORDER BY MIN(q.created_at) ASC
     LIMIT $2`,
    [intervalHours, limitSellers]
  )

  const candidates: SellerQaDigestCandidate[] = []
  for (const seller of sellers.rows) {
    const items = await query<{
      id: number | string
      product_name: string | null
      product_slug: string | null
      body: string
      asker_name: string | null
      asker_email: string | null
      created_at: Date | string
    }>(
      `SELECT q.id, q.body, q.created_at,
              p.name AS product_name, p.slug AS product_slug,
              asker.display_name AS asker_name, asker.email AS asker_email
       FROM product_questions q
       JOIN products p ON p.id = q.product_id
       LEFT JOIN accounts asker ON asker.id = q.asker_account_id
       WHERE p.seller_account_id = $1
         AND q.answer_body IS NULL
         AND q.hidden_at IS NULL
       ORDER BY q.created_at ASC
       LIMIT $2`,
      [seller.seller_account_id, questionsPerSeller]
    )

    candidates.push({
      sellerAccountId: seller.seller_account_id,
      email: seller.email,
      displayName: seller.display_name,
      unansweredCount: Number(seller.unanswered_count) || items.rows.length,
      questions: items.rows.map((row) => ({
        questionId: Number(row.id),
        productName: row.product_name?.trim() || 'Product',
        productSlug: row.product_slug?.trim() || 'product',
        body: row.body,
        askerName: displayName(row.asker_name, row.asker_email),
        createdAt: new Date(row.created_at).toISOString(),
      })),
    })
  }

  return candidates
}

export async function markSellerQaDigestSent(
  sellerAccountId: string
): Promise<void> {
  await query(
    `INSERT INTO seller_qa_digest_state (seller_account_id, last_sent_at)
     VALUES ($1, NOW())
     ON CONFLICT (seller_account_id)
     DO UPDATE SET last_sent_at = NOW()`,
    [sellerAccountId]
  )
}
