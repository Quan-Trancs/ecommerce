import Link from 'next/link'
import StaffQuestionsInboxClient from '@/components/shared/product/staff-questions-inbox-client'
import QaInboxSearchForm from '@/components/shared/product/qa-inbox-search-form'
import { getStaffQaInbox } from '@/lib/actions/qa.actions'

export const metadata = { title: 'Product questions' }

export default async function SupportQuestionsPage({
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
            Help buyers when sellers are slow — platform listings first, or all
            open Q&amp;A.
            {showAll
              ? ` ${inbox.allCount} unanswered across the catalog`
              : ` ${inbox.platformCount} unanswered on platform listings`}
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
            href={`/support/questions${join([qQuery])}`}
            className={
              !showAll
                ? 'rounded-md border border-primary px-3 py-1.5 text-primary'
                : 'rounded-md border px-3 py-1.5 hover:border-primary'
            }
          >
            Platform ({inbox.platformCount})
          </Link>
          <Link
            href={`/support/questions${join([scopeQuery, qQuery])}`}
            className={
              showAll
                ? 'rounded-md border border-primary px-3 py-1.5 text-primary'
                : 'rounded-md border px-3 py-1.5 hover:border-primary'
            }
          >
            All open ({inbox.allCount})
          </Link>
          <Link
            href='/support/questions/reports'
            className='rounded-md border px-3 py-1.5 hover:border-primary'
          >
            Reports ({inbox.openReportCount})
          </Link>
        </div>
      </div>
      <QaInboxSearchForm
        action='/support/questions'
        query={inbox.query}
        hiddenFields={showAll ? { scope: 'all' } : undefined}
      />
      <StaffQuestionsInboxClient
        questions={inbox.questions}
        answerPlaceholder='Write a support answer…'
      />
    </div>
  )
}
