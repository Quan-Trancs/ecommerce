import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMyOrders } from '@/lib/actions/order.actions'
import { formatDateTime, formatId } from '@/lib/utils'
import ProductPrice from '@/components/shared/product/product-price'

export const metadata = { title: 'Your Orders' }

export default async function OrdersPage() {
  const session = await auth()
  if (!session?.user) redirect('/sign-in')

  const orders = await getMyOrders()

  return (
    <div className='page-shell px-4 py-8 md:px-6'>
      <div className='mb-6 flex gap-2 text-sm text-muted-foreground'>
        <Link href='/account' className='hover:text-foreground'>
          Your Account
        </Link>
        <span>›</span>
        <span className='text-foreground'>Your Orders</span>
      </div>
      <h1 className='mb-6 font-display text-3xl font-extrabold tracking-tight'>
        Your orders
      </h1>

      {orders.length === 0 ? (
        <p className='text-muted-foreground'>
          No orders yet.{' '}
          <Link href='/search' className='text-primary underline'>
            Start shopping
          </Link>
        </p>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {orders.map((order) => (
            <li key={order._id} className='flex flex-wrap items-center justify-between gap-3 p-4'>
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
