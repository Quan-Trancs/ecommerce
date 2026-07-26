'use client'

import Link from 'next/link'
import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  answerProductQuestionAction,
  type SellerInboxQuestion,
} from '@/lib/actions/qa.actions'
import { formatDateTime } from '@/lib/utils'

export default function SellerQuestionsInboxClient({
  questions,
}: {
  questions: SellerInboxQuestion[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [answers, setAnswers] = useState<Record<number, string>>({})

  if (questions.length === 0) {
    return (
      <p className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
        No unanswered questions. When buyers ask on your listings, they show up
        here.
      </p>
    )
  }

  return (
    <ul className='space-y-4'>
      {questions.map((question) => (
        <li key={question.id} className='space-y-3 rounded-lg border p-4'>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div>
              <Link
                href={`/product/${question.productSlug}`}
                className='font-semibold text-primary hover:underline'
              >
                {question.productName}
              </Link>
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
              placeholder='Write your answer…'
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
              {pending ? 'Posting…' : 'Post answer'}
            </Button>
          </form>
        </li>
      ))}
    </ul>
  )
}
