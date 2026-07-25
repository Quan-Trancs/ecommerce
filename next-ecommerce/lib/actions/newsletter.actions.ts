'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { formatError } from '@/lib/utils'
import { hasAdminAccess } from '@/lib/auth/roles'
import {
  countActiveNewsletterSubscribers,
  listNewsletterSubscribers,
  subscribeToNewsletter,
  unsubscribeByToken,
  type NewsletterSubscriber,
} from '@/lib/db/newsletter'

export type { NewsletterSubscriber }

export async function subscribeNewsletter(input: {
  email: string
  source?: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    const result = await subscribeToNewsletter({
      email: input.email,
      source: input.source,
      accountId: session?.user?.id || null,
    })
    if (result.ok) {
      revalidatePath('/admin/newsletter')
    }
    return { success: result.ok, message: result.message }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function unsubscribeNewsletter(
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await unsubscribeByToken(token)
    revalidatePath('/admin/newsletter')
    return { success: result.ok, message: result.message }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function adminListNewsletterSubscribers(): Promise<{
  subscribers: NewsletterSubscriber[]
  activeCount: number
}> {
  const session = await auth()
  if (!session?.user?.id || !hasAdminAccess(session.user.role)) {
    return { subscribers: [], activeCount: 0 }
  }
  const [subscribers, activeCount] = await Promise.all([
    listNewsletterSubscribers({ activeOnly: false, limit: 500 }),
    countActiveNewsletterSubscribers(),
  ])
  return {
    subscribers: JSON.parse(JSON.stringify(subscribers)),
    activeCount,
  }
}
