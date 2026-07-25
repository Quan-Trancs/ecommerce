import { randomBytes } from 'crypto'
import { query } from '@/lib/db/postgres'

export type NewsletterSubscriber = {
  id: number
  email: string
  source: string
  active: boolean
  accountId: string | null
  subscribedAt: string
  unsubscribedAt: string | null
  createdAt: string
}

type Row = {
  id: number | string
  email: string
  source: string
  active: boolean
  account_id: string | null
  subscribed_at: Date | string
  unsubscribed_at: Date | string | null
  created_at: Date | string
}

function mapRow(row: Row): NewsletterSubscriber {
  return {
    id: Number(row.id),
    email: row.email,
    source: row.source,
    active: Boolean(row.active),
    accountId: row.account_id,
    subscribedAt: new Date(row.subscribed_at).toISOString(),
    unsubscribedAt: row.unsubscribed_at
      ? new Date(row.unsubscribed_at).toISOString()
      : null,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320
}

export async function subscribeToNewsletter(input: {
  email: string
  source?: string
  accountId?: string | null
}): Promise<{ ok: boolean; message: string; subscriber?: NewsletterSubscriber }> {
  const email = normalizeEmail(input.email)
  if (!isValidEmail(email)) {
    return { ok: false, message: 'Enter a valid email address' }
  }

  const source = (input.source || 'footer').trim().slice(0, 80) || 'footer'
  const token = randomBytes(24).toString('hex')

  const existing = await query<Row>(
    `SELECT * FROM newsletter_subscribers WHERE email = $1 LIMIT 1`,
    [email]
  )
  const row = existing.rows[0]
  if (row) {
    if (row.active) {
      return {
        ok: true,
        message: 'You are already subscribed',
        subscriber: mapRow(row),
      }
    }
    const reactivated = await query<Row>(
      `UPDATE newsletter_subscribers
       SET active = TRUE,
           unsubscribed_at = NULL,
           source = $2,
           account_id = COALESCE($3, account_id),
           unsubscribe_token = $4,
           subscribed_at = NOW(),
           updated_at = NOW()
       WHERE email = $1
       RETURNING *`,
      [email, source, input.accountId || null, token]
    )
    return {
      ok: true,
      message: 'Welcome back — you are subscribed again',
      subscriber: mapRow(reactivated.rows[0]),
    }
  }

  const inserted = await query<Row>(
    `INSERT INTO newsletter_subscribers
       (email, source, active, unsubscribe_token, account_id, subscribed_at, created_at, updated_at)
     VALUES ($1, $2, TRUE, $3, $4, NOW(), NOW(), NOW())
     RETURNING *`,
    [email, source, token, input.accountId || null]
  )
  return {
    ok: true,
    message: 'Thanks for subscribing',
    subscriber: mapRow(inserted.rows[0]),
  }
}

export async function unsubscribeByToken(
  token: string
): Promise<{ ok: boolean; message: string }> {
  const trimmed = token.trim()
  if (!trimmed) return { ok: false, message: 'Invalid unsubscribe link' }
  const result = await query<Row>(
    `UPDATE newsletter_subscribers
     SET active = FALSE, unsubscribed_at = NOW(), updated_at = NOW()
     WHERE unsubscribe_token = $1 AND active = TRUE
     RETURNING *`,
    [trimmed]
  )
  if (!result.rows[0]) {
    return { ok: true, message: 'You are already unsubscribed' }
  }
  return { ok: true, message: 'You have been unsubscribed' }
}

export async function listNewsletterSubscribers(options?: {
  activeOnly?: boolean
  limit?: number
}): Promise<NewsletterSubscriber[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 200, 5000))
  const activeOnly = options?.activeOnly !== false
  const result = await query<Row>(
    activeOnly
      ? `SELECT id, email, source, active, account_id, subscribed_at, unsubscribed_at, created_at
         FROM newsletter_subscribers
         WHERE active = TRUE
         ORDER BY subscribed_at DESC
         LIMIT $1`
      : `SELECT id, email, source, active, account_id, subscribed_at, unsubscribed_at, created_at
         FROM newsletter_subscribers
         ORDER BY subscribed_at DESC
         LIMIT $1`,
    [limit]
  )
  return result.rows.map(mapRow)
}

export async function countActiveNewsletterSubscribers(): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM newsletter_subscribers WHERE active = TRUE`
  )
  return Number(result.rows[0]?.count || 0)
}
