'use server'

import { OrderItem } from '@/types'
import { FREE_SHIPPING_MINIMUM_PRICE } from '../constants'
import { roundToTwoDecimals } from '../utils'

export const calculateDeliveryDateAndPrice = async ({
  items,
}: {
  deliveryDateIndex?: number
  items: OrderItem[]
}) => {
  const itemsPrice = roundToTwoDecimals(
    items.reduce((total, item) => total + item.price * item.quantity, 0)
  )
  const shippingPrice = itemsPrice > FREE_SHIPPING_MINIMUM_PRICE ? 0 : 5
  const taxPrice = roundToTwoDecimals(itemsPrice * 0.15)
  const totalPrice = roundToTwoDecimals(
    itemsPrice +
      (shippingPrice ? roundToTwoDecimals(shippingPrice) : 0) +
      (taxPrice ? roundToTwoDecimals(taxPrice) : 0)
  )

  return { itemsPrice, shippingPrice, taxPrice, totalPrice }
}
