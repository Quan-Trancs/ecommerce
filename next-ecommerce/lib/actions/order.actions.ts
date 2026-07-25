'use server'

import { Cart, OrderItem, ShippingAddress } from '@/types'
import { AVAILABLE_DELIVERY_DATES } from '../constants'
import { formatError, roundToTwoDecimals } from '../utils'
import { auth } from '@/auth'
import type { IOrder } from '@/lib/types/order'
import { paypal } from '../paypal'
import { revalidatePath } from 'next/cache'
import {
  createStoreOrder,
  fetchMyStoreOrders,
  fetchProductsByIds,
  fetchStoreOrder,
  payStoreOrder,
  type StoreOrder,
} from '@/lib/catalog/client'
import type { StoreTokenSubject } from '@/lib/auth/store-token'

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
    isDelivered: String(order.status || '').toUpperCase() === 'SHIPPED',
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

export async function getMyOrders(): Promise<IOrder[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('User not authenticated')

  const subject = subjectFromSession(session)
  const storeOrders = await fetchMyStoreOrders(subject)
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
    const paypalOrder = await paypal.createOrder(order.totalPrice)

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

    await payStoreOrder(
      orderId,
      {
        id: captureData.id,
        status: captureData.status,
        emailAddress: captureData.payer?.email_address,
        pricePaid:
          captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount
            ?.value,
      },
      subject
    )
    revalidatePath(`/account/orders/${orderId}`)
    return {
      success: true,
      message: 'Your order has been successfully paid by PayPal',
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
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
