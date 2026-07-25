import { Resend } from 'resend'
import PurchaseReceiptEmail from './purchase-receipt'
import OrderShippedEmail from './order-shipped'
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
