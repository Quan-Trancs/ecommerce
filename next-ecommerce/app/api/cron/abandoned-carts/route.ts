import { NextRequest, NextResponse } from 'next/server'
import { flushAbandonedCartReminders } from '@/lib/email/abandoned-cart'

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const header = request.headers.get('authorization') || ''
  if (header === `Bearer ${secret}`) return true
  const query = request.nextUrl.searchParams.get('secret')
  return query === secret
}

/**
 * Email reminders for stale signed-in carts.
 * Secure with CRON_SECRET (Authorization: Bearer … or ?secret=).
 */
export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const staleParam = request.nextUrl.searchParams.get('hours')
    const staleHours = staleParam ? Number(staleParam) : undefined
    const result = await flushAbandonedCartReminders({
      staleHours:
        staleHours && Number.isFinite(staleHours) ? staleHours : undefined,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('abandoned cart cron failed:', error)
    return NextResponse.json(
      { error: 'Abandoned cart flush failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
