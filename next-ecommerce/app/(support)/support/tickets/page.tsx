import Link from 'next/link'
import { auth } from '@/auth'
import {
  getSupportStaffOptions,
  getSupportTicketQueue,
} from '@/lib/actions/support.actions'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatId } from '@/lib/utils'
import { TicketAssignControls } from './ticket-assign-controls'

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
    assignment?: string
  }>
}) {
  const searchParams = await props.searchParams
  const session = await auth()
  const currentUserId = session?.user?.id || ''
  const urgentOnly = searchParams.urgent === '1'
  const awaitingStaff = searchParams.awaiting === '1'
  const status = (searchParams.status || '').trim().toUpperCase() || null
  const assignmentRaw = (searchParams.assignment || '').trim().toLowerCase()
  const assignment =
    assignmentRaw === 'mine' || assignmentRaw === 'unassigned'
      ? assignmentRaw
      : 'all'

  let tickets: Awaited<ReturnType<typeof getSupportTicketQueue>> = []
  let staff: Awaited<ReturnType<typeof getSupportStaffOptions>> = []
  let error: string | null = null
  try {
    ;[tickets, staff] = await Promise.all([
      getSupportTicketQueue({
        urgentOnly,
        awaitingStaff,
        status,
        assignment,
        limit: 60,
      }),
      getSupportStaffOptions(),
    ])
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load tickets'
  }

  function hrefFor(next: {
    urgent?: boolean
    awaiting?: boolean
    status?: string | null
    assignment?: 'all' | 'mine' | 'unassigned'
  }) {
    const params = new URLSearchParams()
    const u = next.urgent ?? urgentOnly
    const a = next.awaiting ?? awaitingStaff
    const s = next.status === undefined ? status : next.status
    const asg = next.assignment ?? assignment
    if (u) params.set('urgent', '1')
    if (a) params.set('awaiting', '1')
    if (s) params.set('status', s)
    if (asg && asg !== 'all') params.set('assignment', asg)
    const q = params.toString()
    return q ? `/support/tickets?${q}` : '/support/tickets'
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold'>Ticket queue</h2>
        <p className='text-sm text-muted-foreground'>
          Public order-note threads. Claim a ticket, then open the order to
          reply. Urgent and awaiting-staff threads sort first.
        </p>
      </div>

      <div className='flex flex-wrap gap-2 text-sm'>
        <Link
          href={hrefFor({ assignment: 'all' })}
          className={`rounded-md border px-3 py-1.5 ${
            assignment === 'all' ? 'border-primary bg-primary/10 text-primary' : ''
          }`}
        >
          All
        </Link>
        <Link
          href={hrefFor({ assignment: 'mine' })}
          className={`rounded-md border px-3 py-1.5 ${
            assignment === 'mine'
              ? 'border-primary bg-primary/10 text-primary'
              : ''
          }`}
        >
          Mine
        </Link>
        <Link
          href={hrefFor({ assignment: 'unassigned' })}
          className={`rounded-md border px-3 py-1.5 ${
            assignment === 'unassigned'
              ? 'border-primary bg-primary/10 text-primary'
              : ''
          }`}
        >
          Unassigned
        </Link>
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
            <li key={ticket.orderId} className='px-4 py-3 hover:bg-muted/40'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <Link
                  href={`/account/orders/${ticket.orderId}`}
                  className='min-w-0 flex-1 space-y-2'
                >
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='font-medium'>
                      Order {formatId(ticket.orderId)}
                    </span>
                    <Badge variant='outline'>
                      {ticket.orderStatus || '—'}
                    </Badge>
                    {ticket.urgent ? (
                      <Badge variant='destructive'>Urgent</Badge>
                    ) : null}
                    {ticket.awaitingStaff ? (
                      <Badge variant='secondary'>Awaiting staff</Badge>
                    ) : (
                      <Badge variant='outline'>Staff replied</Badge>
                    )}
                    {ticket.assigneeId ? (
                      <Badge variant='outline'>
                        {ticket.assigneeId === currentUserId
                          ? 'Assigned to you'
                          : `Assigned · ${
                              ticket.assigneeName ||
                              ticket.assigneeEmail ||
                              'staff'
                            }`}
                      </Badge>
                    ) : (
                      <Badge variant='secondary'>Unassigned</Badge>
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
                {currentUserId ? (
                  <TicketAssignControls
                    ticket={ticket}
                    currentUserId={currentUserId}
                    staff={staff}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
