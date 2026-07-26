import { query } from '@/lib/db/postgres'

export type ProductQuestion = {
  id: number
  productId: string
  askerAccountId: string
  askerName: string
  body: string
  answerBody: string | null
  answerAccountId: string | null
  answererName: string | null
  answeredAt: string | null
  createdAt: string
}

export type SellerInboxQuestion = ProductQuestion & {
  productName: string
  productSlug: string
}

export type AdminInboxQuestion = SellerInboxQuestion & {
  sellerAccountId: string | null
  sellerLabel: string
  isPlatformOwned: boolean
}

type Row = {
  id: number | string
  product_id: string
  asker_account_id: string
  asker_name: string | null
  asker_email: string | null
  body: string
  answer_body: string | null
  answer_account_id: string | null
  answerer_name: string | null
  answerer_email: string | null
  answered_at: Date | string | null
  created_at: Date | string
}

function displayName(
  name: string | null | undefined,
  email: string | null | undefined,
  fallback: string
) {
  const trimmed = name?.trim()
  if (trimmed) return trimmed
  if (email?.includes('@')) return email.split('@')[0]
  return fallback
}

function mapRow(row: Row): ProductQuestion {
  return {
    id: Number(row.id),
    productId: row.product_id,
    askerAccountId: row.asker_account_id,
    askerName: displayName(row.asker_name, row.asker_email, 'Customer'),
    body: row.body,
    answerBody: row.answer_body,
    answerAccountId: row.answer_account_id,
    answererName: row.answer_body
      ? displayName(row.answerer_name, row.answerer_email, 'Seller')
      : null,
    answeredAt: row.answered_at
      ? new Date(row.answered_at).toISOString()
      : null,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export async function getProductSellerAccountId(
  productId: string
): Promise<string | null> {
  const result = await query<{ seller_account_id: string | null }>(
    `SELECT seller_account_id FROM products WHERE id = $1 LIMIT 1`,
    [productId]
  )
  return result.rows[0]?.seller_account_id || null
}

export async function getProductQaListing(
  productId: string
): Promise<{ name: string; slug: string } | null> {
  const result = await query<{ name: string; slug: string }>(
    `SELECT name, slug FROM products WHERE id = $1 LIMIT 1`,
    [productId]
  )
  const row = result.rows[0]
  if (!row?.slug) return null
  return { name: row.name || row.slug, slug: row.slug }
}

export async function listProductQuestions(
  productId: string,
  options?: { limit?: number }
): Promise<ProductQuestion[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 40, 100))
  const result = await query<Row>(
    `SELECT q.id, q.product_id, q.asker_account_id, q.body,
            q.answer_body, q.answer_account_id, q.answered_at, q.created_at,
            asker.display_name AS asker_name, asker.email AS asker_email,
            answerer.display_name AS answerer_name, answerer.email AS answerer_email
     FROM product_questions q
     LEFT JOIN accounts asker ON asker.id = q.asker_account_id
     LEFT JOIN accounts answerer ON answerer.id = q.answer_account_id
     WHERE q.product_id = $1
     ORDER BY q.created_at DESC
     LIMIT $2`,
    [productId, limit]
  )
  return result.rows.map(mapRow)
}

export async function createProductQuestion(input: {
  productId: string
  askerAccountId: string
  body: string
}): Promise<ProductQuestion> {
  const result = await query<Row>(
    `WITH inserted AS (
       INSERT INTO product_questions
         (product_id, asker_account_id, body, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *
     )
     SELECT i.id, i.product_id, i.asker_account_id, i.body,
            i.answer_body, i.answer_account_id, i.answered_at, i.created_at,
            asker.display_name AS asker_name, asker.email AS asker_email,
            NULL::varchar AS answerer_name, NULL::varchar AS answerer_email
     FROM inserted i
     LEFT JOIN accounts asker ON asker.id = i.asker_account_id`,
    [input.productId, input.askerAccountId, input.body]
  )
  return mapRow(result.rows[0])
}

export async function answerProductQuestion(input: {
  questionId: number
  productId: string
  answerAccountId: string
  answerBody: string
}): Promise<ProductQuestion | null> {
  const result = await query<Row>(
    `WITH updated AS (
       UPDATE product_questions
       SET answer_body = $3,
           answer_account_id = $4,
           answered_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND product_id = $2
       RETURNING *
     )
     SELECT u.id, u.product_id, u.asker_account_id, u.body,
            u.answer_body, u.answer_account_id, u.answered_at, u.created_at,
            asker.display_name AS asker_name, asker.email AS asker_email,
            answerer.display_name AS answerer_name, answerer.email AS answerer_email
     FROM updated u
     LEFT JOIN accounts asker ON asker.id = u.asker_account_id
     LEFT JOIN accounts answerer ON answerer.id = u.answer_account_id`,
    [
      input.questionId,
      input.productId,
      input.answerBody,
      input.answerAccountId,
    ]
  )
  return result.rows[0] ? mapRow(result.rows[0]) : null
}

