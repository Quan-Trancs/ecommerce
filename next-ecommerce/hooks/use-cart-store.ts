import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Cart, OrderItem } from '@/types'
import { calculateDeliveryDateAndPrice } from '@/lib/actions/order.actions'

const initialState: Cart = {
  items: [],
  itemsPrice: 0,
  taxPrice: undefined,
  shippingPrice: undefined,
  totalPrice: 0,
  paymentMethod: undefined,
  deliveryDateIndex: undefined,
}

interface CartState {
  cart: Cart
  addItem: (item: OrderItem, quantity: number) => Promise<string>
  updateItem: (item: OrderItem, quantity: number) => Promise<void>
  removeItem: (item: OrderItem) => void
}

const useCartStore = create(
  persist<CartState>(
    (set, get) => ({
      cart: initialState,

      addItem: async (item: OrderItem, quantity: number) => {
        const { items } = get().cart
        const existItem = items.find(
          (x) =>
            x.product === item.product &&
            x.size === item.size &&
            x.color === item.color
        )

        if (existItem) {
          if (existItem.countInStock < existItem.quantity + quantity) {
            throw new Error('Product is out of stock')
          }
        } else {
          if (item.countInStock < item.quantity) {
            throw new Error('Not enough product in stock')
          }
        }

        const updatedCartItems = existItem
          ? items.map((x) =>
              x.product === existItem.product &&
              x.size === existItem.size &&
              x.color === existItem.color
                ? { ...existItem, quantity: existItem.quantity + quantity }
                : x
            )
          : [...items, { ...item, quantity }]

        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...(await calculateDeliveryDateAndPrice({
              items: updatedCartItems,
            })),
          },
        })

        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        return updatedCartItems.find(
          (x) =>
            x.product === item.product &&
            x.size === item.size &&
            x.color === item.color
        )?.clientId!
      },

      updateItem: async (item: OrderItem, quantity: number) => {
        const { items } = get().cart
        const existItem = items.find(
          (x) =>
            x.product === item.product &&
            x.size === item.size &&
            x.color === item.color
        )

        if (!existItem) return
        const updatedCartItems = items.map((x) =>
          x.product === existItem.product &&
          x.size === existItem.size &&
          x.color === existItem.color
            ? { ...existItem, quantity: quantity }
            : x
        )

        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...(await calculateDeliveryDateAndPrice({
              items: updatedCartItems,
            })),
          },
        })
      },

      removeItem: async (item: OrderItem) => {
        const { items } = get().cart
        const existItem = items.filter(
          (x) =>
            x.product !== item.product ||
            x.size !== item.size ||
            x.color !== item.color
        )

        set({
          cart: {
            ...get().cart,
            items: existItem,
            ...(await calculateDeliveryDateAndPrice({
              items: existItem,
            })),
          },
        })
      },

      init: () =>
        set({
          cart: {
            ...initialState,
          },
        }),
    }),
    {
      name: 'cartStore',
    }
  )
)

export default useCartStore
