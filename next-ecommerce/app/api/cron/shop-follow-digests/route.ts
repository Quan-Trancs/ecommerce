import { NextRequest, NextResponse } from 'next/server'
import { flushShopFollowDigests } from '@/lib/email/shop-follow-digest'
import { flushShopAnnouncementDigests } from '@/lib/email/shop-announcement-digest'

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const header = request.headers.get('authorization') || ''
  if (header === `Bearer ${secret}`) return true
  const query = request.nextUrl.searchParams.get('secret')
  return query === secret
}

/**
 * Batch email digests for followed shops (new listings + announcements).
 * Secure with CRON_SECRET (Authorization: Bearer … or ?secret=).
 */
export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [listings, announcements] = await Promise.all([
      flushShopFollowDigests(),
      flushShopAnnouncementDigests(),
    ])
    return NextResponse.json({
      ok: true,
      listings,
      announcements,
    })
  } catch (error) {
    console.error('shop follow digest cron failed:', error)
    return NextResponse.json(
      { error: 'Shop follow digest flush failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
