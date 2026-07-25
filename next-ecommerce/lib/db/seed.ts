import { loadEnvConfig } from '@next/env'
import { cwd } from 'process'
import data from '@/lib/data'
import { replaceAllUsers } from './users'
import type { Role } from '@/lib/auth/roles'

loadEnvConfig(cwd())

const main = async () => {
  try {
    const { users } = data
    const createdUsers = await replaceAllUsers(
      users.map((user) => ({
        name: user.name,
        email: user.email,
        passwordHash: user.password,
        role: user.role as Role,
        emailVerified: user.emailVerified,
      }))
    )

    console.log({
      createdUsers: createdUsers.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
      })),
      message:
        'Seeded users into Postgres accounts (catalog is seeded by store-backend)',
    })
    process.exit(0)
  } catch (error) {
    console.log(error)
    throw new Error('Failed to seed database')
  }
}

main()
