import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Cart, OrderItem, ShippingAddress } from '@/types'
import { calculateDeliveryDateAndPrice } from '@/lib/actions/order.actions'

const initialState: Cart = {
  items: [],
  itemsPrice: 0,
  taxPrice: undefined,
  shippingPrice: undefined,
  totalPrice: 0,
  paymentMethod: undefined,
  shippingAddress: undefined,
  deliveryDateIndex: undefined,
}

interface CartState {
  cart: Cart
  isUpdating: boolean
  addItem: (item: OrderItem, quantity: number) => Promise<string>
  updateItem: (item: OrderItem, quantity: number) => Promise<void>
  removeItem: (item: OrderItem) => void
  setShippingAddress: (shippingAddress: ShippingAddress) => Promise<void>
  setPaymentMethod: (paymentMethod: string) => void
  setDeliveryDateIndex: (index: number) => Promise<void>
  clearCart: () => void
}

const useCartStore = create(
  persist<CartState>(
    (set, get) => ({
      cart: initialState,
      isUpdating: false,

      addItem: async (item: OrderItem, quantity: number) => {
        // Prevent concurrent updates
        if (get().isUpdating) {
          throw new Error('Cart is being updated, please try again')
        }

        set({ isUpdating: true })
        
        try {
          const { items, shippingAddress } = get().cart
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
            if (item.countInStock < quantity) {
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

          const calculatedPrices = await calculateDeliveryDateAndPrice({
            items: updatedCartItems,
            shippingAddress,
          })

          set({
            cart: {
              ...get().cart,
              items: updatedCartItems,
              ...calculatedPrices,
            },
            isUpdating: false,
          })

          const addedItem = updatedCartItems.find(
            (x) =>
              x.product === item.product &&
              x.size === item.size &&
              x.color === item.color
          )
          
          return addedItem?.clientId || ''
        } catch (error) {
          set({ isUpdating: false })
          throw error
        }
      },

      updateItem: async (item: OrderItem, quantity: number) => {
        if (get().isUpdating) {
          throw new Error('Cart is being updated, please try again')
        }

        set({ isUpdating: true })
        
        try {
          const { items, shippingAddress } = get().cart
          const existItem = items.find(
            (x) =>
              x.product === item.product &&
              x.size === item.size &&
              x.color === item.color
          )

          if (!existItem) {
            set({ isUpdating: false })
            return
          }

          if (quantity > item.countInStock) {
            throw new Error('Not enough product in stock')
          }

          const updatedCartItems = items.map((x) =>
            x.product === existItem.product &&
            x.size === existItem.size &&
            x.color === existItem.color
              ? { ...existItem, quantity: quantity }
              : x
          )

          const calculatedPrices = await calculateDeliveryDateAndPrice({
            items: updatedCartItems,
            shippingAddress,
          })

          set({
            cart: {
              ...get().cart,
              items: updatedCartItems,
              ...calculatedPrices,
            },
            isUpdating: false,
          })
        } catch (error) {
          set({ isUpdating: false })
          throw error
        }
      },

      removeItem: async (item: OrderItem) => {
        if (get().isUpdating) {
          throw new Error('Cart is being updated, please try again')
        }

        set({ isUpdating: true })
        
        try {
          const { items, shippingAddress } = get().cart
          const updatedItems = items.filter(
            (x) =>
              x.product !== item.product ||
              x.size !== item.size ||
              x.color !== item.color
          )

          const calculatedPrices = await calculateDeliveryDateAndPrice({
            items: updatedItems,
            shippingAddress,
          })

          set({
            cart: {
              ...get().cart,
              items: updatedItems,
              ...calculatedPrices,
            },
            isUpdating: false,
          })
        } catch (error) {
          set({ isUpdating: false })
          throw error
        }
      },

      setShippingAddress: async (shippingAddress: ShippingAddress) => {
        if (get().isUpdating) {
          throw new Error('Cart is being updated, please try again')
        }

        set({ isUpdating: true })
        
        try {
          const { items } = get().cart
          const calculatedPrices = await calculateDeliveryDateAndPrice({
            items,
            shippingAddress,
          })

          set({
            cart: {
              ...get().cart,
              shippingAddress,
              ...calculatedPrices,
            },
            isUpdating: false,
          })
        } catch (error) {
          set({ isUpdating: false })
          throw error
        }
      },

      setPaymentMethod: (paymentMethod: string) => {
        set({
          cart: {
            ...get().cart,
            paymentMethod,
          },
        })
      },

      setDeliveryDateIndex: async (index: number) => {
        if (get().isUpdating) {
          throw new Error('Cart is being updated, please try again')
        }

        set({ isUpdating: true })
        
        try {
          const { items, shippingAddress } = get().cart
          const calculatedPrices = await calculateDeliveryDateAndPrice({
            items,
            shippingAddress,
            deliveryDateIndex: index,
          })

          set({
            cart: {
              ...get().cart,
              ...calculatedPrices,
              deliveryDateIndex: index,
            },
            isUpdating: false,
          })
        } catch (error) {
          set({ isUpdating: false })
          throw error
        }
      },

      clearCart: () => {
        set({
          cart: {
            ...get().cart,
            items: [],
            itemsPrice: 0,
            taxPrice: undefined,
            shippingPrice: undefined,
            totalPrice: 0,
          },
        })
      },

      init: () => set({ cart: { ...initialState }, isUpdating: false }),
    }),
    {
      name: 'cartStore',
    }
  )
)

export default useCartStore
