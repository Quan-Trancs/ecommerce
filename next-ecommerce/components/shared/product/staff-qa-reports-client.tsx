'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  dismissProductQuestionReport,
  moderateDeleteProductQuestion,
  type ProductQuestionReport,
} from '@/lib/actions/qa.actions'
import { qaReportReasonLabel } from '@/lib/qa/report-constants'
import { formatDateTime } from '@/lib/utils'

export default function StaffQaReportsClient({
  reports,
}: {
  reports: ProductQuestionReport[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (reports.length === 0) {
    return (
      <p className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
        No open Q&amp;A reports.
      </p>
    )
  }

  return (
    <ul className='space-y-4'>
      {reports.map((report) => (
        <li key={report.id} className='space-y-3 rounded-lg border p-4'>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div>
              <Link
                href={`/product/${report.productSlug}`}
                className='font-semibold text-primary hover:underline'
              >
                {report.productName}
              </Link>
              <p className='mt-2 text-sm font-medium text-chrome'>
                Q: {report.questionBody}
              </p>
              {report.answerBody ? (
                <p className='mt-1 text-sm text-muted-foreground'>
                  A: {report.answerBody}
                </p>
              ) : (
                <p className='mt-1 text-xs text-muted-foreground'>Unanswered</p>
              )}
              <p className='mt-2 text-xs text-muted-foreground'>
                Asker {report.askerName} · reported by {report.reporterName} ·{' '}
                {qaReportReasonLabel(report.reason)}
                {report.openReportCount > 1
                  ? ` · ${report.openReportCount} open reports`
                  : ''}
                {report.isHidden ? ' · auto-hidden from PDP' : ''} ·{' '}
                {formatDateTime(new Date(report.createdAt)).dateTime}
              </p>
              {report.note ? (
                <p className='mt-1 text-xs text-muted-foreground'>
                  Note: {report.note}
                </p>
              ) : null}
            </div>
            <Link
              href={`/product/${report.productSlug}`}
              className='text-xs text-muted-foreground underline'
            >
              View PDP
            </Link>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await dismissProductQuestionReport({
                    questionId: report.questionId,
                    productSlug: report.productSlug,
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
              Dismiss reports
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
                    'Remove this question from the product page?'
                  )
                ) {
                  return
                }
                startTransition(async () => {
                  const result = await moderateDeleteProductQuestion({
                    questionId: report.questionId,
                    productSlug: report.productSlug,
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
          </div>
        </li>
      ))}
    </ul>
  )
}
