import Link from 'next/link'

function hrefFor(
  basePath: string,
  pinnedOnly: boolean,
  extras: Record<string, string>
) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(extras)) {
    if (value) params.set(key, value)
  }
  if (pinnedOnly) params.set('pinned', '1')
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export default function QaPinnedFilterLinks({
  basePath,
  active,
  counts,
  extras = {},
}: {
  basePath: string
  active: boolean
  counts: { all: number; pinned: number }
  /** Preserved query params (e.g. scope, q, age). */
  extras?: Record<string, string>
}) {
  const tabs: Array<{ pinnedOnly: boolean; label: string; count: number }> = [
    { pinnedOnly: false, label: 'All', count: counts.all },
    { pinnedOnly: true, label: 'Pinned', count: counts.pinned },
  ]

  return (
    <div className='flex flex-wrap gap-2 text-sm'>
      {tabs.map((tab) => (
        <Link
          key={tab.pinnedOnly ? 'pinned' : 'all'}
          href={hrefFor(basePath, tab.pinnedOnly, extras)}
          className={
            active === tab.pinnedOnly
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
