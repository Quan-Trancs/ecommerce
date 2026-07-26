'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { hasSellerAccess, hasSupportAccess } from '@/lib/auth/roles'
import { formatError } from '@/lib/utils'
import {
  notifyProductQuestionAnswered,
  notifyProductQuestionAsked,
} from '@/lib/email/product-qa'
import {
  answerProductQuestion,
  countUnansweredQuestionsForAdmin,
  countUnansweredQuestionsForSeller,
  createProductQuestion,
  deleteProductQuestion,
  getProductSellerAccountId,
  listProductQuestions,
  listUnansweredQuestionsForAdmin,
  listUnansweredQuestionsForSeller,
  type AdminInboxQuestion,
  type ProductQuestion,
  type SellerInboxQuestion,
} from '@/lib/db/product-qa'

export type { AdminInboxQuestion, ProductQuestion, SellerInboxQuestion }

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
}> {
  const session = await auth()
  const sellerAccountId = await getProductSellerAccountId(productId)
  const questions = await listProductQuestions(productId, { limit: 40 })
  const canAnswer = Boolean(
    session?.user?.id &&
      canAnswerProduct(session.user.id, session.user.role, sellerAccountId)
  )
  return JSON.parse(
    JSON.stringify({
      questions,
      canAnswer,
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

export async function getSellerQaInbox(): Promise<{
  questions: SellerInboxQuestion[]
  unansweredCount: number
}> {
  const session = await auth()
  if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
    return { questions: [], unansweredCount: 0 }
  }
  const [questions, unansweredCount] = await Promise.all([
    listUnansweredQuestionsForSeller(session.user.id, { limit: 50 }),
    countUnansweredQuestionsForSeller(session.user.id),
  ])
  return JSON.parse(
    JSON.stringify({
      questions,
      unansweredCount,
    })
  )
}

export async function getStaffQaInbox(options?: {
  all?: boolean
}): Promise<{
  questions: AdminInboxQuestion[]
  platformCount: number
  allCount: number
  showingAll: boolean
}> {
  const session = await auth()
  if (!session?.user?.id || !hasSupportAccess(session.user.role)) {
    return {
      questions: [],
      platformCount: 0,
      allCount: 0,
      showingAll: false,
    }
  }
  const showingAll = Boolean(options?.all)
  const [questions, platformCount, allCount] = await Promise.all([
    listUnansweredQuestionsForAdmin({ limit: 50, all: showingAll }),
    countUnansweredQuestionsForAdmin({ platformOnly: true }),
    countUnansweredQuestionsForAdmin({ platformOnly: false }),
  ])
  return JSON.parse(
    JSON.stringify({
      questions,
      platformCount,
      allCount,
      showingAll,
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
