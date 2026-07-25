import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getInAppNotifications } from '@/lib/actions/notification.actions'
import NotificationsList from './notifications-list'

export const metadata = { title: 'Notifications' }

export default async function AccountNotificationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const notifications = await getInAppNotifications()

  return (
    <div className='space-y-6'>
      <div className='flex gap-2 text-sm text-muted-foreground'>
        <Link href='/account' className='hover:text-foreground'>
          Your Account
        </Link>
        <span>›</span>
        <span>Notifications</span>
      </div>
      <div>
        <h1 className='font-display text-3xl font-extrabold tracking-tight'>
          Notifications
        </h1>
        <p className='mt-2 text-muted-foreground'>
          In-app alerts for public order-note messages.
        </p>
      </div>
      <NotificationsList notifications={notifications} />
    </div>
  )
}
