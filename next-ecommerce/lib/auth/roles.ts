/**
 * Canonical marketplace roles (storefront + API).
 * Prefer these over legacy strings like "User" / "Admin".
 */
export const ROLES = {
  BUYER: 'BUYER',
  SELLER: 'SELLER',
  SUPPORT: 'SUPPORT',
  ADMIN: 'ADMIN',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ALL_ROLES: Role[] = [
  ROLES.BUYER,
  ROLES.SELLER,
  ROLES.SUPPORT,
  ROLES.ADMIN,
]

/** Self-serve signup options (admin / support are invite-only). */
export const SIGNUP_ROLES: Role[] = [ROLES.BUYER, ROLES.SELLER]

const LEGACY_ROLE_MAP: Record<string, Role> = {
  user: ROLES.BUYER,
  buyer: ROLES.BUYER,
  seller: ROLES.SELLER,
  support: ROLES.SUPPORT,
  cs: ROLES.SUPPORT,
  customer_service: ROLES.SUPPORT,
  admin: ROLES.ADMIN,
  moderator: ROLES.ADMIN,
}

export function normalizeRole(role?: string | null): Role {
  if (!role) return ROLES.BUYER
  const key = role.trim().toLowerCase()
  if (LEGACY_ROLE_MAP[key]) return LEGACY_ROLE_MAP[key]
  const upper = role.trim().toUpperCase()
  if ((ALL_ROLES as string[]).includes(upper)) return upper as Role
  return ROLES.BUYER
}

export function isRole(role: string | null | undefined, allowed: Role | Role[]): boolean {
  const current = normalizeRole(role)
  const list = Array.isArray(allowed) ? allowed : [allowed]
  return list.includes(current)
}

export function hasSellerAccess(role?: string | null) {
  return isRole(role, [ROLES.SELLER, ROLES.ADMIN])
}

/** Customer-service access: view any order without full admin. */
export function hasSupportAccess(role?: string | null) {
  return isRole(role, [ROLES.SUPPORT, ROLES.ADMIN])
}

export function hasAdminAccess(role?: string | null) {
  return isRole(role, ROLES.ADMIN)
}

export function homePathForRole(role?: string | null): string {
  const r = normalizeRole(role)
  if (r === ROLES.ADMIN) return '/admin'
  if (r === ROLES.SUPPORT) return '/support'
  if (r === ROLES.SELLER) return '/seller'
  return '/account'
}

export function roleLabel(role?: string | null): string {
  switch (normalizeRole(role)) {
    case ROLES.SELLER:
      return 'Seller'
    case ROLES.SUPPORT:
      return 'Support'
    case ROLES.ADMIN:
      return 'Admin'
    default:
      return 'Buyer'
  }
}
