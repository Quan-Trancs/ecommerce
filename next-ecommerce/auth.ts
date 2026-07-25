import NextAuth, { type DefaultSession } from 'next-auth'
import authConfig from './auth.config'
import client from './lib/db/client'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { connectToDatabase } from './lib/db'
import User from './lib/db/models/user.model'
import bcrypt from 'bcryptjs'
import CredentialsProvider from 'next-auth/providers/credentials'
import { normalizeRole, type Role } from './lib/auth/roles'

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
  adapter: MongoDBAdapter(client),
  providers: [
    CredentialsProvider({
      credentials: {
        email: {
          type: 'email',
        },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        await connectToDatabase()
        if (credentials == null) return null

        const user = await User.findOne({ email: credentials.email })

        if (user && user.password) {
          const isMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          )
          if (isMatch) {
            const role = normalizeRole(user.role)
            if (user.role !== role) {
              await User.findByIdAndUpdate(user.id, { role })
            }
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role,
            }
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        if (!user.name) {
          await connectToDatabase()
          await User.findByIdAndUpdate(user.id, {
            name: user.name || user.email?.split('@')[0],
          })
        }
        token.name = user.name || user.email?.split('@')[0]
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
