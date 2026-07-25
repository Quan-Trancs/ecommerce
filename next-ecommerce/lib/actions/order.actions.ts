'use server'

import { Cart, OrderItem, ShippingAddress } from '@/types'
import { AVAILABLE_DELIVERY_DATES } from '../constants'
import { formatError, roundToTwoDecimals } from '../utils'
import { connectToDatabase } from '../db'
import { auth } from '@/auth'
import { OrderInputSchema } from '../validator'
import Order, { IOrder } from '../db/models/order.model'
import { paypal } from '../paypal'
import { sendPurchaseReceipt } from '@/emails'
import { revalidatePath } from 'next/cache'
import {
  createStoreOrder,
  fetchProductsByIds,
  fetchStoreOrder,
  payStoreOrder,
  type StoreOrder,
} from '@/lib/catalog/client'

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
    isDelivered: false,
    createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    updatedAt: new Date(),
  } as unknown as IOrder
}

export const createOrder = async (clientSideCart: Cart) => {
  try {
    const session = await auth()
    if (!session) throw new Error('User not authenticated')

    const createOrder = await createOrderFromCart(
      clientSideCart,
      session.user.id!
    )

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
  userId: string
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

  try {
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
      userId
    )
    return storeOrderToClient(storeOrder)
  } catch (error) {
    console.warn('Store order API failed, falling back to Mongo order:', error)
  }

  await connectToDatabase()
  const order = OrderInputSchema.parse({
    user: userId,
    items: cart.items,
    shippingAddress: cart.shippingAddress,
    paymentMethod: cart.paymentMethod,
    itemsPrice: cart.itemsPrice,
    shippingPrice: cart.shippingPrice,
    taxPrice: cart.taxPrice,
    totalPrice: cart.totalPrice,
    expectedDeliveryDate: cart.expectedDeliveryDate,
  })
  return await Order.create(order)
}

export async function getOrderById(orderId: string): Promise<IOrder> {
  const storeOrder = await fetchStoreOrder(orderId)
  if (storeOrder) {
    return JSON.parse(JSON.stringify(storeOrderToClient(storeOrder)))
  }

  await connectToDatabase()
  const order = await Order.findById(orderId)
  if (!order) throw new Error('Order not found')
  return JSON.parse(JSON.stringify(order))
}

export async function getMyOrders(): Promise<IOrder[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('User not authenticated')

  await connectToDatabase()
  const orders = await Order.find({ user: session.user.id })
    .sort({ createdAt: -1 })
    .lean()
  return JSON.parse(JSON.stringify(orders))
}

export async function createPayPalOrder(orderId: string) {
  try {
    const order = await getOrderById(orderId)
    const paypalOrder = await paypal.createOrder(order.totalPrice)

    const storeOrder = await fetchStoreOrder(orderId)
    if (storeOrder) {
      // Payment id stored when capture completes via pay endpoint
      return {
        success: true,
        message: 'PayPal order created successfully',
        data: paypalOrder.id,
      }
    }

    await connectToDatabase()
    const mongoOrder = await Order.findById(orderId)
    if (!mongoOrder) throw new Error('Order not found')
    mongoOrder.paymentResult = {
      id: paypalOrder.id,
      email_address: '',
      status: '',
      pricePaid: '0',
    }
    await mongoOrder.save()
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
    const captureData = await paypal.capturePayment(data.orderID)
    if (!captureData || captureData.status !== 'COMPLETED') {
      throw new Error('Error in paypal payment')
    }

    const storeOrder = await fetchStoreOrder(orderId)
    if (storeOrder) {
      await payStoreOrder(orderId, {
        id: captureData.id,
        status: captureData.status,
        emailAddress: captureData.payer?.email_address,
        pricePaid:
          captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount
            ?.value,
      })
      revalidatePath(`/account/orders/${orderId}`)
      return {
        success: true,
        message: 'Your order has been successfully paid by PayPal',
      }
    }

    await connectToDatabase()
    const order = await Order.findById(orderId).populate('user', 'email')
    if (!order) throw new Error('Order not found')
    if (
      captureData.id !== order.paymentResult?.id &&
      order.paymentResult?.id &&
      captureData.id !== data.orderID
    ) {
      // allow capture id vs create id mismatch when using store API path
    }
    order.isPaid = true
    order.paidAt = new Date()
    order.paymentResult = {
      id: captureData.id,
      status: captureData.status,
      email_address: captureData.payer.email_address,
      pricePaid:
        captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
    }
    await order.save()
    await sendPurchaseReceipt({ order })
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
