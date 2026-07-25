import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasSellerAccess } from '@/lib/auth/roles'
import { listSellerPayouts } from '@/lib/db/seller-payouts'
import { sellerPayoutsToCsv } from '@/lib/csv/payout-export'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
    return NextResponse.json({ error: 'Seller access required' }, { status: 401 })
  }

  const payouts = await listSellerPayouts(session.user.id, { limit: 5000 })
  const csv = sellerPayoutsToCsv(payouts, { includeSellerIdentity: false })
  const stamp = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="my-payouts-${stamp}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
