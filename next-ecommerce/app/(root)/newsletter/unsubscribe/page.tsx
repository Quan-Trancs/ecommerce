import { APP_NAME } from '@/lib/constants'
import { unsubscribeNewsletter } from '@/lib/actions/newsletter.actions'
import Link from 'next/link'

export const metadata = { title: 'Unsubscribe' }

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const result = token
    ? await unsubscribeNewsletter(token)
    : { success: false, message: 'Missing unsubscribe token' }

  return (
    <div className='page-shell mx-auto max-w-lg space-y-4 px-4 py-16 text-center md:px-6'>
      <h1 className='font-display text-3xl font-extrabold tracking-tight'>
        Newsletter
      </h1>
      <p className='text-muted-foreground'>{result.message}</p>
      <p className='text-sm text-muted-foreground'>
        <Link href='/' className='underline hover:text-foreground'>
          Back to {APP_NAME}
        </Link>
      </p>
    </div>
  )
}
