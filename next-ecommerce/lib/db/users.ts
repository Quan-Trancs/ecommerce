import { randomUUID } from 'crypto'
import { normalizeRole, type Role } from '@/lib/auth/roles'
import { query, withClient } from './postgres'

export type DbUser = {
  id: string
  email: string
  name: string
  passwordHash: string | null
  role: Role
  emailVerified: boolean
  image: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date | null
}

type AccountRow = {
  id: string
  email: string
  display_name: string | null
  password_hash: string | null
  role: string
  email_verified: boolean
  image: string | null
  active: boolean
  created_at: Date
  updated_at: Date | null
}

function mapRow(row: AccountRow): DbUser {
  return {
    id: row.id,
    email: row.email,
    name: row.display_name || row.email.split('@')[0],
    passwordHash: row.password_hash,
    role: normalizeRole(row.role),
    emailVerified: Boolean(row.email_verified),
    image: row.image,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const SELECT_COLS = `
  id, email, display_name, password_hash, role, email_verified, image, active, created_at, updated_at
`

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const result = await query<AccountRow>(
    `SELECT ${SELECT_COLS} FROM accounts WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email.trim()]
  )
  return result.rows[0] ? mapRow(result.rows[0]) : null
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const result = await query<AccountRow>(
    `SELECT ${SELECT_COLS} FROM accounts WHERE id = $1 LIMIT 1`,
    [id]
  )
  return result.rows[0] ? mapRow(result.rows[0]) : null
}

export async function listUsers(): Promise<DbUser[]> {
  const result = await query<AccountRow>(
    `SELECT ${SELECT_COLS} FROM accounts ORDER BY created_at DESC`
  )
  return result.rows.map(mapRow)
}

export async function createUser(input: {
  name: string
  email: string
  passwordHash: string
  role: Role
  emailVerified?: boolean
  id?: string
}): Promise<DbUser> {
  const id = input.id || randomUUID()
  const role = normalizeRole(input.role)
  const now = new Date()

  await withClient(async (client) => {
    await client.query('BEGIN')
    try {
      await client.query(
        `INSERT INTO accounts (
           id, email, display_name, password_hash, role, email_verified, image, active, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, NULL, TRUE, $7, $7)`,
        [
          id,
          input.email.trim(),
          input.name.trim(),
          input.passwordHash,
          role,
          Boolean(input.emailVerified),
          now,
        ]
      )

      if (role === 'SELLER' || role === 'ADMIN') {
        const shopName = `${input.name.trim()}'s shop`
        await client.query(
          `INSERT INTO seller_profiles (account_id, shop_name, bio, verified, created_at, updated_at)
           VALUES ($1, $2, NULL, $3, $4, $4)
           ON CONFLICT (account_id) DO NOTHING`,
          [id, shopName, role === 'ADMIN', now]
        )
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })

  const created = await findUserById(id)
  if (!created) throw new Error('Failed to create user')
  return created
}

export async function updateUser(
  id: string,
  patch: { name?: string; role?: Role; emailVerified?: boolean }
): Promise<DbUser | null> {
  const existing = await findUserById(id)
  if (!existing) return null

  const name = patch.name?.trim() || existing.name
  const role = patch.role ? normalizeRole(patch.role) : existing.role
  const emailVerified =
    patch.emailVerified === undefined ? existing.emailVerified : patch.emailVerified
  const now = new Date()

  await withClient(async (client) => {
    await client.query('BEGIN')
    try {
      await client.query(
        `UPDATE accounts
         SET display_name = $2, role = $3, email_verified = $4, updated_at = $5
         WHERE id = $1`,
        [id, name, role, emailVerified, now]
      )

      if (role === 'SELLER' || role === 'ADMIN') {
        await client.query(
          `INSERT INTO seller_profiles (account_id, shop_name, bio, verified, created_at, updated_at)
           VALUES ($1, $2, NULL, $3, $4, $4)
           ON CONFLICT (account_id) DO NOTHING`,
          [id, `${name}'s shop`, role === 'ADMIN', now]
        )
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })

  return findUserById(id)
}

/** Seed helper: wipe auth rows (keeps catalog/orders). */
export async function replaceAllUsers(
  users: Array<{
    id?: string
    name: string
    email: string
    passwordHash: string
    role: Role
    emailVerified?: boolean
  }>
): Promise<DbUser[]> {
  await withClient(async (client) => {
    await client.query('BEGIN')
    try {
      await client.query('DELETE FROM seller_profiles')
      await client.query('DELETE FROM accounts')
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })

  const created: DbUser[] = []
  for (const user of users) {
    created.push(
      await createUser({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        emailVerified: user.emailVerified,
      })
    )
  }
  return created
}
