import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/require-role'
import { adminListNewsletterSubscribers } from '@/lib/actions/newsletter.actions'
import { formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Newsletter' }

export default async function AdminNewsletterPage() {
  await requireAdmin()
  const { subscribers, activeCount } = await adminListNewsletterSubscribers()

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='font-display text-2xl font-extrabold tracking-tight'>
            Newsletter
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            {activeCount} active subscriber{activeCount === 1 ? '' : 's'}
          </p>
        </div>
        {subscribers.length > 0 ? (
          <a
            href='/api/admin/newsletter/export'
            className='rounded-md border px-3 py-1.5 text-sm hover:bg-muted'
          >
            Export CSV
          </a>
        ) : null}
      </div>

      {subscribers.length === 0 ? (
        <p className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
          No subscribers yet. The footer form writes here.
        </p>
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <table className='w-full text-left text-sm'>
            <thead className='bg-muted/50'>
              <tr>
                <th className='p-3'>Email</th>
                <th className='p-3'>Status</th>
                <th className='p-3'>Source</th>
                <th className='p-3'>Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((row) => (
                <tr key={row.id} className='border-t'>
                  <td className='p-3 font-medium'>{row.email}</td>
                  <td className='p-3'>
                    {row.active ? (
                      <span className='text-emerald-700'>Active</span>
                    ) : (
                      <span className='text-muted-foreground'>Unsubscribed</span>
                    )}
                  </td>
                  <td className='p-3 text-muted-foreground'>{row.source}</td>
                  <td className='p-3 text-muted-foreground'>
                    {formatDateTime(new Date(row.subscribedAt)).dateTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className='text-xs text-muted-foreground'>
        Unsubscribe links use{' '}
        <Link href='/newsletter/unsubscribe' className='underline'>
          /newsletter/unsubscribe?token=…
        </Link>
      </p>
    </div>
  )
}
