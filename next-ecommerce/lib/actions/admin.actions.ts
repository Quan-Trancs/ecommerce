'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAdminAccess, normalizeRole, ALL_ROLES, type Role } from '@/lib/auth/roles'
import { mintStoreAccessToken } from '@/lib/auth/store-token'
import { formatError } from '@/lib/utils'
import { listUsers, updateUser } from '@/lib/db/users'
import { checkAndNotifyLowStock } from '@/lib/notify/low-stock'
import { checkAndNotifyBackInStock } from '@/lib/notify/back-in-stock'
import { checkAndNotifyPriceDrops } from '@/lib/notify/price-drop'
import { logStaffAction } from '@/lib/audit/log-staff-action'
import {
  getAdminDashboardKpis,
  type AdminDashboardKpis,
} from '@/lib/db/admin-kpis'

export type { AdminDashboardKpis }

const DEFAULT_API_URL = 'http://localhost:8082/api'

function getStoreApiUrl() {
  return (
    process.env.CATALOG_API_URL?.replace(/\/$/, '') ||
    process.env.STORE_API_URL?.replace(/\/$/, '') ||
    DEFAULT_API_URL
  )
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || !hasAdminAccess(session.user.role)) {
    throw new Error('Admin role required')
  }
  return session
}

export async function getAdminKpis(): Promise<AdminDashboardKpis> {
  await requireAdmin()
  const kpis = await getAdminDashboardKpis()
  return JSON.parse(JSON.stringify(kpis))
}

export type AdminUserRow = {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  await requireAdmin()
  const users = await listUsers()
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: normalizeRole(u.role),
    active: u.active,
  }))
}

export async function updateAdminUserRole(userId: string, role: Role) {
  try {
    const session = await requireAdmin()
    if (!ALL_ROLES.includes(role)) {
      return { success: false as const, message: 'Invalid role' }
    }
    if (session.user.id === userId && role !== 'ADMIN') {
      return {
        success: false as const,
        message: 'Cannot remove your own admin role',
      }
    }

    const user = await updateUser(userId, { role })
    if (!user) {
      return { success: false as const, message: 'User not found' }
    }

    // Refresh JWT claims / seller profile via auth bridge
    await mintStoreAccessToken({
      userId: user.id,
      email: user.email,
      displayName: user.name,
      role,
    })

    await logStaffAction({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: 'USER_ROLE_CHANGE',
      entityType: 'user',
      entityId: userId,
      summary: `Set role of ${user.email} to ${role}`,
      metadata: { role, email: user.email },
    })

    revalidatePath('/admin/users')
    revalidatePath('/admin/audit')
    return { success: true as const }
  } catch (error) {
    return { success: false as const, message: formatError(error) }
  }
}

function getAdminApiKey() {
  return process.env.ADMIN_API_KEY || process.env.STORE_ADMIN_API_KEY || 'dev-admin-key'
}

async function adminCatalogFetch<T>(path: string, init?: RequestInit): Promise<T> {
  await requireAdmin()
  const url = `${getStoreApiUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'X-Admin-Key': getAdminApiKey(),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Admin catalog API ${response.status}: ${text || response.statusText}`)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export type AdminCatalogProduct = {
  id: string
  name: string
  slug: string
  price: number
  stockQuantity?: number
  isPublished?: boolean
  sellerAccountId?: string | null
  images?: string[]
}

export async function listAdminCatalogProducts(): Promise<AdminCatalogProduct[]> {
  const products = await adminCatalogFetch<AdminCatalogProduct[]>('/v1/admin/products')
  return products.map((p) => ({
    ...p,
    price: Number(p.price),
    stockQuantity: Number(p.stockQuantity ?? 0),
  }))
}

export type AdminCatalogCreateInput = {
  name: string
  price: number
  stockQuantity?: number
  description?: string
  imageUrl?: string
  isPublished?: boolean
}

export async function createAdminCatalogProduct(input: AdminCatalogCreateInput) {
  try {
    const session = await requireAdmin()
    const images = input.imageUrl?.trim() ? [input.imageUrl.trim()] : []
    const product = await adminCatalogFetch<AdminCatalogProduct>('/v1/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: input.name.trim(),
        price: input.price,
        stockQuantity: input.stockQuantity ?? 0,
        description: input.description || '',
        images,
        isPublished: input.isPublished ?? true,
        tags: ['admin-listing'],
      }),
    })
    await logStaffAction({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: 'CATALOG_CREATE',
      entityType: 'product',
      entityId: product.id,
      summary: `Created product ${product.name}`,
      metadata: { price: product.price, slug: product.slug },
    })
    revalidatePath('/admin/catalog')
    revalidatePath('/search')
    revalidatePath('/admin/audit')
    return { success: true as const, product }
  } catch (error) {
    return { success: false as const, message: formatError(error) }
  }
}

export async function updateAdminCatalogProduct(
  id: string,
  patch: { price?: number; stockQuantity?: number; isPublished?: boolean }
) {
  try {
    const session = await requireAdmin()
    const product = await adminCatalogFetch<AdminCatalogProduct>(
      `/v1/admin/products/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }
    )
    await logStaffAction({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: 'CATALOG_UPDATE',
      entityType: 'product',
      entityId: product.id,
      summary: `Updated product ${product.name || id}`,
      metadata: patch,
    })
    revalidatePath('/admin/catalog')
    revalidatePath('/search')
    revalidatePath(`/product/${product.slug}`)
    revalidatePath('/admin/audit')
    if (patch.stockQuantity !== undefined) {
      await checkAndNotifyLowStock([product.id])
      await checkAndNotifyBackInStock([product.id])
    }
    if (patch.price !== undefined) {
      await checkAndNotifyPriceDrops([product.id])
    }
    return { success: true as const, product }
  } catch (error) {
    return { success: false as const, message: formatError(error) }
  }
}
