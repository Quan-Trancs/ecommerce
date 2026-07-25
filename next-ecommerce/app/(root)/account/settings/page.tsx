import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getNotificationPreferences } from '@/lib/actions/account.actions'
import NotificationPreferencesForm from './notification-preferences-form'

export const metadata = { title: 'Notification settings' }

export default async function AccountSettingsPage() {
  const prefs = await getNotificationPreferences()
  if (!prefs) redirect('/sign-in')

  return (
    <div className='space-y-6'>
      <div className='flex gap-2 text-sm text-muted-foreground'>
        <Link href='/account' className='hover:text-foreground'>
          Your Account
        </Link>
        <span>›</span>
        <span>Settings</span>
      </div>
      <div>
        <h1 className='font-display text-3xl font-extrabold tracking-tight'>
          Notification settings
        </h1>
        <p className='mt-2 text-muted-foreground'>
          Choose which order emails you receive.
        </p>
      </div>
      <div className='max-w-lg rounded-lg border p-4'>
        <NotificationPreferencesForm
          notifyOrderNotes={prefs.notifyOrderNotes}
        />
      </div>
    </div>
  )
}
