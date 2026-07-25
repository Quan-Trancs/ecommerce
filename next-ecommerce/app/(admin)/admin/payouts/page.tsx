import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/require-role'
import { adminGetPayoutsBoard } from '@/lib/actions/payout.actions'
import { PayoutsAdminClient } from './payouts-admin-client'

export const metadata = { title: 'Seller payouts' }

export default async function AdminPayoutsPage() {
  await requireAdmin()
  const board = await adminGetPayoutsBoard()

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='font-display text-2xl font-extrabold tracking-tight'>
          Seller payouts
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Record settlements against available balances (gross paid line
          revenue minus prior payouts).
        </p>
      </div>
      <PayoutsAdminClient sellers={board.sellers} payouts={board.payouts} />
      <p className='text-xs text-muted-foreground'>
        <Link href='/admin' className='underline'>
          Back to overview
        </Link>
      </p>
    </div>
  )
}
