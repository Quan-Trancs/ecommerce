import { randomUUID } from 'crypto'
import { normalizeRole, type Role } from '@/lib/auth/roles'
import {
  clampHour,
  normalizeTimezone,
  type QuietHoursPrefs,
} from '@/lib/email/quiet-hours'
import { query, withClient } from './postgres'

export type OrderNoteEmailMode = 'DIGEST' | 'IMMEDIATE'

export type DbUser = {
  id: string
  email: string
  name: string
  passwordHash: string | null
  role: Role
  emailVerified: boolean
  /** Opt-in (default true): email on public order-note notifications. */
  notifyOrderNotes: boolean
  /** DIGEST (batched) or IMMEDIATE (per message). */
  orderNoteEmailMode: OrderNoteEmailMode
  quietHoursEnabled: boolean
  quietHoursStart: number
  quietHoursEnd: number
  quietHoursTimezone: string
  phoneE164: string | null
  notifyOrderNotesSms: boolean
  notifyOrderNotesPush: boolean
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
  notify_order_notes: boolean
  order_note_email_mode: string | null
  quiet_hours_enabled: boolean
  quiet_hours_start: number
  quiet_hours_end: number
  quiet_hours_timezone: string | null
  phone_e164: string | null
  notify_order_notes_sms: boolean
  notify_order_notes_push: boolean
  image: string | null
  active: boolean
  created_at: Date
  updated_at: Date | null
}

export function normalizeOrderNoteEmailMode(
  value?: string | null
): OrderNoteEmailMode {
  const upper = (value || '').trim().toUpperCase()
  if (upper === 'IMMEDIATE' || upper === 'INSTANT') return 'IMMEDIATE'
  return 'DIGEST'
}

export function quietHoursFromUser(user: DbUser): QuietHoursPrefs {
  return {
    enabled: user.quietHoursEnabled,
    startHour: user.quietHoursStart,
    endHour: user.quietHoursEnd,
    timezone: user.quietHoursTimezone,
  }
}

