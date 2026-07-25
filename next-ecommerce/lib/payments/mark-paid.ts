import { payStoreOrderAsAdmin } from '@/lib/catalog/client'

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
  return payStoreOrderAsAdmin(id, payment)
}
