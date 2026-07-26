import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getNotificationPreferences } from '@/lib/actions/account.actions'
import DesktopAlertsPreference from './desktop-alerts-preference'
import LowStockPreferencesForm from './low-stock-preferences-form'
import AbandonedCartPreferencesForm from './abandoned-cart-preferences-form'
import BackInStockPreferencesForm from './back-in-stock-preferences-form'
import ReviewRequestPreferencesForm from './review-request-preferences-form'
import PriceDropPreferencesForm from './price-drop-preferences-form'
import ShopFollowPreferencesForm from './shop-follow-preferences-form'
import QaDigestPreferencesForm from './qa-digest-preferences-form'
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
          Email digests, quiet hours, desktop alerts, low-stock, and urgent
          SMS / push.
        </p>
      </div>
      <div className='max-w-lg space-y-4'>
        <DesktopAlertsPreference />
        <LowStockPreferencesForm
          notifyLowStock={prefs.notifyLowStock}
          lowStockThreshold={prefs.lowStockThreshold}
        />
        <AbandonedCartPreferencesForm
          notifyAbandonedCart={prefs.notifyAbandonedCart}
        />
        <BackInStockPreferencesForm
          notifyBackInStock={prefs.notifyBackInStock}
        />
        <ReviewRequestPreferencesForm
          notifyReviewRequests={prefs.notifyReviewRequests}
        />
        <PriceDropPreferencesForm notifyPriceDrops={prefs.notifyPriceDrops} />
        <ShopFollowPreferencesForm
          notifyShopFollows={prefs.notifyShopFollows}
        />
        <QaDigestPreferencesForm notifyQaDigest={prefs.notifyQaDigest} />
        <div className='rounded-lg border p-4'>
          <NotificationPreferencesForm
            notifyOrderNotes={prefs.notifyOrderNotes}
            orderNoteEmailMode={prefs.orderNoteEmailMode}
            quietHoursEnabled={prefs.quietHoursEnabled}
            quietHoursStart={prefs.quietHoursStart}
            quietHoursEnd={prefs.quietHoursEnd}
            quietHoursTimezone={prefs.quietHoursTimezone}
            phoneE164={prefs.phoneE164}
            notifyOrderNotesSms={prefs.notifyOrderNotesSms}
            notifyOrderNotesPush={prefs.notifyOrderNotesPush}
            notifyInAppOrderNotes={prefs.notifyInAppOrderNotes}
            vapidPublicKey={prefs.vapidPublicKey}
          />
        </div>
      </div>
    </div>
  )
}
