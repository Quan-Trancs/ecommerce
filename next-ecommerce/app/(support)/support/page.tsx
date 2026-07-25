import Link from 'next/link'
import {
  listSupportOrdersByEmail,
  listSupportRecentOrders,
} from '@/lib/actions/support.actions'
import { formatDateTime, formatId } from '@/lib/utils'
import ProductPrice from '@/components/shared/product/product-price'
import SupportOrderLookup from './support-order-lookup'

export const metadata = { title: 'Support orders' }

export default async function SupportHomePage(props: {
  searchParams: Promise<{ email?: string }>
}) {
  const searchParams = await props.searchParams
  const emailQuery = (searchParams.email || '').trim()

  let orders: Awaited<ReturnType<typeof listSupportRecentOrders>> = []
  let error: string | null = null

  try {
    orders = emailQuery
      ? await listSupportOrdersByEmail(emailQuery)
      : await listSupportRecentOrders()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load orders'
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold'>Order assist</h2>
        <p className='text-sm text-muted-foreground'>
          Look up by order id or buyer email, or browse recent store orders.
          Support cannot change roles or catalog — ask an admin for that.
        </p>
      </div>

      <SupportOrderLookup initialEmail={emailQuery} />

      {emailQuery ? (
        <p className='text-sm text-muted-foreground'>
          Showing orders for <span className='font-medium text-foreground'>{emailQuery}</span>
          {' · '}
          <Link href='/support' className='text-primary hover:underline'>
            Recent orders
          </Link>
        </p>
      ) : null}

      {error ? (
        <div className='rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive'>
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
          {emailQuery
            ? 'No account or orders found for that email.'
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
              {orders.map((order) => (
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
