import Link from 'next/link'
import {
  listSupportOrdersByEmail,
  listSupportRecentOrders,
  type SupportOrderRow,
} from '@/lib/actions/support.actions'
import { cn, formatDateTime, formatId } from '@/lib/utils'
import ProductPrice from '@/components/shared/product/product-price'
import AssistOrderLookup from '@/components/shared/order/assist-order-lookup'

export const metadata = { title: 'Admin orders' }

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const

function filterByStatus(
  orders: SupportOrderRow[],
  status: string
): SupportOrderRow[] {
  if (!status) return orders
  const upper = status.toUpperCase()
  return orders.filter((o) => String(o.status || '').toUpperCase() === upper)
}

function buildHref(opts: { email?: string; status?: string }) {
  const params = new URLSearchParams()
  if (opts.email) params.set('email', opts.email)
  if (opts.status) params.set('status', opts.status)
  const q = params.toString()
  return q ? `/admin/orders?${q}` : '/admin/orders'
}

export default async function AdminOrdersPage(props: {
  searchParams: Promise<{ email?: string; status?: string }>
}) {
  const searchParams = await props.searchParams
  const emailQuery = (searchParams.email || '').trim()
  const statusQuery = (searchParams.status || '').trim().toUpperCase()

  let orders: SupportOrderRow[] = []
  let error: string | null = null

  try {
    orders = emailQuery
      ? await listSupportOrdersByEmail(emailQuery)
      : await listSupportRecentOrders(100)
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load orders'
  }

  const filtered = filterByStatus(orders, statusQuery)
  const paidCount = orders.filter((o) => o.isPaid).length
  const cancelledCount = orders.filter(
    (o) => String(o.status || '').toUpperCase() === 'CANCELLED'
  ).length

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold'>Orders</h2>
        <p className='text-sm text-muted-foreground'>
          Platform-wide recent orders (up to 100), or filter by buyer email /
          status. Open an order for cancel &amp; refund tools.
        </p>
      </div>

      <AssistOrderLookup basePath='/admin/orders' initialEmail={emailQuery} />

      {!error && orders.length > 0 ? (
        <p className='text-sm text-muted-foreground'>
          Loaded {orders.length} order{orders.length === 1 ? '' : 's'}
          {emailQuery ? ` for ${emailQuery}` : ''}
          {' · '}
          {paidCount} paid · {cancelledCount} cancelled
          {statusQuery ? ` · showing ${filtered.length} with status ${statusQuery}` : ''}
        </p>
      ) : null}

      <div className='flex flex-wrap gap-2'>
        {STATUS_FILTERS.map((f) => {
          const active = (statusQuery || '') === f.value
          return (
            <Link
              key={f.value || 'all'}
              href={buildHref({
                email: emailQuery || undefined,
                status: f.value || undefined,
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

      {emailQuery ? (
        <p className='text-sm text-muted-foreground'>
          Email filter active ·{' '}
          <Link
            href={buildHref({ status: statusQuery || undefined })}
            className='text-primary hover:underline'
          >
            Clear email
          </Link>
        </p>
      ) : null}

      {error ? (
        <div className='rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive'>
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
          {emailQuery
            ? 'No account or orders found for that email.'
            : statusQuery
              ? `No ${statusQuery} orders in this list.`
              : 'No recent orders.'}
        </div>
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <table className='w-full text-left text-sm'>
            <thead className='border-b bg-muted/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground'>
              <tr>
                <th className='px-4 py-3'>Order</th>
                <th className='px-4 py-3'>Created</th>
                <th className='px-4 py-3'>Status</th>
                <th className='px-4 py-3'>Items</th>
                <th className='px-4 py-3'>Total</th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td className='px-4 py-3'>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className='font-medium text-primary hover:underline'
                    >
                      {formatId(order.id)}
                    </Link>
                    <p className='text-xs text-muted-foreground'>{order.userId}</p>
                  </td>
                  <td className='px-4 py-3 text-muted-foreground'>
                    {order.createdAt
                      ? formatDateTime(new Date(order.createdAt)).dateTime
                      : '—'}
                  </td>
                  <td className='px-4 py-3'>
                    {order.isPaid ? 'Paid' : 'Unpaid'}
                    {order.status ? ` · ${order.status}` : ''}
                  </td>
                  <td className='px-4 py-3 text-muted-foreground'>
                    {order.itemsCount}
                  </td>
                  <td className='px-4 py-3'>
                    <ProductPrice price={order.totalPrice} plain />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
