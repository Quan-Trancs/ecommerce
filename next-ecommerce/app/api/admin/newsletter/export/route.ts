import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasAdminAccess } from '@/lib/auth/roles'
import { listNewsletterSubscribers } from '@/lib/db/newsletter'

export const runtime = 'nodejs'

function csvEscape(value: string | number | null | undefined) {
  const raw = value == null ? '' : String(value)
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`
  return raw
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || !hasAdminAccess(session.user.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }

  const rows = await listNewsletterSubscribers({
    activeOnly: false,
    limit: 5000,
  })
  const header = [
    'id',
    'email',
    'active',
    'source',
    'accountId',
    'subscribedAt',
    'unsubscribedAt',
  ]
  const lines = [header.join(',')]
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.email,
        row.active ? 'true' : 'false',
        row.source,
        row.accountId || '',
        row.subscribedAt,
        row.unsubscribedAt || '',
      ]
        .map(csvEscape)
        .join(',')
    )
  }

  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(`${lines.join('\n')}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="newsletter-${stamp}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
