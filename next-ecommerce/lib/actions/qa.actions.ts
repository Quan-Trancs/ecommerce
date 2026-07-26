'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { hasSellerAccess, hasSupportAccess } from '@/lib/auth/roles'
import { formatError } from '@/lib/utils'
import { logStaffAction } from '@/lib/audit/log-staff-action'
import {
  notifyPlatformProductQuestionAsked,
  notifyProductQuestionAnswered,
  notifyProductQuestionAsked,
  notifyStaffProductQuestionReported,
} from '@/lib/email/product-qa'
import {
  answerProductQuestion,
  countUnansweredQuestionsForAdmin,
  countUnansweredQuestionsForSeller,
  createProductQuestion,
  deleteProductQuestion,
  deleteProductQuestionAsStaff,
  deleteUnansweredProductQuestionForSeller,
  getProductQuestionAnswerMeta,
  getProductSellerAccountId,
  getProductQaAutoHideReportThreshold,
  hideProductQuestion,
  listProductQuestions,
  listUnansweredQuestionsForAdmin,
  listUnansweredQuestionsForSeller,
  normalizeQaSearch,
  toggleQuestionHelpful,
  unhideProductQuestionIfAutoHidden,
  type AdminInboxQuestion,
  type ProductQuestion,
  type SellerInboxQuestion,
} from '@/lib/db/product-qa'
import {
  countOpenProductQuestionReports,
  countOpenReportsForQuestion,
  createProductQuestionReport,
  isQaReportReason,
  listOpenProductQuestionReports,
  qaReportReasonLabel,
  resolveProductQuestionReports,
  type ProductQuestionReport,
} from '@/lib/db/product-qa-reports'

export type { AdminInboxQuestion, ProductQuestion, SellerInboxQuestion, ProductQuestionReport }
export { QA_REPORT_REASONS } from '@/lib/qa/report-constants'

function canAnswerProduct(
  sessionUserId: string,
  role: string | undefined,
  sellerAccountId: string | null
) {
  if (hasSupportAccess(role)) return true
  return Boolean(sellerAccountId && sellerAccountId === sessionUserId)
}

export async function getProductQaPanel(productId: string): Promise<{
  questions: ProductQuestion[]
  canAnswer: boolean
  canModerate: boolean
  canSellerHide: boolean
}> {
  const session = await auth()
  const sellerAccountId = await getProductSellerAccountId(productId)
  const questions = await listProductQuestions(productId, {
    limit: 40,
    viewerAccountId: session?.user?.id,
  })
  const canAnswer = Boolean(
    session?.user?.id &&
      canAnswerProduct(session.user.id, session.user.role, sellerAccountId)
  )
  const canModerate = Boolean(
    session?.user?.id && hasSupportAccess(session.user.role)
  )
  const canSellerHide = Boolean(
    session?.user?.id && sellerAccountId === session.user.id
  )
  return JSON.parse(
    JSON.stringify({
      questions,
      canAnswer,
      canModerate,
      canSellerHide,
    })
  )
}

