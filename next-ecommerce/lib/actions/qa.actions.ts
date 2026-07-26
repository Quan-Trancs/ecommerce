'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { hasAdminAccess, hasSellerAccess } from '@/lib/auth/roles'
import { formatError } from '@/lib/utils'
import { createInAppNotification } from '@/lib/db/in-app-notifications'
import {
  answerProductQuestion,
  countUnansweredQuestionsForSeller,
  createProductQuestion,
  deleteProductQuestion,
  getProductSellerAccountId,
  listProductQuestions,
  listUnansweredQuestionsForSeller,
  type ProductQuestion,
  type SellerInboxQuestion,
} from '@/lib/db/product-qa'

export type { ProductQuestion, SellerInboxQuestion }

function canAnswerProduct(
  sessionUserId: string,
  role: string | undefined,
  sellerAccountId: string | null
) {
  if (hasAdminAccess(role)) return true
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
    if (sellerId && sellerId !== session.user.id) {
      await createInAppNotification({
        accountId: sellerId,
        type: 'PRODUCT_QA',
        title: 'New product question',
        body: body.slice(0, 160),
        href: '/seller/questions',
      }).catch(() => undefined)
    }

    revalidatePath(`/product/${input.productSlug}`)
    revalidatePath('/seller/questions')
    revalidatePath('/seller')
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
      return { success: false, message: 'Only the seller or admin can answer' }
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

    if (question.askerAccountId !== session.user.id) {
      await createInAppNotification({
        accountId: question.askerAccountId,
        type: 'PRODUCT_QA',
        title: 'Your question was answered',
        body: answerBody.slice(0, 160),
        href: `/product/${input.productSlug}`,
      }).catch(() => undefined)
    }

    revalidatePath(`/product/${input.productSlug}`)
    revalidatePath('/seller/questions')
    revalidatePath('/seller')
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
