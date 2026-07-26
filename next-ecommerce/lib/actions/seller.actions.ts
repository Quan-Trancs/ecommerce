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
import { notifyOrderShipped } from '@/lib/email/order-notifications'
import { checkAndNotifyLowStock } from '@/lib/notify/low-stock'

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
  listPrice?: number
  stockQuantity?: number
  description?: string
  imageUrl?: string
  isPublished?: boolean
  categoryIds?: string[]
  tags?: string[]
}

export async function createSellerProduct(input: SellerProductInput) {
  try {
    const subject = await requireSellerSubject()
    const images = input.imageUrl?.trim() ? [input.imageUrl.trim()] : []
    const tags = Array.from(
      new Set(['seller-listing', ...(input.tags || []).map((t) => t.trim()).filter(Boolean)])
    )
    const product = await sellerFetch<CatalogProduct>('/v1/seller/products', subject, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: input.name.trim(),
        price: input.price,
        listPrice: input.listPrice,
        stockQuantity: input.stockQuantity ?? 0,
        description: input.description || '',
        images,
        isPublished: input.isPublished ?? true,
        categoryIds: input.categoryIds || [],
        tags,
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
  patch: {
    price?: number
    stockQuantity?: number
    isPublished?: boolean
    images?: string[]
  }
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
    if (patch.stockQuantity !== undefined) {
      await checkAndNotifyLowStock([product.id])
    }
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
    id?: number
    productId: string
    name: string
    slug?: string
    price: number
    quantity: number
    color?: string
    size?: string
    isShipped?: boolean
    shippedAt?: string
    shippingCarrier?: string | null
    trackingNumber?: string | null
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
      isShipped: Boolean(item.isShipped),
    })),
  }))
}

export type SellerAnalytics = {
  productsTotal: number
  productsPublished: number
  productsLowStock: number
  ordersTotal: number
  ordersPaid: number
  ordersNeedingShip: number
  unshippedUnits: number
  salesRevenue: number
  salesRevenueLast30Days: number
}

export async function getSellerAnalytics(): Promise<SellerAnalytics> {
  const subject = await requireSellerSubject()
  const data = await sellerFetch<{
    productsTotal: number
    productsPublished: number
    productsLowStock: number
    ordersTotal: number
    ordersPaid: number
    ordersNeedingShip: number
    unshippedUnits: number
    salesRevenue: number
    salesRevenueLast30Days: number
  }>('/v1/seller/analytics', subject)
  return {
    productsTotal: Number(data.productsTotal) || 0,
    productsPublished: Number(data.productsPublished) || 0,
    productsLowStock: Number(data.productsLowStock) || 0,
    ordersTotal: Number(data.ordersTotal) || 0,
    ordersPaid: Number(data.ordersPaid) || 0,
    ordersNeedingShip: Number(data.ordersNeedingShip) || 0,
    unshippedUnits: Number(data.unshippedUnits) || 0,
    salesRevenue: Number(data.salesRevenue) || 0,
    salesRevenueLast30Days: Number(data.salesRevenueLast30Days) || 0,
  }
}

export async function markSellerOrderShipped(input: {
  orderId: string
  carrier?: string
  trackingNumber?: string
}) {
  try {
    const subject = await requireSellerSubject()
    const orderId = input.orderId
    const order = await sellerFetch<SellerOrder>(
      `/v1/seller/orders/${encodeURIComponent(orderId)}/status`,
      subject,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SHIPPED',
          carrier: input.carrier?.trim() || undefined,
          trackingNumber: input.trackingNumber?.trim() || undefined,
        }),
      }
    )
    revalidatePath('/seller/orders')
    revalidatePath(`/account/orders/${orderId}`)

    const status = String(order.status || '').toUpperCase()
    if (status === 'SHIPPED') {
      await notifyOrderShipped(orderId, {
        excludeAccountId: subject.userId,
      })
    }

    return { success: true as const, order }
  } catch (error) {
    return { success: false as const, message: formatError(error) }
  }
}

