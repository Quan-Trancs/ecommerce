'use server'

import { auth } from '@/auth'
import type { Cart, OrderItem, ShippingAddress } from '@/types'
import {
  clearStoreCart,
  fetchProductsByIds,
  fetchStoreCart,
  upsertStoreCart,
  type StoreCart,
} from '@/lib/catalog/client'
import type { StoreTokenSubject } from '@/lib/auth/store-token'
import { calculateDeliveryDateAndPrice } from '@/lib/actions/order.actions'
import { roundToTwoDecimals } from '@/lib/utils'

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

/** Drop unavailable SKUs; refresh price/stock from live catalog. */
export async function revalidateCartItems(
  items: OrderItem[]
): Promise<OrderItem[]> {
  if (!items.length) return []

  const catalog = await fetchProductsByIds(
    items.map((item) => String(item.product))
  )
  if (!catalog.length) {
    // Catalog down — keep snapshot rather than wiping the cart
    return items
  }

  const byId = new Map(catalog.map((p) => [p.id, p]))
  const refreshed: OrderItem[] = []

  for (const item of items) {
    const product = byId.get(String(item.product))
    if (!product || product.isPublished === false) continue

    const variant = product.variants?.find(
      (v) =>
        (!item.color || v.color?.toLowerCase() === item.color.toLowerCase()) &&
        (!item.size || v.size?.toLowerCase() === item.size.toLowerCase())
    )

    const livePrice = roundToTwoDecimals(variant?.price ?? product.price)
    const liveStock = variant?.stockQuantity ?? product.stockQuantity ?? 0
    if (liveStock <= 0) continue

    refreshed.push({
      ...item,
      name: product.name || item.name,
      slug: product.slug || item.slug,
      image: product.images?.[0] || item.image,
      price: livePrice,
      countInStock: liveStock,
      quantity: Math.min(item.quantity, liveStock),
    })
  }

  return refreshed
}

async function priceCart(
  cart: Pick<
    Cart,
    'items' | 'shippingAddress' | 'paymentMethod' | 'deliveryDateIndex'
  >
): Promise<Cart> {
  const priced = await calculateDeliveryDateAndPrice({
    items: cart.items,
    shippingAddress: cart.shippingAddress,
    deliveryDateIndex: cart.deliveryDateIndex,
  })
  return {
    items: cart.items,
    shippingAddress: cart.shippingAddress,
    paymentMethod: cart.paymentMethod,
    deliveryDateIndex: cart.deliveryDateIndex,
    itemsPrice: priced.itemsPrice,
    shippingPrice: priced.shippingPrice,
    taxPrice: priced.taxPrice,
    totalPrice: priced.totalPrice,
  }
}

function toUpsertPayload(cart: Cart) {
  return {
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
  }
}

export async function persistCartSnapshot(cart: Cart): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) return false

  const saved = await upsertStoreCart(
    toUpsertPayload(cart),
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
 * Refresh local cart prices/stock against the catalog (works for guests too).
 */
export async function refreshCartFromCatalog(cart: Cart): Promise<Cart> {
  const items = await revalidateCartItems(cart.items || [])
  return priceCart({
    ...cart,
    items,
  })
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

  items = await revalidateCartItems(items)

  const merged = await priceCart({
    items,
    shippingAddress: localCart.shippingAddress || remoteCart.shippingAddress,
    paymentMethod: localCart.paymentMethod || remoteCart.paymentMethod,
    deliveryDateIndex:
      localCart.deliveryDateIndex ?? remoteCart.deliveryDateIndex,
  })

  await upsertStoreCart(toUpsertPayload(merged), subjectFromSession(session))

  return merged
}
