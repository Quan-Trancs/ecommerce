import { query } from '@/lib/db/postgres'
import { roundToTwoDecimals } from '@/lib/utils'

export type CouponDiscountType = 'PERCENT' | 'FIXED'

export type Coupon = {
  id: number
  code: string
  discountType: CouponDiscountType
  discountValue: number
  minSubtotal: number
  maxRedemptions: number | null
  perUserLimit: number
  startsAt: string | null
  endsAt: string | null
  active: boolean
  createdAt: string
  redemptionCount?: number
}

type CouponRow = {
  id: number | string
  code: string
  discount_type: string
  discount_value: number | string
  min_subtotal: number | string
  max_redemptions: number | string | null
  per_user_limit: number | string
  starts_at: Date | string | null
  ends_at: Date | string | null
  active: boolean
  created_at: Date | string
  redemption_count?: number | string
}

function mapCoupon(row: CouponRow): Coupon {
  const type = String(row.discount_type || '').toUpperCase()
  return {
    id: Number(row.id),
    code: row.code,
    discountType: type === 'FIXED' ? 'FIXED' : 'PERCENT',
    discountValue: Number(row.discount_value),
    minSubtotal: Number(row.min_subtotal) || 0,
    maxRedemptions:
      row.max_redemptions == null ? null : Number(row.max_redemptions),
    perUserLimit: Number(row.per_user_limit) || 1,
    startsAt: row.starts_at ? new Date(row.starts_at).toISOString() : null,
    endsAt: row.ends_at ? new Date(row.ends_at).toISOString() : null,
    active: Boolean(row.active),
    createdAt: new Date(row.created_at).toISOString(),
    redemptionCount:
      row.redemption_count == null ? undefined : Number(row.redemption_count),
  }
}

export async function listCoupons(): Promise<Coupon[]> {
  const result = await query<CouponRow>(
    `SELECT c.*,
            (SELECT COUNT(*)::int FROM coupon_redemptions r WHERE r.coupon_id = c.id) AS redemption_count
     FROM coupons c
     ORDER BY c.created_at DESC`
  )
  return result.rows.map(mapCoupon)
}

export async function findCouponByCode(code: string): Promise<Coupon | null> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return null
  const result = await query<CouponRow>(
    `SELECT * FROM coupons WHERE UPPER(code) = $1 LIMIT 1`,
    [normalized]
  )
  return result.rows[0] ? mapCoupon(result.rows[0]) : null
}

export async function createCoupon(input: {
  code: string
  discountType: CouponDiscountType
  discountValue: number
  minSubtotal?: number
  maxRedemptions?: number | null
  perUserLimit?: number
  active?: boolean
}): Promise<Coupon> {
  const code = input.code.trim().toUpperCase()
  if (!code) throw new Error('Code is required')
  const result = await query<CouponRow>(
    `INSERT INTO coupons
       (code, discount_type, discount_value, min_subtotal, max_redemptions, per_user_limit, active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [
      code,
      input.discountType,
      input.discountValue,
      input.minSubtotal ?? 0,
      input.maxRedemptions ?? null,
      input.perUserLimit ?? 1,
      input.active !== false,
    ]
  )
  return mapCoupon(result.rows[0])
}

export async function setCouponActive(
  id: number,
  active: boolean
): Promise<void> {
  await query(
    `UPDATE coupons SET active = $2, updated_at = NOW() WHERE id = $1`,
    [id, active]
  )
}

export function computeCouponDiscount(
  coupon: Coupon,
  itemsPrice: number
): number {
  if (itemsPrice <= 0) return 0
  if (itemsPrice < coupon.minSubtotal) return 0
  let discount = 0
  if (coupon.discountType === 'PERCENT') {
    discount = (itemsPrice * coupon.discountValue) / 100
  } else {
    discount = coupon.discountValue
  }
  return roundToTwoDecimals(Math.min(Math.max(discount, 0), itemsPrice))
}

export async function assertCouponRedeemable(input: {
  coupon: Coupon
  accountId?: string | null
  itemsPrice: number
}): Promise<{ ok: true; discount: number } | { ok: false; message: string }> {
  const { coupon, accountId, itemsPrice } = input
  if (!coupon.active) return { ok: false, message: 'This promo code is inactive' }

  const now = Date.now()
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) {
    return { ok: false, message: 'This promo code is not active yet' }
  }
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() < now) {
    return { ok: false, message: 'This promo code has expired' }
  }
  if (itemsPrice < coupon.minSubtotal) {
    return {
      ok: false,
      message: `Minimum subtotal is $${coupon.minSubtotal.toFixed(2)}`,
    }
  }

  if (coupon.maxRedemptions != null) {
    const total = await query<{ count: string | number }>(
      `SELECT COUNT(*)::int AS count FROM coupon_redemptions WHERE coupon_id = $1`,
      [coupon.id]
    )
    if (Number(total.rows[0]?.count || 0) >= coupon.maxRedemptions) {
      return { ok: false, message: 'This promo code has reached its limit' }
    }
  }

  if (accountId && coupon.perUserLimit > 0) {
    const used = await query<{ count: string | number }>(
      `SELECT COUNT(*)::int AS count
       FROM coupon_redemptions
       WHERE coupon_id = $1 AND account_id = $2`,
      [coupon.id, accountId]
    )
    if (Number(used.rows[0]?.count || 0) >= coupon.perUserLimit) {
      return {
        ok: false,
        message: 'You have already used this promo code',
      }
    }
  }

  const discount = computeCouponDiscount(coupon, itemsPrice)
  if (discount <= 0) {
    return { ok: false, message: 'Promo code does not apply to this cart' }
  }
  return { ok: true, discount }
}

export async function recordCouponRedemption(input: {
  couponId: number
  accountId: string
  orderId: string
  discountAmount: number
}): Promise<void> {
  await query(
    `INSERT INTO coupon_redemptions
       (coupon_id, account_id, order_id, discount_amount, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (order_id) DO NOTHING`,
    [input.couponId, input.accountId, input.orderId, input.discountAmount]
  )
}

export async function getRedemptionForOrder(orderId: string): Promise<{
  code: string
  discountAmount: number
} | null> {
  const result = await query<{
    code: string
    discount_amount: number | string
  }>(
    `SELECT c.code, r.discount_amount
     FROM coupon_redemptions r
     JOIN coupons c ON c.id = r.coupon_id
     WHERE r.order_id = $1
     LIMIT 1`,
    [orderId]
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    code: row.code,
    discountAmount: Number(row.discount_amount) || 0,
  }
}
