import Link from 'next/link'
import StaffQuestionsInboxClient from '@/components/shared/product/staff-questions-inbox-client'
import QaInboxSearchForm from '@/components/shared/product/qa-inbox-search-form'
import QaAgeFilterLinks from '@/components/shared/product/qa-age-filter-links'
import { getStaffQaInbox } from '@/lib/actions/qa.actions'
import {
  filterQuestionsByAge,
  parseQaAgeFilter,
  summarizeQaAging,
} from '@/lib/qa/aging'

export const metadata = { title: 'Product questions' }

export default async function SupportQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; q?: string; age?: string }>
}) {
  const { scope, q, age: ageParam } = await searchParams
  const showAll = scope === 'all'
  const age = parseQaAgeFilter(ageParam)
  const inbox = await getStaffQaInbox({ all: showAll, q })
  const aging = summarizeQaAging(inbox.questions.map((item) => item.createdAt))
  const filtered = filterQuestionsByAge(inbox.questions, age)
  const scopeQuery = showAll ? 'scope=all' : ''
  const qQuery = inbox.query
    ? `q=${encodeURIComponent(inbox.query)}`
    : ''
  const ageQuery = age !== 'all' ? `age=${age}` : ''
  const join = (parts: string[]) => {
    const filteredParts = parts.filter(Boolean)
    return filteredParts.length ? `?${filteredParts.join('&')}` : ''
  }
  const extras: Record<string, string> = {}
  if (showAll) extras.scope = 'all'
  if (inbox.query) extras.q = inbox.query

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
              ? ` · ${inbox.questions.length} match${
                  inbox.questions.length === 1 ? '' : 'es'
                } for “${inbox.query}”`
              : ''}
            {age !== 'all'
              ? ` · showing ${filtered.length} ${age === 'ontrack' ? 'on track' : age}`
              : inbox.questions.length > 0
                ? ` · ${aging.overdue} overdue · ${aging.aging} aging`
                : ''}
            .
          </p>
        </div>
        <div className='flex flex-wrap gap-2 text-sm'>
          <Link
            href={`/support/questions${join([qQuery, ageQuery])}`}
            className={
              !showAll
                ? 'rounded-md border border-primary px-3 py-1.5 text-primary'
                : 'rounded-md border px-3 py-1.5 hover:border-primary'
            }
          >
            Platform ({inbox.platformCount})
          </Link>
          <Link
            href={`/support/questions${join([scopeQuery, qQuery, ageQuery])}`}
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
      <QaAgeFilterLinks
        basePath='/support/questions'
        active={age}
        counts={{
          all: inbox.questions.length,
          overdue: aging.overdue,
          aging: aging.aging,
          onTrack: aging.onTrack,
        }}
        extras={extras}
      />
      <QaInboxSearchForm
        action='/support/questions'
        query={inbox.query}
        hiddenFields={{
          ...(showAll ? { scope: 'all' } : {}),
          ...(age !== 'all' ? { age } : {}),
        }}
      />
      <StaffQuestionsInboxClient
        questions={filtered}
        answerPlaceholder='Write a support answer…'
      />
    </div>
  )
}
