import Link from 'next/link'
import { getStaffQaInbox } from '@/lib/actions/qa.actions'
import QaInboxSearchForm from '@/components/shared/product/qa-inbox-search-form'
import AdminQuestionsInboxClient from './admin-questions-inbox-client'

export const metadata = { title: 'Product questions' }

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; q?: string }>
}) {
  const { scope, q } = await searchParams
  const showAll = scope === 'all'
  const inbox = await getStaffQaInbox({ all: showAll, q })
  const scopeQuery = showAll ? 'scope=all' : ''
  const qQuery = inbox.query
    ? `q=${encodeURIComponent(inbox.query)}`
    : ''
  const join = (parts: string[]) => {
    const filtered = parts.filter(Boolean)
    return filtered.length ? `?${filtered.join('&')}` : ''
  }

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
            {inbox.query
              ? ` · showing ${inbox.questions.length} match${
                  inbox.questions.length === 1 ? '' : 'es'
                } for “${inbox.query}”`
              : ''}
            .
          </p>
        </div>
        <div className='flex flex-wrap gap-2 text-sm'>
          <Link
            href={`/admin/questions${join([qQuery])}`}
            className={
              !showAll
                ? 'rounded-md border border-primary px-3 py-1.5 text-primary'
                : 'rounded-md border px-3 py-1.5 hover:border-primary'
            }
          >
            Platform ({inbox.platformCount})
          </Link>
          <Link
            href={`/admin/questions${join([scopeQuery, qQuery])}`}
            className={
              showAll
                ? 'rounded-md border border-primary px-3 py-1.5 text-primary'
                : 'rounded-md border px-3 py-1.5 hover:border-primary'
            }
          >
            All open ({inbox.allCount})
          </Link>
          <Link
            href='/admin/questions/reports'
            className='rounded-md border px-3 py-1.5 hover:border-primary'
          >
            Reports ({inbox.openReportCount})
          </Link>
        </div>
      </div>
      <QaInboxSearchForm
        action='/admin/questions'
        query={inbox.query}
        hiddenFields={showAll ? { scope: 'all' } : undefined}
      />
      <AdminQuestionsInboxClient questions={inbox.questions} />
    </div>
  )
}
