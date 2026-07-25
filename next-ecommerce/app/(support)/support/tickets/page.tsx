import Link from 'next/link'
import { getSupportTicketQueue } from '@/lib/actions/support.actions'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatId } from '@/lib/utils'

export const metadata = { title: 'Support tickets' }

const STATUSES = ['', 'PENDING', 'PAID', 'SHIPPED', 'CANCELLED'] as const

function roleLabel(role: string) {
  const upper = (role || '').toUpperCase()
  if (upper === 'SUPPORT') return 'Support'
  if (upper === 'ADMIN') return 'Admin'
  if (upper === 'SELLER') return 'Seller'
  return 'Buyer'
}

export default async function SupportTicketsPage(props: {
  searchParams: Promise<{
    urgent?: string
    awaiting?: string
    status?: string
  }>
}) {
  const searchParams = await props.searchParams
  const urgentOnly = searchParams.urgent === '1'
  const awaitingStaff = searchParams.awaiting === '1'
  const status = (searchParams.status || '').trim().toUpperCase() || null

  let tickets: Awaited<ReturnType<typeof getSupportTicketQueue>> = []
  let error: string | null = null
  try {
    tickets = await getSupportTicketQueue({
      urgentOnly,
      awaitingStaff,
      status,
      limit: 60,
    })
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load tickets'
  }

  function hrefFor(next: {
    urgent?: boolean
    awaiting?: boolean
    status?: string | null
  }) {
    const params = new URLSearchParams()
    const u = next.urgent ?? urgentOnly
    const a = next.awaiting ?? awaitingStaff
    const s = next.status === undefined ? status : next.status
    if (u) params.set('urgent', '1')
    if (a) params.set('awaiting', '1')
    if (s) params.set('status', s)
    const q = params.toString()
    return q ? `/support/tickets?${q}` : '/support/tickets'
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold'>Ticket queue</h2>
        <p className='text-sm text-muted-foreground'>
          Public order-note threads. Open a row to reply on the order. Urgent
          and awaiting-staff threads sort first.
        </p>
      </div>

      <div className='flex flex-wrap gap-2 text-sm'>
        <Link
          href={hrefFor({ awaiting: !awaitingStaff })}
          className={`rounded-md border px-3 py-1.5 ${
            awaitingStaff ? 'border-primary bg-primary/10 text-primary' : ''
          }`}
        >
          Awaiting staff
        </Link>
        <Link
          href={hrefFor({ urgent: !urgentOnly })}
          className={`rounded-md border px-3 py-1.5 ${
            urgentOnly ? 'border-destructive bg-destructive/10 text-destructive' : ''
          }`}
        >
          Urgent only
        </Link>
        {STATUSES.map((value) => (
          <Link
            key={value || 'all'}
            href={hrefFor({ status: value || null })}
            className={`rounded-md border px-3 py-1.5 ${
              (status || '') === value
                ? 'border-primary bg-primary/10 text-primary'
                : ''
            }`}
          >
            {value || 'All statuses'}
          </Link>
        ))}
      </div>

      {error ? (
        <div className='rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive'>
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
          No matching threads. Public order notes will appear here.
        </div>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {tickets.map((ticket) => (
            <li key={ticket.orderId}>
              <Link
                href={`/account/orders/${ticket.orderId}`}
                className='block space-y-2 px-4 py-3 hover:bg-muted/40'
              >
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='font-medium'>
                    Order {formatId(ticket.orderId)}
                  </span>
                  <Badge variant='outline'>{ticket.orderStatus || '—'}</Badge>
                  {ticket.urgent ? (
                    <Badge variant='destructive'>Urgent</Badge>
                  ) : null}
                  {ticket.awaitingStaff ? (
                    <Badge variant='secondary'>Awaiting staff</Badge>
                  ) : (
                    <Badge variant='outline'>Staff replied</Badge>
                  )}
                  <span className='text-xs text-muted-foreground'>
                    {ticket.publicNoteCount} public note
                    {ticket.publicNoteCount === 1 ? '' : 's'}
                  </span>
                </div>
                <p className='line-clamp-2 text-sm text-muted-foreground'>
                  <span className='font-medium text-foreground'>
                    {roleLabel(ticket.lastAuthorRole)}:
                  </span>{' '}
                  {ticket.lastNoteBody}
                </p>
                <div className='flex flex-wrap gap-3 text-xs text-muted-foreground'>
                  <span>
                    {ticket.buyerName || ticket.buyerEmail || 'Buyer'}
                    {ticket.buyerEmail && ticket.buyerName
                      ? ` · ${ticket.buyerEmail}`
                      : ''}
                  </span>
                  <span>
                    Last update{' '}
                    {formatDateTime(new Date(ticket.lastNoteAt)).dateTime}
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