function mapRow(row: AccountRow): DbUser {
  return {
    id: row.id,
    email: row.email,
    name: row.display_name || row.email.split('@')[0],
    passwordHash: row.password_hash,
    role: normalizeRole(row.role),
    emailVerified: Boolean(row.email_verified),
    notifyOrderNotes: row.notify_order_notes !== false,
    orderNoteEmailMode: normalizeOrderNoteEmailMode(row.order_note_email_mode),
    quietHoursEnabled: Boolean(row.quiet_hours_enabled),
    quietHoursStart: clampHour(row.quiet_hours_start, 22),
    quietHoursEnd: clampHour(row.quiet_hours_end, 8),
    quietHoursTimezone: normalizeTimezone(row.quiet_hours_timezone),
    phoneE164: row.phone_e164 || null,
    notifyOrderNotesSms: Boolean(row.notify_order_notes_sms),
    notifyOrderNotesPush: Boolean(row.notify_order_notes_push),
    image: row.image,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const SELECT_COLS = `
  id, email, display_name, password_hash, role, email_verified,
  COALESCE(notify_order_notes, TRUE) AS notify_order_notes,
  COALESCE(order_note_email_mode, 'DIGEST') AS order_note_email_mode,
  COALESCE(quiet_hours_enabled, FALSE) AS quiet_hours_enabled,
  COALESCE(quiet_hours_start, 22) AS quiet_hours_start,
  COALESCE(quiet_hours_end, 8) AS quiet_hours_end,
  COALESCE(quiet_hours_timezone, 'UTC') AS quiet_hours_timezone,
  phone_e164,
  COALESCE(notify_order_notes_sms, FALSE) AS notify_order_notes_sms,
  COALESCE(notify_order_notes_push, FALSE) AS notify_order_notes_push,
  image, active, created_at, updated_at
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
           id, email, display_name, password_hash, role, email_verified,
           notify_order_notes, order_note_email_mode,
           quiet_hours_enabled, quiet_hours_start, quiet_hours_end, quiet_hours_timezone,
           image, active, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'DIGEST', FALSE, 22, 8, 'UTC', NULL, TRUE, $7, $7)`,
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
  patch: {
    name?: string
    role?: Role
    emailVerified?: boolean
    notifyOrderNotes?: boolean
    orderNoteEmailMode?: OrderNoteEmailMode
    quietHoursEnabled?: boolean
    quietHoursStart?: number
    quietHoursEnd?: number
    quietHoursTimezone?: string
    phoneE164?: string | null
    notifyOrderNotesSms?: boolean
    notifyOrderNotesPush?: boolean
  }
): Promise<DbUser | null> {
  const existing = await findUserById(id)
  if (!existing) return null

  const name = patch.name?.trim() || existing.name
  const role = patch.role ? normalizeRole(patch.role) : existing.role
  const emailVerified =
    patch.emailVerified === undefined ? existing.emailVerified : patch.emailVerified
  const notifyOrderNotes =
    patch.notifyOrderNotes === undefined
      ? existing.notifyOrderNotes
      : Boolean(patch.notifyOrderNotes)
  const orderNoteEmailMode =
    patch.orderNoteEmailMode === undefined
      ? existing.orderNoteEmailMode
      : normalizeOrderNoteEmailMode(patch.orderNoteEmailMode)
  const quietHoursEnabled =
    patch.quietHoursEnabled === undefined
      ? existing.quietHoursEnabled
      : Boolean(patch.quietHoursEnabled)
  const quietHoursStart =
    patch.quietHoursStart === undefined
      ? existing.quietHoursStart
      : clampHour(patch.quietHoursStart, existing.quietHoursStart)
  const quietHoursEnd =
    patch.quietHoursEnd === undefined
      ? existing.quietHoursEnd
      : clampHour(patch.quietHoursEnd, existing.quietHoursEnd)
  const quietHoursTimezone =
    patch.quietHoursTimezone === undefined
      ? existing.quietHoursTimezone
      : normalizeTimezone(patch.quietHoursTimezone)
  const phoneE164 =
    patch.phoneE164 === undefined ? existing.phoneE164 : patch.phoneE164
  const notifyOrderNotesSms =
    patch.notifyOrderNotesSms === undefined
      ? existing.notifyOrderNotesSms
      : Boolean(patch.notifyOrderNotesSms)
  const notifyOrderNotesPush =
    patch.notifyOrderNotesPush === undefined
      ? existing.notifyOrderNotesPush
      : Boolean(patch.notifyOrderNotesPush)
  const now = new Date()

  await withClient(async (client) => {
    await client.query('BEGIN')
    try {
      await client.query(
        `UPDATE accounts
         SET display_name = $2, role = $3, email_verified = $4,
             notify_order_notes = $5, order_note_email_mode = $6,
             quiet_hours_enabled = $7, quiet_hours_start = $8,
             quiet_hours_end = $9, quiet_hours_timezone = $10,
             phone_e164 = $11, notify_order_notes_sms = $12,
             notify_order_notes_push = $13,
             updated_at = $14
         WHERE id = $1`,
        [
          id,
          name,
          role,
          emailVerified,
          notifyOrderNotes,
          orderNoteEmailMode,
          quietHoursEnabled,
          quietHoursStart,
          quietHoursEnd,
          quietHoursTimezone,
          phoneE164,
          notifyOrderNotesSms,
          notifyOrderNotesPush,
          now,
        ]
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

export async function updateOrderNoteNotificationPreferences(
  id: string,
  prefs: {
    notifyOrderNotes: boolean
    orderNoteEmailMode: OrderNoteEmailMode
    quietHoursEnabled: boolean
    quietHoursStart: number
    quietHoursEnd: number
    quietHoursTimezone: string
    phoneE164?: string | null
    notifyOrderNotesSms?: boolean
    notifyOrderNotesPush?: boolean
  }
): Promise<DbUser | null> {
  return updateUser(id, {
    notifyOrderNotes: prefs.notifyOrderNotes,
    orderNoteEmailMode: prefs.orderNoteEmailMode,
    quietHoursEnabled: prefs.quietHoursEnabled,
    quietHoursStart: prefs.quietHoursStart,
    quietHoursEnd: prefs.quietHoursEnd,
    quietHoursTimezone: prefs.quietHoursTimezone,
    phoneE164: prefs.phoneE164,
    notifyOrderNotesSms: prefs.notifyOrderNotesSms,
    notifyOrderNotesPush: prefs.notifyOrderNotesPush,
  })
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
