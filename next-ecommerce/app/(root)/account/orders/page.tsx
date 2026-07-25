import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMyOrders } from '@/lib/actions/order.actions'
import { cn, formatDateTime, formatId } from '@/lib/utils'
import ProductPrice from '@/components/shared/product/product-price'
import BuyerOrderDateFilter from './buyer-order-date-filter'

export const metadata = { title: 'Your Orders' }

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const

const DATE_PRESETS = [
  { value: '', label: 'Any time' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' },
] as const

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function fromPreset(days: string): string | undefined {
  const n = Number(days)
  if (!Number.isFinite(n) || n <= 0) return undefined
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - n)
  return isoDate(d)
}

function buildHref(opts: {
  status?: string
  range?: string
  from?: string
  to?: string
}) {
  const params = new URLSearchParams()
  if (opts.status) params.set('status', opts.status)
  if (opts.range) params.set('range', opts.range)
  if (opts.from) params.set('from', opts.from)
  if (opts.to) params.set('to', opts.to)
  const q = params.toString()
  return q ? `/account/orders?${q}` : '/account/orders'
}

export default async function OrdersPage(props: {
  searchParams: Promise<{
    status?: string
    range?: string
    from?: string
    to?: string
  }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/sign-in')

  const searchParams = await props.searchParams
  const statusQuery = (searchParams.status || '').trim().toUpperCase()
  const rangeQuery = (searchParams.range || '').trim()
  const fromQuery = (searchParams.from || '').trim()
  const toQuery = (searchParams.to || '').trim()

  const from =
    fromQuery ||
    (rangeQuery && !fromQuery ? fromPreset(rangeQuery) : undefined)
  const to = toQuery || undefined

  const orders = await getMyOrders({
    status: statusQuery || undefined,
    from,
    to,
  })

  const hasFilters = Boolean(statusQuery || rangeQuery || fromQuery || toQuery)

  return (
    <div className='page-shell px-4 py-8 md:px-6'>
      <div className='mb-6 flex gap-2 text-sm text-muted-foreground'>
        <Link href='/account' className='hover:text-foreground'>
          Your Account
        </Link>
        <span>›</span>
        <span className='text-foreground'>Your Orders</span>
      </div>
      <h1 className='mb-2 font-display text-3xl font-extrabold tracking-tight'>
        Your orders
      </h1>
      <p className='mb-6 text-sm text-muted-foreground'>
        Filter by status or date. Open an order for payment or cancel options.
      </p>

      <div className='mb-4 flex flex-wrap gap-2'>
        {STATUS_FILTERS.map((f) => {
          const active = (statusQuery || '') === f.value
          return (
            <Link
              key={f.value || 'all'}
              href={buildHref({
                status: f.value || undefined,
                range: rangeQuery || undefined,
                from: fromQuery || undefined,
                to: toQuery || undefined,
              })}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm',
                active
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'hover:border-primary hover:text-primary'
              )}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <div className='mb-4 flex flex-wrap gap-2'>
        {DATE_PRESETS.map((f) => {
          const active =
            !fromQuery && !toQuery && (rangeQuery || '') === f.value
          return (
            <Link
              key={f.value || 'any'}
              href={buildHref({
                status: statusQuery || undefined,
                range: f.value || undefined,
              })}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm',
                active
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'hover:border-primary hover:text-primary'
              )}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <BuyerOrderDateFilter
        key={`${fromQuery}|${toQuery}|${statusQuery}`}
        status={statusQuery || undefined}
        initialFrom={fromQuery}
        initialTo={toQuery}
      />

      {hasFilters ? (
        <p className='mb-4 text-sm text-muted-foreground'>
          Showing {orders.length} matching order{orders.length === 1 ? '' : 's'}
          {' · '}
          <Link href='/account/orders' className='text-primary hover:underline'>
            Clear filters
          </Link>
        </p>
      ) : null}

      {orders.length === 0 ? (
        <p className='text-muted-foreground'>
          {hasFilters ? (
            <>No orders match these filters.</>
          ) : (
            <>
              No orders yet.{' '}
              <Link href='/search' className='text-primary underline'>
                Start shopping
              </Link>
            </>
          )}
        </p>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {orders.map((order) => (
            <li
              key={order._id}
              className='flex flex-wrap items-center justify-between gap-3 p-4'
            >
              <div>
                <Link
                  href={`/account/orders/${order._id}`}
                  className='font-semibold text-primary hover:underline'
                >
                  Order {formatId(order._id)}
                </Link>
                <p className='text-sm text-muted-foreground'>
                  {formatDateTime(order.createdAt).dateOnly} ·{' '}
                  {order.isPaid ? 'Paid' : 'Unpaid'}
                  {order.status ? ` · ${order.status}` : ''}
                </p>
              </div>
              <ProductPrice price={order.totalPrice} plain />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
