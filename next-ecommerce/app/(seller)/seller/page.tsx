import Link from 'next/link'

export const metadata = { title: 'Seller dashboard' }

export default function SellerHomePage() {
  return (
    <div className='space-y-4'>
      <p className='max-w-2xl text-muted-foreground'>
        Manage your catalog listings and fulfill orders. Product create/update
        APIs live under <code className='text-sm'>/api/v1/seller/*</code> on the
        store backend.
      </p>
      <ul className='grid gap-3 sm:grid-cols-2'>
        <li>
          <Link
            href='/seller/products'
            className='block rounded-lg border p-4 transition hover:border-primary'
          >
            <h2 className='font-semibold'>Products</h2>
            <p className='text-sm text-muted-foreground'>
              List, edit, and publish SKUs you own
            </p>
          </Link>
        </li>
        <li>
          <Link
            href='/seller/orders'
            className='block rounded-lg border p-4 transition hover:border-primary'
          >
            <h2 className='font-semibold'>Orders</h2>
            <p className='text-sm text-muted-foreground'>
              Orders containing your products
            </p>
          </Link>
        </li>
      </ul>
    </div>
  )
}
