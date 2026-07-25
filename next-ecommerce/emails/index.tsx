import { Resend } from 'resend'
import PurchaseReceiptEmail from './purchase-receipt'
import OrderShippedEmail from './order-shipped'
import OrderNoteEmail from './order-note'
import OrderNoteDigestEmail, {
  type DigestNoteItem,
} from './order-note-digest'
import { SENDER_EMAIL, SENDER_NAME } from '@/lib/constants'
import { IOrder } from '@/lib/types/order'

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
