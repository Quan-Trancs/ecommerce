export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Commerce Store'
export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
export const APP_SLOGAN =
  process.env.NEXT_PUBLIC_APP_SLOGAN || 'Everything you need, one store'
export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
  'A general commercial storefront with smart category and filter discovery'

export const APP_COPYRIGHT =
  process.env.NEXT_PUBLIC_APP_COPYRIGHT ||
  `Copyright © 2025 ${APP_NAME}. All rights reserved.`

export const PAGE_SIZE = Number(process.env.PAGE_SIZE || 10)

export const FREE_SHIPPING_MINIMUM_PRICE = Number(
  process.env.FREE_SHIPPING_MINIMUM_PRICE || 35
)

export const AVAILABLE_PAYMENT_METHODS = [
  {
    name: 'PayPal',
    commission: 0,
    isDefault: true,
  },
  {
    name: 'Stripe',
    commission: 0,
    isDefault: false,
  },
  {
    name: 'Credit Card',
    commission: 0,
    isDefault: false,
  },
  {
    name: 'Cash on Delivery',
    commission: 0,
    isDefault: false,
  },
]

export const DEFAULT_PAYMENT_METHOD =
  process.env.DEFAULT_PAYMENT_METHOD || 'PayPal'

export const AVAILABLE_DELIVERY_DATES = [
  {
    name: 'Tomorrow',
    daysToDelivery: 1,
    shippingPrice: 12.9,
    freeShippingMinimumPrice: 0,
  },
  {
    name: 'Next 3 Days',
    daysToDelivery: 3,
    shippingPrice: 6.9,
    freeShippingMinimumPrice: 0,
  },
  {
    name: 'Next 5 Days',
    daysToDelivery: 5,
    shippingPrice: 4.9,
    freeShippingMinimumPrice: 35,
  },
]

//sender
export const SENDER_EMAIL = 'quantrancs@gmail.com'
export const SENDER_NAME = 'Commerce Store'
