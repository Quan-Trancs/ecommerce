import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Cart, OrderItem, ShippingAddress } from '@/types'
import { calculateDeliveryDateAndPrice } from '@/lib/actions/order.actions'
import {
  clearPersistedCart,
  persistCartSnapshot,
} from '@/lib/actions/cart.actions'

const initialState: Cart = {
  items: [],
  itemsPrice: 0,
  taxPrice: undefined,
  shippingPrice: undefined,
  totalPrice: 0,
  discountPrice: 0,
  couponCode: undefined,
  giftCardCode: undefined,
  giftCardAmount: 0,
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
  applyCoupon: (code: string) => Promise<string>
  removeCoupon: () => Promise<void>
  applyGiftCard: (code: string) => Promise<string>
  removeGiftCard: () => Promise<void>
  clearCart: () => void
}

const PERSIST_DEBOUNCE_MS = 450
let persistTimer: ReturnType<typeof setTimeout> | null = null
let pendingPersistCart: Cart | null = null

function schedulePersist(cart: Cart) {
  pendingPersistCart = cart
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    const snapshot = pendingPersistCart
    pendingPersistCart = null
    persistTimer = null
    if (!snapshot) return
    void persistCartSnapshot(snapshot).catch((error) => {
      console.warn('Cart persist failed:', error)
    })
  }, PERSIST_DEBOUNCE_MS)
}

function cancelScheduledPersist() {
  pendingPersistCart = null
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
}

async function priceCart(input: {
  items: OrderItem[]
  shippingAddress?: ShippingAddress
  deliveryDateIndex?: number
  couponCode?: string
  giftCardCode?: string
}) {
  const calculated = await calculateDeliveryDateAndPrice({
    items: input.items,
    shippingAddress: input.shippingAddress,
    deliveryDateIndex: input.deliveryDateIndex,
    couponCode: input.couponCode,
    giftCardCode: input.giftCardCode,
  })
  return {
    ...calculated,
    couponCode: calculated.couponCode,
    discountPrice: calculated.discountPrice || 0,
    giftCardCode: calculated.giftCardCode,
    giftCardAmount: calculated.giftCardAmount || 0,
  }
}

