import { listSellerOrders, type SellerOrder } from '@/lib/actions/seller.actions'
import { formatDateTime, formatId } from '@/lib/utils'
import ProductPrice from '@/components/shared/product/product-price'
import SellerShipOrderButton from './seller-ship-order-button'
import Link from 'next/link'

export const metadata = { title: 'Seller orders' }

function canShipSellerLines(order: SellerOrder) {
  const status = (order.status || '').toUpperCase()
  if (status === 'CANCELLED') return false
  if (!(order.isPaid || status === 'PAID' || status === 'SHIPPED')) return false
  const lines = order.items || []
  if (!lines.length) return false
  return lines.some((item) => !item.isShipped)
}

export default async function SellerOrdersPage() {
  let orders: Awaited<ReturnType<typeof listSellerOrders>> = []
  let error: string | null = null

  try {
    orders = await listSellerOrders()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load orders'
  }

  return (
    <div className='space-y-4'>
      <div>
        <h2 className='text-xl font-semibold'>Seller orders</h2>
        <p className='text-sm text-muted-foreground'>
          Orders that include your products ({orders.length}). Mark your lines
          shipped; the order becomes fully shipped when every seller has shipped.
        </p>
      </div>

      {error ? (
        <div className='rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive'>
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
          No orders contain your products yet.
        </div>
      ) : (
        <ul className='space-y-3'>
          {orders.map((order) => (
            <li key={order.id} className='rounded-lg border p-4'>
              <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                <div>
                  <p className='font-semibold'>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className='text-primary hover:underline'
                    >
                      Order {formatId(order.id)}
                    </Link>
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {order.createdAt
                      ? formatDateTime(new Date(order.createdAt)).dateTime
                      : '—'}{' '}
                    · {order.isPaid ? 'Paid' : 'Unpaid'}
                    {order.status ? ` · ${order.status}` : ''}
                  </p>
                </div>
                <div className='flex items-center gap-3'>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className='text-sm text-primary hover:underline'
                  >
                    Details & notes
                  </Link>
                  <ProductPrice price={order.itemsPrice} plain />
                  {canShipSellerLines(order) ? (
                    <SellerShipOrderButton orderId={order.id} />
                  ) : null}
                </div>
              </div>
              <ul className='space-y-1 text-sm text-muted-foreground'>
                {order.items.map((item, index) => (
                  <li key={`${item.productId}-${index}`}>
                    {item.quantity}× {item.name}
                    {item.color || item.size
                      ? ` (${[item.color, item.size].filter(Boolean).join(' / ')})`
                      : ''}{' '}
                    — <ProductPrice price={item.price} plain />
                    <span
                      className={
                        item.isShipped
                          ? 'ml-2 text-xs font-medium text-emerald-700'
                          : 'ml-2 text-xs font-medium text-amber-700'
                      }
                    >
                      {item.isShipped ? 'Shipped' : 'Unshipped'}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
