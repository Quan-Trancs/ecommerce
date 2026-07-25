import type { SellerPayout } from '@/lib/db/seller-payouts'

function csvEscape(value: string | number | null | undefined): string {
  const raw = value == null ? '' : String(value)
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

export function sellerPayoutsToCsv(
  payouts: SellerPayout[],
  options?: { includeSellerIdentity?: boolean }
): string {
  const includeSeller = Boolean(options?.includeSellerIdentity)
  const headers = includeSeller
    ? [
        'id',
        'sellerAccountId',
        'sellerEmail',
        'sellerName',
        'amount',
        'currency',
        'note',
        'recordedBy',
        'paidAt',
        'createdAt',
      ]
    : [
        'id',
        'amount',
        'currency',
        'note',
        'recordedBy',
        'paidAt',
        'createdAt',
      ]

  const lines = [headers.join(',')]
  for (const payout of payouts) {
    const cells = includeSeller
      ? [
          payout.id,
          payout.sellerAccountId,
          payout.sellerEmail || '',
          payout.sellerName || '',
          payout.amount.toFixed(2),
          payout.currency,
          payout.note || '',
          payout.recordedBy || '',
          payout.paidAt,
          payout.createdAt,
        ]
      : [
          payout.id,
          payout.amount.toFixed(2),
          payout.currency,
          payout.note || '',
          payout.recordedBy || '',
          payout.paidAt,
          payout.createdAt,
        ]
    lines.push(cells.map(csvEscape).join(','))
  }
  return `${lines.join('\n')}\n`
}
