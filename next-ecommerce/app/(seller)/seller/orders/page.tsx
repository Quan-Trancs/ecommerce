import { listSellerOrders } from '@/lib/actions/seller.actions'
import { formatDateTime, formatId } from '@/lib/utils'
import ProductPrice from '@/components/shared/product/product-price'
import SellerShipOrderButton from './seller-ship-order-button'

export const metadata = { title: 'Seller orders' }

function canShip(order: { status?: string; isPaid?: boolean }) {
  const status = (order.status || '').toUpperCase()
  if (status === 'SHIPPED' || status === 'CANCELLED') return false
  return Boolean(order.isPaid) || status === 'PAID'
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
          Orders that include your products ({orders.length}). Mark paid orders
          as shipped after you send them.
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
                  <p className='font-semibold'>Order {formatId(order.id)}</p>
                  <p className='text-sm text-muted-foreground'>
                    {order.createdAt
                      ? formatDateTime(new Date(order.createdAt)).dateTime
                      : '—'}{' '}
                    · {order.isPaid ? 'Paid' : 'Unpaid'}
                    {order.status ? ` · ${order.status}` : ''}
                  </p>
                </div>
                <div className='flex items-center gap-3'>
                  <ProductPrice price={order.itemsPrice} plain />
                  {canShip(order) ? (
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
