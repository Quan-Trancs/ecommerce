import { sendProductQaAnswerEmail, sendProductQaAskedEmail } from '@/emails/index'
import { findUserById } from '@/lib/db/users'
import { createInAppNotification } from '@/lib/db/in-app-notifications'
import { getProductQaListing } from '@/lib/db/product-qa'
import type { ProductQuestion } from '@/lib/db/product-qa'

/** Notify the listing seller when a buyer asks a question. Never throws. */
export async function notifyProductQuestionAsked(input: {
  question: ProductQuestion
  productId: string
  productSlug: string
  sellerAccountId: string
}) {
  try {
    if (input.sellerAccountId === input.question.askerAccountId) return

    const [seller, listing] = await Promise.all([
      findUserById(input.sellerAccountId),
      getProductQaListing(input.productId),
    ])

    const productName = listing?.name || 'a product'
    const productSlug = listing?.slug || input.productSlug
    const questionPreview = input.question.body.slice(0, 160)

    await createInAppNotification({
      accountId: input.sellerAccountId,
      type: 'PRODUCT_QA',
      title: 'New product question',
      body: `${productName}: ${questionPreview}`,
      href: '/seller/questions',
    }).catch(() => undefined)

    if (!seller?.email) {
      console.warn(
        'No seller email for product Q&A ask',
        input.question.id,
        input.sellerAccountId
      )
      return
    }

    await sendProductQaAskedEmail({
      to: seller.email,
      displayName: seller.name,
      productName,
      productSlug,
      questionBody: input.question.body,
      askerName: input.question.askerName,
    })
  } catch (error) {
    console.warn('notifyProductQuestionAsked failed', error)
  }
}

/** Notify the asker when their product question gets an answer. Never throws. */
export async function notifyProductQuestionAnswered(input: {
  question: ProductQuestion
  productId: string
  productSlug: string
  answerBody: string
  answererAccountId: string
}) {
  try {
    if (input.question.askerAccountId === input.answererAccountId) return

    const [asker, listing] = await Promise.all([
      findUserById(input.question.askerAccountId),
      getProductQaListing(input.productId),
    ])

    const productName = listing?.name || 'a product'
    const productSlug = listing?.slug || input.productSlug
    const href = `/product/${productSlug}`
    const answerPreview = input.answerBody.slice(0, 160)

    await createInAppNotification({
      accountId: input.question.askerAccountId,
      type: 'PRODUCT_QA',
      title: 'Your question was answered',
      body: `${productName}: ${answerPreview}`,
      href,
    }).catch(() => undefined)

    if (!asker?.email) {
      console.warn(
        'No asker email for product Q&A answer',
        input.question.id,
        input.question.askerAccountId
      )
      return
    }

    await sendProductQaAnswerEmail({
      to: asker.email,
      displayName: asker.name,
      productName,
      productSlug,
      questionBody: input.question.body,
      answerBody: input.answerBody,
      answererName: input.question.answererName,
    })
  } catch (error) {
    console.warn('notifyProductQuestionAnswered failed', error)
  }
}
