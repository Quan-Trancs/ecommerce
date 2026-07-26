import { getSellerQaInbox } from '@/lib/actions/qa.actions'
import QaInboxSearchForm from '@/components/shared/product/qa-inbox-search-form'
import QaAgeFilterLinks from '@/components/shared/product/qa-age-filter-links'
import QaPinnedFilterLinks from '@/components/shared/product/qa-pinned-filter-links'
import SellerQuestionsInboxClient from './seller-questions-inbox-client'
import {
  filterQuestionsByAge,
  parseQaAgeFilter,
  summarizeQaAging,
} from '@/lib/qa/aging'
import {
  countPinnedQuestions,
  filterQuestionsByPinned,
  parsePinnedFilter,
} from '@/lib/qa/pinned'

export const metadata = { title: 'Product questions' }

export default async function SellerQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; age?: string; pinned?: string }>
}) {
  const { q, age: ageParam, pinned: pinnedParam } = await searchParams
  const age = parseQaAgeFilter(ageParam)
  const pinnedOnly = parsePinnedFilter(pinnedParam)
  const inbox = await getSellerQaInbox({ q })
  const aging = summarizeQaAging(inbox.questions.map((item) => item.createdAt))
  const ageFiltered = filterQuestionsByAge(inbox.questions, age)
  const filtered = filterQuestionsByPinned(ageFiltered, pinnedOnly)
  const pinnedInView = countPinnedQuestions(ageFiltered)
  const ageExtras: Record<string, string> = {}
  if (inbox.query) ageExtras.q = inbox.query
  if (pinnedOnly) ageExtras.pinned = '1'
  const pinnedExtras: Record<string, string> = {}
  if (inbox.query) pinnedExtras.q = inbox.query
  if (age !== 'all') pinnedExtras.age = age

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
              ? ` · ${ageFiltered.length} ${age === 'ontrack' ? 'on track' : age}`
              : inbox.questions.length > 0
                ? ` · ${aging.overdue} overdue · ${aging.aging} aging`
                : ''}
            {pinnedOnly ? ` · showing ${filtered.length} pinned` : ''}
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
          extras={ageExtras}
        />
        <QaPinnedFilterLinks
          basePath='/seller/questions'
          active={pinnedOnly}
          counts={{ all: ageFiltered.length, pinned: pinnedInView }}
          extras={pinnedExtras}
        />
        <QaInboxSearchForm
          action='/seller/questions'
          query={inbox.query}
          hiddenFields={{
            ...(age !== 'all' ? { age } : {}),
            ...(pinnedOnly ? { pinned: '1' } : {}),
          }}
        />
      </div>
      <SellerQuestionsInboxClient questions={filtered} />
    </div>
  )
}
