import { sendProductQaAnswerEmail } from '@/emails/index'
import { findUserById } from '@/lib/db/users'
import { createInAppNotification } from '@/lib/db/in-app-notifications'
import { getProductQaListing } from '@/lib/db/product-qa'
import type { ProductQuestion } from '@/lib/db/product-qa'

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
