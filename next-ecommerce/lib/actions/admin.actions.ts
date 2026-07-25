'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import { hasAdminAccess, normalizeRole, ALL_ROLES, type Role } from '@/lib/auth/roles'
import { mintStoreAccessToken, storeAuthHeaders } from '@/lib/auth/store-token'
import { formatError } from '@/lib/utils'

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

export type AdminUserRow = {
  id: string
  name: string
  email: string
  role: Role
  storeSynced: boolean
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  await requireAdmin()
  await connectToDatabase()
  const users = await User.find({})
    .select('name email role')
    .sort({ createdAt: -1 })
    .lean()

  const session = await auth()
  const subject = {
    userId: session!.user.id!,
    email: session!.user.email,
    displayName: session!.user.name,
    role: session!.user.role,
  }

  let storeIds = new Set<string>()
  try {
    const headers = await storeAuthHeaders(subject)
    if (headers.Authorization) {
      const res = await fetch(`${getStoreApiUrl()}/v1/accounts`, {
        headers: { Accept: 'application/json', ...headers },
        cache: 'no-store',
      })
      if (res.ok) {
        const accounts = (await res.json()) as { id: string }[]
        storeIds = new Set(accounts.map((a) => a.id))
      }
    }
  } catch {
    /* store API optional for listing */
  }

  return users.map((u) => {
    const id = String(u._id)
    return {
      id,
      name: u.name,
      email: u.email,
      role: normalizeRole(u.role),
      storeSynced: storeIds.has(id),
    }
  })
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

    await connectToDatabase()
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    )
    if (!user) {
      return { success: false as const, message: 'User not found' }
    }

    // Upsert store account with the new role (BFF mint)
    await mintStoreAccessToken({
      userId: String(user._id),
      email: user.email,
      displayName: user.name,
      role,
    })

    revalidatePath('/admin/users')
    return { success: true as const }
  } catch (error) {
    return { success: false as const, message: formatError(error) }
  }
}