export async function deleteProductQuestion(input: {
  questionId: number
  askerAccountId: string
}): Promise<boolean> {
  const result = await query(
    `DELETE FROM product_questions
     WHERE id = $1 AND asker_account_id = $2 AND answer_body IS NULL`,
    [input.questionId, input.askerAccountId]
  )
  return (result.rowCount || 0) > 0
}

/** Seller: remove unanswered Q&A only on products they own. */
export async function deleteUnansweredProductQuestionForSeller(input: {
  questionId: number
  sellerAccountId: string
}): Promise<{
  id: number
  productId: string
  productSlug: string
  body: string
  askerAccountId: string
} | null> {
  const result = await query<{
    id: number | string
    product_id: string
    product_slug: string | null
    body: string
    asker_account_id: string
  }>(
    `WITH deleted AS (
       DELETE FROM product_questions q
       USING products p
       WHERE q.id = $1
         AND q.product_id = p.id
         AND p.seller_account_id = $2
         AND q.answer_body IS NULL
       RETURNING q.id, q.product_id, q.body, q.asker_account_id
     )
     SELECT d.id, d.product_id, d.body, d.asker_account_id, p.slug AS product_slug
     FROM deleted d
     LEFT JOIN products p ON p.id = d.product_id`,
    [input.questionId, input.sellerAccountId]
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    id: Number(row.id),
    productId: row.product_id,
    productSlug: row.product_slug?.trim() || row.product_id,
    body: row.body,
    askerAccountId: row.asker_account_id,
  }
}

/** Staff moderation: delete any question (answered or not). */
export async function deleteProductQuestionAsStaff(
  questionId: number
): Promise<{
  id: number
  productId: string
  productSlug: string
  body: string
  askerAccountId: string
  hadAnswer: boolean
} | null> {
  const result = await query<{
    id: number | string
    product_id: string
    product_slug: string | null
    body: string
    asker_account_id: string
    answer_body: string | null
  }>(
    `WITH deleted AS (
       DELETE FROM product_questions
       WHERE id = $1
       RETURNING id, product_id, body, asker_account_id, answer_body
     )
     SELECT d.id, d.product_id, d.body, d.asker_account_id, d.answer_body,
            p.slug AS product_slug
     FROM deleted d
     LEFT JOIN products p ON p.id = d.product_id`,
    [questionId]
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    id: Number(row.id),
    productId: row.product_id,
    productSlug: row.product_slug?.trim() || row.product_id,
    body: row.body,
    askerAccountId: row.asker_account_id,
    hadAnswer: Boolean(row.answer_body),
  }
}

type InboxRow = Row & {
  product_name: string | null
  product_slug: string | null
}

/** Trim/limit search text; strip ILIKE wildcards from user input. */
export function normalizeQaSearch(q?: string | null): string | null {
  const trimmed = (q || '').trim().slice(0, 80)
  if (!trimmed) return null
  const cleaned = trimmed.replace(/[%_]/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned || null
}

/** Unanswered questions on products owned by this seller. */
export async function listUnansweredQuestionsForSeller(
  sellerAccountId: string,
  options?: { limit?: number; q?: string | null }
): Promise<SellerInboxQuestion[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 200))
  const search = normalizeQaSearch(options?.q)
  const params: unknown[] = [sellerAccountId]
  let searchClause = ''
  if (search) {
    params.push(`%${search}%`)
    searchClause = ` AND (
      p.name ILIKE $2
      OR q.body ILIKE $2
      OR COALESCE(asker.display_name, '') ILIKE $2
      OR COALESCE(asker.email, '') ILIKE $2
    )`
  }
  params.push(limit)
  const limitParam = `$${params.length}`

  const result = await query<InboxRow>(
    `SELECT q.id, q.product_id, q.asker_account_id, q.body,
            q.answer_body, q.answer_account_id, q.answered_at, q.created_at,
            asker.display_name AS asker_name, asker.email AS asker_email,
            NULL::varchar AS answerer_name, NULL::varchar AS answerer_email,
            p.name AS product_name, p.slug AS product_slug
     FROM product_questions q
     JOIN products p ON p.id = q.product_id
     LEFT JOIN accounts asker ON asker.id = q.asker_account_id
     WHERE p.seller_account_id = $1
       AND q.answer_body IS NULL
       ${searchClause}
     ORDER BY q.created_at ASC
     LIMIT ${limitParam}`,
    params
  )
  return result.rows.map((row) => ({
    ...mapRow(row),
    productName: row.product_name?.trim() || 'Product',
    productSlug: row.product_slug?.trim() || row.product_id,
  }))
}