const useCartStore = create(
  persist<CartState>(
    (set, get) => ({
      cart: initialState,
      isUpdating: false,

      addItem: async (item: OrderItem, quantity: number) => {
        if (get().isUpdating) {
          throw new Error('Cart is being updated, please try again')
        }

        set({ isUpdating: true })

        try {
          const {
            items,
            shippingAddress,
            couponCode,
            giftCardCode,
            deliveryDateIndex,
          } = get().cart
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

          const calculatedPrices = await priceCart({
            items: updatedCartItems,
            shippingAddress,
            deliveryDateIndex,
            couponCode,
            giftCardCode,
          })

          const nextCart = {
            ...get().cart,
            items: updatedCartItems,
            ...calculatedPrices,
          }

          set({
            cart: nextCart,
            isUpdating: false,
          })
          schedulePersist(nextCart)

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
          const {
            items,
            shippingAddress,
            couponCode,
            giftCardCode,
            deliveryDateIndex,
          } = get().cart
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

          const calculatedPrices = await priceCart({
            items: updatedCartItems,
            shippingAddress,
            deliveryDateIndex,
            couponCode,
            giftCardCode,
          })

          const nextCart = {
            ...get().cart,
            items: updatedCartItems,
            ...calculatedPrices,
          }

          set({
            cart: nextCart,
            isUpdating: false,
          })
          schedulePersist(nextCart)
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
          const {
            items,
            shippingAddress,
            couponCode,
            giftCardCode,
            deliveryDateIndex,
          } = get().cart
          const updatedItems = items.filter(
            (x) =>
              x.product !== item.product ||
              x.size !== item.size ||
              x.color !== item.color
          )

          const calculatedPrices = await priceCart({
            items: updatedItems,
            shippingAddress,
            deliveryDateIndex,
            couponCode,
            giftCardCode,
          })

          const nextCart = {
            ...get().cart,
            items: updatedItems,
            ...calculatedPrices,
          }

          set({
            cart: nextCart,
            isUpdating: false,
          })
          schedulePersist(nextCart)
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
          const { items, couponCode, giftCardCode, deliveryDateIndex } =
            get().cart
          const calculatedPrices = await priceCart({
            items,
            shippingAddress,
            deliveryDateIndex,
            couponCode,
            giftCardCode,
          })

          const nextCart = {
            ...get().cart,
            shippingAddress,
            ...calculatedPrices,
          }

          set({
            cart: nextCart,
            isUpdating: false,
          })
          schedulePersist(nextCart)
        } catch (error) {
          set({ isUpdating: false })
          throw error
        }
      },

      setPaymentMethod: (paymentMethod: string) => {
        const nextCart = {
          ...get().cart,
          paymentMethod,
        }
        set({ cart: nextCart })
        schedulePersist(nextCart)
      },

      setDeliveryDateIndex: async (index: number) => {
        if (get().isUpdating) {
          throw new Error('Cart is being updated, please try again')
        }

        set({ isUpdating: true })

        try {
          const { items, shippingAddress, couponCode, giftCardCode } =
            get().cart
          const calculatedPrices = await priceCart({
            items,
            shippingAddress,
            deliveryDateIndex: index,
            couponCode,
            giftCardCode,
          })

          const nextCart = {
            ...get().cart,
            ...calculatedPrices,
            deliveryDateIndex: index,
          }

          set({
            cart: nextCart,
            isUpdating: false,
          })
          schedulePersist(nextCart)
        } catch (error) {
          set({ isUpdating: false })
          throw error
        }
      },

      applyCoupon: async (code: string) => {
        if (get().isUpdating) {
          throw new Error('Cart is being updated, please try again')
        }
        const trimmed = code.trim()
        if (!trimmed) throw new Error('Enter a promo code')

        set({ isUpdating: true })
        try {
          const { items, shippingAddress, deliveryDateIndex, giftCardCode } =
            get().cart
          const calculatedPrices = await priceCart({
            items,
            shippingAddress,
            deliveryDateIndex,
            couponCode: trimmed,
            giftCardCode,
          })
          if (!calculatedPrices.couponCode) {
            throw new Error(
              calculatedPrices.couponMessage || 'Invalid promo code'
            )
          }
          const nextCart = {
            ...get().cart,
            ...calculatedPrices,
          }
          set({ cart: nextCart, isUpdating: false })
          schedulePersist(nextCart)
          return calculatedPrices.couponCode
        } catch (error) {
          set({ isUpdating: false })
          throw error
        }
      },

      removeCoupon: async () => {
        if (get().isUpdating) {
          throw new Error('Cart is being updated, please try again')
        }
        set({ isUpdating: true })
        try {
          const { items, shippingAddress, deliveryDateIndex, giftCardCode } =
            get().cart
          const calculatedPrices = await priceCart({
            items,
            shippingAddress,
            deliveryDateIndex,
            giftCardCode,
          })
          const nextCart = {
            ...get().cart,
            ...calculatedPrices,
            couponCode: undefined,
            discountPrice: 0,
          }
          set({ cart: nextCart, isUpdating: false })
          schedulePersist(nextCart)
        } catch (error) {
          set({ isUpdating: false })
          throw error
        }
      },

      applyGiftCard: async (code: string) => {
        if (get().isUpdating) {
          throw new Error('Cart is being updated, please try again')
        }
        const trimmed = code.trim()
        if (!trimmed) throw new Error('Enter a gift card code')

        set({ isUpdating: true })
        try {
          const { items, shippingAddress, deliveryDateIndex, couponCode } =
            get().cart
          const calculatedPrices = await priceCart({
            items,
            shippingAddress,
            deliveryDateIndex,
            couponCode,
            giftCardCode: trimmed,
          })
          if (!calculatedPrices.giftCardCode) {
            throw new Error(
              calculatedPrices.giftCardMessage || 'Invalid gift card'
            )
          }
          const nextCart = {
            ...get().cart,
            ...calculatedPrices,
          }
          set({ cart: nextCart, isUpdating: false })
          schedulePersist(nextCart)
          return calculatedPrices.giftCardCode
        } catch (error) {
          set({ isUpdating: false })
          throw error
        }
      },

      removeGiftCard: async () => {
        if (get().isUpdating) {
          throw new Error('Cart is being updated, please try again')
        }
        set({ isUpdating: true })
        try {
          const { items, shippingAddress, deliveryDateIndex, couponCode } =
            get().cart
          const calculatedPrices = await priceCart({
            items,
            shippingAddress,
            deliveryDateIndex,
            couponCode,
          })
          const nextCart = {
            ...get().cart,
            ...calculatedPrices,
            giftCardCode: undefined,
            giftCardAmount: 0,
          }
          set({ cart: nextCart, isUpdating: false })
          schedulePersist(nextCart)
        } catch (error) {
          set({ isUpdating: false })
          throw error
        }
      },

      clearCart: () => {
        cancelScheduledPersist()
        const nextCart = {
          ...get().cart,
          items: [],
          itemsPrice: 0,
          taxPrice: undefined,
          shippingPrice: undefined,
          totalPrice: 0,
          discountPrice: 0,
          couponCode: undefined,
          giftCardCode: undefined,
          giftCardAmount: 0,
        }
        set({ cart: nextCart })
        void clearPersistedCart().catch((error) => {
          console.warn('Cart clear persist failed:', error)
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
