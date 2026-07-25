'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { hasAdminAccess, hasSellerAccess } from '@/lib/auth/roles'
import { listUsers } from '@/lib/db/users'
import {
  getSellerEarningsSummary,
  listRecentPayouts,
  listRecentSellerEarningLines,
  listSellerPayouts,
  recordSellerPayout,
  type SellerPayout,
} from '@/lib/db/seller-payouts'
import { formatError } from '@/lib/utils'
import { logStaffAction } from '@/lib/audit/log-staff-action'

export type { SellerPayout }

export async function getMySellerEarnings() {
  const session = await auth()
  if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
    throw new Error('Seller role required')
  }
  const sellerId = session.user.id
  const [summary, payouts, lines] = await Promise.all([
    getSellerEarningsSummary(sellerId),
    listSellerPayouts(sellerId, { limit: 40 }),
    listRecentSellerEarningLines(sellerId, { limit: 20 }),
  ])
  return JSON.parse(
    JSON.stringify({
      ...summary,
      payouts,
      recentLines: lines,
    })
  ) as {
    grossRevenue: number
    paidOut: number
    available: number
    payouts: SellerPayout[]
    recentLines: Array<{
      orderId: string
      productName: string
      quantity: number
      lineTotal: number
      paidAt: string | null
      createdAt: string
    }>
  }
}

export async function adminGetPayoutsBoard() {
  const session = await auth()
  if (!hasAdminAccess(session?.user?.role)) {
    return { sellers: [], payouts: [] }
  }
  const users = await listUsers()
  const sellers = users.filter(
    (u) => u.role === 'SELLER' || u.role === 'ADMIN'
  )
  const withBalances = await Promise.all(
    sellers.map(async (seller) => {
      const summary = await getSellerEarningsSummary(seller.id)
      return {
        id: seller.id,
        email: seller.email,
        name: seller.name,
        role: seller.role,
        ...summary,
      }
    })
  )
  const payouts = await listRecentPayouts({ limit: 40 })
  return JSON.parse(
    JSON.stringify({
      sellers: withBalances.sort((a, b) => b.available - a.available),
      payouts,
    })
  )
}

export async function adminRecordSellerPayout(input: {
  sellerAccountId: string
  amount: number | string
  note?: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasAdminAccess(session.user.role)) {
      return { success: false, message: 'Admin required' }
    }
    const amount = Number(input.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: 'Enter a positive payout amount' }
    }
    await recordSellerPayout({
      sellerAccountId: input.sellerAccountId,
      amount,
      note: input.note,
      recordedBy: session.user.id,
    })
    await logStaffAction({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: 'SELLER_PAYOUT',
      entityType: 'seller',
      entityId: input.sellerAccountId,
      summary: `Recorded payout $${amount.toFixed(2)} for seller ${input.sellerAccountId}`,
      metadata: { amount, note: input.note || null },
    })
    revalidatePath('/admin/payouts')
    revalidatePath('/seller/earnings')
    revalidatePath('/seller')
    revalidatePath('/admin/audit')
    return { success: true, message: 'Payout recorded' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
