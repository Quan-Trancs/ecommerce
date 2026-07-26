import { NextRequest, NextResponse } from 'next/server'
import { flushReviewRequestEmails } from '@/lib/email/review-request'

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const header = request.headers.get('authorization') || ''
  if (header === `Bearer ${secret}`) return true
  const query = request.nextUrl.searchParams.get('secret')
  return query === secret
}

/**
 * Email buyers to review products after orders have been fully shipped.
 * Secure with CRON_SECRET (Authorization: Bearer … or ?secret=).
 * Delay: REVIEW_REQUEST_DAYS (default 7) or ?days=.
 */
export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const daysParam = request.nextUrl.searchParams.get('days')
    const delayDays = daysParam ? Number(daysParam) : undefined
    const result = await flushReviewRequestEmails({
      delayDays:
        delayDays && Number.isFinite(delayDays) ? delayDays : undefined,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('review request cron failed:', error)
    return NextResponse.json(
      { error: 'Review request flush failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
