import { findUserById } from '@/lib/db/users'
import {
  fetchStoreOrderAsAdmin,
  type StoreOrder,
} from '@/lib/catalog/client'
import type { IOrder } from '@/lib/types/order'
import {
  sendOrderShippedEmail,
  sendPurchaseReceipt,
} from '@/emails/index'

function storeOrderToEmailOrder(
  order: StoreOrder,
  user: { email: string; name?: string }
): IOrder {
  return {
    _id: order.id,
    user: { email: user.email, name: user.name || user.email },
    status: order.status,
    items: (order.items || []).map((item, index) => ({
      product: item.productId,
      clientId: `${item.productId}-${index}`,
      name: item.name,
      slug: item.slug || item.productId,
      image: item.image || '/images/placeholder.png',
      category: 'General',
      price: Number(item.price),
      countInStock: item.quantity,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    })),
    shippingAddress: {
      fullName: order.shipping?.fullName || '',
      street: order.shipping?.address || '',
      city: order.shipping?.city || '',
      postalCode: order.shipping?.postalCode || '',
      country: order.shipping?.country || '',
      province: '',
      phone: order.shipping?.phone || '',
    },
    expectedDeliveryDate: new Date(),
    paymentMethod: order.paymentMethod,
    paymentResult: undefined,
    itemsPrice: Number(order.itemsPrice),
    shippingPrice: Number(order.shippingPrice),
    taxPrice: Number(order.taxPrice),
    totalPrice: Number(order.totalPrice),
    isPaid: Boolean(order.isPaid),
    paidAt: order.paidAt ? new Date(order.paidAt) : undefined,
    isDelivered: String(order.status || '').toUpperCase() === 'SHIPPED',
    createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    updatedAt: new Date(),
  }
}

async function orderForEmail(orderId: string): Promise<IOrder | null> {
  const storeOrder = await fetchStoreOrderAsAdmin(orderId)
  if (!storeOrder?.userId) return null
  const account = await findUserById(storeOrder.userId)
  if (!account?.email) {
    console.warn('No buyer email for order', orderId, storeOrder.userId)
    return null
  }
  return storeOrderToEmailOrder(storeOrder, {
    email: account.email,
    name: account.name,
  })
}

/** Fire-and-forget safe: never throws to callers. */
export async function notifyOrderPaid(orderId: string) {
  try {
    const order = await orderForEmail(orderId)
    if (!order) return
    await sendPurchaseReceipt({ order })
  } catch (err) {
    console.error('notifyOrderPaid failed:', err)
  }
}

export async function notifyOrderShipped(orderId: string) {
  try {
    const order = await orderForEmail(orderId)
    if (!order) return
    await sendOrderShippedEmail({ order })
  } catch (err) {
    console.error('notifyOrderShipped failed:', err)
  }
}
