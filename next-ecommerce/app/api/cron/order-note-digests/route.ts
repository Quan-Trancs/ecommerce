import { NextRequest, NextResponse } from 'next/server'
import { flushOrderNoteDigests } from '@/lib/email/order-notifications'

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const header = request.headers.get('authorization') || ''
  if (header === `Bearer ${secret}`) return true
  const query = request.nextUrl.searchParams.get('secret')
  return query === secret
}

/**
 * Flush due order-note digests.
 * Secure with CRON_SECRET (Authorization: Bearer … or ?secret=).
 * Vercel cron: vercel.json schedule hits this path with CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const forceAll =
      request.nextUrl.searchParams.get('force') === '1' ||
      request.nextUrl.searchParams.get('force') === 'true'
    const result = await flushOrderNoteDigests({ forceAll })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('order-note digest cron failed:', error)
    return NextResponse.json(
      { error: 'Digest flush failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
