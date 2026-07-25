import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import {
  hasAdminAccess,
  hasSellerAccess,
  normalizeRole,
  type Role,
  ROLES,
} from '@/lib/auth/roles'

export async function requireSession() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in')
  }
  return session
}

export async function requireRole(allowed: Role | Role[]) {
  const session = await requireSession()
  const role = normalizeRole(session.user.role)
  const list = Array.isArray(allowed) ? allowed : [allowed]
  if (!list.includes(role)) {
    redirect(homePathFallback(role))
  }
  return { session, role }
}

export async function requireSeller() {
  const session = await requireSession()
  if (!hasSellerAccess(session.user.role)) {
    redirect('/account')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireSession()
  if (!hasAdminAccess(session.user.role)) {
    redirect('/account')
  }
  return session
}

function homePathFallback(role: Role) {
  if (role === ROLES.ADMIN) return '/admin'
  if (role === ROLES.SELLER) return '/seller'
  return '/account'
}
