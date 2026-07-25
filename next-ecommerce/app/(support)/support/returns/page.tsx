import Link from 'next/link'
import { getSupportReturnQueue } from '@/lib/actions/return.actions'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatId } from '@/lib/utils'
import { RETURN_REASONS } from '@/lib/returns/constants'

export const metadata = { title: 'Return requests' }

function reasonLabel(reason: string) {
  return (
    RETURN_REASONS.find((r) => r.value === reason)?.label || reason || 'Other'
  )
}

export default async function SupportReturnsPage() {
  let returns: Awaited<ReturnType<typeof getSupportReturnQueue>> = []
  let error: string | null = null
  try {
    returns = await getSupportReturnQueue()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load returns'
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold'>Return requests</h2>
        <p className='text-sm text-muted-foreground'>
          Open RMA requests awaiting staff review. Approve or reject on the
          order page; process refunds separately when needed.
        </p>
      </div>

      {error ? (
        <div className='rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive'>
          {error}
        </div>
      ) : returns.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
          No open return requests.
        </div>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {returns.map((ret) => (
            <li key={ret.id}>
              <Link
                href={`/account/orders/${ret.orderId}`}
                className='block space-y-2 px-4 py-3 hover:bg-muted/40'
              >
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='font-medium'>
                    Return #{ret.id} · Order {formatId(ret.orderId)}
                  </span>
                  <Badge variant='secondary'>Requested</Badge>
                  <Badge variant='outline'>{reasonLabel(ret.reason)}</Badge>
                </div>
                <p className='text-sm text-muted-foreground'>
                  {ret.items
                    .map(
                      (i) =>
                        `${i.name || `Item ${i.orderItemId}`} ×${i.quantity}`
                    )
                    .join(' · ')}
                </p>
                <div className='flex flex-wrap gap-3 text-xs text-muted-foreground'>
                  <span>
                    {ret.buyerName || ret.buyerEmail || 'Buyer'}
                    {ret.buyerEmail && ret.buyerName
                      ? ` · ${ret.buyerEmail}`
                      : ''}
                  </span>
                  <span>
                    Submitted{' '}
                    {formatDateTime(new Date(ret.createdAt)).dateTime}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
