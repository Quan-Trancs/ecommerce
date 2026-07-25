import { NextResponse } from 'next/server'
import type { NextAuthConfig } from 'next-auth'
import { hasAdminAccess, hasSellerAccess, normalizeRole } from '@/lib/auth/roles'

export default {
  providers: [],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authorized({ request, auth }: any) {
      const { pathname } = request.nextUrl

      const needsAuth =
        /^\/checkout(\/.*)?$/.test(pathname) ||
        /^\/account(\/.*)?$/.test(pathname) ||
        /^\/seller(\/.*)?$/.test(pathname) ||
        /^\/admin(\/.*)?$/.test(pathname)

      if (!needsAuth) return true
      if (!auth?.user) return false

      const role = normalizeRole(auth.user.role)

      if (/^\/seller(\/.*)?$/.test(pathname) && !hasSellerAccess(role)) {
        return NextResponse.redirect(new URL('/account', request.url))
      }
      if (/^\/admin(\/.*)?$/.test(pathname) && !hasAdminAccess(role)) {
        return NextResponse.redirect(new URL('/account', request.url))
      }

      return true
    },
  },
} satisfies NextAuthConfig
