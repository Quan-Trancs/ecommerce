import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/require-role'
import { adminListCoupons } from '@/lib/actions/coupon.actions'
import { CouponsAdminClient } from './coupons-admin-client'

export const metadata = { title: 'Coupons' }

export default async function AdminCouponsPage() {
  await requireAdmin()
  const coupons = await adminListCoupons()

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='font-display text-2xl font-extrabold tracking-tight'>
          Coupons
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Promo codes applied at checkout. Seeded demo code:{' '}
          <code className='rounded bg-muted px-1'>WELCOME10</code> (10% off).
        </p>
      </div>
      <CouponsAdminClient coupons={coupons} />
      <p className='text-xs text-muted-foreground'>
        <Link href='/admin' className='underline'>
          Back to overview
        </Link>
      </p>
    </div>
  )
}
