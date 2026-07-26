import Link from 'next/link'
import { getStaffQaReportsInbox } from '@/lib/actions/qa.actions'
import StaffQaReportsClient from '@/components/shared/product/staff-qa-reports-client'

export const metadata = { title: 'Q&A reports' }

export default async function SupportQaReportsPage() {
  const inbox = await getStaffQaReportsInbox()

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='font-display text-2xl font-extrabold tracking-tight'>
            Q&amp;A reports
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            {inbox.openCount} open report{inbox.openCount === 1 ? '' : 's'} from
            buyers.
          </p>
        </div>
        <Link
          href='/support/questions'
          className='text-sm text-primary underline'
        >
          Back to unanswered inbox
        </Link>
      </div>
      <StaffQaReportsClient reports={inbox.reports} />
    </div>
  )
}
