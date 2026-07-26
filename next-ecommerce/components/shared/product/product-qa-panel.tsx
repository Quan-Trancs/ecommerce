'use client'

import Link from 'next/link'
import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  answerProductQuestionAction,
  askProductQuestion,
  moderateDeleteProductQuestion,
  removeMyProductQuestion,
  sellerHideProductQuestion,
  type ProductQuestion,
} from '@/lib/actions/qa.actions'
import { formatDateTime } from '@/lib/utils'

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
      <div>
        <p className='brick-label'>Questions & answers</p>
        <h2 className='mt-1 text-xl font-bold text-chrome'>
          {questions.length} question{questions.length === 1 ? '' : 's'}
        </h2>
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

      {questions.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          No questions yet. Be the first to ask.
        </p>
      ) : (
        <ul className='space-y-4'>
          {questions.map((question) => {
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
                  <div className='rounded-md bg-muted/40 p-3'>
                    <p className='font-medium'>A: {question.answerBody}</p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {question.answererName || 'Seller'}
                      {question.answeredAt
                        ? ` · ${formatDateTime(new Date(question.answeredAt)).dateTime}`
                        : ''}
                    </p>
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
