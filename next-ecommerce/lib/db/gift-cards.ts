import { query, withClient } from '@/lib/db/postgres'
import { roundToTwoDecimals } from '@/lib/utils'

export type GiftCard = {
  id: number
  code: string
  initialBalance: number
  remainingBalance: number
  currency: string
  active: boolean
  expiresAt: string | null
  createdBy: string | null
  note: string | null
  createdAt: string
}

type Row = {
  id: number | string
  code: string
  initial_balance: number | string
  remaining_balance: number | string
  currency: string
  active: boolean
  expires_at: Date | string | null
  created_by: string | null
  note: string | null
  created_at: Date | string
}

function mapCard(row: Row): GiftCard {
  return {
    id: Number(row.id),
    code: row.code,
    initialBalance: Number(row.initial_balance),
    remainingBalance: Number(row.remaining_balance),
    currency: row.currency || 'USD',
    active: Boolean(row.active),
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    createdBy: row.created_by,
    note: row.note,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export async function listGiftCards(): Promise<GiftCard[]> {
  const result = await query<Row>(
    `SELECT * FROM gift_cards ORDER BY created_at DESC`
  )
  return result.rows.map(mapCard)
}

export async function findGiftCardByCode(code: string): Promise<GiftCard | null> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return null
  const result = await query<Row>(
    `SELECT * FROM gift_cards WHERE UPPER(code) = $1 LIMIT 1`,
    [normalized]
  )
  return result.rows[0] ? mapCard(result.rows[0]) : null
}

export async function createGiftCard(input: {
  code: string
  initialBalance: number
  createdBy?: string | null
  note?: string | null
  expiresAt?: string | null
}): Promise<GiftCard> {
  const code = input.code.trim().toUpperCase()
  const balance = roundToTwoDecimals(input.initialBalance)
  if (!code) throw new Error('Code required')
  if (!(balance > 0)) throw new Error('Balance must be positive')
  const result = await query<Row>(
    `INSERT INTO gift_cards
       (code, initial_balance, remaining_balance, currency, active, expires_at, created_by, note, created_at, updated_at)
     VALUES ($1, $2, $2, 'USD', TRUE, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [
      code,
      balance,
      input.expiresAt ? new Date(input.expiresAt) : null,
      input.createdBy || null,
      input.note?.trim()?.slice(0, 500) || null,
    ]
  )
  const row = result.rows[0]
  if (!row) throw new Error('Failed to create gift card')
  return mapCard(row)
}

export async function setGiftCardActive(
  id: number,
  active: boolean
): Promise<void> {
  await query(
    `UPDATE gift_cards SET active = $2, updated_at = NOW() WHERE id = $1`,
    [id, active]
  )
}

export async function assertGiftCardApplicable(input: {
  code: string
  orderTotal: number
}): Promise<
  | { ok: true; card: GiftCard; applyAmount: number }
  | { ok: false; message: string }
> {
  const card = await findGiftCardByCode(input.code)
  if (!card) return { ok: false, message: 'Invalid gift card code' }
  if (!card.active) return { ok: false, message: 'This gift card is inactive' }
  if (card.expiresAt && new Date(card.expiresAt).getTime() < Date.now()) {
    return { ok: false, message: 'This gift card has expired' }
  }
  if (card.remainingBalance <= 0) {
    return { ok: false, message: 'This gift card has no remaining balance' }
  }
  const orderTotal = roundToTwoDecimals(Math.max(0, input.orderTotal))
  if (orderTotal <= 0) {
    return { ok: false, message: 'Nothing to apply the gift card to' }
  }
  const applyAmount = roundToTwoDecimals(
    Math.min(card.remainingBalance, orderTotal)
  )
  if (!(applyAmount > 0)) {
    return { ok: false, message: 'Gift card cannot be applied' }
  }
  return { ok: true, card, applyAmount }
}

export async function redeemGiftCardForOrder(input: {
  code: string
  orderId: string
  accountId: string
  amount: number
}): Promise<GiftCard> {
  const amount = roundToTwoDecimals(input.amount)
  if (!(amount > 0)) throw new Error('Gift card amount must be positive')
  const code = input.code.trim().toUpperCase()

  return withClient(async (client) => {
    await client.query('BEGIN')
    try {
      const locked = await client.query<Row>(
        `SELECT * FROM gift_cards WHERE UPPER(code) = $1 FOR UPDATE`,
        [code]
      )
      const row = locked.rows[0]
      if (!row) throw new Error('Gift card not found')
      const card = mapCard(row)
      if (!card.active) throw new Error('Gift card is inactive')
      if (card.expiresAt && new Date(card.expiresAt).getTime() < Date.now()) {
        throw new Error('Gift card has expired')
      }
      if (card.remainingBalance + 0.001 < amount) {
        throw new Error('Gift card balance is insufficient')
      }

      const updated = await client.query<Row>(
        `UPDATE gift_cards
         SET remaining_balance = remaining_balance - $2,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [card.id, amount]
      )
      await client.query(
        `INSERT INTO gift_card_redemptions
           (gift_card_id, order_id, account_id, amount, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (order_id) DO NOTHING`,
        [card.id, input.orderId, input.accountId, amount]
      )
      await client.query('COMMIT')
      return mapCard(updated.rows[0] || row)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
}

export async function getGiftCardRedemptionForOrder(orderId: string): Promise<{
  code: string
  amount: number
} | null> {
  const result = await query<{
    code: string
    amount: number | string
  }>(
    `SELECT g.code, r.amount
     FROM gift_card_redemptions r
     JOIN gift_cards g ON g.id = r.gift_card_id
     WHERE r.order_id = $1
     LIMIT 1`,
    [orderId]
  )
  const row = result.rows[0]
  if (!row) return null
  return { code: row.code, amount: Number(row.amount) || 0 }
}
