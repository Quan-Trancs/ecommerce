'use server'

import { Cart, OrderItem, ShippingAddress } from '@/types'
import { AVAILABLE_DELIVERY_DATES } from '../constants'
import { formatError, roundToTwoDecimals } from '../utils'
import { connectToDatabase } from '../db'
import { auth } from '@/auth'
import { OrderInputSchema } from '../validator'
import Order from '../db/models/order.models'

export const createOrder = async (clientSideCart: Cart) => {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session) throw new Error('User not authenticated')

    //recalculate delivery date and price on the server side
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
  const cart = {
    ...clientSideCart,
    ...calculateDeliveryDateAndPrice({
      items: clientSideCart.items,
      shippingAddress: clientSideCart.shippingAddress,
      deliveryDateIndex: clientSideCart.deliveryDateIndex,
    }),
  }

  const order = await OrderInputSchema.parse({
    user: userId,
    items: cart.items,
    ShippingAddress: cart.shippingAddress,
    paymentMethod: cart.paymentMethod,
    itemsPrice: cart.itemsPrice,
    shippingPrice: cart.shippingPrice,
    taxPrice: cart.taxPrice,
    totalPrice: cart.totalPrice,
    expectedDeliveryDate: cart.expectedDeliveryDate,
  })
  return await Order.create(order)
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
