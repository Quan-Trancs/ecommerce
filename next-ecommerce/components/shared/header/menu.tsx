import { auth } from '@/auth'
import CartButton from './cart-button'
import UserButton from './user-button'
import NotificationsBell from './notifications-bell'
import { getInAppNotificationSummary } from '@/lib/actions/notification.actions'

export default async function Menu() {
  const session = await auth()
  const summary = session?.user?.id
    ? await getInAppNotificationSummary()
    : null

  return (
    <div className='flex justify-end'>
      <nav className='flex w-full items-center gap-2 sm:gap-3'>
        {summary ? (
          <NotificationsBell
            unreadCount={summary.unreadCount}
            recent={summary.recent}
          />
        ) : null}
        <UserButton />
        <CartButton />
      </nav>
    </div>
  )
}
