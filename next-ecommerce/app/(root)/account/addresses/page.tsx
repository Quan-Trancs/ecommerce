import Link from 'next/link'
import { requireSession } from '@/lib/auth/require-role'
import { AddressesManagerClient } from './addresses-manager-client'

export const metadata = { title: 'Saved addresses' }

export default async function AccountAddressesPage() {
  await requireSession()

  return (
    <div className='page-shell space-y-6 px-4 py-8 md:px-6'>
      <div>
        <p className='text-sm text-muted-foreground'>
          <Link href='/account' className='hover:text-foreground'>
            Your Account
          </Link>
          <span className='mx-2'>/</span>
          Addresses
        </p>
        <h1 className='mt-2 font-display text-3xl font-extrabold tracking-tight'>
          Saved addresses
        </h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Reuse shipping addresses at checkout.
        </p>
      </div>
      <AddressesManagerClient />
    </div>
  )
}
