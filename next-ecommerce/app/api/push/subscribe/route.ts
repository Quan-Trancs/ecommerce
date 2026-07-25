import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { upsertPushSubscription } from '@/lib/db/push-subscriptions'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as {
      endpoint?: string
      keys?: { p256dh?: string; auth?: string }
    }
    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }
    await upsertPushSubscription({
      accountId: session.user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: request.headers.get('user-agent'),
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('push subscribe failed:', error)
    return NextResponse.json({ error: 'Subscribe failed' }, { status: 500 })
  }
}
