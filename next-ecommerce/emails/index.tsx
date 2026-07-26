import { Resend } from 'resend'
import PurchaseReceiptEmail from './purchase-receipt'
import OrderShippedEmail from './order-shipped'
import OrderNoteEmail from './order-note'
import OrderNoteDigestEmail, {
  type DigestNoteItem,
} from './order-note-digest'
import OrderReturnEmail, {
  type OrderReturnEmailKind,
} from './order-return'
import AbandonedCartEmail from './abandoned-cart'
import ProductQaAnswerEmail from './product-qa-answer'
import { SENDER_EMAIL, SENDER_NAME } from '@/lib/constants'
import { IOrder } from '@/lib/types/order'
import type { AbandonedCartItem } from '@/lib/db/abandoned-carts'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function resolveRecipient(order: IOrder): string | null {
  if (typeof order.user === 'object' && order.user?.email) {
    return order.user.email
  }
  return null
}

export const sendPurchaseReceipt = async ({ order }: { order: IOrder }) => {
  const resend = getResend()
  const to = resolveRecipient(order)
  if (!resend || !to) {
    console.warn(
      'Skipping purchase receipt email:',
      !resend ? 'RESEND_API_KEY missing' : 'buyer email missing'
    )
    return { sent: false as const }
  }

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to,
    subject: 'Order Confirmation',
    react: <PurchaseReceiptEmail order={order} />,
  })
  return { sent: true as const }
}

export const sendOrderShippedEmail = async ({ order }: { order: IOrder }) => {
  const resend = getResend()
  const to = resolveRecipient(order)
  if (!resend || !to) {
    console.warn(
      'Skipping shipped email:',
      !resend ? 'RESEND_API_KEY missing' : 'buyer email missing'
    )
    return { sent: false as const }
  }

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to,
    subject: 'Your order has shipped',
    react: <OrderShippedEmail order={order} />,
  })
  return { sent: true as const }
}

export const sendOrderNoteEmail = async (input: {
  to: string
  orderId: string
  authorLabel: string
  authorRoleLabel: string
  body: string
  orderUrl: string
}) => {
  const resend = getResend()
  if (!resend) {
    console.warn('Skipping order note email: RESEND_API_KEY missing')
    return { sent: false as const }
  }
  const to = input.to.trim()
  if (!to) {
    return { sent: false as const }
  }

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to,
    subject: `New message on order ${input.orderId}`,
    react: (
      <OrderNoteEmail
        orderId={input.orderId}
        authorLabel={input.authorLabel}
        authorRoleLabel={input.authorRoleLabel}
        body={input.body}
        orderUrl={input.orderUrl}
      />
    ),
  })
  return { sent: true as const }
}

export const sendOrderNoteDigestEmail = async (input: {
  to: string
  notes: DigestNoteItem[]
}) => {
  const resend = getResend()
  if (!resend) {
    console.warn('Skipping order note digest: RESEND_API_KEY missing')
    return { sent: false as const }
  }
  const to = input.to.trim()
  if (!to || !input.notes.length) {
    return { sent: false as const }
  }

  const count = input.notes.length
  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to,
    subject:
      count === 1
        ? `New message on order ${input.notes[0].orderId}`
        : `${count} new order messages`,
    react: <OrderNoteDigestEmail notes={input.notes} />,
  })
  return { sent: true as const }
}

export const sendOrderReturnEmail = async (input: {
  to: string
  orderId: string
  returnId: number
  kind: OrderReturnEmailKind
  reasonLabel: string
  buyerNote?: string | null
  reviewNote?: string | null
  refundAmount?: number | null
  lines: Array<{ name: string; quantity: number }>
}) => {
  const resend = getResend()
  const to = input.to.trim()
  if (!resend || !to) {
    console.warn(
      'Skipping return email:',
      !resend ? 'RESEND_API_KEY missing' : 'buyer email missing'
    )
    return { sent: false as const }
  }

  const subject =
    input.kind === 'SUBMITTED'
      ? `Return request received for order ${input.orderId}`
      : input.kind === 'APPROVED'
        ? `Return approved for order ${input.orderId}`
        : `Return update for order ${input.orderId}`

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to,
    subject,
    react: (
      <OrderReturnEmail
        orderId={input.orderId}
        returnId={input.returnId}
        kind={input.kind}
        reasonLabel={input.reasonLabel}
        buyerNote={input.buyerNote}
        reviewNote={input.reviewNote}
        refundAmount={input.refundAmount}
        lines={input.lines}
      />
    ),
  })
  return { sent: true as const }
}

export const sendAbandonedCartEmail = async (input: {
  to: string
  displayName?: string | null
  items: AbandonedCartItem[]
  itemsTotal: number
}) => {
  const resend = getResend()
  const to = input.to.trim()
  if (!resend || !to) {
    console.warn(
      'Skipping abandoned cart email:',
      !resend ? 'RESEND_API_KEY missing' : 'buyer email missing'
    )
    return { sent: false as const }
  }

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to,
    subject: 'You left items in your cart',
    react: (
      <AbandonedCartEmail
        displayName={input.displayName}
        items={input.items}
        itemsTotal={input.itemsTotal}
      />
    ),
  })
  return { sent: true as const }
}

export const sendProductQaAnswerEmail = async (input: {
  to: string
  displayName?: string | null
  productName: string
  productSlug: string
  questionBody: string
  answerBody: string
  answererName?: string | null
}) => {
  const resend = getResend()
  const to = input.to.trim()
  if (!resend || !to) {
    console.warn(
      'Skipping product Q&A answer email:',
      !resend ? 'RESEND_API_KEY missing' : 'buyer email missing'
    )
    return { sent: false as const }
  }

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to,
    subject: `Your question about ${input.productName} was answered`,
    react: (
      <ProductQaAnswerEmail
        displayName={input.displayName}
        productName={input.productName}
        productSlug={input.productSlug}
        questionBody={input.questionBody}
        answerBody={input.answerBody}
        answererName={input.answererName}
      />
    ),
  })
  return { sent: true as const }
}
