import { APP_NAME } from '@/lib/constants'
import React from 'react'

export default function CheckoutFooter() {
  return (
    <div className='border-t-2 space-y-2 my-4 py-4 text-xs'>
      <p>
        Need help with an order? Reply to your order confirmation email or
        contact support through your account after checkout.
      </p>
      <p>
        For an item ordered from {APP_NAME}: When you click the &apos;Place Your
        Order&apos; button, we will send you an e-mail acknowledging receipt of
        your order. Your contract to purchase an item will not be complete until
        we send you an e-mail notifying you that the item has been shipped to
        you. By placing your order, you agree to {APP_NAME}&apos;s privacy
        notice and conditions of use.
      </p>
      <p>
        Within 30 days of delivery, you may return new, unopened merchandise in
        its original condition. Exceptions and restrictions apply.
      </p>
    </div>
  )
}
