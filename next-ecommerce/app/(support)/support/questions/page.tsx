import Link from 'next/link'
import StaffQuestionsInboxClient from '@/components/shared/product/staff-questions-inbox-client'
import { getStaffQaInbox } from '@/lib/actions/qa.actions'

export const metadata = { title: 'Product questions' }

export default async function SupportQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>
}) {
  const { scope } = await searchParams
  const showAll = scope === 'all'
  const inbox = await getStaffQaInbox({ all: showAll })

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
            .
          </p>
        </div>
        <div className='flex flex-wrap gap-2 text-sm'>
          <Link
            href='/support/questions'
            className={
              !showAll
                ? 'rounded-md border border-primary px-3 py-1.5 text-primary'
                : 'rounded-md border px-3 py-1.5 hover:border-primary'
            }
          >
            Platform ({inbox.platformCount})
          </Link>
          <Link
            href='/support/questions?scope=all'
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
      <StaffQuestionsInboxClient
        questions={inbox.questions}
        answerPlaceholder='Write a support answer…'
      />
    </div>
  )
}
