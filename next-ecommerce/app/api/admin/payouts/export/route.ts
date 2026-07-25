import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasAdminAccess } from '@/lib/auth/roles'
import { listRecentPayouts } from '@/lib/db/seller-payouts'
import { sellerPayoutsToCsv } from '@/lib/csv/payout-export'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || !hasAdminAccess(session.user.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }

  const payouts = await listRecentPayouts({ limit: 5000 })
  const csv = sellerPayoutsToCsv(payouts, { includeSellerIdentity: true })
  const stamp = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="seller-payouts-${stamp}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
