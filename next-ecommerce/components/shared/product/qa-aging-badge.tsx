import { getQaAging, type QaAgingLevel } from '@/lib/qa/aging'

const levelClass: Record<QaAgingLevel, string> = {
  ok: 'rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-200',
  warn: 'rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-200',
  overdue:
    'rounded bg-destructive/15 px-2 py-0.5 text-[11px] font-medium text-destructive',
}

export default function QaAgingBadge({
  createdAt,
  showDuration = true,
}: {
  createdAt: string | Date
  showDuration?: boolean
}) {
  const aging = getQaAging(createdAt)
  return (
    <span className={levelClass[aging.level]} title={aging.label}>
      {aging.badgeLabel}
      {showDuration ? ` · ${aging.label}` : ''}
    </span>
  )
}
