'use server'

import { OrderItem, ShippingAddress } from '@/types'
import { AVAILABLE_DELIVERY_DATES } from '../constants'
import { roundToTwoDecimals } from '../utils'

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
