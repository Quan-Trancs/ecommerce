'use client'

import StaffQuestionsInboxClient from '@/components/shared/product/staff-questions-inbox-client'
import type { AdminInboxQuestion } from '@/lib/actions/qa.actions'

export default function AdminQuestionsInboxClient({
  questions,
}: {
  questions: AdminInboxQuestion[]
}) {
  return (
    <StaffQuestionsInboxClient
      questions={questions}
      answerPlaceholder='Write an admin answer…'
    />
  )
}
