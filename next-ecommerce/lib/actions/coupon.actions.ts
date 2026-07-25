'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { hasAdminAccess } from '@/lib/auth/roles'
import {
  assertCouponRedeemable,
  createCoupon,
  findCouponByCode,
  listCoupons,
  setCouponActive,
  type Coupon,
  type CouponDiscountType,
} from '@/lib/db/coupons'
import { formatError, roundToTwoDecimals } from '@/lib/utils'
import { logStaffAction } from '@/lib/audit/log-staff-action'

export type { Coupon }

export async function previewCouponDiscount(input: {
  code: string
  itemsPrice: number
}): Promise<{
  success: boolean
  message: string
  code?: string
  discountPrice?: number
}> {
  try {
    const session = await auth()
    const coupon = await findCouponByCode(input.code)
    if (!coupon) {
      return { success: false, message: 'Invalid promo code' }
    }
    const check = await assertCouponRedeemable({
      coupon,
      accountId: session?.user?.id,
      itemsPrice: roundToTwoDecimals(Number(input.itemsPrice) || 0),
    })
    if (!check.ok) {
      return { success: false, message: check.message }
    }
    return {
      success: true,
      message: 'Promo applied',
      code: coupon.code,
      discountPrice: check.discount,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function adminListCoupons(): Promise<Coupon[]> {
  const session = await auth()
  if (!hasAdminAccess(session?.user?.role)) return []
  return JSON.parse(JSON.stringify(await listCoupons()))
}

export async function adminCreateCoupon(input: {
  code: string
  discountType: CouponDiscountType | string
  discountValue: number | string
  minSubtotal?: number | string
  maxRedemptions?: number | string | null
  perUserLimit?: number | string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!hasAdminAccess(session?.user?.role)) {
      return { success: false, message: 'Admin required' }
    }
    const discountType =
      String(input.discountType).toUpperCase() === 'FIXED' ? 'FIXED' : 'PERCENT'
    const discountValue = Number(input.discountValue)
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return { success: false, message: 'Discount value must be positive' }
    }
    if (discountType === 'PERCENT' && discountValue > 100) {
      return { success: false, message: 'Percent discount cannot exceed 100' }
    }
    await createCoupon({
      code: input.code,
      discountType,
      discountValue,
      minSubtotal: Number(input.minSubtotal) || 0,
      maxRedemptions:
        input.maxRedemptions === '' ||
        input.maxRedemptions == null ||
        Number.isNaN(Number(input.maxRedemptions))
          ? null
          : Number(input.maxRedemptions),
      perUserLimit: Number(input.perUserLimit) || 1,
    })
    await logStaffAction({
      actorId: session?.user?.id,
      actorRole: session?.user?.role,
      action: 'COUPON_CREATE',
      entityType: 'coupon',
      entityId: input.code.trim().toUpperCase(),
      summary: `Created coupon ${input.code.trim().toUpperCase()}`,
      metadata: { discountType, discountValue },
    })
    revalidatePath('/admin/coupons')
    revalidatePath('/admin/audit')
    return { success: true, message: 'Coupon created' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function adminToggleCoupon(
  id: number,
  active: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!hasAdminAccess(session?.user?.role)) {
      return { success: false, message: 'Admin required' }
    }
    await setCouponActive(id, active)
    await logStaffAction({
      actorId: session?.user?.id,
      actorRole: session?.user?.role,
      action: active ? 'COUPON_ACTIVATE' : 'COUPON_DEACTIVATE',
      entityType: 'coupon',
      entityId: String(id),
      summary: `${active ? 'Activated' : 'Deactivated'} coupon #${id}`,
    })
    revalidatePath('/admin/coupons')
    revalidatePath('/admin/audit')
    return {
      success: true,
      message: active ? 'Coupon activated' : 'Coupon deactivated',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
