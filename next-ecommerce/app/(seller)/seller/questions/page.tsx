import { getSellerQaInbox } from '@/lib/actions/qa.actions'
import QaInboxSearchForm from '@/components/shared/product/qa-inbox-search-form'
import QaAgeFilterLinks from '@/components/shared/product/qa-age-filter-links'
import SellerQuestionsInboxClient from './seller-questions-inbox-client'
import {
  filterQuestionsByAge,
  parseQaAgeFilter,
  summarizeQaAging,
} from '@/lib/qa/aging'

export const metadata = { title: 'Product questions' }

export default async function SellerQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; age?: string }>
}) {
  const { q, age: ageParam } = await searchParams
  const age = parseQaAgeFilter(ageParam)
  const inbox = await getSellerQaInbox({ q })
  const aging = summarizeQaAging(inbox.questions.map((item) => item.createdAt))
  const filtered = filterQuestionsByAge(inbox.questions, age)
  const extras: Record<string, string> = {}
  if (inbox.query) extras.q = inbox.query

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
              ? ` · ${inbox.questions.length} match${
                  inbox.questions.length === 1 ? '' : 'es'
                } for “${inbox.query}”`
              : ' (oldest first)'}
            {age !== 'all'
              ? ` · showing ${filtered.length} ${age === 'ontrack' ? 'on track' : age}`
              : inbox.questions.length > 0
                ? ` · ${aging.overdue} overdue · ${aging.aging} aging`
                : ''}
            .
          </p>
        </div>
        <QaAgeFilterLinks
          basePath='/seller/questions'
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
          action='/seller/questions'
          query={inbox.query}
          hiddenFields={age !== 'all' ? { age } : undefined}
        />
      </div>
      <SellerQuestionsInboxClient questions={filtered} />
    </div>
  )
}
