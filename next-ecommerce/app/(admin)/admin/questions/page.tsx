import Link from 'next/link'
import { getAdminQaInbox } from '@/lib/actions/qa.actions'
import AdminQuestionsInboxClient from './admin-questions-inbox-client'

export const metadata = { title: 'Product questions' }

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>
}) {
  const { scope } = await searchParams
  const showAll = scope === 'all'
  const inbox = await getAdminQaInbox({ all: showAll })

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='font-display text-2xl font-extrabold tracking-tight'>
            Product questions
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            {showAll
              ? `${inbox.allCount} unanswered across the catalog`
              : `${inbox.platformCount} unanswered on platform listings`}
            {inbox.allCount > inbox.platformCount
              ? ` · ${inbox.allCount - inbox.platformCount} on seller listings`
              : ''}
            .
          </p>
        </div>
        <div className='flex flex-wrap gap-2 text-sm'>
          <Link
            href='/admin/questions'
            className={
              !showAll
                ? 'rounded-md border border-primary px-3 py-1.5 text-primary'
                : 'rounded-md border px-3 py-1.5 hover:border-primary'
            }
          >
            Platform ({inbox.platformCount})
          </Link>
          <Link
            href='/admin/questions?scope=all'
            className={
              showAll
                ? 'rounded-md border border-primary px-3 py-1.5 text-primary'
                : 'rounded-md border px-3 py-1.5 hover:border-primary'
            }
          >
            All open ({inbox.allCount})
          </Link>
        </div>
      </div>
      <AdminQuestionsInboxClient questions={inbox.questions} />
    </div>
  )
}
