'use server'

import { Cart, OrderItem, ShippingAddress } from '@/types'
import { AVAILABLE_DELIVERY_DATES } from '../constants'
import { formatError, roundToTwoDecimals } from '../utils'
import { auth } from '@/auth'
import type { IOrder } from '@/lib/types/order'
import { paypal } from '../paypal'
import { revalidatePath } from 'next/cache'
import {
  cancelStoreOrder,
  createStoreOrder,
  createStoreOrderNote,
  fetchMyStoreOrders,
  fetchProductsByIds,
  fetchStoreOrder,
  fetchStoreOrderNotes,
  payStoreOrder,
  type StoreOrder,
  type StoreOrderNote,
} from '@/lib/catalog/client'
import { hasSupportAccess } from '@/lib/auth/roles'
import type { StoreTokenSubject } from '@/lib/auth/store-token'
import { refundPaymentIntent, retrievePaymentIntent } from '@/lib/stripe'
import { notifyOrderPaid, notifyPublicOrderNote } from '@/lib/email/order-notifications'

function assertCatalogMatchesCart(items: OrderItem[], catalogById: Map<string, { price: number; stockQuantity?: number; variants?: { color?: string; size?: string; price: number; stockQuantity?: number }[] }>) {
  for (const item of items) {
    const product = catalogById.get(String(item.product))
    if (!product) {
      throw new Error(`Product unavailable: ${item.name}`)
    }

    const variant = product.variants?.find(
      (v) =>
        (!item.color || v.color?.toLowerCase() === item.color.toLowerCase()) &&
        (!item.size || v.size?.toLowerCase() === item.size.toLowerCase())
    )

    const livePrice = roundToTwoDecimals(variant?.price ?? product.price)
    const liveStock = variant?.stockQuantity ?? product.stockQuantity ?? 0

    if (Math.abs(livePrice - item.price) > 0.01) {
      throw new Error(
        `Price changed for ${item.name}. Refresh cart and try again.`
      )
    }
    if (item.quantity > liveStock) {
      throw new Error(
        `Insufficient stock for ${item.name} (available: ${liveStock}).`
      )
    }
  }
}

