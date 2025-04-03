//middleware
import type { NextAuthConfig } from 'next-auth'

export default {
  providers: [],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authorized({ request, auth }: any) {
      const protectedRoutes = [
        /\/checkout(\/.*)?/,
        /\/account(\/.*)?/,
        /\/admin(\/.*)?/,
      ]

      const { pathName } = request.nextUrl
      if (protectedRoutes.some((route) => route.test(pathName))) return !!auth

      return true
    },
  },
} satisfies NextAuthConfig
