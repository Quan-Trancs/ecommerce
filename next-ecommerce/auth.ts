import NextAuth, { type DefaultSession } from 'next-auth'
import authConfig from './auth.config'
import bcrypt from 'bcryptjs'
import CredentialsProvider from 'next-auth/providers/credentials'
import { normalizeRole, type Role } from './lib/auth/roles'
import { findUserByEmail, updateUser } from './lib/db/users'

declare module 'next-auth' {
  interface Session {
    user: {
      role: Role
    } & DefaultSession['user']
  }

  interface User {
    role?: Role
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
    newUser: '/sign-up',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: {
          type: 'email',
        },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (credentials == null) return null

        const user = await findUserByEmail(String(credentials.email || ''))
        if (!user?.passwordHash || !user.active) return null

        const isMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!isMatch) return null

        const role = normalizeRole(user.role)
        if (user.role !== role) {
          await updateUser(user.id, { role })
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role,
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        const name = user.name || user.email?.split('@')[0]
        if (user.id && name && !user.name) {
          await updateUser(user.id, { name })
        }
        token.name = name
        token.role = normalizeRole((user as { role?: string }).role)
      }

      if (session?.user?.name && trigger === 'update') {
        token.name = session.user.name
      }
      return token
    },

    session: async ({ session, user, trigger, token }) => {
      session.user.id = token.sub as string
      session.user.role = normalizeRole(token.role as string | undefined)
      session.user.name = token.name as string | undefined

      if (trigger === 'update') {
        session.user.name = user.name
      }

      return session
    },
  },
})