export async function askProductQuestion(input: {
  productId: string
  productSlug: string
  body: string
}): Promise<{ success: boolean; message: string; question?: ProductQuestion }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const productId = input.productId?.trim()
    if (!productId) return { success: false, message: 'Product required' }

    const body = (input.body || '').trim()
    if (body.length < 5) {
      return { success: false, message: 'Question must be at least 5 characters' }
    }
    if (body.length > 2000) {
      return { success: false, message: 'Question is too long' }
    }

    const question = await createProductQuestion({
      productId,
      askerAccountId: session.user.id,
      body,
    })

    const sellerId = await getProductSellerAccountId(productId)
    if (sellerId) {
      await notifyProductQuestionAsked({
        question,
        productId,
        productSlug: input.productSlug,
        sellerAccountId: sellerId,
      })
    } else {
      await notifyPlatformProductQuestionAsked({
        question,
        productId,
        productSlug: input.productSlug,
      })
    }

    revalidatePath(`/product/${input.productSlug}`)
    revalidatePath('/seller/questions')
    revalidatePath('/seller')
    revalidatePath('/admin/questions')
    revalidatePath('/admin')
    revalidatePath('/support/questions')
    revalidatePath('/support')
    return {
      success: true,
      message: 'Question posted',
      question: JSON.parse(JSON.stringify(question)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function answerProductQuestionAction(input: {
  questionId: number
  productId: string
  productSlug: string
  answerBody: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const sellerId = await getProductSellerAccountId(input.productId)
    if (!canAnswerProduct(session.user.id, session.user.role, sellerId)) {
      return {
        success: false,
        message: 'Only the seller, support, or admin can answer',
      }
    }

    const answerBody = (input.answerBody || '').trim()
    if (answerBody.length < 2) {
      return { success: false, message: 'Answer is required' }
    }
    if (answerBody.length > 4000) {
      return { success: false, message: 'Answer is too long' }
    }

    const question = await answerProductQuestion({
      questionId: input.questionId,
      productId: input.productId,
      answerAccountId: session.user.id,
      answerBody,
    })
    if (!question) {
      return { success: false, message: 'Question not found' }
    }

    await notifyProductQuestionAnswered({
      question,
      productId: input.productId,
      productSlug: input.productSlug,
      answerBody,
      answererAccountId: session.user.id,
    })

    revalidatePath(`/product/${input.productSlug}`)
    revalidatePath('/seller/questions')
    revalidatePath('/seller')
    revalidatePath('/admin/questions')
    revalidatePath('/admin')
    revalidatePath('/support/questions')
    revalidatePath('/support')
    return { success: true, message: 'Answer posted' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function getSellerQaInbox(options?: {
  q?: string | null
}): Promise<{
  questions: SellerInboxQuestion[]
  unansweredCount: number
  query: string | null
}> {
  const session = await auth()
  if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
    return { questions: [], unansweredCount: 0, query: null }
  }
  const query = normalizeQaSearch(options?.q)
  const [questions, unansweredCount] = await Promise.all([
    listUnansweredQuestionsForSeller(session.user.id, {
      limit: 50,
      q: query,
    }),
    countUnansweredQuestionsForSeller(session.user.id),
  ])
  return JSON.parse(
    JSON.stringify({
      questions,
      unansweredCount,
      query,
    })
  )
}

export async function getStaffQaInbox(options?: {
  all?: boolean
  q?: string | null
}): Promise<{
  questions: AdminInboxQuestion[]
  platformCount: number
  allCount: number
  showingAll: boolean
  query: string | null
  openReportCount: number
}> {
  const session = await auth()
  if (!session?.user?.id || !hasSupportAccess(session.user.role)) {
    return {
      questions: [],
      platformCount: 0,
      allCount: 0,
      showingAll: false,
      query: null,
      openReportCount: 0,
    }
  }
  const showingAll = Boolean(options?.all)
  const query = normalizeQaSearch(options?.q)
  const [questions, platformCount, allCount, openReportCount] =
    await Promise.all([
      listUnansweredQuestionsForAdmin({
        limit: 50,
        all: showingAll,
        q: query,
      }),
      countUnansweredQuestionsForAdmin({ platformOnly: true }),
      countUnansweredQuestionsForAdmin({ platformOnly: false }),
      countOpenProductQuestionReports(),
    ])
  return JSON.parse(
    JSON.stringify({
      questions,
      platformCount,
      allCount,
      showingAll,
      query,
      openReportCount,
    })
  )
}

/** @deprecated Prefer getStaffQaInbox — same data for admin/support. */
export async function getAdminQaInbox(options?: {
  all?: boolean
}) {
  return getStaffQaInbox(options)
}

export async function removeMyProductQuestion(input: {
  questionId: number
  productSlug: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const ok = await deleteProductQuestion({
      questionId: input.questionId,
      askerAccountId: session.user.id,
    })
    if (!ok) {
      return {
        success: false,
        message: 'Question not found or already answered',
      }
    }
    revalidatePath(`/product/${input.productSlug}`)
    return { success: true, message: 'Question removed' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

/** SUPPORT/ADMIN: remove abusive or off-topic Q&A (answered or not). */
export async function moderateDeleteProductQuestion(input: {
  questionId: number
  productSlug?: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasSupportAccess(session.user.role)) {
      return { success: false, message: 'Support or admin required' }
    }

    const deleted = await deleteProductQuestionAsStaff(input.questionId)
    if (!deleted) {
      return { success: false, message: 'Question not found' }
    }

    await logStaffAction({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: 'PRODUCT_QA_DELETE',
      entityType: 'product_question',
      entityId: String(deleted.id),
      summary: `Removed product Q&A on ${deleted.productSlug}`,
      metadata: {
        productId: deleted.productId,
        askerAccountId: deleted.askerAccountId,
        hadAnswer: deleted.hadAnswer,
        bodyPreview: deleted.body.slice(0, 160),
      },
    })

    const slug = input.productSlug || deleted.productSlug
    revalidatePath(`/product/${slug}`)
    revalidatePath('/seller/questions')
    revalidatePath('/seller')
    revalidatePath('/admin/questions')
    revalidatePath('/admin')
    revalidatePath('/support/questions')
    revalidatePath('/support')
    return { success: true, message: 'Question removed' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

/** Seller: hide unanswered Q&A on their own listing. */
export async function sellerHideProductQuestion(input: {
  questionId: number
  productSlug?: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
      return { success: false, message: 'Seller access required' }
    }

    const deleted = await deleteUnansweredProductQuestionForSeller({
      questionId: input.questionId,
      sellerAccountId: session.user.id,
    })
    if (!deleted) {
      return {
        success: false,
        message: 'Question not found, already answered, or not your listing',
      }
    }

    const slug = input.productSlug || deleted.productSlug
    revalidatePath(`/product/${slug}`)
    revalidatePath('/seller/questions')
    revalidatePath('/seller')
    revalidatePath('/admin/questions')
    revalidatePath('/admin')
    revalidatePath('/support/questions')
    revalidatePath('/support')
    return { success: true, message: 'Question hidden' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

/** Signed-in buyers: mark/unmark an answer as helpful. */
export async function toggleProductQuestionHelpful(input: {
  questionId: number
  productSlug: string
}): Promise<{
  success: boolean
  message: string
  marked?: boolean
  helpfulCount?: number
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }

    const meta = await getProductQuestionAnswerMeta(input.questionId)
    if (!meta || !meta.answered) {
      return { success: false, message: 'Answered question required' }
    }
    if (meta.answerAccountId === session.user.id) {
      return {
        success: false,
        message: 'You cannot mark your own answer as helpful',
      }
    }

    const result = await toggleQuestionHelpful({
      questionId: input.questionId,
      accountId: session.user.id,
    })
    revalidatePath(`/product/${input.productSlug}`)
    return {
      success: true,
      message: result.marked ? 'Marked helpful' : 'Removed helpful mark',
      marked: result.marked,
      helpfulCount: result.helpfulCount,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function reportProductQuestion(input: {
  questionId: number
  productId: string
  productSlug: string
  reason: string
  note?: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    if (!isQaReportReason(input.reason)) {
      return { success: false, message: 'Choose a report reason' }
    }

    const meta = await getProductQuestionAnswerMeta(input.questionId)
    if (!meta || meta.productId !== input.productId) {
      return { success: false, message: 'Question not found' }
    }
    if (meta.askerAccountId === session.user.id) {
      return { success: false, message: 'You cannot report your own question' }
    }

    const result = await createProductQuestionReport({
      questionId: input.questionId,
      reporterAccountId: session.user.id,
      reason: input.reason,
      note: input.note,
    })
    if (result.alreadyReported) {
      return { success: false, message: 'You already reported this question' }
    }

    const openForQuestion = await countOpenReportsForQuestion(input.questionId)
    const threshold = getProductQaAutoHideReportThreshold()
    let autoHidden = false
    if (openForQuestion >= threshold) {
      autoHidden = await hideProductQuestion({
        questionId: input.questionId,
        reason: 'AUTO_REPORTS',
      })
      if (autoHidden) {
        await logStaffAction({
          actorId: session.user.id,
          actorRole: session.user.role,
          action: 'PRODUCT_QA_AUTO_HIDE',
          entityType: 'product_question',
          entityId: String(input.questionId),
          summary: `Auto-hid Q&A after ${openForQuestion} open reports`,
          metadata: { threshold, openForQuestion },
        })
      }
    }

    await notifyStaffProductQuestionReported({
      productId: input.productId,
      productSlug: input.productSlug,
      questionBody: meta.body,
      reasonLabel: qaReportReasonLabel(input.reason),
    })

    revalidatePath(`/product/${input.productSlug}`)
    revalidatePath('/admin/questions/reports')
    revalidatePath('/support/questions/reports')
    revalidatePath('/admin/questions')
    revalidatePath('/support/questions')
    revalidatePath('/seller/questions')
    revalidatePath('/seller')
    return {
      success: true,
      message: autoHidden
        ? 'Report submitted — question hidden pending review'
        : 'Report submitted',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function getStaffQaReportsInbox(): Promise<{
  reports: ProductQuestionReport[]
  openCount: number
}> {
  const session = await auth()
  if (!session?.user?.id || !hasSupportAccess(session.user.role)) {
    return { reports: [], openCount: 0 }
  }
  const [reports, openCount] = await Promise.all([
    listOpenProductQuestionReports({ limit: 50 }),
    countOpenProductQuestionReports(),
  ])
  return JSON.parse(JSON.stringify({ reports, openCount }))
}

export async function dismissProductQuestionReport(input: {
  questionId: number
  productSlug?: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasSupportAccess(session.user.role)) {
      return { success: false, message: 'Support or admin required' }
    }
    const updated = await resolveProductQuestionReports({
      questionId: input.questionId,
      resolverAccountId: session.user.id,
      status: 'DISMISSED',
    })
    if (!updated) {
      return { success: false, message: 'No open reports for this question' }
    }
    const restored = await unhideProductQuestionIfAutoHidden(input.questionId)
    await logStaffAction({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: 'PRODUCT_QA_REPORT_DISMISS',
      entityType: 'product_question',
      entityId: String(input.questionId),
      summary: restored
        ? `Dismissed Q&A reports and restored question #${input.questionId}`
        : `Dismissed Q&A reports on question #${input.questionId}`,
      metadata: { restored },
    })
    if (input.productSlug) {
      revalidatePath(`/product/${input.productSlug}`)
    }
    revalidatePath('/admin/questions/reports')
    revalidatePath('/support/questions/reports')
    revalidatePath('/admin/questions')
    revalidatePath('/support/questions')
    revalidatePath('/seller/questions')
    return {
      success: true,
      message: restored
        ? 'Reports dismissed — question restored to the product page'
        : 'Reports dismissed',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
