import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getOrderById,
  getOrderCoupon,
  getOrderGiftCard,
} from '@/lib/actions/order.actions'
import { buildOrderInvoicePdf } from '@/lib/pdf/order-invoice'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    }

    const { id } = await context.params
    if (!id?.trim()) {
      return NextResponse.json({ error: 'Order id required' }, { status: 400 })
    }

    let order
    try {
      order = await getOrderById(id.trim())
    } catch {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const [coupon, giftCard] = await Promise.all([
      getOrderCoupon(order._id),
      getOrderGiftCard(order._id),
    ])

    const pdf = await buildOrderInvoicePdf(order, {
      coupon: coupon
        ? {
            code: coupon.code,
            discountAmount: Number(coupon.discountAmount || 0),
          }
        : null,
      giftCard: giftCard
        ? {
            code: giftCard.code,
            amount: Number(giftCard.amount || 0),
          }
        : null,
    })

    const filename = `invoice-${order._id}.pdf`
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('Invoice PDF error:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}
