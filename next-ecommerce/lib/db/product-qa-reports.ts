import { query } from '@/lib/db/postgres'
import {
  isQaReportReason,
  type QaReportReason,
} from '@/lib/qa/report-constants'

export type { QaReportReason }
export {
  QA_REPORT_REASONS,
  isQaReportReason,
  qaReportReasonLabel,
} from '@/lib/qa/report-constants'

export type ProductQuestionReport = {
  id: number
  questionId: number
  productId: string
  productName: string
  productSlug: string
  questionBody: string
  answerBody: string | null
  askerName: string
  reason: QaReportReason
  note: string | null
  reporterName: string
  reporterAccountId: string
  status: 'OPEN' | 'DISMISSED' | 'RESOLVED'
  createdAt: string
  openReportCount: number
}

export async function createProductQuestionReport(input: {
  questionId: number
  reporterAccountId: string
  reason: QaReportReason
  note?: string | null
}): Promise<{ created: boolean; alreadyReported: boolean }> {
  const note = (input.note || '').trim().slice(0, 500) || null
  const result = await query(
    `INSERT INTO product_question_reports
       (question_id, reporter_account_id, reason, note, status, created_at)
     VALUES ($1, $2, $3, $4, 'OPEN', NOW())
     ON CONFLICT (question_id, reporter_account_id) DO NOTHING`,
    [input.questionId, input.reporterAccountId, input.reason, note]
  )
  const created = (result.rowCount || 0) > 0
  return { created, alreadyReported: !created }
}

export async function countOpenProductQuestionReports(): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM product_question_reports
     WHERE status = 'OPEN'`
  )
  return Number(result.rows[0]?.count || 0)
}

export async function listOpenProductQuestionReports(options?: {
  limit?: number
}): Promise<ProductQuestionReport[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 200))
  const result = await query<{
    id: number | string
    question_id: number | string
    product_id: string
    product_name: string | null
    product_slug: string | null
    question_body: string
    answer_body: string | null
    asker_name: string | null
    asker_email: string | null
    reason: string
    note: string | null
    reporter_name: string | null
    reporter_email: string | null
    reporter_account_id: string
    status: string
    created_at: Date | string
    open_report_count: number | string
  }>(
    `SELECT r.id, r.question_id, r.reason, r.note, r.status, r.created_at,
            r.reporter_account_id,
            q.product_id, q.body AS question_body, q.answer_body,
            p.name AS product_name, p.slug AS product_slug,
            asker.display_name AS asker_name, asker.email AS asker_email,
            reporter.display_name AS reporter_name, reporter.email AS reporter_email,
            (
              SELECT COUNT(*)::int
              FROM product_question_reports r2
              WHERE r2.question_id = r.question_id AND r2.status = 'OPEN'
            ) AS open_report_count
     FROM product_question_reports r
     JOIN product_questions q ON q.id = r.question_id
     JOIN products p ON p.id = q.product_id
     LEFT JOIN accounts asker ON asker.id = q.asker_account_id
     LEFT JOIN accounts reporter ON reporter.id = r.reporter_account_id
     WHERE r.status = 'OPEN'
     ORDER BY r.created_at ASC
     LIMIT $1`,
    [limit]
  )

  return result.rows.map((row) => {
    const askerName =
      row.asker_name?.trim() ||
      (row.asker_email?.includes('@')
        ? row.asker_email.split('@')[0]
        : 'Customer')
    const reporterName =
      row.reporter_name?.trim() ||
      (row.reporter_email?.includes('@')
        ? row.reporter_email.split('@')[0]
        : 'Reporter')
    return {
      id: Number(row.id),
      questionId: Number(row.question_id),
      productId: row.product_id,
      productName: row.product_name?.trim() || 'Product',
      productSlug: row.product_slug?.trim() || row.product_id,
      questionBody: row.question_body,
      answerBody: row.answer_body,
      askerName,
      reason: (isQaReportReason(row.reason) ? row.reason : 'OTHER') as QaReportReason,
      note: row.note,
      reporterName,
      reporterAccountId: row.reporter_account_id,
      status: 'OPEN',
      createdAt: new Date(row.created_at).toISOString(),
      openReportCount: Number(row.open_report_count) || 1,
    }
  })
}

export async function resolveProductQuestionReports(input: {
  questionId: number
  resolverAccountId: string
  status: 'DISMISSED' | 'RESOLVED'
}): Promise<number> {
  const result = await query(
    `UPDATE product_question_reports
     SET status = $3,
         resolved_at = NOW(),
         resolved_by_account_id = $2
     WHERE question_id = $1
       AND status = 'OPEN'`,
    [input.questionId, input.resolverAccountId, input.status]
  )
  return result.rowCount || 0
}

export async function listViewerReportedQuestionIds(
  questionIds: number[],
  viewerAccountId: string
): Promise<Set<number>> {
  if (!questionIds.length) return new Set()
  const result = await query<{ question_id: number | string }>(
    `SELECT question_id
     FROM product_question_reports
     WHERE reporter_account_id = $1
       AND question_id = ANY($2::bigint[])`,
    [viewerAccountId, questionIds]
  )
  return new Set(result.rows.map((r) => Number(r.question_id)))
}
