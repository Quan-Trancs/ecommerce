'use server'

import { auth } from '@/auth'
import type { Cart, OrderItem, ShippingAddress } from '@/types'
import {
  clearStoreCart,
  fetchStoreCart,
  upsertStoreCart,
  type StoreCart,
} from '@/lib/catalog/client'
import type { StoreTokenSubject } from '@/lib/auth/store-token'
import { calculateDeliveryDateAndPrice } from '@/lib/actions/order.actions'

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

function toShippingAddress(
  shipping: StoreCart['shipping']
): ShippingAddress | undefined {
  if (!shipping?.fullName && !shipping?.address) return undefined
  return {
    fullName: shipping.fullName || '',
    street: shipping.address || '',
    city: shipping.city || '',
    postalCode: shipping.postalCode || '',
    country: shipping.country || '',
    province: '',
    phone: shipping.phone || '',
  }
}

function fromShippingAddress(
  shipping?: ShippingAddress
): StoreCart['shipping'] | undefined {
  if (!shipping) return undefined
  return {
    fullName: shipping.fullName,
    address: shipping.street,
    city: shipping.city,
    postalCode: shipping.postalCode,
    country: shipping.country,
    phone: shipping.phone,
  }
}

function storeCartToClient(cart: StoreCart): Cart {
  return {
    items: (cart.items || []).map(
      (item): OrderItem => ({
        clientId: item.clientId || item.productId,
        product: item.productId,
        name: item.name,
        slug: item.slug,
        image: item.image,
        category: item.category || 'General',
        price: Number(item.price),
        quantity: item.quantity,
        countInStock: item.countInStock ?? item.quantity,
        color: item.color,
        size: item.size,
      })
    ),
    itemsPrice: 0,
    taxPrice: undefined,
    shippingPrice: undefined,
    totalPrice: 0,
    paymentMethod: cart.paymentMethod || undefined,
    shippingAddress: toShippingAddress(cart.shipping),
    deliveryDateIndex: cart.deliveryDateIndex ?? undefined,
  }
}

function lineKey(item: Pick<OrderItem, 'product' | 'size' | 'color'>) {
  return `${item.product}::${item.size || ''}::${item.color || ''}`
}

function mergeCartItems(local: OrderItem[], remote: OrderItem[]): OrderItem[] {
  const map = new Map<string, OrderItem>()
  for (const item of remote) {
    map.set(lineKey(item), { ...item })
  }
  for (const item of local) {
    const key = lineKey(item)
    const existing = map.get(key)
    if (!existing) {
      map.set(key, { ...item })
      continue
    }
    const quantity = Math.min(
      existing.quantity + item.quantity,
      Math.max(existing.countInStock, item.countInStock, existing.quantity)
    )
    map.set(key, {
      ...existing,
      quantity,
      countInStock: Math.max(existing.countInStock, item.countInStock),
      price: item.price,
      name: item.name || existing.name,
      image: item.image || existing.image,
      slug: item.slug || existing.slug,
    })
  }
  return [...map.values()]
}

export async function persistCartSnapshot(cart: Cart): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) return false

  const saved = await upsertStoreCart(
    {
      paymentMethod: cart.paymentMethod,
      deliveryDateIndex: cart.deliveryDateIndex,
      shipping: fromShippingAddress(cart.shippingAddress),
      items: cart.items.map((item) => ({
        clientId: item.clientId,
        productId: String(item.product),
        name: item.name,
        slug: item.slug,
        image: item.image,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        countInStock: item.countInStock,
        color: item.color,
        size: item.size,
      })),
    },
    subjectFromSession(session)
  )
  return Boolean(saved)
}

export async function clearPersistedCart(): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) return false
  return clearStoreCart(subjectFromSession(session))
}

/**
 * Load server cart and merge with the browser cart for signed-in users.
 * Returns null when guest / API unavailable (keep local only).
 */
export async function hydrateCartFromServer(
  localCart: Cart
): Promise<Cart | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const remote = await fetchStoreCart(subjectFromSession(session))
  if (!remote) return null

  const remoteCart = storeCartToClient(remote)
  const localItems = localCart.items || []
  const remoteItems = remoteCart.items || []

  let items: OrderItem[]
  if (!localItems.length && !remoteItems.length) {
    items = []
  } else if (!localItems.length) {
    items = remoteItems
  } else if (!remoteItems.length) {
    items = localItems
  } else {
    items = mergeCartItems(localItems, remoteItems)
  }

  const shippingAddress =
    localCart.shippingAddress || remoteCart.shippingAddress
  const paymentMethod = localCart.paymentMethod || remoteCart.paymentMethod
  const deliveryDateIndex =
    localCart.deliveryDateIndex ?? remoteCart.deliveryDateIndex

  const priced = await calculateDeliveryDateAndPrice({
    items,
    shippingAddress,
    deliveryDateIndex,
  })

  const merged: Cart = {
    items,
    shippingAddress,
    paymentMethod,
    deliveryDateIndex,
    itemsPrice: priced.itemsPrice,
    shippingPrice: priced.shippingPrice,
    taxPrice: priced.taxPrice,
    totalPrice: priced.totalPrice,
  }

  await upsertStoreCart(
    {
      paymentMethod: merged.paymentMethod,
      deliveryDateIndex: merged.deliveryDateIndex,
      shipping: fromShippingAddress(merged.shippingAddress),
      items: merged.items.map((item) => ({
        clientId: item.clientId,
        productId: String(item.product),
        name: item.name,
        slug: item.slug,
        image: item.image,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        countInStock: item.countInStock,
        color: item.color,
        size: item.size,
      })),
    },
    subjectFromSession(session)
  )

  return merged
}
