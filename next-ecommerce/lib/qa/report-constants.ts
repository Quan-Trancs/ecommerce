export const QA_REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'OFFENSIVE', label: 'Offensive or abusive' },
  { value: 'MISLEADING', label: 'Misleading' },
  { value: 'OTHER', label: 'Other' },
] as const

export type QaReportReason = (typeof QA_REPORT_REASONS)[number]['value']

export function isQaReportReason(value: string): value is QaReportReason {
  return QA_REPORT_REASONS.some((r) => r.value === value)
}

export function qaReportReasonLabel(reason: string) {
  return (
    QA_REPORT_REASONS.find((r) => r.value === reason)?.label || reason || 'Other'
  )
}
