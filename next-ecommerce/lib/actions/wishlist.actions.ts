'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { formatError } from '@/lib/utils'
import {
  addWishlistItem,
  isProductWishlisted,
  listWishlistItems,
  productExists,
  removeWishlistItem,
  type WishlistItemRow,
} from '@/lib/db/wishlist'

export type { WishlistItemRow }

export async function getMyWishlist(): Promise<WishlistItemRow[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const rows = await listWishlistItems(session.user.id)
  return JSON.parse(JSON.stringify(rows))
}

export async function getWishlistStatus(
  productId: string
): Promise<{ wishlisted: boolean; signedIn: boolean }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { wishlisted: false, signedIn: false }
  }
  const wishlisted = await isProductWishlisted(session.user.id, productId)
  return { wishlisted, signedIn: true }
}

export async function toggleWishlistItem(
  productId: string
): Promise<{ success: boolean; message: string; wishlisted?: boolean }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in to save products' }
    }
    const id = productId.trim()
    if (!id) return { success: false, message: 'Product required' }
    if (!(await productExists(id))) {
      return { success: false, message: 'Product not found' }
    }

    const already = await isProductWishlisted(session.user.id, id)
    if (already) {
      await removeWishlistItem(session.user.id, id)
      revalidatePath('/account/wishlist')
      revalidatePath(`/product`)
      return {
        success: true,
        message: 'Removed from wishlist',
        wishlisted: false,
      }
    }

    await addWishlistItem(session.user.id, id)
    revalidatePath('/account/wishlist')
    return {
      success: true,
      message: 'Saved to wishlist',
      wishlisted: true,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function removeFromWishlist(
  productId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    await removeWishlistItem(session.user.id, productId.trim())
    revalidatePath('/account/wishlist')
    return { success: true, message: 'Removed from wishlist' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
