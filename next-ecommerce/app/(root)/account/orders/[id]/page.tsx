import { notFound } from 'next/navigation'
import React from 'react'

import { auth } from '@/auth'
import { getOrderById, getOrderNotes } from '@/lib/actions/order.actions'
import OrderDetailsForm from '@/components/shared/order/order-details-form'
import Link from 'next/link'
import { formatId } from '@/lib/utils'
import { hasAdminAccess, hasSellerAccess, hasSupportAccess } from '@/lib/auth/roles'

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params

  return {
    title: `Order ${formatId(params.id)}`,
  }
}

export default async function OrderDetailsPage(props: {
  params: Promise<{
    id: string
  }>
}) {
  const params = await props.params

  const { id } = params

  const order = await getOrderById(id)
  if (!order) notFound()

  const session = await auth()
  const notes = session?.user?.id ? await getOrderNotes(id) : []
  const orderUserId =
    typeof order.user === 'string' ? order.user : undefined
  const isSellerViewer =
    hasSellerAccess(session?.user?.role) &&
    !hasSupportAccess(session?.user?.role) &&
    Boolean(session?.user?.id) &&
    session?.user?.id !== orderUserId

  return (
    <>
      <div className='flex gap-2'>
        {isSellerViewer ? (
          <>
            <Link href='/seller'>Seller</Link>
            <span>›</span>
            <Link href='/seller/orders'>Orders</Link>
            <span>›</span>
            <span>Order {formatId(order._id)}</span>
          </>
        ) : (
          <>
            <Link href='/account'>Your Account</Link>
            <span>›</span>
            <Link href='/account/orders'>Your Orders</Link>
            <span>›</span>
            <span>Order {formatId(order._id)}</span>
          </>
        )}
      </div>
      <h1 className='h1-bold py-4'>Order {formatId(order._id)}</h1>
      <OrderDetailsForm
        order={order}
        isAdmin={hasAdminAccess(session?.user?.role)}
        canCancelElevated={hasSupportAccess(session?.user?.role)}
        notes={notes}
      />
    </>
  )
}
