'use server'

import { auth } from '@/auth'
import {
  storeAuthHeaders,
  type StoreTokenSubject,
} from '@/lib/auth/store-token'
import { hasSupportAccess } from '@/lib/auth/roles'
import { formatError } from '@/lib/utils'
import { getOrderById } from '@/lib/actions/order.actions'
import type { IOrder } from '@/lib/types/order'

const DEFAULT_API_URL = 'http://localhost:8082/api'

function getStoreApiUrl() {
  return (
    process.env.CATALOG_API_URL?.replace(/\/$/, '') ||
    process.env.STORE_API_URL?.replace(/\/$/, '') ||
    DEFAULT_API_URL
  )
}

async function requireSupportSubject(): Promise<StoreTokenSubject> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('User not authenticated')
  if (!hasSupportAccess(session.user.role)) {
    throw new Error('Support role required')
  }
  return {
    userId: session.user.id,
    email: session.user.email,
    displayName: session.user.name,
    role: session.user.role,
  }
}

export type SupportOrderRow = {
  id: string
  userId: string
  status?: string
  isPaid?: boolean
  totalPrice: number
  createdAt?: string
  itemsCount: number
}

function mapSupportOrders(
  orders: Array<{
    id: string
    userId: string
    status?: string
    isPaid?: boolean
    totalPrice: number
    createdAt?: string
    items?: unknown[]
  }>
): SupportOrderRow[] {
  return orders.map((o) => ({
    id: o.id,
    userId: o.userId,
    status: o.status,
    isPaid: o.isPaid,
    totalPrice: Number(o.totalPrice),
    createdAt: o.createdAt,
    itemsCount: o.items?.length ?? 0,
  }))
}

async function supportFetch(path: string): Promise<SupportOrderRow[]> {
  const subject = await requireSupportSubject()
  const authHeaders = await storeAuthHeaders(subject)
  if (!authHeaders.Authorization) {
    throw new Error('Unable to mint store API token')
  }
  const res = await fetch(`${getStoreApiUrl()}${path}`, {
    headers: { Accept: 'application/json', ...authHeaders },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Support API ${res.status}: ${text || res.statusText}`)
  }
  const orders = (await res.json()) as Array<{
    id: string
    userId: string
    status?: string
    isPaid?: boolean
    totalPrice: number
    createdAt?: string
    items?: unknown[]
  }>
  return mapSupportOrders(orders)
}

export async function listSupportRecentOrders(
  limit = 40
): Promise<SupportOrderRow[]> {
  const capped = Math.max(1, Math.min(limit, 100))
  return supportFetch(`/v1/orders/assist/recent?limit=${capped}`)
}

export async function listSupportOrdersByEmail(
  email: string
): Promise<SupportOrderRow[]> {
  const trimmed = email.trim()
  if (!trimmed) throw new Error('Email required')
  return supportFetch(
    `/v1/orders/assist/by-email?email=${encodeURIComponent(trimmed)}`
  )
}

export async function lookupSupportOrder(
  orderId: string
): Promise<{ success: true; order: IOrder } | { success: false; message: string }> {
  try {
    await requireSupportSubject()
    const id = orderId.trim()
    if (!id) return { success: false, message: 'Order id required' }
    const order = await getOrderById(id)
    return { success: true, order }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
