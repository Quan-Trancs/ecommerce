import Link from 'next/link'
import { getSellerAnalytics } from '@/lib/actions/seller.actions'
import ProductPrice from '@/components/shared/product/product-price'

export const metadata = { title: 'Seller dashboard' }

export default async function SellerHomePage() {
  let analytics: Awaited<ReturnType<typeof getSellerAnalytics>> | null = null
  let error: string | null = null

  try {
    analytics = await getSellerAnalytics()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load analytics'
  }

  return (
    <div className='space-y-8'>
      <div>
        <p className='max-w-2xl text-muted-foreground'>
          Manage your catalog listings and fulfill orders. Snapshot metrics use
          your product lines only (multi-seller orders count your share).
        </p>
      </div>

      {error ? (
        <div className='rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive'>
          {error}
        </div>
      ) : analytics ? (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='rounded-lg border p-4'>
            <p className='font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
              Sales (all time)
            </p>
            <p className='mt-2 font-display text-2xl font-extrabold tracking-tight'>
              <ProductPrice price={analytics.salesRevenue} plain />
            </p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Last 30 days:{' '}
              <ProductPrice price={analytics.salesRevenueLast30Days} plain />
            </p>
            <Link
              href='/seller/earnings'
              className='mt-2 inline-block text-xs text-primary underline'
            >
              View earnings & payouts
            </Link>
          </div>
          <Link
            href='/seller/orders'
            className='rounded-lg border p-4 transition hover:border-primary'
          >
            <p className='font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
              Needs shipping
            </p>
            <p className='mt-2 font-display text-2xl font-extrabold tracking-tight'>
              {analytics.ordersNeedingShip}
            </p>
            <p className='mt-1 text-sm text-muted-foreground'>
              {analytics.unshippedUnits} unshipped unit
              {analytics.unshippedUnits === 1 ? '' : 's'} · {analytics.ordersPaid}{' '}
              paid orders
            </p>
          </Link>
          <Link
            href='/seller/products'
            className='rounded-lg border p-4 transition hover:border-primary'
          >
            <p className='font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
              Products
            </p>
            <p className='mt-2 font-display text-2xl font-extrabold tracking-tight'>
              {analytics.productsPublished}
              <span className='text-base font-semibold text-muted-foreground'>
                /{analytics.productsTotal}
              </span>
            </p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Published · {analytics.productsLowStock} at low stock (≤5)
            </p>
          </Link>
          <div className='rounded-lg border p-4'>
            <p className='font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
              Orders touched
            </p>
            <p className='mt-2 font-display text-2xl font-extrabold tracking-tight'>
              {analytics.ordersTotal}
            </p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Include unpaid / cancelled in this count
            </p>
          </div>
        </div>
      ) : null}

      <ul className='grid gap-3 sm:grid-cols-2'>
        <li>
          <Link
            href='/seller/products'
            className='block rounded-lg border p-4 transition hover:border-primary'
          >
            <h2 className='font-semibold'>Products</h2>
            <p className='text-sm text-muted-foreground'>
              List, create, and publish SKUs you own
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
              Orders containing your products — mark your lines shipped
            </p>
          </Link>
        </li>
      </ul>
    </div>
  )
}