export async function countUnansweredQuestionsForSeller(
  sellerAccountId: string
): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM product_questions q
     JOIN products p ON p.id = q.product_id
     WHERE p.seller_account_id = $1
       AND q.answer_body IS NULL`,
    [sellerAccountId]
  )
  return Number(result.rows[0]?.count || 0)
}

type AdminInboxRow = InboxRow & {
  seller_account_id: string | null
  seller_name: string | null
  seller_email: string | null
}

/**
 * Unanswered questions for admin review.
 * Default: platform-owned products (no seller). Pass `all: true` for every open Q.
 */
export async function listUnansweredQuestionsForAdmin(options?: {
  limit?: number
  all?: boolean
  q?: string | null
}): Promise<AdminInboxQuestion[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 200))
  const all = Boolean(options?.all)
  const search = normalizeQaSearch(options?.q)
  const params: unknown[] = []
  let searchClause = ''
  if (search) {
    params.push(`%${search}%`)
    const p = `$${params.length}`
    searchClause = ` AND (
      p.name ILIKE ${p}
      OR q.body ILIKE ${p}
      OR COALESCE(asker.display_name, '') ILIKE ${p}
      OR COALESCE(asker.email, '') ILIKE ${p}
      OR COALESCE(seller.display_name, '') ILIKE ${p}
      OR COALESCE(seller.email, '') ILIKE ${p}
    )`
  }
  params.push(limit)
  const limitParam = `$${params.length}`
  const platformClause = all ? '' : ' AND p.seller_account_id IS NULL'
  const orderClause = all
    ? `ORDER BY
           CASE WHEN p.seller_account_id IS NULL THEN 0 ELSE 1 END,
           q.created_at ASC`
    : 'ORDER BY q.created_at ASC'

  const result = await query<AdminInboxRow>(
    `SELECT q.id, q.product_id, q.asker_account_id, q.body,
            q.answer_body, q.answer_account_id, q.answered_at, q.created_at,
            asker.display_name AS asker_name, asker.email AS asker_email,
            NULL::varchar AS answerer_name, NULL::varchar AS answerer_email,
            p.name AS product_name, p.slug AS product_slug,
            p.seller_account_id,
            seller.display_name AS seller_name, seller.email AS seller_email
     FROM product_questions q
     JOIN products p ON p.id = q.product_id
     LEFT JOIN accounts asker ON asker.id = q.asker_account_id
     LEFT JOIN accounts seller ON seller.id = p.seller_account_id
     WHERE q.answer_body IS NULL
       ${platformClause}
       ${searchClause}
     ${orderClause}
     LIMIT ${limitParam}`,
    params
  )
  return result.rows.map((row) => {
    const sellerAccountId = row.seller_account_id || null
    const isPlatformOwned = !sellerAccountId
    const sellerLabel = isPlatformOwned
      ? 'Platform'
      : row.seller_name?.trim() ||
        (row.seller_email?.includes('@')
          ? row.seller_email.split('@')[0]
          : sellerAccountId)
    return {
      ...mapRow(row),
      productName: row.product_name?.trim() || 'Product',
      productSlug: row.product_slug?.trim() || row.product_id,
      sellerAccountId,
      sellerLabel,
      isPlatformOwned,
    }
  })
}

export async function countUnansweredQuestionsForAdmin(options?: {
  platformOnly?: boolean
}): Promise<number> {
  const platformOnly = options?.platformOnly !== false
  const result = await query<{ count: string }>(
    platformOnly
      ? `SELECT COUNT(*)::text AS count
         FROM product_questions q
         JOIN products p ON p.id = q.product_id
         WHERE q.answer_body IS NULL
           AND p.seller_account_id IS NULL`
      : `SELECT COUNT(*)::text AS count
         FROM product_questions q
         WHERE q.answer_body IS NULL`
  )
  return Number(result.rows[0]?.count || 0)
}
