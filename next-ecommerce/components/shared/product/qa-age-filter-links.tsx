import Link from 'next/link'
import type { QaAgeFilter } from '@/lib/qa/aging'

function hrefFor(
  basePath: string,
  age: QaAgeFilter,
  extras: Record<string, string>
) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(extras)) {
    if (value) params.set(key, value)
  }
  if (age !== 'all') params.set('age', age)
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export default function QaAgeFilterLinks({
  basePath,
  active,
  counts,
  extras = {},
}: {
  basePath: string
  active: QaAgeFilter
  counts: { all: number; overdue: number; aging: number; onTrack: number }
  /** Preserved query params (e.g. scope, q). */
  extras?: Record<string, string>
}) {
  const tabs: Array<{ id: QaAgeFilter; label: string; count: number }> = [
    { id: 'all', label: 'All ages', count: counts.all },
    { id: 'overdue', label: 'Overdue', count: counts.overdue },
    { id: 'aging', label: 'Aging', count: counts.aging },
    { id: 'ontrack', label: 'On track', count: counts.onTrack },
  ]

  return (
    <div className='flex flex-wrap gap-2 text-sm'>
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={hrefFor(basePath, tab.id, extras)}
          className={
            active === tab.id
              ? 'rounded-md border border-primary px-3 py-1.5 text-primary'
              : 'rounded-md border px-3 py-1.5 hover:border-primary'
          }
        >
          {tab.label} ({tab.count})
        </Link>
      ))}
    </div>
  )
}
