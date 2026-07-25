import { FALLBACK_CATEGORIES, FALLBACK_SEARCH } from './fallback-data'
import type {
  CatalogCategory,
  CatalogProduct,
  ProductSearchParams,
  ProductSearchResult,
} from './types'
import {
  storeAuthHeaders,
  type StoreTokenSubject,
} from '@/lib/auth/store-token'

const DEFAULT_API_URL = 'http://localhost:8082/api'

let lastCatalogSource: 'api' | 'fallback' = 'api'

export function getCatalogApiUrl() {
  return (
    process.env.CATALOG_API_URL?.replace(/\/$/, '') ||
    process.env.STORE_API_URL?.replace(/\/$/, '') ||
    DEFAULT_API_URL
  )
}

export function getCatalogSource() {
  return lastCatalogSource
}

export function isUsingCatalogFallback() {
  return lastCatalogSource === 'fallback'
}

export async function checkCatalogHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getCatalogApiUrl()}/v1/categories?view=flat`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout?.(2500),
    })
    if (response.ok) {
      lastCatalogSource = 'api'
      return true
    }
  } catch {
    /* ignore */
  }
  lastCatalogSource = 'fallback'
  return false
}

async function catalogFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${getCatalogApiUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const response = await fetch(url, {
    headers: { Accept: 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
    ...init,
  })
  if (!response.ok) {
    throw new Error(
      `Catalog API ${response.status}: ${response.statusText} (${url})`
    )
  }
  lastCatalogSource = 'api'
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

function buildSearchQuery(params: ProductSearchParams): string {
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.category && params.category.toLowerCase() !== 'all') {
    query.set('category', params.category)
  }
  params.brand?.forEach((brand) => query.append('brand', brand))
  params.tag?.forEach((tag) => query.append('tag', tag))
  if (params.minPrice != null) query.set('minPrice', String(params.minPrice))
  if (params.maxPrice != null) query.set('maxPrice', String(params.maxPrice))
  if (params.price) query.set('price', params.price)
  if (params.sort && params.sort !== 'featured') query.set('sort', params.sort)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 20))
  if (params.attributes) {
    for (const [key, values] of Object.entries(params.attributes)) {
      if (values?.length) query.set(key, values.join(','))
    }
  }
  return query.toString()
}

export async function searchProducts(
  params: ProductSearchParams = {}
): Promise<ProductSearchResult> {
  try {
    return await catalogFetch<ProductSearchResult>(
      `/v1/products?${buildSearchQuery(params)}`
    )
  } catch (error) {
    console.warn('Catalog API unavailable, using fallback products:', error)
    lastCatalogSource = 'fallback'
    return filterFallback(params)
  }
}

export async function fetchProductsByIds(
  ids: string[]
): Promise<CatalogProduct[]> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
  if (!unique.length) return []
  try {
    return await catalogFetch<CatalogProduct[]>(
      `/v1/products/batch?ids=${unique.map(encodeURIComponent).join(',')}`
    )
  } catch (error) {
    console.warn('Catalog batch unavailable, fetching individually:', error)
    const products = await Promise.all(
      unique.map((id) => fetchProductByIdOrSlug(id))
    )
    return products.filter((p): p is CatalogProduct => Boolean(p))
  }
}

export async function fetchProductByIdOrSlug(
  idOrSlug: string
): Promise<CatalogProduct | null> {
  try {
    const response = await fetch(
      `${getCatalogApiUrl()}/v1/products/${encodeURIComponent(idOrSlug)}`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' }
    )
    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Catalog API ${response.status}`)
    }
    lastCatalogSource = 'api'
    return (await response.json()) as CatalogProduct
  } catch (error) {
    console.warn('Catalog API unavailable, using fallback product:', error)
    lastCatalogSource = 'fallback'
    return (
      FALLBACK_SEARCH.data.find(
        (product) =>
          product.id.toLowerCase() === idOrSlug.toLowerCase() ||
          product.slug.toLowerCase() === idOrSlug.toLowerCase()
      ) || null
    )
  }
}

export async function fetchCategories(): Promise<CatalogCategory[]> {
  try {
    return await catalogFetch<CatalogCategory[]>('/v1/categories?view=tree')
  } catch (error) {
    console.warn('Catalog API unavailable, using fallback categories:', error)
    lastCatalogSource = 'fallback'
    return FALLBACK_CATEGORIES
  }
}

export type StoreOrderPayload = {
  paymentMethod: string
  itemsPrice: number
  shippingPrice: number
  taxPrice: number
  totalPrice: number
  shipping: {
    fullName: string
    address: string
    city: string
    postalCode: string
    country: string
    phone?: string
  }
  items: {
    productId: string
    name: string
    slug: string
    image: string
    price: number
    quantity: number
    color?: string
    size?: string
    isShipped?: boolean
    shippedAt?: string
  }[]
}

export type StoreOrder = {
  id: string
  userId: string
  status: string
  paymentMethod: string
  itemsPrice: number
  shippingPrice: number
  taxPrice: number
  totalPrice: number
  isPaid?: boolean
  paidAt?: string
  paymentResultJson?: string
  items: StoreOrderPayload['items']
  shipping: StoreOrderPayload['shipping']
  createdAt?: string
}

