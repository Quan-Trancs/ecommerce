'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import type { CatalogProduct } from '@/lib/catalog/types'
import {
  storeAuthHeaders,
  type StoreTokenSubject,
} from '@/lib/auth/store-token'
import { hasSellerAccess } from '@/lib/auth/roles'
import { formatError } from '@/lib/utils'

const DEFAULT_API_URL = 'http://localhost:8082/api'

function getStoreApiUrl() {
  return (
    process.env.CATALOG_API_URL?.replace(/\/$/, '') ||
    process.env.STORE_API_URL?.replace(/\/$/, '') ||
    DEFAULT_API_URL
  )
}

async function requireSellerSubject(): Promise<StoreTokenSubject> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('User not authenticated')
  }
  if (!hasSellerAccess(session.user.role)) {
    throw new Error('Seller role required')
  }
  return {
    userId: session.user.id,
    email: session.user.email,
    displayName: session.user.name,
    role: session.user.role,
  }
}

async function sellerFetch<T>(
  path: string,
  subject: StoreTokenSubject,
  init?: RequestInit
): Promise<T> {
  const authHeaders = await storeAuthHeaders(subject)
  if (!authHeaders.Authorization) {
    throw new Error('Unable to mint store API token')
  }
  const url = `${getStoreApiUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...authHeaders,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Seller API ${response.status}: ${text || response.statusText}`)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function listSellerProducts(): Promise<CatalogProduct[]> {
  const subject = await requireSellerSubject()
  return sellerFetch<CatalogProduct[]>('/v1/seller/products', subject)
}

export type SellerProductInput = {
  name: string
  price: number
  stockQuantity?: number
  description?: string
  imageUrl?: string
  isPublished?: boolean
}

export async function createSellerProduct(input: SellerProductInput) {
  try {
    const subject = await requireSellerSubject()
    const images = input.imageUrl?.trim() ? [input.imageUrl.trim()] : []
    const product = await sellerFetch<CatalogProduct>('/v1/seller/products', subject, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: input.name.trim(),
        price: input.price,
        stockQuantity: input.stockQuantity ?? 0,
        description: input.description || '',
        images,
        isPublished: input.isPublished ?? true,
        tags: ['seller-listing'],
      }),
    })
    revalidatePath('/seller/products')
    revalidatePath('/search')
    return { success: true as const, product }
  } catch (error) {
    return { success: false as const, message: formatError(error) }
  }
}

export async function updateSellerProduct(
  id: string,
  patch: { price?: number; stockQuantity?: number; isPublished?: boolean }
) {
  try {
    const subject = await requireSellerSubject()
    const product = await sellerFetch<CatalogProduct>(
      `/v1/seller/products/${encodeURIComponent(id)}`,
      subject,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }
    )
    revalidatePath('/seller/products')
    revalidatePath(`/product/${product.slug}`)
    revalidatePath('/search')
    return { success: true as const, product }
  } catch (error) {
    return { success: false as const, message: formatError(error) }
  }
}

export type SellerOrder = {
  id: string
  userId: string
  status?: string
  paymentMethod?: string
  itemsPrice: number
  totalPrice: number
  isPaid?: boolean
  createdAt?: string
  items: {
    productId: string
    name: string
    slug?: string
    price: number
    quantity: number
    color?: string
    size?: string
  }[]
}

export async function listSellerOrders(): Promise<SellerOrder[]> {
  const subject = await requireSellerSubject()
  const orders = await sellerFetch<SellerOrder[]>('/v1/seller/orders', subject)
  return orders.map((order) => ({
    ...order,
    itemsPrice: Number(order.itemsPrice),
    totalPrice: Number(order.totalPrice),
    items: (order.items || []).map((item) => ({
      ...item,
      price: Number(item.price),
      quantity: Number(item.quantity),
    })),
  }))
}
