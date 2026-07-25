import { findUserById } from '@/lib/db/users'
import {
  fetchProductsByIds,
  fetchStoreOrderAsAdmin,
  type StoreOrder,
} from '@/lib/catalog/client'
import type { IOrder } from '@/lib/types/order'
import {
  sendOrderNoteEmail,
  sendOrderShippedEmail,
  sendPurchaseReceipt,
} from '@/emails/index'
import { SERVER_URL } from '@/lib/constants'
import { roleLabel } from '@/lib/auth/roles'

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

/**
 * Email the buyer and product-scoped sellers when a PUBLIC order note is posted.
 * Skips the author. INTERNAL notes never notify.
 */
export async function notifyPublicOrderNote(input: {
  orderId: string
  authorUserId: string
  authorRole: string
  authorDisplayName?: string | null
  body: string
}) {
  try {
    const storeOrder = await fetchStoreOrderAsAdmin(input.orderId)
    if (!storeOrder) return

    const recipientIds = new Set<string>()
    if (storeOrder.userId) {
      recipientIds.add(storeOrder.userId)
    }

    const productIds = [
      ...new Set(
        (storeOrder.items || [])
          .map((item) => item.productId)
          .filter((id): id is string => Boolean(id))
      ),
    ]
    if (productIds.length) {
      const products = await fetchProductsByIds(productIds)
      for (const product of products) {
        if (product.sellerAccountId) {
          recipientIds.add(product.sellerAccountId)
        }
      }
    }

    recipientIds.delete(input.authorUserId)

    const supportInbox = process.env.SUPPORT_ORDER_NOTES_EMAIL?.trim()
    const emails = new Set<string>()
    for (const userId of recipientIds) {
      const account = await findUserById(userId)
      if (!account?.email) continue
      if (!account.notifyOrderNotes) continue
      emails.add(account.email.trim().toLowerCase())
    }
    if (supportInbox) {
      emails.add(supportInbox.toLowerCase())
    }

    const author = await findUserById(input.authorUserId)
    if (author?.email) {
      emails.delete(author.email.trim().toLowerCase())
    }

    if (!emails.size) return

    const authorLabel =
      input.authorDisplayName?.trim() ||
      author?.name ||
      author?.email ||
      'Someone'
    const orderUrl = `${SERVER_URL}/account/orders/${input.orderId}`

    await Promise.all(
      [...emails].map((to) =>
        sendOrderNoteEmail({
          to,
          orderId: input.orderId,
          authorLabel,
          authorRoleLabel: roleLabel(input.authorRole),
          body: input.body,
          orderUrl,
        })
      )
    )
  } catch (err) {
    console.error('notifyPublicOrderNote failed:', err)
  }
}
