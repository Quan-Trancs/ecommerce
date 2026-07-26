import { getSellerQaInbox } from '@/lib/actions/qa.actions'
import SellerQuestionsInboxClient from './seller-questions-inbox-client'

export const metadata = { title: 'Product questions' }

export default async function SellerQuestionsPage() {
  const inbox = await getSellerQaInbox()

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='font-display text-2xl font-extrabold tracking-tight'>
          Product questions
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          {inbox.unansweredCount} unanswered question
          {inbox.unansweredCount === 1 ? '' : 's'} on your listings (oldest
          first).
        </p>
      </div>
      <SellerQuestionsInboxClient questions={inbox.questions} />
    </div>
  )
}
