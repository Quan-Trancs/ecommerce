'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  answerProductQuestionAction,
  askProductQuestion,
  moderateDeleteProductQuestion,
  removeMyProductQuestion,
  sellerHideProductQuestion,
  toggleProductQuestionHelpful,
  type ProductQuestion,
} from '@/lib/actions/qa.actions'
import { formatDateTime } from '@/lib/utils'

type QaSort = 'helpful' | 'newest'

function sortQuestions(
  questions: ProductQuestion[],
  sort: QaSort
): ProductQuestion[] {
  const copy = [...questions]
  if (sort === 'newest') {
    copy.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return copy
  }
  copy.sort((a, b) => {
    const aOpen = a.answerBody ? 0 : 1
    const bOpen = b.answerBody ? 0 : 1
    if (aOpen !== bOpen) return aOpen - bOpen
    if (b.helpfulCount !== a.helpfulCount) {
      return b.helpfulCount - a.helpfulCount
    }
    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  })
  return copy
}

export default function ProductQaPanel({
  productId,
  productSlug,
  signedIn,
  canAnswer,
  canModerate = false,
  canSellerHide = false,
  accountId,
  questions,
}: {
  productId: string
  productSlug: string
  signedIn: boolean
  canAnswer: boolean
  canModerate?: boolean
  canSellerHide?: boolean
  accountId?: string | null
  questions: ProductQuestion[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [body, setBody] = useState('')
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [sort, setSort] = useState<QaSort>('helpful')
  const [unansweredOnly, setUnansweredOnly] = useState(false)
  const unansweredCount = useMemo(
    () => questions.filter((q) => !q.answerBody).length,
    [questions]
  )
  const sortedQuestions = useMemo(() => {
    const filtered = unansweredOnly
      ? questions.filter((q) => !q.answerBody)
      : questions
    return sortQuestions(filtered, sort)
  }, [questions, sort, unansweredOnly])

  function onAsk(event: FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await askProductQuestion({
        productId,
        productSlug,
        body,
      })
      if (result.success) {
        toast.success(result.message)
        setBody('')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <section className='brick space-y-6 p-4 md:p-5'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <p className='brick-label'>Questions & answers</p>
          <h2 className='mt-1 text-xl font-bold text-chrome'>
            {questions.length} question{questions.length === 1 ? '' : 's'}
            {unansweredCount > 0
              ? ` · ${unansweredCount} unanswered`
              : ''}
          </h2>
        </div>
        {questions.length > 0 ? (
          <div className='flex flex-wrap gap-2 text-sm'>
            {questions.length > 1 ? (
              <>
                <button
                  type='button'
                  onClick={() => setSort('helpful')}
                  className={
                    sort === 'helpful'
                      ? 'rounded-md border border-primary px-3 py-1.5 text-primary'
                      : 'rounded-md border px-3 py-1.5 hover:border-primary'
                  }
                >
                  Most helpful
                </button>
                <button
                  type='button'
                  onClick={() => setSort('newest')}
                  className={
                    sort === 'newest'
                      ? 'rounded-md border border-primary px-3 py-1.5 text-primary'
                      : 'rounded-md border px-3 py-1.5 hover:border-primary'
                  }
                >
                  Newest
                </button>
              </>
            ) : null}
            {unansweredCount > 0 ? (
              <button
                type='button'
                onClick={() => setUnansweredOnly((v) => !v)}
                className={
                  unansweredOnly
                    ? 'rounded-md border border-primary px-3 py-1.5 text-primary'
                    : 'rounded-md border px-3 py-1.5 hover:border-primary'
                }
              >
                Unanswered only
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {signedIn ? (
        <form onSubmit={onAsk} className='space-y-3 rounded-lg border p-4'>
          <label className='block text-sm'>
            <span className='mb-1 block font-medium'>Ask about this product</span>
            <textarea
              className='min-h-[88px] w-full rounded-md border bg-background px-3 py-2 text-sm'
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='Is this waterproof? What is the warranty?'
              disabled={pending}
              maxLength={2000}
              required
            />
          </label>
          <Button type='submit' disabled={pending || body.trim().length < 5}>
            {pending ? 'Posting…' : 'Post question'}
          </Button>
        </form>
      ) : (
        <p className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
          <Link
            href={`/sign-in?callbackUrl=${encodeURIComponent(`/product/${productSlug}`)}`}
            className='underline'
          >
            Sign in
          </Link>{' '}
          to ask a question.
        </p>
      )}

      {sortedQuestions.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          {unansweredOnly
            ? 'No unanswered questions right now.'
            : 'No questions yet. Be the first to ask.'}
        </p>
      ) : (
        <ul className='space-y-4'>
          {sortedQuestions.map((question) => {
            const isAsker = accountId && question.askerAccountId === accountId
            const unanswered = !question.answerBody
            return (
              <li
                key={question.id}
                className='space-y-3 rounded-lg border p-4 text-sm'
              >
                <div>
                  <p className='font-medium text-chrome'>Q: {question.body}</p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {question.askerName} ·{' '}
                    {formatDateTime(new Date(question.createdAt)).dateTime}
                  </p>
                </div>

                {question.answerBody ? (
                  <div className='space-y-2'>
                    <div className='rounded-md bg-muted/40 p-3'>
                      <p className='font-medium'>A: {question.answerBody}</p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {question.answererName || 'Seller'}
                        {question.answeredAt
                          ? ` · ${formatDateTime(new Date(question.answeredAt)).dateTime}`
                          : ''}
                      </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      {signedIn &&
                      accountId &&
                      question.answerAccountId !== accountId ? (
                        <Button
                          type='button'
                          size='sm'
                          variant={
                            question.viewerMarkedHelpful
                              ? 'secondary'
                              : 'outline'
                          }
                          disabled={pending}
                          onClick={() => {
                            startTransition(async () => {
                              const result = await toggleProductQuestionHelpful(
                                {
                                  questionId: question.id,
                                  productSlug,
                                }
                              )
                              if (result.success) {
                                toast.success(result.message)
                                router.refresh()
                              } else {
                                toast.error(result.message)
                              }
                            })
                          }}
                        >
                          {question.viewerMarkedHelpful
                            ? 'Helpful ✓'
                            : 'Helpful'}
                          {question.helpfulCount > 0
                            ? ` (${question.helpfulCount})`
                            : ''}
                        </Button>
                      ) : question.helpfulCount > 0 ? (
                        <p className='text-xs text-muted-foreground'>
                          {question.helpfulCount} found this helpful
                        </p>
                      ) : !signedIn ? (
                        <p className='text-xs text-muted-foreground'>
                          Sign in to mark helpful
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : canAnswer ? (
                  <form
                    className='space-y-2'
                    onSubmit={(e) => {
                      e.preventDefault()
                      startTransition(async () => {
                        const result = await answerProductQuestionAction({
                          questionId: question.id,
                          productId,
                          productSlug,
                          answerBody: answers[question.id] || '',
                        })
                        if (result.success) {
                          toast.success(result.message)
                          setAnswers((prev) => {
                            const next = { ...prev }
                            delete next[question.id]
                            return next
                          })
                          router.refresh()
                        } else {
                          toast.error(result.message)
                        }
                      })
                    }}
                  >
                    <textarea
                      className='min-h-[72px] w-full rounded-md border bg-background px-3 py-2 text-sm'
                      placeholder='Write an answer…'
                      value={answers[question.id] || ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: e.target.value,
                        }))
                      }
                      disabled={pending}
                      maxLength={4000}
                      required
                    />
                    <Button type='submit' size='sm' disabled={pending}>
                      Post answer
                    </Button>
                  </form>
                ) : (
                  <p className='text-xs text-muted-foreground'>
                    Awaiting seller answer
                  </p>
                )}

                {isAsker && unanswered ? (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='px-0'
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await removeMyProductQuestion({
                          questionId: question.id,
                          productSlug,
                        })
                        if (result.success) {
                          toast.success(result.message)
                          router.refresh()
                        } else {
                          toast.error(result.message)
                        }
                      })
                    }}
                  >
                    Remove question
                  </Button>
                ) : null}

                {canModerate && !(isAsker && unanswered) ? (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='px-0 text-destructive'
                    disabled={pending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          'Remove this question from the product page?'
                        )
                      ) {
                        return
                      }
                      startTransition(async () => {
                        const result = await moderateDeleteProductQuestion({
                          questionId: question.id,
                          productSlug,
                        })
                        if (result.success) {
                          toast.success(result.message)
                          router.refresh()
                        } else {
                          toast.error(result.message)
                        }
                      })
                    }}
                  >
                    Remove (moderation)
                  </Button>
                ) : null}

                {canSellerHide &&
                unanswered &&
                !canModerate &&
                !(isAsker && unanswered) ? (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='px-0 text-destructive'
                    disabled={pending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          'Hide this unanswered question from your listing?'
                        )
                      ) {
                        return
                      }
                      startTransition(async () => {
                        const result = await sellerHideProductQuestion({
                          questionId: question.id,
                          productSlug,
                        })
                        if (result.success) {
                          toast.success(result.message)
                          router.refresh()
                        } else {
                          toast.error(result.message)
                        }
                      })
                    }}
                  >
                    Hide question
                  </Button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
