import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/require-role'
import { adminListGiftCards } from '@/lib/actions/gift-card.actions'
import { GiftCardsAdminClient } from './gift-cards-admin-client'

export const metadata = { title: 'Gift cards' }

export default async function AdminGiftCardsPage() {
  await requireAdmin()
  const cards = await adminListGiftCards()

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='font-display text-2xl font-extrabold tracking-tight'>
          Gift cards
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Store credit codes applied at checkout after tax &amp; shipping. Demo:{' '}
          <code className='rounded bg-muted px-1'>GIFT25</code> ($25).
        </p>
      </div>
      <GiftCardsAdminClient cards={cards} />
      <p className='text-xs text-muted-foreground'>
        <Link href='/admin' className='underline'>
          Back to overview
        </Link>
      </p>
    </div>
  )
}
