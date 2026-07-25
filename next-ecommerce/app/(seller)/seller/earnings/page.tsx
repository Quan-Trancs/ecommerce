import Link from 'next/link'
import { getMySellerEarnings } from '@/lib/actions/payout.actions'
import ProductPrice from '@/components/shared/product/product-price'
import { formatDateTime, formatId } from '@/lib/utils'

export const metadata = { title: 'Seller earnings' }

export default async function SellerEarningsPage() {
  const data = await getMySellerEarnings()

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='font-display text-2xl font-extrabold tracking-tight'>
          Earnings
        </h2>
        <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
          Gross sales from your product lines on paid orders, minus payouts
          recorded by the platform.
        </p>
      </div>

      <div className='grid gap-3 sm:grid-cols-3'>
        <div className='rounded-lg border p-4'>
          <p className='font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
            Available
          </p>
          <p className='mt-2 font-display text-2xl font-extrabold tracking-tight text-emerald-700'>
            <ProductPrice price={data.available} plain />
          </p>
        </div>
        <div className='rounded-lg border p-4'>
          <p className='font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
            Lifetime gross
          </p>
          <p className='mt-2 font-display text-2xl font-extrabold tracking-tight'>
            <ProductPrice price={data.grossRevenue} plain />
          </p>
        </div>
        <div className='rounded-lg border p-4'>
          <p className='font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
            Paid out
          </p>
          <p className='mt-2 font-display text-2xl font-extrabold tracking-tight'>
            <ProductPrice price={data.paidOut} plain />
          </p>
        </div>
      </div>

      <section className='space-y-3'>
        <h3 className='text-lg font-semibold'>Payout history</h3>
        {data.payouts.length === 0 ? (
          <p className='rounded-lg border border-dashed p-6 text-sm text-muted-foreground'>
            No payouts recorded yet.
          </p>
        ) : (
          <ul className='divide-y rounded-lg border'>
            {data.payouts.map((payout) => (
              <li
                key={payout.id}
                className='flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm'
              >
                <div>
                  <p className='font-medium'>
                    <ProductPrice price={payout.amount} plain />
                  </p>
                  {payout.note ? (
                    <p className='text-muted-foreground'>{payout.note}</p>
                  ) : null}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {formatDateTime(new Date(payout.paidAt)).dateTime}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className='space-y-3'>
        <h3 className='text-lg font-semibold'>Recent paid lines</h3>
        {data.recentLines.length === 0 ? (
          <p className='rounded-lg border border-dashed p-6 text-sm text-muted-foreground'>
            No paid sales yet.
          </p>
        ) : (
          <ul className='divide-y rounded-lg border'>
            {data.recentLines.map((line, index) => (
              <li
                key={`${line.orderId}-${index}`}
                className='flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm'
              >
                <div>
                  <p className='font-medium'>{line.productName}</p>
                  <p className='text-muted-foreground'>
                    Qty {line.quantity} · Order{' '}
                    <Link
                      href={`/account/orders/${line.orderId}`}
                      className='text-primary underline'
                    >
                      {formatId(line.orderId)}
                    </Link>
                  </p>
                </div>
                <p className='font-medium'>
                  <ProductPrice price={line.lineTotal} plain />
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