function flattenCategories(
  categories: import('@/lib/catalog/types').CatalogCategory[]
): import('@/lib/catalog/types').CatalogCategory[] {
  const out: import('@/lib/catalog/types').CatalogCategory[] = []
  for (const category of categories) {
    out.push(category)
    if (category.children?.length) {
      out.push(...flattenCategories(category.children))
    }
  }
  return out
}

function resolveCategoryId(
  raw: string | undefined,
  categories: import('@/lib/catalog/types').CatalogCategory[]
): string | undefined {
  if (!raw?.trim()) return undefined
  const needle = raw.trim().toLowerCase()
  const match = categories.find(
    (c) =>
      c.id.toLowerCase() === needle ||
      c.slug.toLowerCase() === needle ||
      c.name.toLowerCase() === needle
  )
  return match?.id
}

export type SellerCsvImportRowResult = {
  rowNumber: number
  name: string
  ok: boolean
  message: string
  productId?: string
}

export async function importSellerProductsCsv(
  csvText: string,
  options?: { dryRun?: boolean }
): Promise<{
  success: boolean
  message: string
  dryRun: boolean
  parseErrors: { rowNumber: number; message: string }[]
  results: SellerCsvImportRowResult[]
  created: number
  failed: number
}> {
  const dryRun = Boolean(options?.dryRun)
  try {
    await requireSellerSubject()
    const { parseSellerProductCsv } = await import(
      '@/lib/csv/seller-product-import'
    )
    const { fetchCategories } = await import('@/lib/catalog/client')

    const parsed = parseSellerProductCsv(csvText, { maxRows: 100 })
    if (parsed.rows.length === 0 && parsed.errors.length > 0) {
      return {
        success: false,
        message: parsed.errors[0]?.message || 'Invalid CSV',
        dryRun,
        parseErrors: parsed.errors,
        results: [],
        created: 0,
        failed: parsed.errors.length,
      }
    }

    const categories = flattenCategories(await fetchCategories())
    const results: SellerCsvImportRowResult[] = []
    let created = 0
    let failed = 0

    for (const row of parsed.rows) {
      const categoryId = resolveCategoryId(row.category, categories)
      if (row.category && !categoryId) {
        failed++
        results.push({
          rowNumber: row.rowNumber,
          name: row.name,
          ok: false,
          message: `Unknown category: ${row.category}`,
        })
        continue
      }

      if (dryRun) {
        results.push({
          rowNumber: row.rowNumber,
          name: row.name,
          ok: true,
          message: categoryId
            ? `Ready (category ${categoryId})`
            : 'Ready',
        })
        continue
      }

      const createdProduct = await createSellerProduct({
        name: row.name,
        price: row.price,
        listPrice: row.listPrice,
        stockQuantity: row.stockQuantity,
        description: row.description,
        imageUrl: row.imageUrl,
        isPublished: row.isPublished,
        categoryIds: categoryId ? [categoryId] : undefined,
        tags: row.tags,
      })

      if (!createdProduct.success) {
        failed++
        results.push({
          rowNumber: row.rowNumber,
          name: row.name,
          ok: false,
          message: createdProduct.message,
        })
        continue
      }

      created++
      results.push({
        rowNumber: row.rowNumber,
        name: row.name,
        ok: true,
        message: 'Created',
        productId: createdProduct.product.id,
      })
    }

    // Surface parse errors that skipped rows
    for (const err of parsed.errors) {
      if (err.rowNumber === 0) continue
      failed++
      results.push({
        rowNumber: err.rowNumber,
        name: '',
        ok: false,
        message: err.message,
      })
    }

    const headerErrors = parsed.errors.filter((e) => e.rowNumber === 0)
    const ok = failed === 0 && headerErrors.length === 0
    return {
      success: ok || created > 0,
      message: dryRun
        ? `Validated ${parsed.rows.length} row(s)`
        : `Created ${created}, failed ${failed}`,
      dryRun,
      parseErrors: headerErrors,
      results: results.sort((a, b) => a.rowNumber - b.rowNumber),
      created,
      failed,
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
      dryRun,
      parseErrors: [],
      results: [],
      created: 0,
      failed: 0,
    }
  }
}
