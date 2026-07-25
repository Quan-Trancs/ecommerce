'use client'

import { useEffect, useRef } from 'react'
import useCartStore from '@/hooks/use-cart-store'
import {
  hydrateCartFromServer,
  refreshCartFromCatalog,
} from '@/lib/actions/cart.actions'

/**
 * On mount: merge local + server cart when signed in, always refresh prices/stock.
 * Guests keep local-only carts with live catalog revalidation.
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
        if (cancelled) return

        if (merged) {
          useCartStore.setState({ cart: merged, isUpdating: false })
          return
        }

        if (local.items?.length) {
          const refreshed = await refreshCartFromCatalog(local)
          if (!cancelled) {
            useCartStore.setState({ cart: refreshed, isUpdating: false })
          }
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
