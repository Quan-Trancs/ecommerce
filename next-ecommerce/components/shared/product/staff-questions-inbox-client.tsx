'use client'

import Link from 'next/link'
import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  answerProductQuestionAction,
  moderateDeleteProductQuestion,
  type AdminInboxQuestion,
} from '@/lib/actions/qa.actions'
import { formatDateTime } from '@/lib/utils'

export default function StaffQuestionsInboxClient({
  questions,
  answerPlaceholder = 'Write an answer…',
}: {
  questions: AdminInboxQuestion[]
  answerPlaceholder?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [answers, setAnswers] = useState<Record<number, string>>({})

  if (questions.length === 0) {
    return (
      <p className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
        No unanswered questions in this view.
      </p>
    )
  }

  return (
    <ul className='space-y-4'>
      {questions.map((question) => (
        <li key={question.id} className='space-y-3 rounded-lg border p-4'>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <Link
                  href={`/product/${question.productSlug}`}
                  className='font-semibold text-primary hover:underline'
                >
                  {question.productName}
                </Link>
                <span
                  className={
                    question.isPlatformOwned
                      ? 'rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-200'
                      : 'rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground'
                  }
                >
                  {question.isPlatformOwned
                    ? 'Platform listing'
                    : `Seller · ${question.sellerLabel}`}
                </span>
              </div>
              <p className='mt-2 text-sm font-medium text-chrome'>
                Q: {question.body}
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                {question.askerName} ·{' '}
                {formatDateTime(new Date(question.createdAt)).dateTime}
              </p>
            </div>
            <Link
              href={`/product/${question.productSlug}`}
              className='text-xs text-muted-foreground underline'
            >
              View PDP
            </Link>
          </div>
          <form
            className='space-y-2'
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              startTransition(async () => {
                const result = await answerProductQuestionAction({
                  questionId: question.id,
                  productId: question.productId,
                  productSlug: question.productSlug,
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
              className='min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm'
              placeholder={answerPlaceholder}
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
            <div className='flex flex-wrap gap-2'>
              <Button type='submit' size='sm' disabled={pending}>
                {pending ? 'Posting…' : 'Post answer'}
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='text-destructive'
                disabled={pending}
                onClick={() => {
                  if (
                    !window.confirm(
                      'Remove this question? This cannot be undone.'
                    )
                  ) {
                    return
                  }
                  startTransition(async () => {
                    const result = await moderateDeleteProductQuestion({
                      questionId: question.id,
                      productSlug: question.productSlug,
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
                Remove
              </Button>
            </div>
          </form>
        </li>
      ))}
    </ul>
  )
}
