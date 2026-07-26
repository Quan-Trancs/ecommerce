import { getSellerQaInbox } from '@/lib/actions/qa.actions'
import QaInboxSearchForm from '@/components/shared/product/qa-inbox-search-form'
import SellerQuestionsInboxClient from './seller-questions-inbox-client'

export const metadata = { title: 'Product questions' }

export default async function SellerQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const inbox = await getSellerQaInbox({ q })

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
            .
          </p>
        </div>
        <QaInboxSearchForm action='/seller/questions' query={inbox.query} />
      </div>
      <SellerQuestionsInboxClient questions={inbox.questions} />
    </div>
  )
}