function storeOrderToClient(order: StoreOrder): IOrder {
  return {
    _id: order.id,
    user: order.userId,
    status: order.status,
    items: (order.items || []).map((item, index) => ({
      product: item.productId,
      clientId: `${item.productId}-${index}`,
      name: item.name,
      slug: item.slug,
      image: item.image,
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
    isDelivered:
      String(order.status || '').toUpperCase() === 'SHIPPED' ||
      ((order.items || []).length > 0 &&
        (order.items || []).every((item) => Boolean(item.isShipped))),
    hasShippedLines: (order.items || []).some((item) => Boolean(item.isShipped)),
    createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    updatedAt: new Date(),
  }
}

export const createOrder = async (clientSideCart: Cart) => {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('User not authenticated')

    const subject: StoreTokenSubject = {
      userId: session.user.id,
      email: session.user.email,
      displayName: session.user.name,
      role: session.user.role,
    }

    const createOrder = await createOrderFromCart(clientSideCart, subject)

    return {
      success: true,
      message: 'Order created successfully',
      data: { orderId: createOrder._id.toString() },
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export const createOrderFromCart = async (
  clientSideCart: Cart,
  subject: StoreTokenSubject
) => {
  const priced = await calculateDeliveryDateAndPrice({
    items: clientSideCart.items,
    shippingAddress: clientSideCart.shippingAddress,
    deliveryDateIndex: clientSideCart.deliveryDateIndex,
  })
  const cart = {
    ...clientSideCart,
    ...priced,
  }

  const productIds = cart.items.map((item) => String(item.product))
  const catalogProducts = await fetchProductsByIds(productIds)
  if (!catalogProducts.length && productIds.length) {
    throw new Error('Catalog unavailable — cannot place order safely')
  }

  const catalogById = new Map(
    catalogProducts.map((p) => [
      p.id,
      {
        price: p.price,
        stockQuantity: p.stockQuantity,
        variants: p.variants,
      },
    ])
  )
  assertCatalogMatchesCart(cart.items, catalogById)

  const shipping = cart.shippingAddress
  if (!shipping) throw new Error('Shipping address required')

  const storeOrder = await createStoreOrder(
    {
      paymentMethod: cart.paymentMethod || 'PayPal',
      itemsPrice: cart.itemsPrice!,
      shippingPrice: cart.shippingPrice ?? 0,
      taxPrice: cart.taxPrice ?? 0,
      totalPrice: cart.totalPrice!,
      shipping: {
        fullName: shipping.fullName,
        address: shipping.street,
        city: shipping.city,
        postalCode: shipping.postalCode,
        country: shipping.country,
        phone: shipping.phone,
      },
      items: cart.items.map((item) => ({
        productId: String(item.product),
        name: item.name,
        slug: item.slug,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
      })),
    },
    subject
  )
  return storeOrderToClient(storeOrder)
}

function subjectFromSession(session: {
  user: {
    id?: string | null
    email?: string | null
    name?: string | null
    role?: string | null
  }
}): StoreTokenSubject {
  return {
    userId: session.user.id!,
    email: session.user.email,
    displayName: session.user.name,
    role: session.user.role,
  }
}

export async function getOrderById(orderId: string): Promise<IOrder> {
  const session = await auth()
  const subject = session?.user?.id ? subjectFromSession(session) : undefined
  const storeOrder = await fetchStoreOrder(orderId, subject)
  if (!storeOrder) throw new Error('Order not found')
  return JSON.parse(JSON.stringify(storeOrderToClient(storeOrder)))
}

export async function getMyOrders(filters?: {
  status?: string
  from?: string
  to?: string
}): Promise<IOrder[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('User not authenticated')

  const subject = subjectFromSession(session)
  const storeOrders = await fetchMyStoreOrders(subject, filters)
  return JSON.parse(
    JSON.stringify(storeOrders.map((order) => storeOrderToClient(order)))
  )
}

export async function createPayPalOrder(orderId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('User not authenticated')
    const subject = subjectFromSession(session)

    const order = await getOrderById(orderId)
    const paypalOrder = await paypal.createOrder(order.totalPrice, {
      customId: orderId,
    })

    const storeOrder = await fetchStoreOrder(orderId, subject)
    if (!storeOrder) throw new Error('Order not found')

    return {
      success: true,
      message: 'PayPal order created successfully',
      data: paypalOrder.id,
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

export async function approvePayPalOrder(
  orderId: string,
  data: { orderID: string }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('User not authenticated')
    const subject = subjectFromSession(session)

    const captureData = await paypal.capturePayment(data.orderID)
    if (!captureData || captureData.status !== 'COMPLETED') {
      throw new Error('Error in paypal payment')
    }

    const storeOrder = await fetchStoreOrder(orderId, subject)
    if (!storeOrder) throw new Error('Order not found')
    const wasPaid = Boolean(storeOrder.isPaid)

    await payStoreOrder(
      orderId,
      {
        id: captureData.id,
        captureId:
          captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
        status: captureData.status,
        emailAddress: captureData.payer?.email_address,
        pricePaid:
          captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount
            ?.value,
        paymentMethod: 'PayPal',
      },
      subject
    )
    if (!wasPaid) {
      await notifyOrderPaid(orderId)
    }
    revalidatePath(`/account/orders/${orderId}`)
    return {
      success: true,
      message: 'Your order has been successfully paid by PayPal',
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

export async function approveStripeOrder(
  orderId: string,
  data: { paymentIntentId: string }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('User not authenticated')
    const subject = subjectFromSession(session)

    const paymentIntent = await retrievePaymentIntent(data.paymentIntentId)
    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Stripe payment not completed (${paymentIntent.status})`)
    }
    if (paymentIntent.metadata?.orderId && paymentIntent.metadata.orderId !== orderId) {
      throw new Error('PaymentIntent does not match this order')
    }

    const storeOrder = await fetchStoreOrder(orderId, subject)
    if (!storeOrder) throw new Error('Order not found')
    const wasPaid = Boolean(storeOrder.isPaid)

    const amountPaid =
      typeof paymentIntent.amount_received === 'number'
        ? (paymentIntent.amount_received / 100).toFixed(2)
        : undefined

    await payStoreOrder(
      orderId,
      {
        id: paymentIntent.id,
        status: paymentIntent.status,
        pricePaid: amountPaid,
        paymentMethod: 'Stripe',
      },
      subject
    )
    if (!wasPaid) {
      await notifyOrderPaid(orderId)
    }
    revalidatePath(`/account/orders/${orderId}`)
    return {
      success: true as const,
      message: 'Your order has been successfully paid by Stripe',
    }
  } catch (err) {
    return { success: false as const, message: formatError(err) }
  }
}

export async function cancelOrder(orderId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('User not authenticated')
    const subject = subjectFromSession(session)

    const storeOrder = await fetchStoreOrder(orderId, subject)
    if (!storeOrder) throw new Error('Order not found')

    if (String(storeOrder.status || '').toUpperCase() === 'CANCELLED') {
      return {
        success: true as const,
        message: 'Order already cancelled',
      }
    }

    const isPaid = Boolean(storeOrder.isPaid)
    const paymentMethod = (storeOrder.paymentMethod || '').toLowerCase()
    const elevate = hasSupportAccess(session.user.role)

    let refundMeta:
      | {
          refundId?: string
          refundStatus?: string
          refundSkipped?: boolean
          refundNote?: string
        }
      | undefined

    if (isPaid && elevate) {
      if (paymentMethod === 'paypal') {
        const captureId = await resolvePayPalCaptureId(storeOrder.paymentResultJson)
        if (!captureId) {
          throw new Error(
            'Cannot refund: PayPal capture id missing. Cancel aborted — refund manually in PayPal, then retry or ask an admin.'
          )
        }
        const refund = await paypal.refundCapture(captureId)
        const refundStatus = String(refund?.status || '').toUpperCase()
        if (refundStatus && !['COMPLETED', 'PENDING'].includes(refundStatus)) {
          throw new Error(`PayPal refund failed with status ${refundStatus}`)
        }
        refundMeta = {
          refundId: refund?.id,
          refundStatus: refund?.status || 'COMPLETED',
        }
      } else if (paymentMethod === 'stripe') {
        const paymentIntentId = resolveStripePaymentIntentId(
          storeOrder.paymentResultJson
        )
        if (!paymentIntentId) {
          throw new Error(
            'Cannot refund: Stripe PaymentIntent id missing. Cancel aborted — refund manually in Stripe, then retry.'
          )
        }
        const refund = await refundPaymentIntent(paymentIntentId)
        refundMeta = {
          refundId: refund.id,
          refundStatus: refund.status || 'succeeded',
        }
      } else {
        refundMeta = {
          refundSkipped: true,
          refundNote: `No automatic refund for payment method ${storeOrder.paymentMethod || 'unknown'}`,
        }
      }
    }

    await cancelStoreOrder(orderId, subject, refundMeta)
    revalidatePath(`/account/orders/${orderId}`)
    revalidatePath('/account/orders')
    revalidatePath('/seller/orders')
    revalidatePath('/support')
    revalidatePath('/admin/orders')

    if (refundMeta?.refundId) {
      const processor = paymentMethod === 'stripe' ? 'Stripe' : 'PayPal'
      return {
        success: true as const,
        message: `Order cancelled, stock restored, and ${processor} refund submitted`,
      }
    }
    if (refundMeta?.refundSkipped) {
      return {
        success: true as const,
        message:
          'Order cancelled and stock restored (payment refund skipped — see order payment notes)',
      }
    }
    return {
      success: true as const,
      message: 'Order cancelled and stock restored',
    }
  } catch (err) {
    return { success: false as const, message: formatError(err) }
  }
}

type PaymentResultShape = {
  id?: string
  capture_id?: string
  captureId?: string
  price_paid?: string
  refund_id?: string
  payment_intent_id?: string
}

function resolveStripePaymentIntentId(
  paymentResultJson?: string | null
): string | null {
  if (!paymentResultJson) return null
  let parsed: PaymentResultShape
  try {
    parsed = JSON.parse(paymentResultJson) as PaymentResultShape
  } catch {
    return null
  }
  if (parsed.refund_id) {
    throw new Error('Order payment already has a refund recorded')
  }
  const id = parsed.payment_intent_id || parsed.id
  if (id && String(id).startsWith('pi_')) return String(id)
  return id ? String(id) : null
}

async function resolvePayPalCaptureId(
  paymentResultJson?: string | null
): Promise<string | null> {
  if (!paymentResultJson) return null
  let parsed: PaymentResultShape
  try {
    parsed = JSON.parse(paymentResultJson) as PaymentResultShape
  } catch {
    return null
  }
  if (parsed.refund_id) {
    throw new Error('Order payment already has a refund recorded')
  }
  const direct = parsed.capture_id || parsed.captureId
  if (direct) return direct
  if (!parsed.id) return null

  try {
    const paypalOrder = await paypal.getOrder(parsed.id)
    const fromOrder =
      paypalOrder?.purchase_units?.[0]?.payments?.captures?.[0]?.id
    if (fromOrder) return String(fromOrder)
  } catch {
    // Legacy rows may have stored the capture id in `id`.
  }
  return parsed.id
}

export const calculateDeliveryDateAndPrice = async ({
  items,
  shippingAddress,
  deliveryDateIndex,
}: {
  deliveryDateIndex?: number
  items: OrderItem[]
  shippingAddress?: ShippingAddress
}) => {
  const itemsPrice = roundToTwoDecimals(
    items.reduce((total, item) => total + item.price * item.quantity, 0)
  )

  const deliveryDate =
    AVAILABLE_DELIVERY_DATES[
      deliveryDateIndex === undefined
        ? AVAILABLE_DELIVERY_DATES.length - 1
        : deliveryDateIndex
    ]

  const shippingPrice =
    !shippingAddress || !deliveryDate
      ? undefined
      : deliveryDate.freeShippingMinimumPrice > 0 &&
          itemsPrice >= deliveryDate.freeShippingMinimumPrice
        ? 0
        : deliveryDate.shippingPrice

  const taxPrice = roundToTwoDecimals(itemsPrice * 0.15)
  const totalPrice = roundToTwoDecimals(
    itemsPrice +
      (shippingPrice ? roundToTwoDecimals(shippingPrice) : 0) +
      (taxPrice ? roundToTwoDecimals(taxPrice) : 0)
  )

  return {
    AVAILABLE_DELIVERY_DATES,
    deliveryDateIndex:
      deliveryDateIndex === undefined
        ? AVAILABLE_DELIVERY_DATES.length - 1
        : deliveryDateIndex,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  }
}

export type OrderNote = {
  id: number
  orderId: string
  authorUserId: string
  authorRole: string
  authorDisplayName?: string | null
  visibility: 'PUBLIC' | 'INTERNAL'
  body: string
  createdAt: string
}

function noteToClient(note: StoreOrderNote): OrderNote {
  const visibility =
    (note.visibility || 'PUBLIC').toUpperCase() === 'INTERNAL'
      ? 'INTERNAL'
      : 'PUBLIC'
  return {
    id: note.id,
    orderId: note.orderId,
    authorUserId: note.authorUserId,
    authorRole: note.authorRole,
    authorDisplayName: note.authorDisplayName,
    visibility,
    body: note.body,
    createdAt: note.createdAt,
  }
}

export async function getOrderNotes(orderId: string): Promise<OrderNote[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('User not authenticated')
  const notes = await fetchStoreOrderNotes(orderId, subjectFromSession(session))
  return JSON.parse(JSON.stringify(notes.map(noteToClient)))
}

export async function addOrderNote(
  orderId: string,
  body: string,
  options?: { visibility?: 'PUBLIC' | 'INTERNAL' }
): Promise<{ success: boolean; message: string; note?: OrderNote }> {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('User not authenticated')
    const trimmed = body.trim()
    if (!trimmed) {
      return { success: false, message: 'Message is required' }
    }
    const visibility = options?.visibility || 'PUBLIC'
    if (visibility === 'INTERNAL' && !hasSupportAccess(session.user.role)) {
      return {
        success: false,
        message: 'Only support or admin can post internal notes',
      }
    }
    const note = await createStoreOrderNote(
      orderId,
      trimmed,
      subjectFromSession(session),
      { visibility }
    )
    revalidatePath(`/account/orders/${orderId}`)
    const clientNote = noteToClient(note)
    if (visibility === 'PUBLIC') {
      await notifyPublicOrderNote({
        orderId,
        authorUserId: session.user.id,
        authorRole: session.user.role || note.authorRole || 'BUYER',
        authorDisplayName:
          note.authorDisplayName || session.user.name || session.user.email,
        body: trimmed,
      })
    }
    return {
      success: true,
      message: visibility === 'INTERNAL' ? 'Internal note saved' : 'Message sent',
      note: clientNote,
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}
