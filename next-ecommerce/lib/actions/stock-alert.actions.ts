'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { formatError } from '@/lib/utils'
import {
  getProductStockForAlert,
  isStockAlertSubscribed,
  subscribeStockAlert,
  unsubscribeStockAlert,
} from '@/lib/db/stock-alerts'
import { productExists } from '@/lib/db/wishlist'

export async function getStockAlertStatus(productId: string): Promise<{
  signedIn: boolean
  subscribed: boolean
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { signedIn: false, subscribed: false }
  }
  const subscribed = await isStockAlertSubscribed(session.user.id, productId)
  return { signedIn: true, subscribed }
}

export async function toggleStockAlert(productId: string): Promise<{
  success: boolean
  message: string
  subscribed?: boolean
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const id = productId.trim()
    if (!id) {
      return { success: false, message: 'Product required' }
    }
    if (!(await productExists(id))) {
      return { success: false, message: 'Product not found' }
    }

    const product = await getProductStockForAlert(id)
    if (!product) {
      return { success: false, message: 'Product not found' }
    }

    const already = await isStockAlertSubscribed(session.user.id, id)
    if (already) {
      await unsubscribeStockAlert({
        accountId: session.user.id,
        productId: id,
      })
      revalidatePath(`/product/${product.slug}`)
      return {
        success: true,
        message: 'Stock alert removed',
        subscribed: false,
      }
    }

    if (product.stockQuantity > 0) {
      return {
        success: false,
        message: 'This product is already in stock',
      }
    }

    await subscribeStockAlert({
      accountId: session.user.id,
      productId: id,
    })
    revalidatePath(`/product/${product.slug}`)
    return {
      success: true,
      message: 'We will notify you when it is back in stock',
      subscribed: true,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
