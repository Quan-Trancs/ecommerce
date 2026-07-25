import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/require-role'
import { getStaffAuditLog } from '@/lib/actions/audit.actions'

export const metadata = { title: 'Staff audit log' }

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams?: Promise<{ action?: string; entity?: string }>
}) {
  await requireAdmin()
  const params = (await searchParams) || {}
  const action = params.action?.trim() || undefined
  const entityType = params.entity?.trim() || undefined
  const entries = await getStaffAuditLog({ action, entityType, limit: 100 })

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='font-display text-2xl font-extrabold tracking-tight'>
          Staff audit log
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Recent support and admin actions (cancels, refunds, role changes,
          coupons, payouts, catalog edits).
        </p>
      </div>

      <form className='flex flex-wrap items-end gap-3 text-sm' method='get'>
        <label className='space-y-1'>
          <span className='block text-xs text-muted-foreground'>Action</span>
          <input
            name='action'
            defaultValue={action || ''}
            placeholder='e.g. ORDER_CANCEL'
            className='h-9 w-48 rounded-md border bg-background px-3'
          />
        </label>
        <label className='space-y-1'>
          <span className='block text-xs text-muted-foreground'>Entity type</span>
          <input
            name='entity'
            defaultValue={entityType || ''}
            placeholder='order, user, coupon…'
            className='h-9 w-40 rounded-md border bg-background px-3'
          />
        </label>
        <button
          type='submit'
          className='h-9 rounded-md border px-3 hover:border-primary hover:text-primary'
        >
          Filter
        </button>
        {(action || entityType) && (
          <Link
            href='/admin/audit'
            className='h-9 inline-flex items-center text-xs text-muted-foreground underline'
          >
            Clear
          </Link>
        )}
      </form>

      {entries.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          No audit entries yet. Staff actions will appear here after they run.
        </p>
      ) : (
        <div className='overflow-x-auto rounded-md border'>
          <table className='w-full min-w-[720px] text-left text-sm'>
            <thead className='border-b bg-muted/40 font-mono text-[11px] uppercase tracking-wide text-muted-foreground'>
              <tr>
                <th className='px-3 py-2'>When</th>
                <th className='px-3 py-2'>Actor</th>
                <th className='px-3 py-2'>Action</th>
                <th className='px-3 py-2'>Entity</th>
                <th className='px-3 py-2'>Summary</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row) => (
                <tr key={row.id} className='border-b last:border-0'>
                  <td className='whitespace-nowrap px-3 py-2 align-top text-xs text-muted-foreground'>
                    {formatWhen(row.createdAt)}
                  </td>
                  <td className='px-3 py-2 align-top'>
                    <div className='font-medium'>
                      {row.actorName || row.actorEmail || row.actorId || '—'}
                    </div>
                    {row.actorRole && (
                      <div className='font-mono text-[10px] uppercase text-muted-foreground'>
                        {row.actorRole}
                      </div>
                    )}
                  </td>
                  <td className='px-3 py-2 align-top font-mono text-xs'>
                    {row.action}
                  </td>
                  <td className='px-3 py-2 align-top text-xs'>
                    {row.entityType && row.entityId ? (
                      row.entityType === 'order' ? (
                        <Link
                          href={`/account/orders/${row.entityId}`}
                          className='underline'
                        >
                          {row.entityType}/{row.entityId}
                        </Link>
                      ) : (
                        <span>
                          {row.entityType}/{row.entityId}
                        </span>
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className='px-3 py-2 align-top text-muted-foreground'>
                    {row.summary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className='text-xs text-muted-foreground'>
        <Link href='/admin' className='underline'>
          Back to overview
        </Link>
      </p>
    </div>
  )
}
