import PDFDocument from 'pdfkit'
import { APP_NAME, SENDER_NAME } from '@/lib/constants'
import type { IOrder } from '@/lib/types/order'

function money(value: number | undefined | null) {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) return '$0.00'
  return `$${amount.toFixed(2)}`
}

function formatDate(value: Date | string | undefined) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export type InvoiceExtras = {
  coupon?: { code: string; discountAmount: number } | null
  giftCard?: { code: string; amount: number } | null
}

export async function buildOrderInvoicePdf(
  order: IOrder,
  extras?: InvoiceExtras
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 50,
      info: {
        Title: `Invoice ${order._id}`,
        Author: APP_NAME,
      },
    })
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const left = doc.page.margins.left
    const right = doc.page.width - doc.page.margins.right

    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(APP_NAME, left, 50, { continued: false })
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#555555')
      .text(SENDER_NAME, { continued: false })
    doc.fillColor('#000000')

    doc.moveDown(0.5)
    doc.fontSize(16).font('Helvetica-Bold').text('Invoice')
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Order ID: ${order._id}`)
      .text(`Date: ${formatDate(order.createdAt)}`)
      .text(`Status: ${(order.status || 'PENDING').toUpperCase()}`)
      .text(
        `Payment: ${order.paymentMethod || '—'} · ${
          order.isPaid
            ? `Paid${order.paidAt ? ` ${formatDate(order.paidAt)}` : ''}`
            : 'Unpaid'
        }`
      )

    doc.moveDown()
    doc.font('Helvetica-Bold').text('Ship to')
    doc.font('Helvetica')
    const ship = order.shippingAddress
    doc.text(ship.fullName || '')
    if (ship.phone) doc.text(ship.phone)
    doc.text(
      [
        ship.street,
        [ship.city, ship.province, ship.postalCode].filter(Boolean).join(', '),
        ship.country,
      ]
        .filter(Boolean)
        .join('\n')
    )

    doc.moveDown()
    doc.font('Helvetica-Bold').fontSize(11).text('Items')
    doc.moveDown(0.3)

    const colItem = left
    const colQty = right - 180
    const colPrice = right - 110
    const colTotal = right - 50

    const drawHeader = (y: number) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('Item', colItem, y, { width: colQty - colItem - 8 })
        .text('Qty', colQty, y, { width: 40, align: 'right' })
        .text('Price', colPrice, y, { width: 50, align: 'right' })
        .text('Total', colTotal - 10, y, { width: 60, align: 'right' })
      doc
        .moveTo(left, y + 14)
        .lineTo(right, y + 14)
        .strokeColor('#cccccc')
        .stroke()
    }

    let y = doc.y + 4
    drawHeader(y)
    y += 20
    doc.font('Helvetica').fontSize(9).strokeColor('#000000')

    for (const item of order.items || []) {
      const refunded = Number(item.refundedQuantity || 0)
      const qty = Math.max(0, Number(item.quantity || 0) - refunded)
      const unit = Number(item.price || 0)
      const lineTotal = unit * qty
      const meta = [item.color, item.size].filter(Boolean).join(' / ')
      const label =
        item.name +
        (meta ? ` (${meta})` : '') +
        (refunded > 0 ? ` · ${refunded} refunded` : '')

      const height = doc.heightOfString(label, {
        width: colQty - colItem - 8,
      })
      if (y + height > doc.page.height - 120) {
        doc.addPage()
        y = doc.page.margins.top
        drawHeader(y)
        y += 20
        doc.font('Helvetica').fontSize(9)
      }

      doc.text(label, colItem, y, { width: colQty - colItem - 8 })
      doc.text(String(qty), colQty, y, { width: 40, align: 'right' })
      doc.text(money(unit), colPrice, y, { width: 50, align: 'right' })
      doc.text(money(lineTotal), colTotal - 10, y, {
        width: 60,
        align: 'right',
      })
      y += Math.max(height, 14) + 8
    }

    doc.y = y + 8
    doc
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .strokeColor('#cccccc')
      .stroke()
    doc.moveDown()

    const totals: { label: string; value: string }[] = [
      { label: 'Items', value: money(order.itemsPrice) },
    ]
    if (extras?.coupon && extras.coupon.discountAmount > 0) {
      totals.push({
        label: `Promo (${extras.coupon.code})`,
        value: `-${money(extras.coupon.discountAmount)}`,
      })
    }
    if (extras?.giftCard && extras.giftCard.amount > 0) {
      totals.push({
        label: `Gift card (${extras.giftCard.code})`,
        value: `-${money(extras.giftCard.amount)}`,
      })
    }
    totals.push(
      { label: 'Tax', value: money(order.taxPrice) },
      { label: 'Shipping', value: money(order.shippingPrice) },
      { label: 'Total', value: money(order.totalPrice) }
    )

    for (const row of totals) {
      const isTotal = row.label === 'Total'
      doc
        .font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(isTotal ? 11 : 10)
      const rowY = doc.y
      doc.text(row.label, right - 200, rowY, { width: 100, align: 'left' })
      doc.text(row.value, right - 90, rowY, { width: 90, align: 'right' })
      doc.moveDown(0.4)
    }

    doc.moveDown()
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#666666')
      .text(
        `Thank you for shopping with ${APP_NAME}. This invoice is a record of your order.`,
        left,
        doc.y,
        { width: right - left }
      )

    doc.end()
  })
}
