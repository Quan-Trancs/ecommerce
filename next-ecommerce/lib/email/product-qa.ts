import { sendProductQaAnswerEmail, sendProductQaAskedEmail } from '@/emails/index'
import { findUserById } from '@/lib/db/users'
import { createInAppNotification } from '@/lib/db/in-app-notifications'
import { listSupportStaff } from '@/lib/db/support-ticket-assignments'
import { getProductQaListing } from '@/lib/db/product-qa'
import type { ProductQuestion } from '@/lib/db/product-qa'
import { ROLES, normalizeRole } from '@/lib/auth/roles'

function staffQaInboxPath(role?: string | null) {
  return normalizeRole(role) === ROLES.ADMIN
    ? '/admin/questions'
    : '/support/questions'
}

function staffQaReportsPath(role?: string | null) {
  return normalizeRole(role) === ROLES.ADMIN
    ? '/admin/questions/reports'
    : '/support/questions/reports'
}

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
      inboxPath: '/seller/questions',
    })
  } catch (error) {
    console.warn('notifyProductQuestionAsked failed', error)
  }
}

/**
 * Platform listings (no seller): notify SUPPORT/ADMIN in-app + email.
 * Optional SUPPORT_PRODUCT_QA_EMAIL (falls back to SUPPORT_ORDER_NOTES_EMAIL).
 */
export async function notifyPlatformProductQuestionAsked(input: {
  question: ProductQuestion
  productId: string
  productSlug: string
}) {
  try {
    const [staff, listing] = await Promise.all([
      listSupportStaff(),
      getProductQaListing(input.productId),
    ])

    const productName = listing?.name || 'a product'
    const productSlug = listing?.slug || input.productSlug
    const questionPreview = input.question.body.slice(0, 160)
    const recipients = staff.filter(
      (s) => s.id !== input.question.askerAccountId
    )

    await Promise.all(
      recipients.map((member) =>
        createInAppNotification({
          accountId: member.id,
          type: 'PRODUCT_QA',
          title: 'Platform product question',
          body: `${productName}: ${questionPreview}`,
          href: staffQaInboxPath(member.role),
        }).catch(() => undefined)
      )
    )

    const emailed = new Set<string>()
    for (const member of recipients) {
      const email = member.email?.trim().toLowerCase()
      if (!email || emailed.has(email)) continue
      emailed.add(email)
      await sendProductQaAskedEmail({
        to: member.email,
        displayName: member.name,
        productName,
        productSlug,
        questionBody: input.question.body,
        askerName: input.question.askerName,
        inboxPath: staffQaInboxPath(member.role),
      })
    }

    const sharedInbox =
      process.env.SUPPORT_PRODUCT_QA_EMAIL?.trim() ||
      process.env.SUPPORT_ORDER_NOTES_EMAIL?.trim()
    if (sharedInbox) {
      const email = sharedInbox.toLowerCase()
      if (!emailed.has(email)) {
        await sendProductQaAskedEmail({
          to: sharedInbox,
          displayName: null,
          productName,
          productSlug,
          questionBody: input.question.body,
          askerName: input.question.askerName,
          inboxPath: '/support/questions',
        })
      }
    }
  } catch (error) {
    console.warn('notifyPlatformProductQuestionAsked failed', error)
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

/** In-app notify SUPPORT/ADMIN about a buyer Q&A report. Never throws. */
export async function notifyStaffProductQuestionReported(input: {
  productId: string
  productSlug: string
  questionBody: string
  reasonLabel: string
}) {
  try {
    const [staff, listing] = await Promise.all([
      listSupportStaff(),
      getProductQaListing(input.productId),
    ])
    const productName = listing?.name || 'a product'
    const preview = input.questionBody.slice(0, 120)

    await Promise.all(
      staff.map((member) =>
        createInAppNotification({
          accountId: member.id,
          type: 'PRODUCT_QA_REPORT',
          title: 'Product Q&A reported',
          body: `${productName} · ${input.reasonLabel}: ${preview}`,
          href: staffQaReportsPath(member.role),
        }).catch(() => undefined)
      )
    )
  } catch (error) {
    console.warn('notifyStaffProductQuestionReported failed', error)
  }
}
