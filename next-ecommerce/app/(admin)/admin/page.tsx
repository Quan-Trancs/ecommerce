import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/require-role'
import { getAdminKpis } from '@/lib/actions/admin.actions'
import { getAdminQaInbox } from '@/lib/actions/qa.actions'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Admin' }

function KpiCard({
  label,
  value,
  hint,
  href,
}: {
  label: string
  value: string
  hint?: string
  href?: string
}) {
  const inner = (
    <>
      <p className='font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground'>
        {label}
      </p>
      <p className='mt-2 font-display text-3xl font-extrabold tracking-tight'>
        {value}
      </p>
      {hint ? (
        <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>
      ) : null}
    </>
  )
  if (href) {
    return (
      <Link
        href={href}
        className='block rounded-lg border p-4 transition hover:border-primary'
      >
        {inner}
      </Link>
    )
  }
  return <div className='rounded-lg border p-4'>{inner}</div>
}

export default async function AdminHomePage() {
  await requireAdmin()
  const [kpis, qaInbox] = await Promise.all([
    getAdminKpis(),
    getAdminQaInbox({ all: false }),
  ])

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='font-display text-2xl font-extrabold tracking-tight'>
          Platform overview
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Snapshot as of{' '}
          {formatDateTime(new Date(kpis.generatedAt)).dateTime}. Paid revenue
          excludes cancelled orders.
        </p>
      </div>

      <section className='space-y-3'>
        <h3 className='text-sm font-semibold'>Commerce</h3>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <KpiCard
            label='Revenue · 7d'
            value={formatCurrency(kpis.revenue.paidLast7Days)}
            hint={`All-time ${formatCurrency(kpis.revenue.paidAllTime)}`}
            href='/admin/orders'
          />
          <KpiCard
            label='Orders · 7d'
            value={String(kpis.orders.last7Days)}
            hint={`${kpis.orders.today} today`}
            href='/admin/orders'
          />
          <KpiCard
            label='Refunds · 7d'
            value={formatCurrency(kpis.refunds.amountLast7Days)}
            hint={`${kpis.refunds.countLast7Days} refund event${
              kpis.refunds.countLast7Days === 1 ? '' : 's'
            }`}
          />
          <KpiCard
            label='Coupons · 7d'
            value={String(kpis.coupons.redemptionsLast7Days)}
            hint='Redemptions'
            href='/admin/coupons'
          />
        </div>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <KpiCard label='Pending' value={String(kpis.orders.pending)} />
          <KpiCard label='Paid' value={String(kpis.orders.paid)} />
          <KpiCard label='Shipped' value={String(kpis.orders.shipped)} />
          <KpiCard label='Cancelled' value={String(kpis.orders.cancelled)} />
        </div>
      </section>

      <section className='space-y-3'>
        <h3 className='text-sm font-semibold'>Support & catalog</h3>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <KpiCard
            label='Awaiting staff'
            value={String(kpis.support.awaitingStaff)}
            hint='Public note threads'
            href='/support/tickets?awaiting=1'
          />
          <KpiCard
            label='Unassigned tickets'
            value={String(kpis.support.unassigned)}
            hint={`${kpis.support.assignedOpen} assigned & open`}
            href='/support/tickets?assignment=unassigned'
          />
          <KpiCard
            label='Published products'
            value={String(kpis.catalog.published)}
            href='/admin/catalog'
          />
          <KpiCard
            label='Low stock'
            value={String(kpis.catalog.lowStock)}
            hint='Published · qty ≤ 5'
            href='/admin/catalog'
          />
        </div>
      </section>

      <section className='space-y-3'>
        <h3 className='text-sm font-semibold'>Accounts</h3>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <KpiCard
            label='Buyers'
            value={String(kpis.accounts.buyers)}
            href='/admin/users'
          />
          <KpiCard
            label='Sellers'
            value={String(kpis.accounts.sellers)}
            href='/admin/users'
          />
          <KpiCard
            label='Support'
            value={String(kpis.accounts.support)}
            href='/admin/users'
          />
          <KpiCard
            label='Admins'
            value={String(kpis.accounts.admins)}
            href='/admin/users'
          />
        </div>
      </section>

      <ul className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        <li>
          <Link
            href='/admin/orders'
            className='block rounded-lg border p-4 transition hover:border-primary'
          >
            <h2 className='font-semibold'>Orders</h2>
            <p className='text-sm text-muted-foreground'>
              Platform-wide recent orders, email &amp; status filters
            </p>
          </Link>
        </li>
        <li>
          <Link
            href='/admin/payouts'
            className='block rounded-lg border p-4 transition hover:border-primary'
          >
            <h2 className='font-semibold'>Payouts</h2>
            <p className='text-sm text-muted-foreground'>
              Record seller settlements against available balance
            </p>
          </Link>
        </li>
        <li>
          <Link
            href='/admin/questions'
            className='block rounded-lg border p-4 transition hover:border-primary'
          >
            <h2 className='font-semibold'>Product questions</h2>
            <p className='text-sm text-muted-foreground'>
              Unanswered Q&A on platform listings
              {qaInbox.platformCount > 0
                ? ` (${qaInbox.platformCount} open)`
                : ''}
            </p>
          </Link>
        </li>
        <li>
          <Link
            href='/admin/audit'
            className='block rounded-lg border p-4 transition hover:border-primary'
          >
            <h2 className='font-semibold'>Audit log</h2>
            <p className='text-sm text-muted-foreground'>
              Staff cancels, refunds, role changes, and more
            </p>
          </Link>
        </li>
      </ul>
    </div>
  )
}
