import { getSellerQaInbox } from '@/lib/actions/qa.actions'
import QaInboxSearchForm from '@/components/shared/product/qa-inbox-search-form'
import SellerQuestionsInboxClient from './seller-questions-inbox-client'
import { summarizeQaAging } from '@/lib/qa/aging'

export const metadata = { title: 'Product questions' }

export default async function SellerQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const inbox = await getSellerQaInbox({ q })
  const aging = summarizeQaAging(inbox.questions.map((q) => q.createdAt))

  return (
    <div className='space-y-6'>
      <div className='space-y-3'>
        <div>
          <h2 className='font-display text-2xl font-extrabold tracking-tight'>
            Product questions
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            {inbox.unansweredCount} unanswered question
            {inbox.unansweredCount === 1 ? '' : 's'} on your listings
            {inbox.query
              ? ` · showing ${inbox.questions.length} match${
                  inbox.questions.length === 1 ? '' : 'es'
                } for “${inbox.query}”`
              : ' (oldest first)'}
            {inbox.questions.length > 0
              ? ` · ${aging.overdue} overdue · ${aging.aging} aging`
              : ''}
            .
          </p>
        </div>
        <QaInboxSearchForm action='/seller/questions' query={inbox.query} />
      </div>
      <SellerQuestionsInboxClient questions={inbox.questions} />
    </div>
  )
}
