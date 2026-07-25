'use client'

import { useEffect, useRef } from 'react'
import useCartStore from '@/hooks/use-cart-store'
import { hydrateCartFromServer } from '@/lib/actions/cart.actions'

/**
 * On mount, merge localStorage cart with Postgres cart when signed in.
 * Guests keep local-only carts (hydrate returns null).
 */
export default function CartHydrator() {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    let cancelled = false
    ;(async () => {
      try {
        const local = useCartStore.getState().cart
        const merged = await hydrateCartFromServer(local)
        if (!cancelled && merged) {
          useCartStore.setState({ cart: merged, isUpdating: false })
        }
      } catch (error) {
        console.warn('Cart hydrate failed:', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