export async function createStoreOrder(
  payload: StoreOrderPayload,
  subject: StoreTokenSubject
): Promise<StoreOrder> {
  const authHeaders = await storeAuthHeaders(subject)
  if (!authHeaders.Authorization) {
    throw new Error('Unable to mint store API token for order create')
  }
  return catalogFetch<StoreOrder>('/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  })
}

export async function fetchStoreOrder(
  orderId: string,
  subject?: StoreTokenSubject
): Promise<StoreOrder | null> {
  try {
    const authHeaders = subject ? await storeAuthHeaders(subject) : {}
    return await catalogFetch<StoreOrder>(
      `/v1/orders/${encodeURIComponent(orderId)}`,
      { headers: authHeaders }
    )
  } catch {
    return null
  }
}

export async function fetchMyStoreOrders(
  subject: StoreTokenSubject,
  filters?: { status?: string; from?: string; to?: string }
): Promise<StoreOrder[]> {
  const authHeaders = await storeAuthHeaders(subject)
  if (!authHeaders.Authorization) return []
  const query = new URLSearchParams()
  if (filters?.status) query.set('status', filters.status)
  if (filters?.from) query.set('from', filters.from)
  if (filters?.to) query.set('to', filters.to)
  const qs = query.toString()
  try {
    return await catalogFetch<StoreOrder[]>(
      `/v1/orders/me${qs ? `?${qs}` : ''}`,
      { headers: authHeaders }
    )
  } catch {
    return []
  }
}

export async function payStoreOrder(
  orderId: string,
  payment: {
    id: string
    captureId?: string
    status: string
    emailAddress?: string
    pricePaid?: string
    paymentMethod?: string
  },
  subject: StoreTokenSubject
): Promise<StoreOrder> {
  const authHeaders = await storeAuthHeaders(subject)
  if (!authHeaders.Authorization) {
    throw new Error('Unable to mint store API token for order pay')
  }
  return catalogFetch<StoreOrder>(`/v1/orders/${encodeURIComponent(orderId)}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(payment),
  })
}

export async function cancelStoreOrder(
  orderId: string,
  subject: StoreTokenSubject,
  refund?: {
    refundId?: string
    refundStatus?: string
    refundSkipped?: boolean
    refundNote?: string
  }
): Promise<StoreOrder> {
  const authHeaders = await storeAuthHeaders(subject)
  if (!authHeaders.Authorization) {
    throw new Error('Unable to mint store API token for order cancel')
  }
  return catalogFetch<StoreOrder>(
    `/v1/orders/${encodeURIComponent(orderId)}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(refund || {}),
    }
  )
}

export type StoreCartItem = {
  clientId: string
  productId: string
  name: string
  slug: string
  image: string
  category?: string
  price: number
  quantity: number
  countInStock?: number
  color?: string
  size?: string
}

export type StoreCart = {
  id?: string
  userId?: string
  paymentMethod?: string | null
  deliveryDateIndex?: number | null
  shipping?: {
    fullName?: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
    phone?: string
  } | null
  items: StoreCartItem[]
}

export async function fetchStoreCart(
  subject: StoreTokenSubject
): Promise<StoreCart | null> {
  const authHeaders = await storeAuthHeaders(subject)
  if (!authHeaders.Authorization) return null
  try {
    return await catalogFetch<StoreCart>('/v1/cart', { headers: authHeaders })
  } catch {
    return null
  }
}

export async function upsertStoreCart(
  payload: {
    paymentMethod?: string
    deliveryDateIndex?: number
    shipping?: StoreCart['shipping']
    items: StoreCartItem[]
  },
  subject: StoreTokenSubject
): Promise<StoreCart | null> {
  const authHeaders = await storeAuthHeaders(subject)
  if (!authHeaders.Authorization) return null
  try {
    return await catalogFetch<StoreCart>('/v1/cart', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.warn('Store cart upsert failed:', error)
    return null
  }
}

export async function clearStoreCart(
  subject: StoreTokenSubject
): Promise<boolean> {
  const authHeaders = await storeAuthHeaders(subject)
  if (!authHeaders.Authorization) return false
  try {
    await catalogFetch<void>('/v1/cart', {
      method: 'DELETE',
      headers: authHeaders,
    })
    return true
  } catch (error) {
    console.warn('Store cart clear failed:', error)
    return false
  }
}

function filterFallback(params: ProductSearchParams): ProductSearchResult {
  let products = [...FALLBACK_SEARCH.data]

  if (params.q) {
    const q = params.q.toLowerCase()
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.brand?.name.toLowerCase().includes(q)
    )
  }
  if (params.category && params.category.toLowerCase() !== 'all') {
    const cat = params.category.toLowerCase()
    products = products.filter((p) =>
      p.categories?.some(
        (c) => c.slug.toLowerCase() === cat || c.name.toLowerCase() === cat
      )
    )
  }
  if (params.brand?.length) {
    const brands = params.brand.map((b) => b.toLowerCase())
    products = products.filter(
      (p) =>
        p.brand &&
        (brands.includes(p.brand.slug.toLowerCase()) ||
          brands.includes(p.brand.name.toLowerCase()))
    )
  }
  if (params.tag?.length) {
    const tags = params.tag.map((t) => t.toLowerCase())
    products = products.filter((p) =>
      p.tags?.some((tag) => tags.includes(tag.toLowerCase()))
    )
  }
  if (params.attributes) {
    for (const [key, values] of Object.entries(params.attributes)) {
      if (!values?.length) continue
      const wanted = values.map((v) => v.toLowerCase())
      products = products.filter((p) =>
        p.attributes?.[key]?.some((v) => wanted.includes(v.toLowerCase()))
      )
    }
  }

  switch (params.sort) {
    case 'price-asc':
      products.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      products.sort((a, b) => b.price - a.price)
      break
    case 'rating':
      products.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
      break
    case 'newest':
      products.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )
      break
    default:
      break
  }

  const page = params.page ?? 0
  const size = params.size ?? 20
  return {
    data: products.slice(page * size, page * size + size),
    total: products.length,
    page,
    size,
    facets: FALLBACK_SEARCH.facets,
  }
}
