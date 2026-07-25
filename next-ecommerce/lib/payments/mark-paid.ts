import { payStoreOrderAsAdmin, fetchStoreOrderAsAdmin } from '@/lib/catalog/client'
import { notifyOrderPaid } from '@/lib/email/order-notifications'

export type ProcessorPayment = {
  id: string
  captureId?: string
  status: string
  emailAddress?: string
  pricePaid?: string
  paymentMethod: 'PayPal' | 'Stripe'
}

/** Idempotent mark-paid for webhook / system callers. */
export async function markOrderPaidFromWebhook(
  orderId: string,
  payment: ProcessorPayment
) {
  const id = orderId.trim()
  if (!id) throw new Error('orderId required')

  const before = await fetchStoreOrderAsAdmin(id)
  const wasPaid = Boolean(before?.isPaid)
  const updated = await payStoreOrderAsAdmin(id, payment)
  if (!wasPaid) {
    await notifyOrderPaid(id)
  }
  return updated
}
