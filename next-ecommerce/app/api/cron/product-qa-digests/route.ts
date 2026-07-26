import { NextRequest, NextResponse } from 'next/server'
import { flushSellerQaDigests } from '@/lib/email/seller-qa-digest'

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const header = request.headers.get('authorization') || ''
  if (header === `Bearer ${secret}`) return true
  const query = request.nextUrl.searchParams.get('secret')
  return query === secret
}

/**
 * Email digests of unanswered product Q&A for sellers.
 * Secure with CRON_SECRET (Authorization: Bearer … or ?secret=).
 */
export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const hoursParam = request.nextUrl.searchParams.get('hours')
    const intervalHours = hoursParam ? Number(hoursParam) : undefined
    const result = await flushSellerQaDigests({
      intervalHours:
        intervalHours && Number.isFinite(intervalHours)
          ? intervalHours
          : undefined,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('seller Q&A digest cron failed:', error)
    return NextResponse.json(
      { error: 'Seller Q&A digest flush failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
